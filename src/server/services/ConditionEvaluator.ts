import type { CandleInput } from './common.response';
import { Granularity } from './common.request';
import type { Ticker } from './MarketEventService.message';
import {
  isIndicatorCondition,
  type Condition,
  type IndicatorCondition,
  type TickerCondition,
} from './MarketEventService.request';
import {
  IndicatorConditionField,
  TickerConditionField,
} from './MarketEventService.types';
import type { ConditionResult } from './MarketEventService.response';
import { ConditionOperator } from './MarketEventService.types';
import type {
  CalculateBollingerBandsRequest,
  CalculateEmaRequest,
  CalculateMacdRequest,
  CalculateRsiRequest,
  CalculateSmaRequest,
  CalculateStochasticRequest,
  TechnicalIndicatorsService,
} from './TechnicalIndicatorsService';

// =============================================================================
// Operator Evaluation
// =============================================================================

/**
 * Evaluates a single operator against actual and threshold values.
 */
function evaluateOperator(
  actual: number,
  operator: ConditionOperator,
  threshold: number,
  previous: number | null,
): boolean {
  switch (operator) {
    case ConditionOperator.GT:
      return actual > threshold;
    case ConditionOperator.GTE:
      return actual >= threshold;
    case ConditionOperator.LT:
      return actual < threshold;
    case ConditionOperator.LTE:
      return actual <= threshold;
    case ConditionOperator.CROSS_ABOVE:
      return previous !== null && previous <= threshold && actual > threshold;
    case ConditionOperator.CROSS_BELOW:
      return previous !== null && previous >= threshold && actual < threshold;
  }
}

// =============================================================================
// Condition Evaluator
// =============================================================================

/**
 * Service for evaluating conditions against ticker and indicator data.
 */
export class ConditionEvaluator {
  constructor(private readonly indicatorService: TechnicalIndicatorsService) {}

  /**
   * Evaluates all conditions against provided data.
   * Returns results for ALL conditions (with triggered boolean), not just triggered ones.
   *
   * @param conditions - Conditions to evaluate
   * @param ticker - Current ticker data (for ticker conditions)
   * @param previousTicker - Previous ticker data (for crossAbove/crossBelow)
   * @param candlesByGranularity - Current candle data by granularity (for indicator calculations)
   * @param previousCandlesByGranularity - Previous candle data (for crossAbove/crossBelow on indicators)
   * @returns Array of all condition results with triggered status
   */
  public evaluateConditions(
    conditions: readonly Condition[],
    ticker: Ticker | null,
    previousTicker: Ticker | null,
    candlesByGranularity: Map<Granularity, readonly CandleInput[]> | null,
    previousCandlesByGranularity: Map<
      Granularity,
      readonly CandleInput[]
    > | null,
  ): ConditionResult[] {
    return conditions.map((condition) =>
      this.evaluateCondition(
        condition,
        ticker,
        previousTicker,
        candlesByGranularity,
        previousCandlesByGranularity,
      ),
    );
  }

  /**
   * Calculates the current value of an indicator based on the condition field.
   *
   * @param condition - The indicator condition
   * @param candles - Candle data for calculation
   * @returns The indicator value or null if not enough data
   */
  private calculateIndicatorValue(
    condition: IndicatorCondition,
    candles: readonly CandleInput[],
  ): number | null {
    const { field } = condition;

    switch (field) {
      case IndicatorConditionField.Rsi:
        return this.calculateRsi(candles, condition.period);

      case IndicatorConditionField.Macd:
      case IndicatorConditionField.MacdHistogram:
      case IndicatorConditionField.MacdSignal:
        return this.calculateMacd(
          candles,
          field,
          condition.fastPeriod,
          condition.slowPeriod,
          condition.signalPeriod,
        );
      case IndicatorConditionField.BollingerBands:
      case IndicatorConditionField.BollingerBandsUpper:
      case IndicatorConditionField.BollingerBandsLower:
      case IndicatorConditionField.BollingerBandsBandwidth:
      case IndicatorConditionField.BollingerBandsPercentB:
        return this.calculateBollinger(
          candles,
          field,
          condition.period,
          condition.stdDev,
        );

      case IndicatorConditionField.Sma:
        return this.calculateSma(candles, condition.period);

      case IndicatorConditionField.Ema:
        return this.calculateEma(candles, condition.period);

      case IndicatorConditionField.Stochastic:
      case IndicatorConditionField.StochasticD:
        return this.calculateStochastic(
          candles,
          field,
          condition.kPeriod,
          condition.dPeriod,
        );
    }
  }

  // ---------------------------------------------------------------------------
  // Private condition evaluation methods
  // ---------------------------------------------------------------------------

  /**
   * Evaluates a single condition and returns the result.
   */
  private evaluateCondition(
    condition: Condition,
    ticker: Ticker | null,
    previousTicker: Ticker | null,
    candlesByGranularity: Map<Granularity, readonly CandleInput[]> | null,
    previousCandlesByGranularity: Map<
      Granularity,
      readonly CandleInput[]
    > | null,
  ): ConditionResult {
    if (isIndicatorCondition(condition)) {
      return this.evaluateIndicatorCondition(
        condition,
        candlesByGranularity,
        previousCandlesByGranularity,
      );
    }

    return this.evaluateTickerCondition(condition, ticker, previousTicker);
  }

  /**
   * Evaluates a ticker condition.
   */
  private evaluateTickerCondition(
    condition: TickerCondition,
    ticker: Ticker | null,
    previousTicker: Ticker | null,
  ): ConditionResult {
    const base = {
      field: condition.field,
      operator: condition.operator,
      threshold: condition.value,
    };

    const tickerValue = this.getTickerValue(ticker, condition.field);
    const previousTickerValue = this.getTickerValue(
      previousTicker,
      condition.field,
    );

    if (tickerValue === null) {
      return { ...base, actualValue: null, triggered: false };
    }

    const triggered = evaluateOperator(
      tickerValue,
      condition.operator,
      condition.value,
      previousTickerValue,
    );

    return { ...base, actualValue: tickerValue, triggered };
  }

  /**
   * Evaluates an indicator condition.
   */
  private evaluateIndicatorCondition(
    condition: IndicatorCondition,
    candlesByGranularity: Map<Granularity, readonly CandleInput[]> | null,
    previousCandlesByGranularity: Map<
      Granularity,
      readonly CandleInput[]
    > | null,
  ): ConditionResult {
    const base = {
      field: condition.field,
      operator: condition.operator,
      threshold: condition.value,
    };

    const candles = candlesByGranularity?.get(condition.granularity);
    if (!candles || candles.length === 0) {
      return { ...base, actualValue: null, triggered: false };
    }

    const indicatorValue = this.calculateIndicatorValue(condition, candles);
    if (indicatorValue === null) {
      return { ...base, actualValue: null, triggered: false };
    }

    // Only calculate previous value for cross operators
    const needsPreviousValue =
      condition.operator === ConditionOperator.CROSS_ABOVE ||
      condition.operator === ConditionOperator.CROSS_BELOW;

    let previousIndicatorValue: number | null = null;
    if (needsPreviousValue) {
      const previousCandles = previousCandlesByGranularity?.get(
        condition.granularity,
      );
      if (previousCandles && previousCandles.length > 0) {
        previousIndicatorValue = this.calculateIndicatorValue(
          condition,
          previousCandles,
        );
      }
    }

    const triggered = evaluateOperator(
      indicatorValue,
      condition.operator,
      condition.value,
      previousIndicatorValue,
    );

    return { ...base, actualValue: indicatorValue, triggered };
  }

  /**
   * Gets a value from ticker data by field name.
   */
  private getTickerValue(
    ticker: Ticker | null,
    field: TickerConditionField,
  ): number | null {
    if (!ticker) {
      return null;
    }
    switch (field) {
      case TickerConditionField.Price:
        return ticker.price;
      case TickerConditionField.Volume24h:
        return ticker.volume24h;
      case TickerConditionField.PercentChange24h:
        return ticker.percentChange24h;
      case TickerConditionField.High24h:
        return ticker.high24h;
      case TickerConditionField.Low24h:
        return ticker.low24h;
      case TickerConditionField.High52w:
        return ticker.high52w;
      case TickerConditionField.Low52w:
        return ticker.low52w;
      case TickerConditionField.BestBid:
        return ticker.bestBid;
      case TickerConditionField.BestAsk:
        return ticker.bestAsk;
      case TickerConditionField.BestBidQuantity:
        return ticker.bestBidQuantity;
      case TickerConditionField.BestAskQuantity:
        return ticker.bestAskQuantity;
    }
  }

  // ---------------------------------------------------------------------------
  // Private indicator calculation methods
  // ---------------------------------------------------------------------------

  private calculateRsi(
    candles: readonly CandleInput[],
    period: CalculateRsiRequest['period'],
  ): number | null {
    const result = this.indicatorService.calculateRsi({
      candles,
      period,
    });
    return result.latestValue;
  }

  private calculateMacd(
    candles: readonly CandleInput[],
    field: 'macd' | 'macd.histogram' | 'macd.signal',
    fastPeriod: CalculateMacdRequest['fastPeriod'],
    slowPeriod: CalculateMacdRequest['slowPeriod'],
    signalPeriod: CalculateMacdRequest['signalPeriod'],
  ): number | null {
    const result = this.indicatorService.calculateMacd({
      candles,
      fastPeriod,
      slowPeriod,
      signalPeriod,
    });

    if (!result.latestValue) {
      return null;
    }

    switch (field) {
      case 'macd':
        return result.latestValue.MACD ?? null;
      case 'macd.histogram':
        return result.latestValue.histogram ?? null;
      case 'macd.signal':
        return result.latestValue.signal ?? null;
    }
  }

  private calculateBollinger(
    candles: readonly CandleInput[],
    field:
      | 'bollingerBands'
      | 'bollingerBands.upper'
      | 'bollingerBands.lower'
      | 'bollingerBands.bandwidth'
      | 'bollingerBands.percentB',
    period: CalculateBollingerBandsRequest['period'],
    stdDev: CalculateBollingerBandsRequest['stdDev'],
  ): number | null {
    const result = this.indicatorService.calculateBollingerBands({
      candles,
      period,
      stdDev,
    });

    if (!result.latestValue) {
      return null;
    }

    switch (field) {
      case 'bollingerBands':
        return result.latestValue.middle;
      case 'bollingerBands.upper':
        return result.latestValue.upper;
      case 'bollingerBands.lower':
        return result.latestValue.lower;
      case 'bollingerBands.bandwidth':
        return result.latestValue.bandwidth;
      case 'bollingerBands.percentB':
        return result.latestValue.pb;
    }
  }

  private calculateSma(
    candles: readonly CandleInput[],
    period: CalculateSmaRequest['period'],
  ): number | null {
    const result = this.indicatorService.calculateSma({
      candles,
      period,
    });
    return result.latestValue;
  }

  private calculateEma(
    candles: readonly CandleInput[],
    period: CalculateEmaRequest['period'],
  ): number | null {
    const result = this.indicatorService.calculateEma({
      candles,
      period,
    });
    return result.latestValue;
  }

  private calculateStochastic(
    candles: readonly CandleInput[],
    field: 'stochastic' | 'stochastic.d',
    kPeriod: CalculateStochasticRequest['kPeriod'],
    dPeriod: CalculateStochasticRequest['dPeriod'],
  ): number | null {
    const result = this.indicatorService.calculateStochastic({
      candles,
      kPeriod,
      dPeriod,
    });

    if (!result.latestValue) {
      return null;
    }

    switch (field) {
      case 'stochastic':
        return result.latestValue.k;
      case 'stochastic.d':
        return result.latestValue.d;
    }
  }
}
