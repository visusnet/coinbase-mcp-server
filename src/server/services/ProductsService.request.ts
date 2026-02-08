import { z } from 'zod';
import { ProductType } from './common.request';
import { GranularitySchema } from './common.request';
import { isoToUnix } from './schema.helpers';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListProductsRequestSchema = z
  .object({
    limit: z
      .number()
      .optional()
      .describe('Maximum number of products to return'),
    productType: z
      .nativeEnum(ProductType)
      .optional()
      .describe('Product type filter (SPOT, FUTURE)'),
    cursor: z.string().optional().describe('Pagination cursor for next page'),
  })
  .describe('Request to list products');

export const GetProductRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    getTradabilityStatus: z
      .boolean()
      .optional()
      .describe('Include tradability status in response'),
  })
  .describe('Request to get a single product');

export const GetProductBookRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    limit: z
      .number()
      .optional()
      .describe('Maximum number of order book levels to return'),
  })
  .describe('Request to get product order book');

export const GetProductCandlesRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    start: isoToUnix.describe('Start time (ISO 8601 format)'),
    end: isoToUnix.describe('End time (ISO 8601 format)'),
    granularity: GranularitySchema,
    limit: z
      .number()
      .optional()
      .describe('Maximum number of candles to return'),
  })
  .describe('Request to get product candles');

export const GetProductCandlesBatchRequestSchema = z
  .object({
    productIds: z
      .array(z.string().describe('Trading pair'))
      .min(1)
      .max(10)
      .describe(
        "Trading pairs to query (e.g., ['BTC-EUR', 'ETH-EUR', 'SOL-EUR']). Max 10 pairs.",
      ),
    start: isoToUnix.describe('Start time (ISO 8601 format)'),
    end: isoToUnix.describe('End time (ISO 8601 format)'),
    granularity: GranularitySchema,
  })
  .describe('Request to get candles for multiple products');

export const GetProductMarketTradesRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    limit: z.number().describe('Maximum number of trades to return'),
  })
  .describe('Request to get product market trades');

export const GetBestBidAskRequestSchema = z
  .object({
    productIds: z
      .array(z.string().describe('Trading pair'))
      .optional()
      .describe(
        'Product IDs to get bid/ask for (optional, returns all if omitted)',
      ),
  })
  .describe('Request to get best bid/ask prices');

export const GetMarketSnapshotRequestSchema = z
  .object({
    productIds: z
      .array(z.string().describe('Trading pair'))
      .min(1)
      .max(10)
      .describe(
        "Trading pairs to query (e.g., ['BTC-EUR', 'ETH-EUR']). Max 10 pairs.",
      ),
    includeOrderBook: z
      .boolean()
      .optional()
      .describe('Include order book levels per asset (default: false)'),
  })
  .describe('Request to get market snapshot for multiple products');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListProductsRequest = z.output<typeof ListProductsRequestSchema>;
export type GetProductRequest = z.output<typeof GetProductRequestSchema>;
export type GetProductBookRequest = z.output<
  typeof GetProductBookRequestSchema
>;
export type GetProductCandlesRequest = z.output<
  typeof GetProductCandlesRequestSchema
>;
export type GetProductCandlesBatchRequest = z.output<
  typeof GetProductCandlesBatchRequestSchema
>;
export type GetProductMarketTradesRequest = z.output<
  typeof GetProductMarketTradesRequestSchema
>;
export type GetBestBidAskRequest = z.output<typeof GetBestBidAskRequestSchema>;
export type GetMarketSnapshotRequest = z.output<
  typeof GetMarketSnapshotRequestSchema
>;
