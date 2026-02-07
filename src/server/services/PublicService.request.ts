import { z } from 'zod';
import { GranularitySchema } from './common.request';
import { isoToUnix } from './schema.helpers';

// =============================================================================
// Request Schemas
// =============================================================================

export const GetPublicProductRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  })
  .describe('Request to get a public product');

export const ListPublicProductsRequestSchema = z
  .object({
    limit: z
      .number()
      .optional()
      .describe('Maximum number of products to return'),
    offset: z.number().optional().describe('Offset for pagination'),
  })
  .describe('Request to list public products');

export const GetPublicProductBookRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    limit: z
      .number()
      .optional()
      .describe('Maximum number of order book levels to return'),
  })
  .describe('Request to get public product order book');

export const GetPublicProductCandlesRequestSchema = z
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
  .describe('Request to get public product candles');

export const GetPublicMarketTradesRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    limit: z.number().describe('Maximum number of trades to return'),
  })
  .describe('Request to get public market trades');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetPublicProductRequest = z.output<
  typeof GetPublicProductRequestSchema
>;
export type ListPublicProductsRequest = z.output<
  typeof ListPublicProductsRequestSchema
>;
export type GetPublicProductBookRequest = z.output<
  typeof GetPublicProductBookRequestSchema
>;
export type GetPublicProductCandlesRequest = z.output<
  typeof GetPublicProductCandlesRequestSchema
>;
export type GetPublicMarketTradesRequest = z.output<
  typeof GetPublicMarketTradesRequestSchema
>;
