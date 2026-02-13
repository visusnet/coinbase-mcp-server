import type { CandleInput } from './common.response';
import { Granularity } from './common.request';
import { evaluateOperator } from './ConditionEvaluator';
import type { Ticker } from './MarketData.message';
import {
  isIndicatorCondition,
  type MarketCondition,
  type IndicatorCondition,
  type TickerCondition,
} from './EventService.request';
import type { MarketConditionResult } from './EventService.response';
import {
  ConditionOperator,
  IndicatorConditionField,
  TickerConditionField,
} from './EventService.types';
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
// Market Condition Evaluator
// =============================================================================

/**
 * Service for evaluating market conditions against ticker and indicator data.
 */
export class MarketConditionEvaluator {
  constructor(private readonly indicatorService: TechnicalIndicatorsService) {}

  /**
   * Evaluates all conditions against provided data.
   * Returns results for ALL conditions (with triggered boolean), not just triggered ones.
   */
  public evaluateConditions(
    conditions: readonly MarketCondition[],
    ticker: Ticker | null,
    previousTicker: Ticker | null,
    candlesByGranularity: Map<Granularity, readonly CandleInput[]> | null,
    previousCandlesByGranularity: Map<
      Granularity,
      readonly CandleInput[]
    > | null,
  ): MarketConditionResult[] {
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

  private evaluateCondition(
    condition: MarketCondition,
    ticker: Ticker | null,
    previousTicker: Ticker | null,
    candlesByGranularity: Map<Granularity, readonly CandleInput[]> | null,
    previousCandlesByGranularity: Map<
      Granularity,
      readonly CandleInput[]
    > | null,
  ): MarketConditionResult {
    if (isIndicatorCondition(condition)) {
      return this.evaluateIndicatorCondition(
        condition,
        candlesByGranularity,
        previousCandlesByGranularity,
      );
    }

    return this.evaluateTickerCondition(condition, ticker, previousTicker);
  }

  private evaluateTickerCondition(
    condition: TickerCondition,
    ticker: Ticker | null,
    previousTicker: Ticker | null,
  ): MarketConditionResult {
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

  private evaluateIndicatorCondition(
    condition: IndicatorCondition,
    candlesByGranularity: Map<Granularity, readonly CandleInput[]> | null,
    previousCandlesByGranularity: Map<
      Granularity,
      readonly CandleInput[]
    > | null,
  ): MarketConditionResult {
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
