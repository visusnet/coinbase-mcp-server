import {
  RSI,
  MACD,
  SMA,
  EMA,
  BollingerBands,
  ATR,
  Stochastic,
  ADX,
  OBV,
  VWAP,
  CCI,
  WilliamsR,
  ROC,
  MFI,
  PSAR,
  IchimokuCloud,
  KeltnerChannels,
  fibonacciretracement,
  bullish,
  bearish,
  doji,
  bullishengulfingpattern,
  bearishengulfingpattern,
  bullishhammerstick,
  bullishinvertedhammerstick,
  bearishhammerstick,
  bearishinvertedhammerstick,
  hangingman,
  shootingstar,
  morningstar,
  eveningstar,
  morningdojistar,
  eveningdojistar,
  threewhitesoldiers,
  threeblackcrows,
  piercingline,
  darkcloudcover,
  dragonflydoji,
  gravestonedoji,
  bullishharami,
  bearishharami,
  bullishharamicross,
  bearishharamicross,
  bullishmarubozu,
  bearishmarubozu,
  bullishspinningtop,
  bearishspinningtop,
  tweezertop,
  tweezerbottom,
  abandonedbaby,
  downsidetasukigap,
} from '@thuantan2060/technicalindicators';

import {
  calculateStandardPivotPoints,
  calculateFibonacciPivotPoints,
  calculateWoodiePivotPoints,
  calculateCamarillaPivotPoints,
  calculateDemarkPivotPoints,
  PivotPointsType,
  PivotPointsOutput,
} from './indicators/pivotPoints';

import {
  calculateRsiValues,
  findLocalPeaks,
  findLocalTroughs,
  detectDivergences,
  RsiDivergence,
} from './indicators/rsiDivergence';

import {
  calculateZones,
  findPointOfControl,
  calculateValueArea,
  VolumeProfileZone,
} from './indicators/volumeProfile';

import { detectChartPatterns, ChartPattern } from './indicators/chartPatterns';

/**
 * Candle data structure matching Coinbase API output.
 * All values are strings to match the API response format.
 */
export interface CandleInput {
  readonly open: string;
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly volume: string;
}

/**
 * Input for RSI calculation
 */
export interface CalculateRsiInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for RSI calculation
 */
export interface CalculateRsiOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for MACD calculation
 */
export interface CalculateMacdInput {
  readonly candles: readonly CandleInput[];
  readonly fastPeriod?: number;
  readonly slowPeriod?: number;
  readonly signalPeriod?: number;
}

/**
 * Single MACD data point
 */
interface MacdValue {
  readonly MACD?: number;
  readonly signal?: number;
  readonly histogram?: number;
}

/**
 * Output for MACD calculation
 */
export interface CalculateMacdOutput {
  readonly fastPeriod: number;
  readonly slowPeriod: number;
  readonly signalPeriod: number;
  readonly values: readonly MacdValue[];
  readonly latestValue: MacdValue | null;
}

/**
 * Input for SMA calculation
 */
export interface CalculateSmaInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for SMA calculation
 */
export interface CalculateSmaOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for EMA calculation
 */
export interface CalculateEmaInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for EMA calculation
 */
export interface CalculateEmaOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Bollinger Bands calculation
 */
export interface CalculateBollingerBandsInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
  readonly stdDev?: number;
}

/**
 * Single Bollinger Bands data point
 */
interface BollingerBandsValue {
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
  readonly pb: number;
  readonly bandwidth: number;
}

/**
 * Output for Bollinger Bands calculation
 */
export interface CalculateBollingerBandsOutput {
  readonly period: number;
  readonly stdDev: number;
  readonly values: readonly BollingerBandsValue[];
  readonly latestValue: BollingerBandsValue | null;
}

/**
 * Input for ATR calculation
 */
export interface CalculateAtrInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for ATR calculation
 */
export interface CalculateAtrOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Stochastic oscillator calculation
 */
export interface CalculateStochasticInput {
  readonly candles: readonly CandleInput[];
  readonly kPeriod?: number;
  readonly dPeriod?: number;
}

/**
 * Single Stochastic data point
 */
interface StochasticValue {
  readonly k: number;
  readonly d: number;
}

/**
 * Output for Stochastic calculation
 */
export interface CalculateStochasticOutput {
  readonly kPeriod: number;
  readonly dPeriod: number;
  readonly values: readonly StochasticValue[];
  readonly latestValue: StochasticValue | null;
}

/**
 * Input for ADX calculation
 */
export interface CalculateAdxInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Single ADX data point
 */
interface AdxValue {
  readonly adx: number;
  readonly pdi: number;
  readonly mdi: number;
}

/**
 * Output for ADX calculation
 */
export interface CalculateAdxOutput {
  readonly period: number;
  readonly values: readonly AdxValue[];
  readonly latestValue: AdxValue | null;
}

/**
 * Input for OBV calculation
 */
export interface CalculateObvInput {
  readonly candles: readonly CandleInput[];
}

/**
 * Output for OBV calculation
 */
export interface CalculateObvOutput {
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for VWAP calculation
 */
export interface CalculateVwapInput {
  readonly candles: readonly CandleInput[];
}

/**
 * Output for VWAP calculation
 */
export interface CalculateVwapOutput {
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for CCI calculation
 */
export interface CalculateCciInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for CCI calculation
 */
export interface CalculateCciOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Williams %R calculation
 */
export interface CalculateWilliamsRInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for Williams %R calculation
 */
export interface CalculateWilliamsROutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for ROC calculation
 */
export interface CalculateRocInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for ROC calculation
 */
export interface CalculateRocOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for MFI calculation
 */
export interface CalculateMfiInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for MFI calculation
 */
export interface CalculateMfiOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Parabolic SAR calculation
 */
export interface CalculatePsarInput {
  readonly candles: readonly CandleInput[];
  readonly step?: number;
  readonly max?: number;
}

/**
 * Output for Parabolic SAR calculation
 */
export interface CalculatePsarOutput {
  readonly step: number;
  readonly max: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Ichimoku Cloud calculation
 */
export interface CalculateIchimokuCloudInput {
  readonly candles: readonly CandleInput[];
  readonly conversionPeriod?: number;
  readonly basePeriod?: number;
  readonly spanPeriod?: number;
  readonly displacement?: number;
}

/**
 * Single Ichimoku Cloud data point.
 *
 * Note: The Chikou Span (Lagging Span) is the current closing price plotted
 * `displacement` periods (default: 26) in the past. For the most recent
 * `displacement` data points, chikou will be null because we cannot know
 * future closing prices. This matches the industry standard behavior of
 * TradingView, MetaTrader, and other professional charting platforms.
 */
interface IchimokuCloudDataPoint {
  readonly conversion: number;
  readonly base: number;
  readonly spanA: number;
  readonly spanB: number;
  readonly chikou: number | null;
}

/**
 * Output for Ichimoku Cloud calculation
 */
export interface CalculateIchimokuCloudOutput {
  readonly conversionPeriod: number;
  readonly basePeriod: number;
  readonly spanPeriod: number;
  readonly displacement: number;
  readonly values: readonly IchimokuCloudDataPoint[];
  readonly latestValue: IchimokuCloudDataPoint | null;
}

/**
 * Input for Keltner Channels calculation
 */
export interface CalculateKeltnerChannelsInput {
  readonly candles: readonly CandleInput[];
  readonly maPeriod?: number;
  readonly atrPeriod?: number;
  readonly multiplier?: number;
  readonly useSMA?: boolean;
}

/**
 * Single Keltner Channels data point
 */
interface KeltnerChannelsDataPoint {
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
}

/**
 * Output for Keltner Channels calculation
 */
export interface CalculateKeltnerChannelsOutput {
  readonly maPeriod: number;
  readonly atrPeriod: number;
  readonly multiplier: number;
  readonly useSMA: boolean;
  readonly values: readonly KeltnerChannelsDataPoint[];
  readonly latestValue: KeltnerChannelsDataPoint | null;
}

/**
 * Input for Fibonacci Retracement calculation
 */
export interface CalculateFibonacciRetracementInput {
  readonly start: number;
  readonly end: number;
}

/**
 * Output for Fibonacci Retracement calculation
 */
export interface CalculateFibonacciRetracementOutput {
  readonly start: number;
  readonly end: number;
  readonly trend: 'uptrend' | 'downtrend';
  readonly levels: {
    readonly level: number;
    readonly price: number;
  }[];
}

/**
 * Input for Candlestick Patterns detection
 */
export interface DetectCandlestickPatternsInput {
  readonly candles: readonly CandleInput[];
}

/**
 * Output for Candlestick Patterns detection
 */
export interface DetectCandlestickPatternsOutput {
  readonly bullish: boolean;
  readonly bearish: boolean;
  readonly patterns: {
    readonly name: string;
    readonly type: 'bullish' | 'bearish' | 'neutral';
    readonly detected: boolean;
  }[];
  readonly detectedPatterns: string[];
}

/**
 * Input for Volume Profile calculation
 */
export interface CalculateVolumeProfileInput {
  readonly candles: readonly CandleInput[];
  readonly noOfBars?: number;
}

/**
 * Output for Volume Profile calculation
 */
export interface CalculateVolumeProfileOutput {
  readonly noOfBars: number;
  readonly zones: readonly VolumeProfileZone[];
  readonly pointOfControl: VolumeProfileZone | null;
  readonly valueAreaHigh: number | null;
  readonly valueAreaLow: number | null;
}

/**
 * Input for Pivot Points calculation
 */
export interface CalculatePivotPointsInput {
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly open?: string;
  readonly type?: PivotPointsType;
}

/**
 * Input for RSI Divergence detection
 */
export interface DetectRsiDivergenceInput {
  readonly candles: readonly CandleInput[];
  readonly rsiPeriod?: number;
  readonly lookbackPeriod?: number;
}

/**
 * Output for RSI Divergence detection
 */
export interface DetectRsiDivergenceOutput {
  readonly rsiPeriod: number;
  readonly lookbackPeriod: number;
  readonly rsiValues: readonly number[];
  readonly divergences: readonly RsiDivergence[];
  readonly latestDivergence: RsiDivergence | null;
  readonly hasBullishDivergence: boolean;
  readonly hasBearishDivergence: boolean;
}

/**
 * Input for Chart Pattern detection
 */
export interface DetectChartPatternsInput {
  readonly candles: readonly CandleInput[];
  readonly lookbackPeriod?: number;
}

/**
 * Output for Chart Pattern detection
 */
export interface DetectChartPatternsOutput {
  readonly lookbackPeriod: number;
  readonly patterns: readonly ChartPattern[];
  readonly bullishPatterns: readonly ChartPattern[];
  readonly bearishPatterns: readonly ChartPattern[];
  readonly latestPattern: ChartPattern | null;
}

const DEFAULT_RSI_PERIOD = 14;
const DEFAULT_SMA_PERIOD = 20;
const DEFAULT_EMA_PERIOD = 20;
const DEFAULT_MACD_FAST_PERIOD = 12;
const DEFAULT_MACD_SLOW_PERIOD = 26;
const DEFAULT_MACD_SIGNAL_PERIOD = 9;
const DEFAULT_BOLLINGER_PERIOD = 20;
const DEFAULT_BOLLINGER_STD_DEV = 2;
const DEFAULT_ATR_PERIOD = 14;
const DEFAULT_STOCHASTIC_K_PERIOD = 14;
const DEFAULT_STOCHASTIC_D_PERIOD = 3;
const DEFAULT_ADX_PERIOD = 14;
const DEFAULT_CCI_PERIOD = 20;
const DEFAULT_WILLIAMS_R_PERIOD = 14;
const DEFAULT_ROC_PERIOD = 12;
const DEFAULT_MFI_PERIOD = 14;
const DEFAULT_PSAR_STEP = 0.02;
const DEFAULT_PSAR_MAX = 0.2;
const DEFAULT_ICHIMOKU_CONVERSION_PERIOD = 9;
const DEFAULT_ICHIMOKU_BASE_PERIOD = 26;
const DEFAULT_ICHIMOKU_SPAN_PERIOD = 52;
const DEFAULT_ICHIMOKU_DISPLACEMENT = 26;
const DEFAULT_KELTNER_MA_PERIOD = 20;
const DEFAULT_KELTNER_ATR_PERIOD = 10;
const DEFAULT_KELTNER_MULTIPLIER = 2;

/**
 * Service for calculating technical indicators from candle data.
 * Accepts candle data in the same format as Coinbase API output.
 */
export class TechnicalIndicatorsService {
  /**
   * Calculate RSI (Relative Strength Index) from candle data.
   *
   * @param input - Candles and optional period (default: 14)
   * @returns RSI values array and latest value
   */
  public calculateRsi(input: CalculateRsiInput): CalculateRsiOutput {
    const period = input.period ?? DEFAULT_RSI_PERIOD;
    const closePrices = extractClosePrices(input.candles);

    const rsiValues = RSI.calculate({
      period,
      values: closePrices,
    });

    return {
      period,
      values: rsiValues,
      latestValue:
        rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null,
    };
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence) from candle data.
   *
   * @param input - Candles and optional periods (default: 12/26/9)
   * @returns MACD line, signal line, and histogram values
   */
  public calculateMacd(input: CalculateMacdInput): CalculateMacdOutput {
    const fastPeriod = input.fastPeriod ?? DEFAULT_MACD_FAST_PERIOD;
    const slowPeriod = input.slowPeriod ?? DEFAULT_MACD_SLOW_PERIOD;
    const signalPeriod = input.signalPeriod ?? DEFAULT_MACD_SIGNAL_PERIOD;
    const closePrices = extractClosePrices(input.candles);

    const macdValues = MACD.calculate({
      values: closePrices,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });

    return {
      fastPeriod,
      slowPeriod,
      signalPeriod,
      values: macdValues,
      latestValue:
        macdValues.length > 0 ? macdValues[macdValues.length - 1] : null,
    };
  }

  /**
   * Calculate SMA (Simple Moving Average) from candle data.
   *
   * @param input - Candles and optional period (default: 20)
   * @returns SMA values array and latest value
   */
  public calculateSma(input: CalculateSmaInput): CalculateSmaOutput {
    const period = input.period ?? DEFAULT_SMA_PERIOD;
    const closePrices = extractClosePrices(input.candles);

    const smaValues = SMA.calculate({
      period,
      values: closePrices,
    });

    return {
      period,
      values: smaValues,
      latestValue:
        smaValues.length > 0 ? smaValues[smaValues.length - 1] : null,
    };
  }

  /**
   * Calculate EMA (Exponential Moving Average) from candle data.
   *
   * @param input - Candles and optional period (default: 20)
   * @returns EMA values array and latest value
   */
  public calculateEma(input: CalculateEmaInput): CalculateEmaOutput {
    const period = input.period ?? DEFAULT_EMA_PERIOD;
    const closePrices = extractClosePrices(input.candles);

    const emaValues = EMA.calculate({
      period,
      values: closePrices,
    });

    return {
      period,
      values: emaValues,
      latestValue:
        emaValues.length > 0 ? emaValues[emaValues.length - 1] : null,
    };
  }

  /**
   * Calculate Bollinger Bands from candle data.
   *
   * @param input - Candles and optional period/stdDev (default: 20/2)
   * @returns Upper, middle, lower bands, %B, and bandwidth values
   */
  public calculateBollingerBands(
    input: CalculateBollingerBandsInput,
  ): CalculateBollingerBandsOutput {
    const period = input.period ?? DEFAULT_BOLLINGER_PERIOD;
    const stdDev = input.stdDev ?? DEFAULT_BOLLINGER_STD_DEV;
    const closePrices = extractClosePrices(input.candles);

    const rawBbValues = BollingerBands.calculate({
      period,
      stdDev,
      values: closePrices,
    });

    // Add bandwidth calculation: (upper - lower) / middle
    const bbValues: BollingerBandsValue[] = rawBbValues.map((bb) => ({
      middle: bb.middle,
      upper: bb.upper,
      lower: bb.lower,
      pb: bb.pb,
      bandwidth: (bb.upper - bb.lower) / bb.middle,
    }));

    return {
      period,
      stdDev,
      values: bbValues,
      latestValue: bbValues.length > 0 ? bbValues[bbValues.length - 1] : null,
    };
  }

  /**
   * Calculate ATR (Average True Range) from candle data.
   *
   * @param input - Candles and optional period (default: 14)
   * @returns ATR values array and latest value
   */
  public calculateAtr(input: CalculateAtrInput): CalculateAtrOutput {
    const period = input.period ?? DEFAULT_ATR_PERIOD;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);

    const atrValues = ATR.calculate({
      period,
      high,
      low,
      close,
    });

    return {
      period,
      values: atrValues,
      latestValue:
        atrValues.length > 0 ? atrValues[atrValues.length - 1] : null,
    };
  }

  /**
   * Calculate Stochastic oscillator from candle data.
   *
   * @param input - Candles and optional periods (default: 14/3)
   * @returns %K and %D values array and latest value
   */
  public calculateStochastic(
    input: CalculateStochasticInput,
  ): CalculateStochasticOutput {
    const kPeriod = input.kPeriod ?? DEFAULT_STOCHASTIC_K_PERIOD;
    const dPeriod = input.dPeriod ?? DEFAULT_STOCHASTIC_D_PERIOD;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);

    const stochValues = Stochastic.calculate({
      high,
      low,
      close,
      period: kPeriod,
      signalPeriod: dPeriod,
    });

    return {
      kPeriod,
      dPeriod,
      values: stochValues,
      latestValue:
        stochValues.length > 0 ? stochValues[stochValues.length - 1] : null,
    };
  }

  /**
   * Calculate ADX (Average Directional Index) from candle data.
   *
   * @param input - Candles and optional period (default: 14)
   * @returns ADX, +DI, and -DI values array and latest value
   */
  public calculateAdx(input: CalculateAdxInput): CalculateAdxOutput {
    const period = input.period ?? DEFAULT_ADX_PERIOD;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);

    const adxValues = ADX.calculate({
      period,
      high,
      low,
      close,
    });

    return {
      period,
      values: adxValues,
      latestValue:
        adxValues.length > 0 ? adxValues[adxValues.length - 1] : null,
    };
  }

  /**
   * Calculate OBV (On-Balance Volume) from candle data.
   *
   * @param input - Candles with close prices and volume
   * @returns OBV values array and latest value
   */
  public calculateObv(input: CalculateObvInput): CalculateObvOutput {
    const close = extractClosePrices(input.candles);
    const volume = extractVolumes(input.candles);

    const obvValues = OBV.calculate({
      close,
      volume,
    });

    return {
      values: obvValues,
      latestValue:
        obvValues.length > 0 ? obvValues[obvValues.length - 1] : null,
    };
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price) from candle data.
   *
   * @param input - Candles with OHLCV data
   * @returns VWAP values array and latest value
   */
  public calculateVwap(input: CalculateVwapInput): CalculateVwapOutput {
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);
    const volume = extractVolumes(input.candles);

    const vwapValues = VWAP.calculate({
      high,
      low,
      close,
      volume,
    });

    return {
      values: vwapValues,
      latestValue:
        vwapValues.length > 0 ? vwapValues[vwapValues.length - 1] : null,
    };
  }

  /**
   * Calculate CCI (Commodity Channel Index) from candle data.
   *
   * @param input - Candles and optional period (default: 20)
   * @returns CCI values array and latest value
   */
  public calculateCci(input: CalculateCciInput): CalculateCciOutput {
    const period = input.period ?? DEFAULT_CCI_PERIOD;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);

    const cciValues = CCI.calculate({
      period,
      high,
      low,
      close,
    });

    return {
      period,
      values: cciValues,
      latestValue:
        cciValues.length > 0 ? cciValues[cciValues.length - 1] : null,
    };
  }

  /**
   * Calculate Williams %R from candle data.
   *
   * @param input - Candles and optional period (default: 14)
   * @returns Williams %R values array and latest value
   */
  public calculateWilliamsR(
    input: CalculateWilliamsRInput,
  ): CalculateWilliamsROutput {
    const period = input.period ?? DEFAULT_WILLIAMS_R_PERIOD;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);

    const wrValues = WilliamsR.calculate({
      period,
      high,
      low,
      close,
    });

    return {
      period,
      values: wrValues,
      latestValue: wrValues.length > 0 ? wrValues[wrValues.length - 1] : null,
    };
  }

  /**
   * Calculate ROC (Rate of Change) from candle data.
   *
   * @param input - Candles and optional period (default: 12)
   * @returns ROC values array and latest value
   */
  public calculateRoc(input: CalculateRocInput): CalculateRocOutput {
    const period = input.period ?? DEFAULT_ROC_PERIOD;
    const closePrices = extractClosePrices(input.candles);

    const rocValues = ROC.calculate({
      period,
      values: closePrices,
    });

    return {
      period,
      values: rocValues,
      latestValue:
        rocValues.length > 0 ? rocValues[rocValues.length - 1] : null,
    };
  }

  /**
   * Calculate MFI (Money Flow Index) from candle data.
   *
   * @param input - Candles and optional period (default: 14)
   * @returns MFI values array and latest value
   */
  public calculateMfi(input: CalculateMfiInput): CalculateMfiOutput {
    const period = input.period ?? DEFAULT_MFI_PERIOD;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);
    const volume = extractVolumes(input.candles);

    const mfiValues = MFI.calculate({
      period,
      high,
      low,
      close,
      volume,
    });

    return {
      period,
      values: mfiValues,
      latestValue:
        mfiValues.length > 0 ? mfiValues[mfiValues.length - 1] : null,
    };
  }

  /**
   * Calculate Parabolic SAR from candle data.
   *
   * @param input - Candles and optional step/max parameters
   * @returns PSAR values array and latest value
   */
  public calculatePsar(input: CalculatePsarInput): CalculatePsarOutput {
    const step = input.step ?? DEFAULT_PSAR_STEP;
    const max = input.max ?? DEFAULT_PSAR_MAX;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);

    const psarValues = PSAR.calculate({
      step,
      max,
      high,
      low,
    });

    return {
      step,
      max,
      values: psarValues,
      latestValue:
        psarValues.length > 0 ? psarValues[psarValues.length - 1] : null,
    };
  }

  /**
   * Calculate Ichimoku Cloud from candle data.
   *
   * @param input - Candles and optional period parameters
   * @returns Ichimoku Cloud values array and latest value
   */
  public calculateIchimokuCloud(
    input: CalculateIchimokuCloudInput,
  ): CalculateIchimokuCloudOutput {
    const conversionPeriod =
      input.conversionPeriod ?? DEFAULT_ICHIMOKU_CONVERSION_PERIOD;
    const basePeriod = input.basePeriod ?? DEFAULT_ICHIMOKU_BASE_PERIOD;
    const spanPeriod = input.spanPeriod ?? DEFAULT_ICHIMOKU_SPAN_PERIOD;
    const displacement = input.displacement ?? DEFAULT_ICHIMOKU_DISPLACEMENT;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);

    const close = extractClosePrices(input.candles);

    const ichimokuRaw = IchimokuCloud.calculate({
      high,
      low,
      conversionPeriod,
      basePeriod,
      spanPeriod,
      displacement,
    });

    // Chikou Span: Current close plotted `displacement` periods in the past.
    // For position i in the output array, the chikou value comes from the close
    // at index (offset + i + displacement). For the last `displacement` values,
    // chikou is null because we don't have future closing prices.
    const offset = close.length - ichimokuRaw.length;
    const values = ichimokuRaw.map((value, i) => {
      const chikouIndex = offset + i + displacement;
      return {
        conversion: value.conversion,
        base: value.base,
        spanA: value.spanA,
        spanB: value.spanB,
        chikou: chikouIndex < close.length ? close[chikouIndex] : null,
      };
    });

    return {
      conversionPeriod,
      basePeriod,
      spanPeriod,
      displacement,
      values,
      latestValue: values.length > 0 ? values[values.length - 1] : null,
    };
  }

  /**
   * Calculate Keltner Channels from candle data.
   *
   * @param input - Candles and optional parameters
   * @returns Keltner Channels values array and latest value
   */
  public calculateKeltnerChannels(
    input: CalculateKeltnerChannelsInput,
  ): CalculateKeltnerChannelsOutput {
    const maPeriod = input.maPeriod ?? DEFAULT_KELTNER_MA_PERIOD;
    const atrPeriod = input.atrPeriod ?? DEFAULT_KELTNER_ATR_PERIOD;
    const multiplier = input.multiplier ?? DEFAULT_KELTNER_MULTIPLIER;
    const useSMA = input.useSMA ?? false;
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);

    const keltnerValues = KeltnerChannels.calculate({
      maPeriod,
      atrPeriod,
      multiplier,
      useSMA,
      high,
      low,
      close,
    });

    return {
      maPeriod,
      atrPeriod,
      multiplier,
      useSMA,
      values: keltnerValues,
      latestValue:
        keltnerValues.length > 0
          ? keltnerValues[keltnerValues.length - 1]
          : null,
    };
  }

  /**
   * Calculate Fibonacci Retracement levels from start and end prices.
   *
   * @param input - Start and end prices (low to high for uptrend, high to low for downtrend)
   * @returns Fibonacci retracement levels with corresponding prices
   */
  public calculateFibonacciRetracement(
    input: CalculateFibonacciRetracementInput,
  ): CalculateFibonacciRetracementOutput {
    const { start, end } = input;
    const trend = end > start ? 'uptrend' : 'downtrend';

    // Library returns percentage levels: [0, 23.6, 38.2, 50, 61.8, 78.6, 100, 127.2, 161.8, 261.8, 423.6]
    const retracementPrices = fibonacciretracement(start, end);
    const percentLevels = [
      0, 23.6, 38.2, 50, 61.8, 78.6, 100, 127.2, 161.8, 261.8, 423.6,
    ];

    const levels = percentLevels.map((level, index) => ({
      level,
      price: retracementPrices[index],
    }));

    return {
      start,
      end,
      trend,
      levels,
    };
  }

  /**
   * Detect candlestick patterns from candle data.
   *
   * @param input - Candles to analyze
   * @returns Detected patterns with bullish/bearish summary
   */
  public detectCandlestickPatterns(
    input: DetectCandlestickPatternsInput,
  ): DetectCandlestickPatternsOutput {
    const open = extractOpenPrices(input.candles);
    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);

    const stockData = { open, high, low, close };

    // Define all patterns to check
    const patternChecks: {
      name: string;
      type: 'bullish' | 'bearish' | 'neutral';
      fn: (data: {
        open: number[];
        high: number[];
        low: number[];
        close: number[];
      }) => boolean;
    }[] = [
      // Bullish patterns
      { name: 'Hammer', type: 'bullish', fn: bullishhammerstick },
      {
        name: 'Inverted Hammer',
        type: 'bullish',
        fn: bullishinvertedhammerstick,
      },
      {
        name: 'Bullish Engulfing',
        type: 'bullish',
        fn: bullishengulfingpattern,
      },
      { name: 'Morning Star', type: 'bullish', fn: morningstar },
      { name: 'Morning Doji Star', type: 'bullish', fn: morningdojistar },
      { name: 'Three White Soldiers', type: 'bullish', fn: threewhitesoldiers },
      { name: 'Piercing Line', type: 'bullish', fn: piercingline },
      { name: 'Bullish Harami', type: 'bullish', fn: bullishharami },
      { name: 'Bullish Harami Cross', type: 'bullish', fn: bullishharamicross },
      { name: 'Bullish Marubozu', type: 'bullish', fn: bullishmarubozu },
      { name: 'Bullish Spinning Top', type: 'bullish', fn: bullishspinningtop },
      { name: 'Tweezer Bottom', type: 'bullish', fn: tweezerbottom },
      { name: 'Dragonfly Doji', type: 'bullish', fn: dragonflydoji },
      { name: 'Abandoned Baby', type: 'bullish', fn: abandonedbaby },
      { name: 'Downside Tasuki Gap', type: 'bullish', fn: downsidetasukigap },
      // Bearish patterns
      { name: 'Shooting Star', type: 'bearish', fn: shootingstar },
      { name: 'Hanging Man', type: 'bearish', fn: hangingman },
      { name: 'Bearish Hammer', type: 'bearish', fn: bearishhammerstick },
      {
        name: 'Bearish Inverted Hammer',
        type: 'bearish',
        fn: bearishinvertedhammerstick,
      },
      {
        name: 'Bearish Engulfing',
        type: 'bearish',
        fn: bearishengulfingpattern,
      },
      { name: 'Evening Star', type: 'bearish', fn: eveningstar },
      { name: 'Evening Doji Star', type: 'bearish', fn: eveningdojistar },
      { name: 'Three Black Crows', type: 'bearish', fn: threeblackcrows },
      { name: 'Dark Cloud Cover', type: 'bearish', fn: darkcloudcover },
      { name: 'Bearish Harami', type: 'bearish', fn: bearishharami },
      { name: 'Bearish Harami Cross', type: 'bearish', fn: bearishharamicross },
      { name: 'Bearish Marubozu', type: 'bearish', fn: bearishmarubozu },
      { name: 'Bearish Spinning Top', type: 'bearish', fn: bearishspinningtop },
      { name: 'Tweezer Top', type: 'bearish', fn: tweezertop },
      { name: 'Gravestone Doji', type: 'bearish', fn: gravestonedoji },
      // Neutral patterns
      { name: 'Doji', type: 'neutral', fn: doji },
    ];

    const patterns = patternChecks.map((pattern) => ({
      name: pattern.name,
      type: pattern.type,
      detected: pattern.fn(stockData),
    }));

    const detectedPatterns = patterns
      .filter((p) => p.detected)
      .map((p) => p.name);

    return {
      bullish: Boolean(bullish(stockData)),
      bearish: Boolean(bearish(stockData)),
      patterns,
      detectedPatterns,
    };
  }

  /**
   * Calculate Volume Profile from candle data.
   * Divides price range into zones and calculates volume distribution.
   *
   * @param input - Candle data and optional number of bars
   * @returns Volume profile zones with point of control and value area
   */
  public calculateVolumeProfile(
    input: CalculateVolumeProfileInput,
  ): CalculateVolumeProfileOutput {
    const noOfBars = input.noOfBars ?? 12;

    const zones = calculateZones(
      extractOpenPrices(input.candles),
      extractHighPrices(input.candles),
      extractLowPrices(input.candles),
      extractClosePrices(input.candles),
      extractVolumes(input.candles),
      noOfBars,
    );
    const pointOfControl = findPointOfControl(zones);
    const { valueAreaHigh, valueAreaLow } = calculateValueArea(
      zones,
      pointOfControl,
    );

    return {
      noOfBars,
      zones,
      pointOfControl,
      valueAreaHigh,
      valueAreaLow,
    };
  }

  /**
   * Calculate Pivot Points from previous period's OHLC data.
   * Supports multiple calculation types: Standard, Fibonacci, Woodie, Camarilla, DeMark.
   *
   * @param input - High, Low, Close (and optionally Open) prices from previous period
   * @returns Pivot Point with Support and Resistance levels
   */
  public calculatePivotPoints(
    input: CalculatePivotPointsInput,
  ): PivotPointsOutput {
    const high = parseFloat(input.high);
    const low = parseFloat(input.low);
    const close = parseFloat(input.close);
    const open = input.open ? parseFloat(input.open) : close;
    const type = input.type ?? 'standard';

    switch (type) {
      case 'fibonacci':
        return calculateFibonacciPivotPoints(high, low, close);
      case 'woodie':
        return calculateWoodiePivotPoints(high, low, close);
      case 'camarilla':
        return calculateCamarillaPivotPoints(high, low, close);
      case 'demark':
        return calculateDemarkPivotPoints(high, low, close, open);
      default:
        return calculateStandardPivotPoints(high, low, close);
    }
  }

  /**
   * Detect RSI Divergences in price data.
   * Identifies bullish/bearish divergences and hidden divergences.
   *
   * @param input - Candles, RSI period, and lookback period
   * @returns Detected divergences with their characteristics
   */
  public detectRsiDivergence(
    input: DetectRsiDivergenceInput,
  ): DetectRsiDivergenceOutput {
    const rsiPeriod = input.rsiPeriod ?? 14;
    const lookbackPeriod = input.lookbackPeriod ?? 14;
    const closePrices = extractClosePrices(input.candles);

    const rsiValues = calculateRsiValues(closePrices, rsiPeriod);
    const rsiOffset = closePrices.length - rsiValues.length;

    const pricePeaks = findLocalPeaks(closePrices, lookbackPeriod);
    const priceTroughs = findLocalTroughs(closePrices, lookbackPeriod);

    const divergences = [
      ...detectDivergences(
        'bearish',
        pricePeaks,
        closePrices,
        rsiValues,
        rsiOffset,
      ),
      ...detectDivergences(
        'bullish',
        priceTroughs,
        closePrices,
        rsiValues,
        rsiOffset,
      ),
      ...detectDivergences(
        'hidden_bearish',
        pricePeaks,
        closePrices,
        rsiValues,
        rsiOffset,
      ),
      ...detectDivergences(
        'hidden_bullish',
        priceTroughs,
        closePrices,
        rsiValues,
        rsiOffset,
      ),
    ].sort((a, b) => b.endIndex - a.endIndex);

    const latestDivergence = divergences.length > 0 ? divergences[0] : null;
    const hasBullishDivergence = divergences.some(
      (d) => d.type === 'bullish' || d.type === 'hidden_bullish',
    );
    const hasBearishDivergence = divergences.some(
      (d) => d.type === 'bearish' || d.type === 'hidden_bearish',
    );

    return {
      rsiPeriod,
      lookbackPeriod,
      rsiValues,
      divergences,
      latestDivergence,
      hasBullishDivergence,
      hasBearishDivergence,
    };
  }

  /**
   * Detect Chart Patterns in price data.
   * Identifies reversal and continuation patterns like Double Top/Bottom,
   * Head and Shoulders, Triangles, and Flags.
   *
   * @param input - Candles and optional lookback period
   * @returns Detected patterns with price targets
   */
  public detectChartPatterns(
    input: DetectChartPatternsInput,
  ): DetectChartPatternsOutput {
    const lookbackPeriod = input.lookbackPeriod ?? 50;

    const high = extractHighPrices(input.candles);
    const low = extractLowPrices(input.candles);
    const close = extractClosePrices(input.candles);

    const patterns = detectChartPatterns(high, low, close, lookbackPeriod);

    const bullishPatterns = patterns.filter((p) => p.direction === 'bullish');
    const bearishPatterns = patterns.filter((p) => p.direction === 'bearish');
    const latestPattern = patterns.length > 0 ? patterns[0] : null;

    return {
      lookbackPeriod,
      patterns,
      bullishPatterns,
      bearishPatterns,
      latestPattern,
    };
  }
}

/**
 * Extract open prices from candle data as numbers.
 */
function extractOpenPrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => parseFloat(candle.open));
}

/**
 * Extract close prices from candle data as numbers.
 */
function extractClosePrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => parseFloat(candle.close));
}

/**
 * Extract high prices from candle data as numbers.
 */
function extractHighPrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => parseFloat(candle.high));
}

/**
 * Extract low prices from candle data as numbers.
 */
function extractLowPrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => parseFloat(candle.low));
}

/**
 * Extract volume from candle data as numbers.
 */
function extractVolumes(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => parseFloat(candle.volume));
}
