import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import {
  ProductSchema,
  CandleSchema,
  PriceBookSchema,
  HistoricalMarketTradeSchema,
} from './common.response';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * ListProductsResponse schema with number conversion.
 */
export const ListProductsResponseSchema = z
  .object({
    products: z.array(ProductSchema).optional().describe('List of products'),
    numProducts: stringToNumber.describe('Total number of products'),
  })
  .describe('Response containing a list of products');

/**
 * GetProductResponse schema - SDK returns product directly.
 */
export const GetProductResponseSchema = ProductSchema.transform((product) => ({
  product,
})).describe('Response containing a single product');

/**
 * GetProductCandlesResponse schema with number conversion.
 */
export const GetProductCandlesResponseSchema = z
  .object({
    candles: z.array(CandleSchema).optional().describe('List of candles'),
  })
  .describe('Response containing product candles');

/**
 * GetProductBookResponse schema with number conversion.
 */
export const GetProductBookResponseSchema = z
  .object({
    pricebook: PriceBookSchema.describe('Price book data'),
    last: stringToNumber.describe('Last trade price'),
    midMarket: stringToNumber.describe('Mid-market price'),
    spreadBps: stringToNumber.describe('Spread in basis points'),
    spreadAbsolute: stringToNumber.describe('Absolute spread'),
  })
  .describe('Response containing product order book');

/**
 * GetBestBidAskResponse schema with number conversion.
 */
export const GetBestBidAskResponseSchema = z
  .object({
    pricebooks: z.array(PriceBookSchema).describe('List of price books'),
  })
  .describe('Response containing best bid/ask prices');

/**
 * GetProductMarketTradesResponse schema with number conversion.
 */
export const GetProductMarketTradesResponseSchema = z
  .object({
    trades: z
      .array(HistoricalMarketTradeSchema)
      .optional()
      .describe('List of trades'),
    bestBid: stringToNumber.describe('Best bid price'),
    bestAsk: stringToNumber.describe('Best ask price'),
  })
  .describe('Response containing product market trades');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type ListProductsResponse = z.output<typeof ListProductsResponseSchema>;
export type GetProductResponse = z.output<typeof GetProductResponseSchema>;
export type GetProductCandlesResponse = z.output<
  typeof GetProductCandlesResponseSchema
>;
export type GetProductBookResponse = z.output<
  typeof GetProductBookResponseSchema
>;
export type GetBestBidAskResponse = z.output<
  typeof GetBestBidAskResponseSchema
>;
export type GetProductMarketTradesResponse = z.output<
  typeof GetProductMarketTradesResponseSchema
>;
