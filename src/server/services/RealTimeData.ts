import { randomUUID } from 'node:crypto';
import pRetry, { type RetryContext } from 'p-retry';
import { logger } from '../../logger';
import type { WebSocketPool } from '../websocket/WebSocketPool';
import type { BufferedCandle, CandleBuffer } from './CandleBuffer';
import { Granularity } from './common.request';
import type { Ticker, WebSocketCandle } from './MarketEventService.message';
import type { ProductsService } from './ProductsService';
import { GetProductCandlesRequestSchema } from './ProductsService.request';

const CANDLE_REFRESH_RETRIES = 3;

// =============================================================================
// Types
// =============================================================================

/** Callback for ticker updates */
export type RealTimeTickerCallback = (
  productId: string,
  ticker: Ticker,
) => void;

/** Callback for candle updates */
export type RealTimeCandleCallback = (
  productId: string,
  candles: readonly BufferedCandle[],
) => void;

/** Callback when connection permanently fails after max retries */
export type ConnectionFailedCallback = (reason: string) => void;

/** Internal ticker subscription record */
interface TickerSubscription {
  readonly productIds: readonly string[];
  readonly callback: RealTimeTickerCallback;
  readonly onConnectionFailed?: ConnectionFailedCallback;
  readonly webSocketSubId: string;
}

/** Internal candle subscription record */
interface CandleSubscription {
  readonly productIds: readonly string[];
  readonly granularity: Granularity;
  readonly candleCount: number;
  readonly callback: RealTimeCandleCallback;
  readonly onConnectionFailed?: ConnectionFailedCallback;
  readonly webSocketSubId?: string;
  readonly refreshTimer?: ReturnType<typeof setInterval>;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Maps granularity to refresh interval in milliseconds.
 */
export function getRefreshIntervalMs(granularity: Granularity): number {
  switch (granularity) {
    case Granularity.ONE_MINUTE:
      return 60 * 1000;
    case Granularity.FIVE_MINUTE:
      return 5 * 60 * 1000;
    case Granularity.FIFTEEN_MINUTE:
      return 15 * 60 * 1000;
    case Granularity.THIRTY_MINUTE:
      return 30 * 60 * 1000;
    case Granularity.ONE_HOUR:
      return 60 * 60 * 1000;
    case Granularity.TWO_HOUR:
      return 2 * 60 * 60 * 1000;
    case Granularity.SIX_HOUR:
      return 6 * 60 * 60 * 1000;
    case Granularity.ONE_DAY:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Creates a retry attempt logger for candle refresh operations.
 */
function logRetryAttemptFor(
  productIds: readonly string[],
  granularity: Granularity,
): (context: RetryContext) => void {
  return (context) => {
    logger.streaming.warn(
      {
        attempt: context.attemptNumber,
        retriesLeft: context.retriesLeft,
        productIds,
        granularity,
      },
      'Candle refresh failed, retrying',
    );
  };
}

// =============================================================================
// RealTimeData
// =============================================================================

/**
 * Abstracts real-time market data delivery over WebSocket and REST.
 *
 * - Ticker: Always delivered via WebSocket
 * - Candles: WebSocket for 5-minute, REST polling for other granularities
 */
export class RealTimeData {
  private readonly tickerSubscriptions = new Map<string, TickerSubscription>();
  private readonly candleSubscriptions = new Map<string, CandleSubscription>();
  private readonly refreshAbortControllers = new Map<string, AbortController>();

  constructor(
    private readonly pool: WebSocketPool,
    private readonly productsService: ProductsService,
    private readonly candleBuffer: CandleBuffer,
  ) {}

  // ---------------------------------------------------------------------------
  // Ticker Subscription
  // ---------------------------------------------------------------------------

  /**
   * Subscribes to real-time ticker updates.
   *
   * @param productIds - Products to subscribe to
   * @param callback - Called on each ticker update with (productId, ticker)
   * @param onConnectionFailed - Called when connection permanently fails after max retries
   * @returns Subscription ID for unsubscription
   */
  public async subscribeToTicker(
    productIds: readonly string[],
    callback: RealTimeTickerCallback,
    onConnectionFailed?: ConnectionFailedCallback,
  ): Promise<string> {
    const subscriptionId = randomUUID();

    const webSocketSubId = await this.pool.subscribeToTicker(
      [...productIds],
      (ticker: Ticker) => {
        callback(ticker.productId, ticker);
      },
      undefined, // No onReconnect needed - caller handles previous value tracking
      onConnectionFailed,
    );

    this.tickerSubscriptions.set(subscriptionId, {
      productIds,
      callback,
      onConnectionFailed,
      webSocketSubId,
    });

    return subscriptionId;
  }

  /**
   * Unsubscribes from ticker updates.
   *
   * @param subscriptionId - ID returned from subscribeToTicker
   */
  public unsubscribeFromTicker(subscriptionId: string): void {
    const subscription = this.tickerSubscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    this.pool.unsubscribeFromTicker(subscription.webSocketSubId);
    this.tickerSubscriptions.delete(subscriptionId);
  }

  // ---------------------------------------------------------------------------
  // Candle Subscription
  // ---------------------------------------------------------------------------

  /**
   * Subscribes to real-time candle updates.
   * Uses WebSocket for 5-minute granularity, REST polling for others.
   * Callback receives the full candle buffer for indicator calculations.
   *
   * @param productIds - Products to subscribe to
   * @param granularity - Candle granularity
   * @param candleCount - Number of candles to maintain in buffer
   * @param callback - Called on candle updates with (productId, candles)
   * @param onConnectionFailed - Called when connection permanently fails (5m only)
   * @returns Subscription ID for unsubscription
   */
  public async subscribeToCandles(
    productIds: readonly string[],
    granularity: Granularity,
    candleCount: number,
    callback: RealTimeCandleCallback,
    onConnectionFailed?: ConnectionFailedCallback,
  ): Promise<string> {
    const subscriptionId = randomUUID();

    if (granularity === Granularity.FIVE_MINUTE) {
      // WebSocket delivery for 5-minute candles
      const webSocketSubId = await this.pool.subscribeToCandles(
        [...productIds],
        (candle: WebSocketCandle) => {
          this.candleBuffer.addCandle(candle, granularity);
          const candles = this.candleBuffer.getCandles(
            candle.productId,
            granularity,
          );
          callback(candle.productId, candles);
        },
        undefined, // No onReconnect needed for candles
        onConnectionFailed,
      );

      this.candleSubscriptions.set(subscriptionId, {
        productIds,
        granularity,
        candleCount,
        callback,
        onConnectionFailed,
        webSocketSubId,
      });
    } else {
      // REST polling for non-5m granularities
      // Register subscription first (so refreshCandles guard passes)
      this.candleSubscriptions.set(subscriptionId, {
        productIds,
        granularity,
        candleCount,
        callback,
        onConnectionFailed,
        refreshTimer: undefined,
      });

      // Fetch initial data and deliver
      await this.refreshCandles(subscriptionId);

      // Set up periodic refresh
      const refreshTimer = setInterval(
        () => void this.refreshCandles(subscriptionId),
        getRefreshIntervalMs(granularity),
      );

      // Update subscription with timer
      this.candleSubscriptions.set(subscriptionId, {
        productIds,
        granularity,
        candleCount,
        callback,
        onConnectionFailed,
        refreshTimer,
      });
    }

    return subscriptionId;
  }

  /**
   * Unsubscribes from candle updates.
   *
   * @param subscriptionId - ID returned from subscribeToCandles
   */
  public unsubscribeFromCandles(subscriptionId: string): void {
    const subscription = this.candleSubscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    if (subscription.webSocketSubId) {
      this.pool.unsubscribeFromCandles(subscription.webSocketSubId);
    }

    if (subscription.refreshTimer) {
      clearInterval(subscription.refreshTimer);
    }

    this.candleSubscriptions.delete(subscriptionId);
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Fetches candles via REST API for multiple products.
   */
  private async fetchCandlesForProducts(
    productIds: readonly string[],
    granularity: Granularity,
    candleCount: number,
  ): Promise<void> {
    const intervalMs = getRefreshIntervalMs(granularity);
    const end = new Date();
    const start = new Date(end.getTime() - candleCount * intervalMs);

    for (const productId of productIds) {
      const request = GetProductCandlesRequestSchema.parse({
        productId,
        granularity,
        start: start.toISOString(),
        end: end.toISOString(),
        limit: candleCount,
      });

      const response = await this.productsService.getProductCandles(request);

      for (const candle of response.candles ?? []) {
        const bufferedCandle: BufferedCandle = {
          productId,
          start: candle.start ?? 0,
          open: candle.open ?? 0,
          high: candle.high ?? 0,
          low: candle.low ?? 0,
          close: candle.close ?? 0,
          volume: candle.volume ?? 0,
        };
        this.candleBuffer.addCandle(bufferedCandle, granularity);
      }
    }
  }

  /**
   * Refreshes candles for a subscription with retry logic.
   * Aborts any in-flight refresh when a new one starts.
   */
  private async refreshCandles(subscriptionId: string): Promise<void> {
    const subscription = this.candleSubscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    // Abort any in-flight refresh for this subscription
    this.refreshAbortControllers.get(subscriptionId)?.abort();

    const abortController = new AbortController();
    this.refreshAbortControllers.set(subscriptionId, abortController);

    const {
      productIds,
      granularity,
      candleCount,
      callback,
      onConnectionFailed,
    } = subscription;

    try {
      await pRetry(
        () =>
          this.fetchCandlesForProducts(productIds, granularity, candleCount),
        {
          retries: CANDLE_REFRESH_RETRIES,
          signal: abortController.signal,
          onFailedAttempt: logRetryAttemptFor(productIds, granularity),
        },
      );

      for (const productId of productIds) {
        const candles = this.candleBuffer.getCandles(productId, granularity);
        callback(productId, candles);
      }
    } catch (error: unknown) {
      // Ignore if aborted (superseded by newer refresh)
      if (abortController.signal.aborted) {
        return;
      }

      logger.streaming.error(
        { err: error, productIds, granularity },
        'Candle refresh failed after retries',
      );

      // pRetry always throws Error (wraps non-Error throws)
      onConnectionFailed?.((error as Error).message);
    } finally {
      // Clean up abort controller if it's still ours
      if (
        this.refreshAbortControllers.get(subscriptionId) === abortController
      ) {
        this.refreshAbortControllers.delete(subscriptionId);
      }
    }
  }
}
