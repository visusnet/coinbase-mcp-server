import { RSI } from 'technicalindicators';

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

const DEFAULT_RSI_PERIOD = 14;

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
}
