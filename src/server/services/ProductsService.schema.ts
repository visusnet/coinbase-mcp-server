import { z } from 'zod';
import { ProductType, Granularity } from './ProductsService.types';

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
  start: z.string().describe('Start time (ISO 8601 format)'),
  end: z.string().describe('End time (ISO 8601 format)'),
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

export type ListProductsRequest = z.infer<typeof ListProductsRequestSchema>;
export type GetProductRequest = z.infer<typeof GetProductRequestSchema>;
export type GetProductBookRequest = z.infer<typeof GetProductBookRequestSchema>;
export type GetProductCandlesRequest = z.infer<
  typeof GetProductCandlesRequestSchema
>;
export type GetProductCandlesBatchRequest = z.infer<
  typeof GetProductCandlesBatchRequestSchema
>;
export type GetProductMarketTradesRequest = z.infer<
  typeof GetProductMarketTradesRequestSchema
>;
export type GetBestBidAskRequest = z.infer<typeof GetBestBidAskRequestSchema>;
export type GetMarketSnapshotRequest = z.infer<
  typeof GetMarketSnapshotRequestSchema
>;
