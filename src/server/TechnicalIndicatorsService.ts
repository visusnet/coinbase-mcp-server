import {
  RSI,
  MACD,
  EMA,
  BollingerBands,
  ATR,
  Stochastic,
} from 'technicalindicators';

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
export interface MacdValue {
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
export interface BollingerBandsValue {
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
  readonly pb: number;
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
  readonly stochPeriod?: number;
}

/**
 * Single Stochastic data point
 */
export interface StochasticValue {
  readonly k: number;
  readonly d: number;
}

/**
 * Output for Stochastic calculation
 */
export interface CalculateStochasticOutput {
  readonly kPeriod: number;
  readonly dPeriod: number;
  readonly stochPeriod: number;
  readonly values: readonly StochasticValue[];
  readonly latestValue: StochasticValue | null;
}

const DEFAULT_RSI_PERIOD = 14;
const DEFAULT_EMA_PERIOD = 20;
const DEFAULT_MACD_FAST_PERIOD = 12;
const DEFAULT_MACD_SLOW_PERIOD = 26;
const DEFAULT_MACD_SIGNAL_PERIOD = 9;
const DEFAULT_BOLLINGER_PERIOD = 20;
const DEFAULT_BOLLINGER_STD_DEV = 2;
const DEFAULT_ATR_PERIOD = 14;
const DEFAULT_STOCHASTIC_K_PERIOD = 14;
const DEFAULT_STOCHASTIC_D_PERIOD = 3;
const DEFAULT_STOCHASTIC_STOCH_PERIOD = 3;

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
   * @returns Upper, middle, lower bands and %B values
   */
  public calculateBollingerBands(
    input: CalculateBollingerBandsInput,
  ): CalculateBollingerBandsOutput {
    const period = input.period ?? DEFAULT_BOLLINGER_PERIOD;
    const stdDev = input.stdDev ?? DEFAULT_BOLLINGER_STD_DEV;
    const closePrices = extractClosePrices(input.candles);

    const bbValues = BollingerBands.calculate({
      period,
      stdDev,
      values: closePrices,
    });

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
   * @param input - Candles and optional periods (default: 14/3/3)
   * @returns %K and %D values array and latest value
   */
  public calculateStochastic(
    input: CalculateStochasticInput,
  ): CalculateStochasticOutput {
    const kPeriod = input.kPeriod ?? DEFAULT_STOCHASTIC_K_PERIOD;
    const dPeriod = input.dPeriod ?? DEFAULT_STOCHASTIC_D_PERIOD;
    const stochPeriod = input.stochPeriod ?? DEFAULT_STOCHASTIC_STOCH_PERIOD;
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
      stochPeriod,
      values: stochValues,
      latestValue:
        stochValues.length > 0 ? stochValues[stochValues.length - 1] : null,
    };
  }
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

