import type { CandleInput } from '../TechnicalIndicatorsService';

/**
 * Converts number to string for SDK calls.
 * Returns undefined if value is undefined.
 */
export function toString(value: number | undefined): string | undefined {
  return value !== undefined ? value.toString() : undefined;
}

/**
 * Converts number to string (required).
 */
export function toStringRequired(value: number): string {
  return value.toString();
}

/**
 * Converts string to number.
 * Throws Error for invalid values (NaN, Infinity, empty strings, or partially parsed strings).
 * Uses Number() instead of parseFloat() for strict validation.
 */
export function toNumber(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === '') {
    throw new Error('Invalid number: ""');
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return num;
}

/**
 * Converts string to number (required).
 * Uses Number() instead of parseFloat() for strict validation.
 */
export function toNumberRequired(value: string): number {
  if (value === '') {
    throw new Error('Invalid number: ""');
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return num;
}

/**
 * Maps an SDK candle to CandleInput with number types.
 * Used by ProductsService, PublicService, and TechnicalAnalysisService.
 */
export function mapSdkCandleToInput(candle: {
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}): CandleInput {
  return {
    open: toNumberRequired(candle.open ?? '0'),
    high: toNumberRequired(candle.high ?? '0'),
    low: toNumberRequired(candle.low ?? '0'),
    close: toNumberRequired(candle.close ?? '0'),
    volume: toNumberRequired(candle.volume ?? '0'),
  };
}

/**
 * Maps an array of SDK candles to CandleInput[] with number types.
 */
export function mapSdkCandlesToInput(
  candles:
    | ReadonlyArray<{
        open?: string;
        high?: string;
        low?: string;
        close?: string;
        volume?: string;
      }>
    | undefined,
): CandleInput[] {
  return (candles ?? []).map(mapSdkCandleToInput);
}
