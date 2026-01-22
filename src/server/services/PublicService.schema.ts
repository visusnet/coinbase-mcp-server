import { z } from 'zod';
import { Granularity } from './ProductsService.types';

// =============================================================================
// Request Schemas
// =============================================================================

export const GetPublicProductRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
});

export const ListPublicProductsRequestSchema = z.object({
  limit: z.number().optional().describe('Maximum number of products to return'),
  offset: z.number().optional().describe('Offset for pagination'),
});

export const GetPublicProductBookRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of order book levels to return'),
});

export const GetPublicProductCandlesRequestSchema = z.object({
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

export const GetPublicMarketTradesRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  limit: z.number().describe('Maximum number of trades to return'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetPublicProductRequest = z.infer<
  typeof GetPublicProductRequestSchema
>;
export type ListPublicProductsRequest = z.infer<
  typeof ListPublicProductsRequestSchema
>;
export type GetPublicProductBookRequest = z.infer<
  typeof GetPublicProductBookRequestSchema
>;
export type GetPublicProductCandlesRequest = z.infer<
  typeof GetPublicProductCandlesRequestSchema
>;
export type GetPublicMarketTradesRequest = z.infer<
  typeof GetPublicMarketTradesRequestSchema
>;
