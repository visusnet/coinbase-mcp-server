import type { CandleInput } from './TechnicalIndicatorsService';
import { toNumberRequired } from './numberConversion';

/**
 * SDK candle type with string values.
 */
type SdkCandle = {
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
};

/**
 * Convert SDK candle to CandleInput with number types.
 */
function toCandleInput(candle: SdkCandle): CandleInput {
  return {
    open: toNumberRequired(candle.open ?? '0'),
    high: toNumberRequired(candle.high ?? '0'),
    low: toNumberRequired(candle.low ?? '0'),
    close: toNumberRequired(candle.close ?? '0'),
    volume: toNumberRequired(candle.volume ?? '0'),
  };
}

/**
 * Convert array of SDK candles to CandleInput[] with number types.
 */
export function toCandleInputs(
  candles: ReadonlyArray<SdkCandle> | undefined,
): CandleInput[] {
  return (candles ?? []).map(toCandleInput);
}
