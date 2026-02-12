import { logger } from '../../logger';
import type { BufferedCandle } from './CandleBuffer';
import { Granularity } from './common.request';
import type { ConditionEvaluator } from './ConditionEvaluator';
import type { MarketDataPool } from './MarketDataPool';
import type { Ticker } from './MarketEventService.message';
import {
  isIndicatorCondition,
  isTickerField,
  type IndicatorCondition,
  type Subscription as SubscriptionConfig,
} from './MarketEventService.request';
import type { SubscriptionResult } from './MarketEventService.response';
import {
  ConditionLogic,
  IndicatorConditionField,
} from './MarketEventService.types';

/**
 * Self-contained unit for a single product subscription.
 * Manages its own data subscriptions, state tracking, and condition evaluation.
 *
 * - `.promise` resolves when this subscription's conditions trigger
 * - `.result` returns the latest SubscriptionResult (always available)
 * - `.start()` subscribes to data sources via MarketDataPool
 * - `.cleanup()` unsubscribes from all data sources
 */
export class MarketDataSubscription {
  public readonly promise: Promise<void>;

  private readonly resolve: () => void;
  private readonly reject: (error: Error) => void;
  public result: SubscriptionResult;
  private triggered = false;

  // State tracking (single product)
  private currentTicker: Ticker | null = null;
  private previousTicker: Ticker | null = null;
  private readonly currentCandlesByGranularity = new Map<
    Granularity,
    readonly BufferedCandle[]
  >();
  private readonly previousCandlesByGranularity = new Map<
    Granularity,
    readonly BufferedCandle[]
  >();

  // Subscription IDs for cleanup
  private readonly subscriptionIds: string[] = [];

  constructor(
    private readonly config: SubscriptionConfig,
    private readonly marketDataPool: MarketDataPool,
    private readonly conditionEvaluator: ConditionEvaluator,
  ) {
    const { promise, resolve, reject }: PromiseWithResolvers<void> =
      Promise.withResolvers();
    this.promise = promise;
    this.resolve = resolve;
    this.reject = reject;
    this.result = {
      productId: config.productId,
      triggered: false,
      conditions: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public start(): void {
    const onDisconnect = this.handleDisconnect.bind(this);

    if (this.hasTickerConditions()) {
      const subId = this.marketDataPool.subscribeToTicker(
        this.config.productId,
        (ticker) => this.handleTicker(ticker),
        onDisconnect,
      );
      this.subscriptionIds.push(subId);
    }

    const indicatorsByGranularity =
      this.groupIndicatorConditionsByGranularity();

    for (const [granularity, conditions] of indicatorsByGranularity) {
      const count = calculateRequiredCandleCount(conditions);
      const subId = this.marketDataPool.subscribeToCandles(
        this.config.productId,
        granularity,
        count,
        (candles) => this.handleCandles(granularity, candles),
        onDisconnect,
      );
      this.subscriptionIds.push(subId);
    }
  }

  public cleanup(): void {
    for (const id of this.subscriptionIds) {
      this.marketDataPool.unsubscribe(id);
    }
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  private handleDisconnect(reason: string): void {
    if (this.triggered) {
      return;
    }
    this.reject(new Error(reason));
  }

  private handleTicker(ticker: Ticker): void {
    if (this.triggered) {
      return;
    }

    if (this.currentTicker) {
      this.previousTicker = this.currentTicker;
    }
    this.currentTicker = ticker;

    this.evaluate();
  }

  private handleCandles(
    granularity: Granularity,
    candles: readonly BufferedCandle[],
  ): void {
    if (this.triggered) {
      return;
    }

    const current = this.currentCandlesByGranularity.get(granularity);
    if (current) {
      this.previousCandlesByGranularity.set(granularity, current);
    }
    this.currentCandlesByGranularity.set(granularity, candles);

    this.evaluate();
  }

  // ---------------------------------------------------------------------------
  // Evaluation
  // ---------------------------------------------------------------------------

  private evaluate(): void {
    const evaluatedConditions = this.conditionEvaluator.evaluateConditions(
      this.config.conditions,
      this.currentTicker,
      this.previousTicker,
      this.currentCandlesByGranularity.size > 0
        ? this.currentCandlesByGranularity
        : null,
      this.previousCandlesByGranularity.size > 0
        ? this.previousCandlesByGranularity
        : null,
    );

    if (logger.streaming.isLevelEnabled('trace')) {
      for (const result of evaluatedConditions) {
        logger.streaming.trace(
          {
            productId: this.config.productId,
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

    const conditionsTriggered =
      this.config.logic === ConditionLogic.ANY
        ? evaluatedConditions.some((r) => r.triggered)
        : evaluatedConditions.every((r) => r.triggered);

    this.result = {
      productId: this.config.productId,
      triggered: conditionsTriggered,
      conditions: evaluatedConditions,
    };

    if (conditionsTriggered) {
      this.triggered = true;
      this.resolve();
    }
  }

  // ---------------------------------------------------------------------------
  // Condition Helpers
  // ---------------------------------------------------------------------------

  private hasTickerConditions(): boolean {
    return this.config.conditions.some((c) => isTickerField(c.field));
  }

  private groupIndicatorConditionsByGranularity(): Map<
    Granularity,
    IndicatorCondition[]
  > {
    const map = new Map<Granularity, IndicatorCondition[]>();

    for (const condition of this.config.conditions) {
      if (isIndicatorCondition(condition)) {
        const existing = map.get(condition.granularity) ?? [];
        existing.push(condition);
        map.set(condition.granularity, existing);
      }
    }

    return map;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

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

/**
 * Calculates required candles with 20% buffer.
 */
function calculateRequiredCandleCount(
  conditions: readonly IndicatorCondition[],
): number {
  const maxRequired = Math.max(
    ...conditions.map(getMinimumCandlesForCondition),
  );
  return Math.ceil(maxRequired * 1.2);
}
