import type { CandleInput } from './TechnicalIndicatorsService';

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
 * Returns undefined for undefined or empty strings (SDK returns "" for missing optional fields).
 * Throws Error for invalid values (NaN, Infinity).
 * Also handles number input (SDK may return numbers in some cases).
 */
export function toNumber(
  value: string | number | undefined,
): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  // Handle case where SDK might return number instead of string
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value;
    }
    throw new Error(`Invalid number: "${value}"`);
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
 * Converts ISO 8601 timestamp strings to Unix timestamps for Product Candles API compatibility.
 *
 * The Coinbase Advanced Trade SDK accepts ISO 8601 formatted timestamps (e.g., "2025-12-31T23:59:59Z")
 * in its method signatures. While most Coinbase REST API endpoints accept ISO 8601, the Product Candles
 * endpoints specifically require Unix timestamps (seconds since epoch). This method handles the conversion.
 *
 * @param value - ISO 8601 string (e.g., "2025-12-31T23:59:59Z")
 * @returns Unix timestamp as a string (seconds since epoch)
 * @throws Error if the timestamp string is invalid
 */
export function toUnixTimestamp(value: string): string {
  // Parse ISO 8601 string to milliseconds since epoch
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid timestamp: ${value}`);
  }

  // Convert milliseconds to seconds for Unix timestamp format
  return Math.floor(ms / 1000).toString();
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
