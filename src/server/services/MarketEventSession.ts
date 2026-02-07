import { logger } from '../../logger';
import type { BufferedCandle } from './CandleBuffer';
import { Granularity } from './common.request';
import { ConditionEvaluator } from './ConditionEvaluator';
import type { Ticker } from './MarketEventService.message';
import {
  isIndicatorCondition,
  isTickerField,
  type IndicatorCondition,
  type WaitForMarketEventRequest,
} from './MarketEventService.request';
import type { WaitForMarketEventResponse } from './MarketEventService.response';
import {
  ConditionLogic,
  IndicatorConditionField,
} from './MarketEventService.types';
import type { RealTimeData } from './RealTimeData';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets or creates a nested map entry.
 */
function getOrCreateNestedMap<K, V>(
  outer: Map<string, Map<K, V>>,
  key: string,
): Map<K, V> {
  let inner = outer.get(key);
  if (!inner) {
    inner = new Map();
    outer.set(key, inner);
  }
  return inner;
}

/**
 * Calculates the minimum number of candles required for an indicator condition.
 */
function getMinimumCandlesForCondition(condition: IndicatorCondition): number {
  switch (condition.field) {
    case IndicatorConditionField.Rsi:
      return condition.period + 1;

    case IndicatorConditionField.Macd:
    case IndicatorConditionField.MacdHistogram:
    case IndicatorConditionField.MacdSignal:
      return condition.slowPeriod + condition.signalPeriod;

    case IndicatorConditionField.BollingerBands:
    case IndicatorConditionField.BollingerBandsUpper:
    case IndicatorConditionField.BollingerBandsLower:
    case IndicatorConditionField.BollingerBandsBandwidth:
    case IndicatorConditionField.BollingerBandsPercentB:
      return condition.period + 1;

    case IndicatorConditionField.Sma:
    case IndicatorConditionField.Ema:
      return condition.period + 1;

    case IndicatorConditionField.Stochastic:
    case IndicatorConditionField.StochasticD:
      return condition.kPeriod + condition.dPeriod;
  }
}

interface MarketEventSessionState {
  previousTickerByProduct: Map<string, Ticker>;
  currentTickerByProduct: Map<string, Ticker>;
  currentCandlesByGranularityByProduct: Map<
    string,
    Map<Granularity, readonly BufferedCandle[]>
  >;
  previousCandlesByGranularityByProduct: Map<
    string,
    Map<Granularity, readonly BufferedCandle[]>
  >;
}

// =============================================================================
// MarketEventSession
// =============================================================================

/**
 * Manages a single wait_for_market_event session.
 * Uses RealTimeData for data delivery and focuses on condition evaluation.
 */
export class MarketEventSession {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** Latest data for evaluation */
  private readonly state: MarketEventSessionState = {
    previousTickerByProduct: new Map(),
    currentTickerByProduct: new Map(),
    currentCandlesByGranularityByProduct: new Map(),
    previousCandlesByGranularityByProduct: new Map(),
  };

  /** Subscription IDs for cleanup */
  private tickerSubscriptionId?: string;
  private readonly candleSubscriptionIds: string[] = [];
  private timeoutId?: ReturnType<typeof setTimeout>;

  private resolved = false;
  private readonly completion: PromiseWithResolvers<WaitForMarketEventResponse>;
  private readonly productIds: string[];

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  constructor(
    private readonly request: WaitForMarketEventRequest,
    private readonly realTimeData: RealTimeData,
    private readonly conditionEvaluator: ConditionEvaluator,
  ) {
    this.completion = Promise.withResolvers();
    this.productIds = request.subscriptions.map((s) => s.productId);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Starts the session and waits for completion.
   * Returns when a condition triggers, timeout occurs, or an error happens.
   *
   * Three things can complete the session:
   * 1. Condition triggers → complete() called from evaluateAndMaybeComplete()
   * 2. Connection fails → complete() called from handleConnectionFailed()
   * 3. Timeout expires → timeoutPromise resolves
   *
   * The Promise.race ensures we return as soon as ANY of these happens,
   * even if subscribe() is still running (e.g., waiting for reconnect).
   */
  public async start(): Promise<WaitForMarketEventResponse> {
    const timeoutPromise = this.createTimeoutPromise();

    // Start subscription in background (don't await)
    void this.trySubscribe();

    // Wait for: condition trigger, connection failure, or timeout
    const result = await Promise.race([
      this.completion.promise,
      timeoutPromise,
    ]);

    this.cleanup();
    return result;
  }

  /**
   * Attempts to subscribe, completing with error if subscription fails.
   */
  private async trySubscribe(): Promise<void> {
    try {
      await this.subscribe();
    } catch (error: unknown) {
      if (!this.resolved) {
        logger.streaming.error(
          { err: error },
          'Market event subscription failed',
        );
        this.complete({
          status: 'error',
          reason: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Subscription
  // ---------------------------------------------------------------------------

  /**
   * Subscribes to ticker and/or candle data based on condition types.
   */
  private async subscribe(): Promise<void> {
    // Only subscribe to ticker if there are ticker conditions
    if (this.hasTickerConditions()) {
      this.tickerSubscriptionId = await this.realTimeData.subscribeToTicker(
        this.productIds,
        this.handleTicker.bind(this),
        this.handleConnectionFailed.bind(this),
      );
    }

    // Only subscribe to candles if there are indicator conditions
    const indicatorConditionsByGranularity =
      this.groupIndicatorConditionsByGranularity();

    for (const [granularity, conditions] of indicatorConditionsByGranularity) {
      const candleCount = this.calculateRequiredCandleCount(conditions);

      const candleSubId = await this.realTimeData.subscribeToCandles(
        this.productIds,
        granularity,
        candleCount,
        (productId, candles) =>
          this.handleCandles(productId, granularity, candles),
        this.handleConnectionFailed.bind(this),
      );
      this.candleSubscriptionIds.push(candleSubId);
    }
  }

  /**
   * Returns true if any subscription has ticker conditions.
   */
  private hasTickerConditions(): boolean {
    return this.request.subscriptions.some((sub) =>
      sub.conditions.some((c) => isTickerField(c.field)),
    );
  }

  /**
   * Groups indicator conditions by their granularity.
   */
  private groupIndicatorConditionsByGranularity(): Map<
    Granularity,
    IndicatorCondition[]
  > {
    const map = new Map<Granularity, IndicatorCondition[]>();

    for (const subscription of this.request.subscriptions) {
      for (const condition of subscription.conditions) {
        if (isIndicatorCondition(condition)) {
          const existing = map.get(condition.granularity) ?? [];
          existing.push(condition);
          map.set(condition.granularity, existing);
        }
      }
    }

    return map;
  }

  /**
   * Calculates required candles with 20% buffer.
   */
  private calculateRequiredCandleCount(
    conditions: readonly IndicatorCondition[],
  ): number {
    const maxRequired = Math.max(
      ...conditions.map(getMinimumCandlesForCondition),
    );
    return Math.ceil(maxRequired * 1.2);
  }

  // ---------------------------------------------------------------------------
  // Timeout
  // ---------------------------------------------------------------------------

  /**
   * Creates a promise that resolves on timeout.
   */
  private createTimeoutPromise(): Promise<WaitForMarketEventResponse> {
    return new Promise((resolve) => {
      this.timeoutId = setTimeout(() => {
        resolve({
          status: 'timeout',
          duration: this.request.timeout,
          timestamp: new Date().toISOString(),
        });
      }, this.request.timeout * 1000);
    });
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles incoming ticker data from RealTimeData.
   */
  private handleTicker(productId: string, ticker: Ticker): void {
    if (this.resolved) {
      return;
    }

    const currentTicker = this.state.currentTickerByProduct.get(productId);
    if (currentTicker) {
      this.state.previousTickerByProduct.set(productId, currentTicker);
    }
    this.state.currentTickerByProduct.set(productId, ticker);

    this.evaluateAndMaybeComplete();
  }

  /**
   * Handles incoming candle data from RealTimeData.
   */
  private handleCandles(
    productId: string,
    granularity: Granularity,
    candles: readonly BufferedCandle[],
  ): void {
    if (this.resolved) {
      return;
    }

    const currentCandlesByGranularity = getOrCreateNestedMap(
      this.state.currentCandlesByGranularityByProduct,
      productId,
    );
    const currentCandles = currentCandlesByGranularity.get(granularity);

    if (currentCandles) {
      const previousCandlesByGranularity = getOrCreateNestedMap(
        this.state.previousCandlesByGranularityByProduct,
        productId,
      );
      previousCandlesByGranularity.set(granularity, currentCandles);
    }

    currentCandlesByGranularity.set(granularity, candles);
    this.evaluateAndMaybeComplete();
  }

  /**
   * Handles connection failure.
   */
  private handleConnectionFailed(reason: string): void {
    this.complete({
      status: 'error',
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  // ---------------------------------------------------------------------------
  // Evaluation
  // ---------------------------------------------------------------------------

  /**
   * Evaluates conditions for a product and completes if triggered.
   */
  private evaluateAndMaybeComplete(): void {
    for (const subscription of this.request.subscriptions) {
      const ticker =
        this.state.currentTickerByProduct.get(subscription.productId) ?? null;
      const previousTicker =
        this.state.previousTickerByProduct.get(subscription.productId) ?? null;
      const candlesByGranularity =
        this.state.currentCandlesByGranularityByProduct.get(
          subscription.productId,
        ) ?? null;
      const previousCandlesByGranularity =
        this.state.previousCandlesByGranularityByProduct.get(
          subscription.productId,
        ) ?? null;

      const evaluatedConditions = this.conditionEvaluator.evaluateConditions(
        subscription.conditions,
        ticker,
        previousTicker,
        candlesByGranularity,
        previousCandlesByGranularity,
      );

      if (logger.streaming.isLevelEnabled('trace')) {
        for (const result of evaluatedConditions) {
          logger.streaming.trace(
            {
              productId: subscription.productId,
              field: result.field,
              operator: result.operator,
              threshold: result.threshold,
              actualValue: result.actualValue,
              triggered: result.triggered,
            },
            'Condition evaluated',
          );
        }
      }

      const triggered =
        subscription.logic === ConditionLogic.ANY
          ? evaluatedConditions.some((r) => r.triggered)
          : evaluatedConditions.every((r) => r.triggered);

      if (triggered) {
        this.complete({
          status: 'triggered',
          productId: subscription.productId,
          conditions: evaluatedConditions,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Completion & Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Completes the session with a response.
   */
  private complete(response: WaitForMarketEventResponse): void {
    if (this.resolved) {
      return;
    }
    this.resolved = true;
    this.completion.resolve(response);
  }

  /**
   * Cleans up all resources.
   */
  private cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    if (this.tickerSubscriptionId) {
      this.realTimeData.unsubscribeFromTicker(this.tickerSubscriptionId);
    }

    for (const candleSubId of this.candleSubscriptionIds) {
      this.realTimeData.unsubscribeFromCandles(candleSubId);
    }
  }
}
