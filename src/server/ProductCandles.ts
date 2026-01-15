import { Candle } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Candle';
import { GetProductCandlesResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';

export enum Granularity {
  ONE_MINUTE = 'ONE_MINUTE',
  FIVE_MINUTE = 'FIVE_MINUTE',
  FIFTEEN_MINUTE = 'FIFTEEN_MINUTE',
  THIRTY_MINUTE = 'THIRTY_MINUTE',
  ONE_HOUR = 'ONE_HOUR',
  TWO_HOUR = 'TWO_HOUR',
  SIX_HOUR = 'SIX_HOUR',
  ONE_DAY = 'ONE_DAY',
}

export interface GetProductCandlesBatchRequest {
  productIds: string[];
  granularity: Granularity;
  start: string; // ISO 8601 timestamp
  end: string; // ISO 8601 timestamp
}

export interface ProductCandles {
  candles: Candle[];
  latest: Candle | null;
  oldest: Candle | null;
}

export interface GetProductCandlesBatchResponse {
  timestamp: string;
  granularity: Granularity;
  candleCount: number;
  productCandlesByProductId: Record<string, ProductCandles>;
}

export function countCandles(
  candleResults: { productId: string; response: GetProductCandlesResponse }[],
): number {
  return candleResults.reduce(
    (acc: number, { response }) => acc + (response.candles?.length ?? 0),
    0,
  );
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
