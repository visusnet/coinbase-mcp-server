import { randomUUID } from 'node:crypto';
import { logger } from '../../logger';
import { CandleBuffer, type BufferedCandle } from './CandleBuffer';
import { Granularity } from './common.request';
import {
  isTickerChannelMessage,
  isCandlesChannelMessage,
  isSubscriptionsChannelMessage,
  WebSocketMessageSchema,
  type Ticker,
} from './MarketData.message';
import { isErrorMessage } from './common.message';
import type { ProductsService } from './ProductsService';
import { RestPollingConnection } from './RestPollingConnection';
import type { CoinbaseCredentials } from '@client/CoinbaseCredentials';
import { WebSocketConnection } from '../websocket/WebSocketConnection';
import { COINBASE_WS_URL } from '../websocket/WebSocketConnection.constants';

// =============================================================================
// Types
// =============================================================================

interface TickerPoolSub {
  readonly type: 'ticker';
  readonly productId: string;
  readonly callback: (ticker: Ticker) => void;
  readonly onDisconnect?: (reason: string) => void;
}

interface CandlePoolSub {
  readonly type: 'candle';
  readonly productId: string;
  readonly granularity: Granularity;
  readonly callback: (candles: readonly BufferedCandle[]) => void;
  readonly onDisconnect?: (reason: string) => void;
}

type PoolSubscription = TickerPoolSub | CandlePoolSub;

type CandleRefKey = `${string}:${Granularity}`;

function candleRefKey(
  productId: string,
  granularity: Granularity,
): CandleRefKey {
  return `${productId}:${granularity}`;
}

// =============================================================================
// MarketDataPool
// =============================================================================

/**
 * Unified data access layer for market data.
 * Consumers request data by product and type; the pool decides the transport.
 *
 * - Ticker: always WebSocket
 * - Candles (5m): WebSocket
 * - Candles (other): REST polling via RestPollingConnection
 *
 * Reference counting: only sends a WebSocket unsubscribe when the last
 * subscriber for a product is removed.
 */
export class MarketDataPool {
  private readonly webSocketConnection: WebSocketConnection;
  private readonly restPollingConnection: RestPollingConnection;
  private readonly candleBuffer = new CandleBuffer();
  private readonly subscriptions = new Map<string, PoolSubscription>();

  // Reference counting: productId → Set<subscriptionId>
  private readonly tickerWsRefs: Record<string, Set<string>> = {};
  private readonly candleWsRefs: Record<string, Set<string>> = {};
  private readonly candleRestRefs: Record<CandleRefKey, Set<string>> = {};

  constructor(
    credentials: CoinbaseCredentials,
    productsService: ProductsService,
  ) {
    this.webSocketConnection = new WebSocketConnection(
      COINBASE_WS_URL,
      credentials,
      this.handleMessage.bind(this),
      this.handlePoolDisconnect.bind(this),
    );

    this.restPollingConnection = new RestPollingConnection(
      productsService,
      this.deliverRestCandles.bind(this),
      this.handleRestDisconnect.bind(this),
    );
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public subscribeToTicker(
    productId: string,
    callback: (ticker: Ticker) => void,
    onDisconnect?: (reason: string) => void,
  ): string {
    const id = randomUUID();
    this.subscriptions.set(id, {
      type: 'ticker',
      productId,
      callback,
      onDisconnect,
    });

    const refs = (this.tickerWsRefs[productId] ??= new Set());
    if (refs.size === 0) {
      this.webSocketConnection.subscribe('ticker', [productId]);
    }
    refs.add(id);

    return id;
  }

  public subscribeToCandles(
    productId: string,
    granularity: Granularity,
    count: number,
    callback: (candles: readonly BufferedCandle[]) => void,
    onDisconnect?: (reason: string) => void,
  ): string {
    const id = randomUUID();
    this.subscriptions.set(id, {
      type: 'candle',
      productId,
      granularity,
      callback,
      onDisconnect,
    });

    if (granularity === Granularity.FIVE_MINUTE) {
      this.addCandleWsRef(id, productId);
    } else {
      this.addCandleRestRef(id, productId, granularity, count);
    }

    return id;
  }

  public unsubscribe(subscriptionId: string): void {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) {
      return;
    }

    this.subscriptions.delete(subscriptionId);

    if (sub.type === 'ticker') {
      this.removeTickerWsRef(subscriptionId, sub.productId);
    } else if (sub.granularity === Granularity.FIVE_MINUTE) {
      this.removeCandleWsRef(subscriptionId, sub.productId);
    } else {
      this.removeCandleRestRef(subscriptionId, sub.productId, sub.granularity);
    }
  }

  public close(): void {
    this.restPollingConnection.close();
    this.subscriptions.clear();
    this.webSocketConnection.close();
  }

  // ---------------------------------------------------------------------------
  // Disconnect Propagation
  // ---------------------------------------------------------------------------

  private handlePoolDisconnect(reason: string): void {
    logger.streaming.error({ reason }, 'Market data connection lost');
    for (const sub of this.subscriptions.values()) {
      sub.onDisconnect?.(reason);
    }
  }

  private handleRestDisconnect(reason: string): void {
    logger.streaming.error({ reason }, 'Market data connection lost');
    for (const sub of this.subscriptions.values()) {
      sub.onDisconnect?.(reason);
    }
  }

  // ---------------------------------------------------------------------------
  // Reference Counting
  // ---------------------------------------------------------------------------

  private addCandleWsRef(subscriptionId: string, productId: string): void {
    const refs = (this.candleWsRefs[productId] ??= new Set());
    if (refs.size === 0) {
      this.webSocketConnection.subscribe('candles', [productId]);
    }
    refs.add(subscriptionId);
  }

  private addCandleRestRef(
    subscriptionId: string,
    productId: string,
    granularity: Granularity,
    count: number,
  ): void {
    const key = candleRefKey(productId, granularity);
    const refs = (this.candleRestRefs[key] ??= new Set());

    this.restPollingConnection.subscribe(productId, granularity, count);
    refs.add(subscriptionId);
  }

  private removeTickerWsRef(subscriptionId: string, productId: string): void {
    const refs = this.tickerWsRefs[productId];
    refs.delete(subscriptionId);
    if (refs.size === 0) {
      delete this.tickerWsRefs[productId];
      this.webSocketConnection.unsubscribe('ticker', [productId]);
    }
  }

  private removeCandleWsRef(subscriptionId: string, productId: string): void {
    const refs = this.candleWsRefs[productId];
    refs.delete(subscriptionId);
    if (refs.size === 0) {
      delete this.candleWsRefs[productId];
      this.webSocketConnection.unsubscribe('candles', [productId]);
    }
  }

  private removeCandleRestRef(
    subscriptionId: string,
    productId: string,
    granularity: Granularity,
  ): void {
    const key = candleRefKey(productId, granularity);
    const refs = this.candleRestRefs[key];
    refs.delete(subscriptionId);
    if (refs.size === 0) {
      delete this.candleRestRefs[key];
      this.restPollingConnection.unsubscribe(productId, granularity);
    }
  }

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  private handleMessage(data: unknown): void {
    const parsed = WebSocketMessageSchema.safeParse(data);
    if (!parsed.success) {
      logger.streaming.error(
        { err: parsed.error },
        'Unknown WebSocket message',
      );
      return;
    }

    const message = parsed.data;

    if (isErrorMessage(message)) {
      logger.streaming.error(
        { message: message.message },
        'Coinbase WebSocket error',
      );
      if (message.message.includes('authentication')) {
        this.handlePoolDisconnect('Authentication error: ' + message.message);
        this.webSocketConnection.close();
      }
      return;
    }

    if (isTickerChannelMessage(message)) {
      for (const event of message.events) {
        for (const ticker of event.tickers) {
          this.deliverTicker(ticker);
        }
      }
    } else if (isCandlesChannelMessage(message)) {
      for (const event of message.events) {
        for (const candle of event.candles) {
          this.candleBuffer.addCandle(candle, Granularity.FIVE_MINUTE);
          this.deliverWsCandles(candle.productId, Granularity.FIVE_MINUTE);
        }
      }
    } else if (isSubscriptionsChannelMessage(message)) {
      const subs = message.events[0].subscriptions;
      logger.streaming.debug(
        {
          ticker: subs.ticker ?? [],
          candles: subs.candles ?? [],
        },
        'Subscriptions updated',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Delivery
  // ---------------------------------------------------------------------------

  private deliverTicker(ticker: Ticker): void {
    for (const sub of this.subscriptions.values()) {
      if (sub.type === 'ticker' && sub.productId === ticker.productId) {
        try {
          sub.callback(ticker);
        } catch (error) {
          logger.streaming.error(
            { err: error, productId: ticker.productId },
            'Ticker callback error',
          );
        }
      }
    }
  }

  private deliverWsCandles(productId: string, granularity: Granularity): void {
    const candles = this.candleBuffer.getCandles(productId, granularity);
    this.deliverCandlesToSubscribers(productId, granularity, candles);
  }

  private deliverRestCandles(
    productId: string,
    granularity: Granularity,
    candles: readonly BufferedCandle[],
  ): void {
    this.deliverCandlesToSubscribers(productId, granularity, candles);
  }

  private deliverCandlesToSubscribers(
    productId: string,
    granularity: Granularity,
    candles: readonly BufferedCandle[],
  ): void {
    for (const sub of this.subscriptions.values()) {
      if (
        sub.type === 'candle' &&
        sub.productId === productId &&
        sub.granularity === granularity
      ) {
        try {
          sub.callback(candles);
        } catch (error) {
          logger.streaming.error(
            { err: error, productId },
            'Candle callback error',
          );
        }
      }
    }
  }
}
