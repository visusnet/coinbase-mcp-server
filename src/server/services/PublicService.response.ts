import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import {
  ProductSchema,
  ProductListSchema,
  CandleSchema,
  PriceBookSchema,
  HistoricalMarketTradeSchema,
} from './common.response';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * GetPublicProductResponse schema - API returns product directly, wrap for consistency.
 */
export const GetPublicProductResponseSchema = ProductSchema.transform(
  (product) => ({
    product,
  }),
).describe('Response containing a public product');

/**
 * ListPublicProductsResponse schema with number conversion.
 */
export const ListPublicProductsResponseSchema = z
  .object({
    products: ProductListSchema.optional(),
    numProducts: stringToNumber.describe('Total number of products'),
  })
  .describe('Response containing a list of public products');

/**
 * GetPublicProductCandlesResponse schema with number conversion.
 */
export const GetPublicProductCandlesResponseSchema = z
  .object({
    candles: z.array(CandleSchema).optional().describe('List of candles'),
  })
  .describe('Response containing public product candles');

/**
 * GetPublicProductBookResponse schema with number conversion.
 */
export const GetPublicProductBookResponseSchema = z
  .object({
    pricebook: PriceBookSchema.describe('Price book data'),
    last: stringToNumber.describe('Last trade price'),
    midMarket: stringToNumber.describe('Mid-market price'),
    spreadBps: stringToNumber.describe('Spread in basis points'),
    spreadAbsolute: stringToNumber.describe('Absolute spread'),
  })
  .describe('Response containing public product order book');

/**
 * GetPublicMarketTradesResponse schema with number conversion.
 */
export const GetPublicMarketTradesResponseSchema = z
  .object({
    trades: z
      .array(HistoricalMarketTradeSchema)
      .optional()
      .describe('List of trades'),
    bestBid: stringToNumber.describe('Best bid price'),
    bestAsk: stringToNumber.describe('Best ask price'),
  })
  .describe('Response containing public market trades');

/**
 * GetServerTimeResponse schema.
 */
export const GetServerTimeResponseSchema = z
  .object({
    iso: z
      .string()
      .optional()
      .describe('ISO-8601 representation of the timestamp'),
    epochSeconds: z
      .string()
      .optional()
      .describe('Second-precision representation of the timestamp'),
    epochMillis: z
      .string()
      .optional()
      .describe('Millisecond-precision representation of the timestamp'),
  })
  .describe('Response containing server time');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type GetPublicProductResponse = z.output<
  typeof GetPublicProductResponseSchema
>;
export type ListPublicProductsResponse = z.output<
  typeof ListPublicProductsResponseSchema
>;
export type GetPublicProductCandlesResponse = z.output<
  typeof GetPublicProductCandlesResponseSchema
>;
export type GetPublicProductBookResponse = z.output<
  typeof GetPublicProductBookResponseSchema
>;
export type GetPublicMarketTradesResponse = z.output<
  typeof GetPublicMarketTradesResponseSchema
>;
export type GetServerTimeResponse = z.output<
  typeof GetServerTimeResponseSchema
>;
