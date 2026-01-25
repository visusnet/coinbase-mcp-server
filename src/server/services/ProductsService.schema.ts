import { z } from 'zod';
import { ProductType } from './FeesService.schema';
import { Granularity } from './ProductsService.types';
import { stringToNumber, isoToUnix } from './schema.helpers';
import {
  ProductSchema,
  CandleSchema,
  PriceBookSchema,
  HistoricalMarketTradeSchema,
} from './common.schema';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListProductsRequestSchema = z.object({
  limit: z.number().optional().describe('Maximum number of products to return'),
  productType: z
    .nativeEnum(ProductType)
    .optional()
    .describe('Product type filter (SPOT, FUTURE)'),
  cursor: z.string().optional().describe('Pagination cursor for next page'),
});

export const GetProductRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  getTradabilityStatus: z
    .boolean()
    .optional()
    .describe('Include tradability status in response'),
});

export const GetProductBookRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of order book levels to return'),
});

export const GetProductCandlesRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  start: isoToUnix.describe('Start time (ISO 8601 format)'),
  end: isoToUnix.describe('End time (ISO 8601 format)'),
  granularity: z
    .nativeEnum(Granularity)
    .describe(
      'Candle granularity (e.g., ONE_MINUTE, FIVE_MINUTE, ONE_HOUR, ONE_DAY)',
    ),
  limit: z.number().optional().describe('Maximum number of candles to return'),
});

export const GetProductCandlesBatchRequestSchema = z.object({
  productIds: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe(
      "Trading pairs to query (e.g., ['BTC-EUR', 'ETH-EUR', 'SOL-EUR']). Max 10 pairs.",
    ),
  start: z.string().describe('Start time (ISO 8601 format)'),
  end: z.string().describe('End time (ISO 8601 format)'),
  granularity: z
    .nativeEnum(Granularity)
    .describe(
      'Candle granularity (e.g., ONE_MINUTE, FIVE_MINUTE, ONE_HOUR, ONE_DAY)',
    ),
});

export const GetProductMarketTradesRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  limit: z.number().describe('Maximum number of trades to return'),
});

export const GetBestBidAskRequestSchema = z.object({
  productIds: z
    .array(z.string())
    .optional()
    .describe(
      'Product IDs to get bid/ask for (optional, returns all if omitted)',
    ),
});

export const GetMarketSnapshotRequestSchema = z.object({
  productIds: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe(
      "Trading pairs to query (e.g., ['BTC-EUR', 'ETH-EUR']). Max 10 pairs.",
    ),
  includeOrderBook: z
    .boolean()
    .optional()
    .describe('Include order book levels per asset (default: false)'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListProductsRequest = z.input<typeof ListProductsRequestSchema>;
export type GetProductRequest = z.input<typeof GetProductRequestSchema>;
export type GetProductBookRequest = z.input<typeof GetProductBookRequestSchema>;
export type GetProductCandlesRequest = z.output<
  typeof GetProductCandlesRequestSchema
>;
export type GetProductCandlesBatchRequest = z.input<
  typeof GetProductCandlesBatchRequestSchema
>;
export type GetProductMarketTradesRequest = z.input<
  typeof GetProductMarketTradesRequestSchema
>;
export type GetBestBidAskRequest = z.input<typeof GetBestBidAskRequestSchema>;
export type GetMarketSnapshotRequest = z.input<
  typeof GetMarketSnapshotRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * ListProductsResponse schema with number conversion.
 */
export const ListProductsResponseSchema = z.object({
  products: z.array(ProductSchema).optional().describe('List of products'),
  numProducts: stringToNumber.describe('Total number of products'),
});

/**
 * GetProductResponse schema - SDK returns product directly.
 */
export const GetProductResponseSchema = ProductSchema.transform((product) => ({
  product,
}));

/**
 * GetProductCandlesResponse schema with number conversion.
 */
export const GetProductCandlesResponseSchema = z.object({
  candles: z.array(CandleSchema).optional().describe('List of candles'),
});

/**
 * GetProductBookResponse schema with number conversion.
 */
export const GetProductBookResponseSchema = z.object({
  pricebook: PriceBookSchema.describe('Price book data'),
  last: stringToNumber.describe('Last trade price'),
  midMarket: stringToNumber.describe('Mid-market price'),
  spreadBps: stringToNumber.describe('Spread in basis points'),
  spreadAbsolute: stringToNumber.describe('Absolute spread'),
});

/**
 * GetBestBidAskResponse schema with number conversion.
 */
export const GetBestBidAskResponseSchema = z.object({
  pricebooks: z.array(PriceBookSchema).describe('List of price books'),
});

/**
 * GetProductMarketTradesResponse schema with number conversion.
 */
export const GetProductMarketTradesResponseSchema = z.object({
  trades: z
    .array(HistoricalMarketTradeSchema)
    .optional()
    .describe('List of trades'),
  bestBid: stringToNumber.describe('Best bid price'),
  bestAsk: stringToNumber.describe('Best ask price'),
});

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
