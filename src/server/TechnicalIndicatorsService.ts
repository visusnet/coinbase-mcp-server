import { RSI, MACD } from 'technicalindicators';

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

const DEFAULT_RSI_PERIOD = 14;
const DEFAULT_MACD_FAST_PERIOD = 12;
const DEFAULT_MACD_SLOW_PERIOD = 26;
const DEFAULT_MACD_SIGNAL_PERIOD = 9;

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
    const closePrices = input.candles.map((candle) => parseFloat(candle.close));

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
    const closePrices = input.candles.map((candle) => parseFloat(candle.close));

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
}
