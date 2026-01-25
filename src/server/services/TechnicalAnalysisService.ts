/**
 * Technical Analysis Service.
 *
 * Provides integrated candle fetching and indicator calculation,
 * reducing context usage by keeping candle data server-side and
 * returning only computed indicator values.
 */

import type { ProductsService } from '.';
import type { TechnicalIndicatorsService } from './TechnicalIndicatorsService';
import { CandleInputArraySchema, type CandleInput } from './common.response';
import { Granularity } from './ProductsService.types';
import type {
  AnalyzeTechnicalIndicatorsRequest,
  AnalyzeTechnicalIndicatorsBatchRequest,
} from './TechnicalAnalysisService.request';
import {
  AnalyzeTechnicalIndicatorsResponse,
  AnalyzeTechnicalIndicatorsBatchResponse,
  IndicatorType,
  MomentumIndicators,
  TrendIndicators,
  VolatilityIndicators,
  VolumeIndicators,
  PatternIndicators,
  SupportResistanceIndicators,
  PriceSummary,
  AggregatedSignal,
  SignalDirection,
  SignalConfidence,
  IndicatorResults,
  ProductSignalRanking,
} from './TechnicalAnalysisService.types';

/** Default number of candles to fetch */
const DEFAULT_CANDLE_COUNT = 100;

/** Minimum candles required for meaningful analysis */
const MIN_CANDLE_COUNT = 5;

/** Maximum candles to prevent excessive API usage */
const MAX_CANDLE_COUNT = 300;

/** Granularity values in seconds for time calculation */
const GRANULARITY_SECONDS: Record<Granularity, number> = {
  [Granularity.ONE_MINUTE]: 60,
  [Granularity.FIVE_MINUTE]: 300,
  [Granularity.FIFTEEN_MINUTE]: 900,
  [Granularity.THIRTY_MINUTE]: 1800,
  [Granularity.ONE_HOUR]: 3600,
  [Granularity.TWO_HOUR]: 7200,
  [Granularity.SIX_HOUR]: 21600,
  [Granularity.ONE_DAY]: 86400,
};

/**
 * Service for integrated technical analysis.
 *
 * Combines candle fetching and indicator calculation to reduce
 * context usage. Candle data never leaves the server - only
 * computed indicator values are returned.
 */
export class TechnicalAnalysisService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly indicatorsService: TechnicalIndicatorsService,
  ) {}

  /**
   * Analyze technical indicators for multiple products in parallel.
   *
   * Fetches candles and calculates indicators for all products concurrently.
   * Returns results keyed by product ID with a summary ranking.
   *
   * @param request - Product IDs, granularity, and optional settings
   * @returns Results for each product with ranking summary
   */
  public async analyzeTechnicalIndicatorsBatch(
    request: AnalyzeTechnicalIndicatorsBatchRequest,
  ): Promise<AnalyzeTechnicalIndicatorsBatchResponse> {
    const { productIds, granularity, candleCount, indicators } = request;
    const timestamp = new Date().toISOString();
    const results: Record<string, AnalyzeTechnicalIndicatorsResponse> = {};
    const errors: Record<string, string> = {};

    // Analyze all products in parallel
    await Promise.all(
      productIds.map(async (productId) => {
        try {
          const result = await this.analyzeTechnicalIndicators({
            productId,
            granularity,
            candleCount,
            indicators,
          });
          results[productId] = result;
        } catch (err) {
          errors[productId] = err instanceof Error ? err.message : String(err);
        }
      }),
    );

    // Build ranking by signal score
    const rankedBySignal: ProductSignalRanking[] = Object.values(results)
      .map((r) => ({
        productId: r.productId,
        score: r.signal.score,
        direction: r.signal.direction,
      }))
      .sort((a, b) => b.score - a.score);

    return {
      granularity,
      timestamp,
      results,
      errors,
      summary: {
        successCount: Object.keys(results).length,
        errorCount: Object.keys(errors).length,
        rankedBySignal,
      },
    };
  }

  /**
   * Analyze technical indicators for a product.
   *
   * Fetches candles internally and calculates all requested indicators.
   * Returns aggregated results without raw candle data.
   *
   * @param request - Product ID, granularity, and optional settings
   * @returns Indicator results with aggregated signal
   */
  public async analyzeTechnicalIndicators(
    request: AnalyzeTechnicalIndicatorsRequest,
  ): Promise<AnalyzeTechnicalIndicatorsResponse> {
    const candleCount = this.validateCandleCount(request.candleCount);
    const indicators = request.indicators ?? Object.values(IndicatorType);

    // Fetch main candles for the requested timeframe
    const candles = await this.fetchCandles(
      request.productId,
      request.granularity,
      candleCount,
    );

    // Build price summary from candles
    const price = this.buildPriceSummary(candles);

    // Calculate indicators
    const indicatorResults = await this.calculateIndicators(
      request.productId,
      candles,
      indicators,
    );

    // Calculate aggregated signal
    const signal = this.calculateAggregatedSignal(indicatorResults);

    return {
      productId: request.productId,
      granularity: request.granularity,
      candleCount: candles.length,
      timestamp: new Date().toISOString(),
      price,
      indicators: indicatorResults,
      signal,
    };
  }

  /**
   * Validate and normalize candle count.
   */
  private validateCandleCount(count: number | undefined): number {
    const value = count ?? DEFAULT_CANDLE_COUNT;
    return Math.min(Math.max(value, MIN_CANDLE_COUNT), MAX_CANDLE_COUNT);
  }

  /**
   * Fetch candles for the requested timeframe.
   */
  private async fetchCandles(
    productId: string,
    granularity: Granularity,
    candleCount: number,
  ): Promise<CandleInput[]> {
    const end = new Date();
    const secondsPerCandle = GRANULARITY_SECONDS[granularity];
    const start = new Date(
      end.getTime() - candleCount * secondsPerCandle * 1000,
    );

    const response = await this.productsService.getProductCandles({
      productId,
      granularity,
      start: start.toISOString(),
      end: end.toISOString(),
    });

    return CandleInputArraySchema.parse(response.candles ?? []);
  }

  /**
   * Fetch daily candles for pivot points calculation.
   * Uses previous trading day's OHLC (industry standard).
   */
  private async fetchDailyCandles(productId: string): Promise<CandleInput[]> {
    // Fetch 3 days to ensure we have the previous complete day
    const end = new Date();
    const start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000);

    const response = await this.productsService.getProductCandles({
      productId,
      granularity: Granularity.ONE_DAY,
      start: start.toISOString(),
      end: end.toISOString(),
    });

    return CandleInputArraySchema.parse(response.candles ?? []);
  }

  /**
   * Build price summary from candle data.
   */
  private buildPriceSummary(candles: readonly CandleInput[]): PriceSummary {
    if (candles.length === 0) {
      return {
        current: 0,
        open: 0,
        high: 0,
        low: 0,
        change24h: 0,
      };
    }

    // Coinbase returns candles newest first
    const latest = candles[0];
    const oldest = candles[candles.length - 1];

    const current = latest.close;
    const open = oldest.open;
    const high = Math.max(...candles.map((c) => c.high));
    const low = Math.min(...candles.map((c) => c.low));
    const change24h = open !== 0 ? ((current - open) / open) * 100 : 0;

    return {
      current,
      open,
      high,
      low,
      change24h,
    };
  }

  /**
   * Calculate all requested indicators.
   */
  private async calculateIndicators(
    productId: string,
    candles: readonly CandleInput[],
    indicators: readonly IndicatorType[],
  ): Promise<IndicatorResults> {
    const indicatorSet = new Set(indicators);

    const results: IndicatorResults = {};

    // Calculate momentum indicators
    const momentum = this.calculateMomentumIndicators(candles, indicatorSet);
    if (Object.keys(momentum).length > 0) {
      results.momentum = momentum;
    }

    // Calculate trend indicators
    const trend = this.calculateTrendIndicators(candles, indicatorSet);
    if (Object.keys(trend).length > 0) {
      results.trend = trend;
    }

    // Calculate volatility indicators
    const volatility = this.calculateVolatilityIndicators(
      candles,
      indicatorSet,
    );
    if (Object.keys(volatility).length > 0) {
      results.volatility = volatility;
    }

    // Calculate volume indicators
    const volume = this.calculateVolumeIndicators(candles, indicatorSet);
    if (Object.keys(volume).length > 0) {
      results.volume = volume;
    }

    // Calculate pattern detection
    const patterns = this.calculatePatternIndicators(candles, indicatorSet);
    if (Object.keys(patterns).length > 0) {
      results.patterns = patterns;
    }

    // Calculate support/resistance (may require additional API calls)
    const supportResistance = await this.calculateSupportResistanceIndicators(
      productId,
      candles,
      indicatorSet,
    );
    if (Object.keys(supportResistance).length > 0) {
      results.supportResistance = supportResistance;
    }

    return results;
  }

  /**
   * Calculate momentum indicators (RSI, MACD, Stochastic, ADX, CCI, Williams %R, ROC).
   */
  private calculateMomentumIndicators(
    candles: readonly CandleInput[],
    indicatorSet: Set<IndicatorType>,
  ): MomentumIndicators {
    const momentum: MomentumIndicators = {};

    if (indicatorSet.has(IndicatorType.RSI)) {
      const result = this.indicatorsService.calculateRsi({ candles });
      if (result.latestValue !== null) {
        momentum.rsi = {
          value: result.latestValue,
          signal: this.interpretRsi(result.latestValue),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.MACD)) {
      const result = this.indicatorsService.calculateMacd({ candles });
      if (result.latestValue?.MACD !== undefined) {
        const macd = result.latestValue.MACD;
        const signal = result.latestValue.signal ?? 0;
        const histogram = result.latestValue.histogram ?? 0;
        momentum.macd = {
          macd,
          signal,
          histogram,
          crossover: this.interpretMacdCrossover(macd, signal, result.values),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.STOCHASTIC)) {
      const result = this.indicatorsService.calculateStochastic({ candles });
      if (result.latestValue) {
        momentum.stochastic = {
          k: result.latestValue.k,
          d: result.latestValue.d,
          signal: this.interpretStochastic(result.latestValue.k),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.ADX)) {
      const result = this.indicatorsService.calculateAdx({ candles });
      if (result.latestValue) {
        momentum.adx = {
          adx: result.latestValue.adx,
          pdi: result.latestValue.pdi,
          mdi: result.latestValue.mdi,
          trendStrength: this.interpretAdx(result.latestValue.adx),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.CCI)) {
      const result = this.indicatorsService.calculateCci({ candles });
      if (result.latestValue !== null) {
        momentum.cci = {
          value: result.latestValue,
          signal: this.interpretCci(result.latestValue),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.WILLIAMS_R)) {
      const result = this.indicatorsService.calculateWilliamsR({ candles });
      if (result.latestValue !== null) {
        momentum.williamsR = {
          value: result.latestValue,
          signal: this.interpretWilliamsR(result.latestValue),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.ROC)) {
      const result = this.indicatorsService.calculateRoc({ candles });
      if (result.latestValue !== null) {
        momentum.roc = {
          value: result.latestValue,
          signal: this.interpretRoc(result.latestValue),
        };
      }
    }

    return momentum;
  }

  /**
   * Calculate trend indicators (SMA, EMA, Ichimoku, PSAR).
   */
  private calculateTrendIndicators(
    candles: readonly CandleInput[],
    indicatorSet: Set<IndicatorType>,
  ): TrendIndicators {
    const trend: TrendIndicators = {};
    const currentPrice = candles.length > 0 ? candles[0].close : 0;

    if (indicatorSet.has(IndicatorType.SMA)) {
      const result = this.indicatorsService.calculateSma({ candles });
      if (result.latestValue !== null) {
        trend.sma = {
          value: result.latestValue,
          trend: currentPrice > result.latestValue ? 'bullish' : 'bearish',
        };
      }
    }

    if (indicatorSet.has(IndicatorType.EMA)) {
      const result = this.indicatorsService.calculateEma({ candles });
      if (result.latestValue !== null) {
        trend.ema = {
          value: result.latestValue,
          trend: currentPrice > result.latestValue ? 'bullish' : 'bearish',
        };
      }
    }

    if (indicatorSet.has(IndicatorType.ICHIMOKU) && candles.length >= 52) {
      const result = this.indicatorsService.calculateIchimokuCloud({ candles });
      if (result.latestValue) {
        trend.ichimoku = {
          tenkan: result.latestValue.conversion,
          kijun: result.latestValue.base,
          senkouA: result.latestValue.spanA,
          senkouB: result.latestValue.spanB,
          signal: this.interpretIchimoku(
            currentPrice,
            result.latestValue.spanA,
            result.latestValue.spanB,
          ),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.PSAR)) {
      const result = this.indicatorsService.calculatePsar({ candles });
      if (result.latestValue !== null) {
        trend.psar = {
          value: result.latestValue,
          trend: currentPrice > result.latestValue ? 'up' : 'down',
        };
      }
    }

    return trend;
  }

  /**
   * Calculate volatility indicators (Bollinger Bands, ATR, Keltner).
   */
  private calculateVolatilityIndicators(
    candles: readonly CandleInput[],
    indicatorSet: Set<IndicatorType>,
  ): VolatilityIndicators {
    const volatility: VolatilityIndicators = {};
    const currentPrice = candles.length > 0 ? candles[0].close : 0;

    if (indicatorSet.has(IndicatorType.BOLLINGER_BANDS)) {
      const result = this.indicatorsService.calculateBollingerBands({
        candles,
      });
      if (result.latestValue) {
        volatility.bollingerBands = {
          upper: result.latestValue.upper,
          middle: result.latestValue.middle,
          lower: result.latestValue.lower,
          percentB: result.latestValue.pb,
          signal: this.interpretBollingerBands(result.latestValue.pb),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.ATR)) {
      const result = this.indicatorsService.calculateAtr({ candles });
      if (result.latestValue !== null) {
        const atrPercent =
          currentPrice > 0 ? (result.latestValue / currentPrice) * 100 : 0;
        volatility.atr = {
          value: result.latestValue,
          volatility: this.interpretAtr(atrPercent),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.KELTNER) && candles.length >= 20) {
      const result = this.indicatorsService.calculateKeltnerChannels({
        candles,
      });
      if (result.latestValue) {
        volatility.keltner = {
          upper: result.latestValue.upper,
          middle: result.latestValue.middle,
          lower: result.latestValue.lower,
          signal: this.interpretKeltner(
            currentPrice,
            result.latestValue.upper,
            result.latestValue.lower,
          ),
        };
      }
    }

    return volatility;
  }

  /**
   * Calculate volume indicators (OBV, MFI, VWAP, Volume Profile).
   */
  private calculateVolumeIndicators(
    candles: readonly CandleInput[],
    indicatorSet: Set<IndicatorType>,
  ): VolumeIndicators {
    const volume: VolumeIndicators = {};
    const currentPrice = candles.length > 0 ? candles[0].close : 0;

    if (indicatorSet.has(IndicatorType.OBV)) {
      const result = this.indicatorsService.calculateObv({ candles });
      if (result.values.length >= 2) {
        const latest = result.values[result.values.length - 1];
        const previous = result.values[result.values.length - 2];
        volume.obv = {
          value: latest,
          trend:
            latest > previous
              ? 'rising'
              : latest < previous
                ? 'falling'
                : 'flat',
        };
      }
    }

    if (indicatorSet.has(IndicatorType.MFI)) {
      const result = this.indicatorsService.calculateMfi({ candles });
      if (result.latestValue !== null) {
        volume.mfi = {
          value: result.latestValue,
          signal: this.interpretMfi(result.latestValue),
        };
      }
    }

    if (indicatorSet.has(IndicatorType.VWAP)) {
      const result = this.indicatorsService.calculateVwap({ candles });
      if (result.latestValue !== null) {
        volume.vwap = {
          value: result.latestValue,
          position: currentPrice > result.latestValue ? 'above' : 'below',
        };
      }
    }

    if (indicatorSet.has(IndicatorType.VOLUME_PROFILE)) {
      const result = this.indicatorsService.calculateVolumeProfile({ candles });
      if (result.pointOfControl) {
        volume.volumeProfile = {
          poc: result.pointOfControl.rangeEnd,
          valueAreaHigh: result.valueAreaHigh ?? 0,
          valueAreaLow: result.valueAreaLow ?? 0,
        };
      }
    }

    return volume;
  }

  /**
   * Calculate pattern detection indicators.
   */
  private calculatePatternIndicators(
    candles: readonly CandleInput[],
    indicatorSet: Set<IndicatorType>,
  ): PatternIndicators {
    const patterns: PatternIndicators = {};

    if (indicatorSet.has(IndicatorType.CANDLESTICK_PATTERNS)) {
      const result = this.indicatorsService.detectCandlestickPatterns({
        candles,
      });
      patterns.candlestickPatterns = {
        patterns: result.detectedPatterns,
        bias: result.bullish
          ? 'bullish'
          : result.bearish
            ? 'bearish'
            : 'neutral',
      };
    }

    if (indicatorSet.has(IndicatorType.RSI_DIVERGENCE)) {
      const result = this.indicatorsService.detectRsiDivergence({ candles });
      patterns.rsiDivergence = {
        type: result.latestDivergence?.type ?? null,
        strength: result.latestDivergence?.strength ?? null,
      };
    }

    if (
      indicatorSet.has(IndicatorType.CHART_PATTERNS) &&
      candles.length >= 50
    ) {
      const result = this.indicatorsService.detectChartPatterns({ candles });
      patterns.chartPatterns = {
        patterns: result.patterns.map((p) => p.type),
        direction:
          result.bullishPatterns.length > result.bearishPatterns.length
            ? 'bullish'
            : result.bearishPatterns.length > result.bullishPatterns.length
              ? 'bearish'
              : null,
      };
    }

    if (indicatorSet.has(IndicatorType.SWING_POINTS)) {
      const result = this.indicatorsService.detectSwingPoints({ candles });
      patterns.swingPoints = {
        latestSwingHigh: result.latestSwingHigh?.price ?? null,
        latestSwingLow: result.latestSwingLow?.price ?? null,
        trend: result.trend,
        swingHighCount: result.swingHighs.length,
        swingLowCount: result.swingLows.length,
      };
    }

    return patterns;
  }

  /**
   * Calculate support/resistance indicators (Pivot Points, Fibonacci).
   */
  private async calculateSupportResistanceIndicators(
    productId: string,
    candles: readonly CandleInput[],
    indicatorSet: Set<IndicatorType>,
  ): Promise<SupportResistanceIndicators> {
    const supportResistance: SupportResistanceIndicators = {};

    // Pivot Points: Use daily candles (industry standard)
    if (indicatorSet.has(IndicatorType.PIVOT_POINTS)) {
      try {
        const dailyCandles = await this.fetchDailyCandles(productId);
        // Use previous day (index 1, since index 0 is current incomplete day)
        if (dailyCandles.length >= 2) {
          const previousDay = dailyCandles[1];
          const result = this.indicatorsService.calculatePivotPoints({
            high: previousDay.high,
            low: previousDay.low,
            close: previousDay.close,
            open: previousDay.open,
          });
          // Standard pivot points have all levels
          if (result.type === 'standard' || result.type === 'fibonacci') {
            supportResistance.pivotPoints = {
              pivot: result.pivotPoint,
              r1: result.resistance1,
              r2: result.resistance2,
              r3: result.resistance3,
              s1: result.support1,
              s2: result.support2,
              s3: result.support3,
              source: 'daily',
            };
          } else if (result.type === 'camarilla') {
            supportResistance.pivotPoints = {
              pivot: result.pivotPoint,
              r1: result.resistance1,
              r2: result.resistance2,
              r3: result.resistance3,
              s1: result.support1,
              s2: result.support2,
              s3: result.support3,
              source: 'daily',
            };
          } else if (result.type === 'woodie') {
            supportResistance.pivotPoints = {
              pivot: result.pivotPoint,
              r1: result.resistance1,
              r2: result.resistance2,
              r3: 0,
              s1: result.support1,
              s2: result.support2,
              s3: 0,
              source: 'daily',
            };
          } else {
            // demark type
            supportResistance.pivotPoints = {
              pivot: result.pivotPoint,
              r1: result.resistance1,
              r2: 0,
              r3: 0,
              s1: result.support1,
              s2: 0,
              s3: 0,
              source: 'daily',
            };
          }
        }
      } catch {
        // Pivot points calculation failed, skip
      }
    }

    // Fibonacci: Use swing points (industry standard)
    if (indicatorSet.has(IndicatorType.FIBONACCI)) {
      const swings = this.indicatorsService.detectSwingPoints({ candles });
      if (swings.latestSwingHigh && swings.latestSwingLow) {
        const isUptrend = swings.trend === 'uptrend';
        const start = isUptrend
          ? swings.latestSwingLow.price
          : swings.latestSwingHigh.price;
        const end = isUptrend
          ? swings.latestSwingHigh.price
          : swings.latestSwingLow.price;

        const result = this.indicatorsService.calculateFibonacciRetracement({
          start,
          end,
        });

        const levels: Record<string, number> = {};
        for (const level of result.levels) {
          levels[`${level.level}%`] = level.price;
        }

        supportResistance.fibonacci = {
          trend: result.trend,
          levels,
          swingHigh: swings.latestSwingHigh.price,
          swingLow: swings.latestSwingLow.price,
        };
      }
    }

    return supportResistance;
  }

  /**
   * Calculate aggregated signal from all indicator results.
   */
  private calculateAggregatedSignal(
    indicators: IndicatorResults,
  ): AggregatedSignal {
    let bullishSignals = 0;
    let bearishSignals = 0;
    let totalSignals = 0;

    // Count momentum signals
    if (indicators.momentum) {
      const m = indicators.momentum;
      if (m.rsi) {
        totalSignals++;
        if (m.rsi.signal === 'oversold') {
          bullishSignals++;
        } else if (m.rsi.signal === 'overbought') {
          bearishSignals++;
        }
      }
      if (m.macd) {
        totalSignals++;
        if (m.macd.crossover === 'bullish') {
          bullishSignals++;
        } else if (m.macd.crossover === 'bearish') {
          bearishSignals++;
        }
      }
      if (m.stochastic) {
        totalSignals++;
        if (m.stochastic.signal === 'oversold') {
          bullishSignals++;
        } else if (m.stochastic.signal === 'overbought') {
          bearishSignals++;
        }
      }
      if (m.adx) {
        totalSignals++;
        if (m.adx.pdi > m.adx.mdi) {
          bullishSignals++;
        } else if (m.adx.mdi > m.adx.pdi) {
          bearishSignals++;
        }
      }
      if (m.cci) {
        totalSignals++;
        if (m.cci.signal === 'oversold') {
          bullishSignals++;
        } else if (m.cci.signal === 'overbought') {
          bearishSignals++;
        }
      }
      if (m.williamsR) {
        totalSignals++;
        if (m.williamsR.signal === 'oversold') {
          bullishSignals++;
        } else if (m.williamsR.signal === 'overbought') {
          bearishSignals++;
        }
      }
      if (m.roc) {
        totalSignals++;
        if (m.roc.signal === 'bullish') {
          bullishSignals++;
        } else if (m.roc.signal === 'bearish') {
          bearishSignals++;
        }
      }
    }

    // Count trend signals
    if (indicators.trend) {
      const t = indicators.trend;
      if (t.sma) {
        totalSignals++;
        if (t.sma.trend === 'bullish') {
          bullishSignals++;
        } else {
          bearishSignals++;
        }
      }
      if (t.ema) {
        totalSignals++;
        if (t.ema.trend === 'bullish') {
          bullishSignals++;
        } else {
          bearishSignals++;
        }
      }
      if (t.ichimoku) {
        totalSignals++;
        if (t.ichimoku.signal === 'bullish') {
          bullishSignals++;
        } else if (t.ichimoku.signal === 'bearish') {
          bearishSignals++;
        }
      }
      if (t.psar) {
        totalSignals++;
        if (t.psar.trend === 'up') {
          bullishSignals++;
        } else {
          bearishSignals++;
        }
      }
    }

    // Count volatility signals
    if (indicators.volatility?.bollingerBands) {
      totalSignals++;
      if (indicators.volatility.bollingerBands.signal === 'oversold') {
        bullishSignals++;
      } else if (indicators.volatility.bollingerBands.signal === 'overbought') {
        bearishSignals++;
      }
    }

    // Count volume signals
    if (indicators.volume) {
      const v = indicators.volume;
      if (v.obv) {
        totalSignals++;
        if (v.obv.trend === 'rising') {
          bullishSignals++;
        } else if (v.obv.trend === 'falling') {
          bearishSignals++;
        }
      }
      if (v.mfi) {
        totalSignals++;
        if (v.mfi.signal === 'oversold') {
          bullishSignals++;
        } else if (v.mfi.signal === 'overbought') {
          bearishSignals++;
        }
      }
      if (v.vwap) {
        totalSignals++;
        if (v.vwap.position === 'above') {
          bullishSignals++;
        } else {
          bearishSignals++;
        }
      }
    }

    // Count pattern signals
    if (indicators.patterns) {
      const p = indicators.patterns;
      if (p.candlestickPatterns) {
        totalSignals++;
        if (p.candlestickPatterns.bias === 'bullish') {
          bullishSignals++;
        } else if (p.candlestickPatterns.bias === 'bearish') {
          bearishSignals++;
        }
      }
      if (p.rsiDivergence?.type) {
        totalSignals++;
        if (p.rsiDivergence.type.includes('bullish')) {
          bullishSignals++;
        } else if (p.rsiDivergence.type.includes('bearish')) {
          bearishSignals++;
        }
      }
      if (p.chartPatterns?.direction) {
        totalSignals++;
        if (p.chartPatterns.direction === 'bullish') {
          bullishSignals++;
        } else {
          bearishSignals++;
        }
      }
      if (p.swingPoints) {
        totalSignals++;
        if (p.swingPoints.trend === 'uptrend') {
          bullishSignals++;
        } else if (p.swingPoints.trend === 'downtrend') {
          bearishSignals++;
        }
      }
    }

    // Calculate score (-100 to +100)
    const score =
      totalSignals > 0
        ? Math.round(((bullishSignals - bearishSignals) / totalSignals) * 100)
        : 0;

    // Determine direction
    const direction = this.scoreToDirection(score);

    // Determine confidence
    const agreementRate =
      totalSignals > 0
        ? Math.max(bullishSignals, bearishSignals) / totalSignals
        : 0;
    const confidence = this.agreementToConfidence(agreementRate, totalSignals);

    return { score, direction, confidence };
  }

  // ============================================================================
  // Interpretation Helpers
  // ============================================================================

  private interpretRsi(value: number): string {
    if (value >= 70) {
      return 'overbought';
    }
    if (value <= 30) {
      return 'oversold';
    }
    return 'neutral';
  }

  private interpretMacdCrossover(
    macd: number,
    signal: number,
    values: readonly { MACD?: number; signal?: number }[],
  ): string {
    if (values.length < 2) {
      return 'none';
    }
    const prev = values[values.length - 2];
    const prevMacd = prev.MACD ?? 0;
    const prevSignal = prev.signal ?? 0;

    if (macd > signal && prevMacd <= prevSignal) {
      return 'bullish';
    }
    if (macd < signal && prevMacd >= prevSignal) {
      return 'bearish';
    }
    return 'none';
  }

  private interpretStochastic(k: number): string {
    if (k >= 80) {
      return 'overbought';
    }
    if (k <= 20) {
      return 'oversold';
    }
    return 'neutral';
  }

  private interpretAdx(adx: number): string {
    if (adx >= 25) {
      return 'strong';
    }
    if (adx >= 20) {
      return 'moderate';
    }
    return 'weak';
  }

  private interpretCci(value: number): string {
    if (value >= 100) {
      return 'overbought';
    }
    if (value <= -100) {
      return 'oversold';
    }
    return 'neutral';
  }

  private interpretWilliamsR(value: number): string {
    if (value >= -20) {
      return 'overbought';
    }
    if (value <= -80) {
      return 'oversold';
    }
    return 'neutral';
  }

  private interpretRoc(value: number): string {
    if (value > 0) {
      return 'bullish';
    }
    if (value < 0) {
      return 'bearish';
    }
    return 'neutral';
  }

  private interpretIchimoku(
    price: number,
    spanA: number,
    spanB: number,
  ): string {
    const cloudTop = Math.max(spanA, spanB);
    const cloudBottom = Math.min(spanA, spanB);
    if (price > cloudTop) {
      return 'bullish';
    }
    if (price < cloudBottom) {
      return 'bearish';
    }
    return 'neutral';
  }

  private interpretBollingerBands(percentB: number): string {
    if (percentB >= 1) {
      return 'overbought';
    }
    if (percentB <= 0) {
      return 'oversold';
    }
    return 'neutral';
  }

  private interpretAtr(atrPercent: number): string {
    if (atrPercent >= 3) {
      return 'high';
    }
    if (atrPercent >= 1.5) {
      return 'normal';
    }
    return 'low';
  }

  private interpretKeltner(
    price: number,
    upper: number,
    lower: number,
  ): string {
    if (price >= upper) {
      return 'overbought';
    }
    if (price <= lower) {
      return 'oversold';
    }
    return 'neutral';
  }

  private interpretMfi(value: number): string {
    if (value >= 80) {
      return 'overbought';
    }
    if (value <= 20) {
      return 'oversold';
    }
    return 'neutral';
  }

  private scoreToDirection(score: number): SignalDirection {
    if (score >= 50) {
      return 'STRONG_BUY';
    }
    if (score >= 20) {
      return 'BUY';
    }
    if (score <= -50) {
      return 'STRONG_SELL';
    }
    if (score <= -20) {
      return 'SELL';
    }
    return 'NEUTRAL';
  }

  private agreementToConfidence(
    rate: number,
    totalSignals: number,
  ): SignalConfidence {
    if (totalSignals < 5) {
      return 'LOW';
    }
    if (rate >= 0.75) {
      return 'HIGH';
    }
    if (rate >= 0.5) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
}
