import { z } from 'zod';
import { numberToString } from './schema.helpers';

// =============================================================================
// Granularity (Candle timeframes)
// =============================================================================

/**
 * Candle granularity (timeframe) for OHLCV data.
 * Used across Products, Technical Analysis, and Event subscriptions.
 */
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

/**
 * Zod schema for Granularity validation.
 */
export const GranularitySchema = z
  .nativeEnum(Granularity)
  .describe(
    'Candle granularity (e.g., ONE_MINUTE, FIVE_MINUTE, ONE_HOUR, ONE_DAY)',
  );

// =============================================================================
// Product Type
// =============================================================================

export enum ProductType {
  UnknownProductType = 'UNKNOWN_PRODUCT_TYPE',
  Spot = 'SPOT',
  Future = 'FUTURE',
}

// =============================================================================
// Shared Request Schemas
// =============================================================================

/**
 * Amount schema for requests with number→string conversion for value field.
 * Used for API requests that require string representation of numeric values.
 */
export const AmountSchema = z
  .object({
    value: numberToString.describe('Amount value'),
    currency: z.string().describe('Currency code (e.g., USD, BTC)'),
  })
  .describe('Monetary amount with currency');

export type Amount = z.output<typeof AmountSchema>;
