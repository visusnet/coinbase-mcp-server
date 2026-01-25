import { z } from 'zod';
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
  start: isoToUnix.describe('Start time (ISO 8601 format)'),
  end: isoToUnix.describe('End time (ISO 8601 format)'),
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

export type GetPublicProductRequest = z.input<
  typeof GetPublicProductRequestSchema
>;
export type ListPublicProductsRequest = z.input<
  typeof ListPublicProductsRequestSchema
>;
export type GetPublicProductBookRequest = z.input<
  typeof GetPublicProductBookRequestSchema
>;
export type GetPublicProductCandlesRequest = z.output<
  typeof GetPublicProductCandlesRequestSchema
>;
export type GetPublicMarketTradesRequest = z.input<
  typeof GetPublicMarketTradesRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * GetPublicProductResponse schema - returns Product directly.
 */
export const GetPublicProductResponseSchema = ProductSchema;

/**
 * ListPublicProductsResponse schema with number conversion.
 */
export const ListPublicProductsResponseSchema = z.object({
  products: z.array(ProductSchema).optional().describe('List of products'),
  numProducts: stringToNumber.describe('Total number of products'),
});

/**
 * GetPublicProductCandlesResponse schema with number conversion.
 */
export const GetPublicProductCandlesResponseSchema = z.object({
  candles: z.array(CandleSchema).optional().describe('List of candles'),
});

/**
 * GetPublicProductBookResponse schema with number conversion.
 */
export const GetPublicProductBookResponseSchema = z.object({
  pricebook: PriceBookSchema.describe('Price book data'),
  last: stringToNumber.describe('Last trade price'),
  midMarket: stringToNumber.describe('Mid-market price'),
  spreadBps: stringToNumber.describe('Spread in basis points'),
  spreadAbsolute: stringToNumber.describe('Absolute spread'),
});

/**
 * GetPublicMarketTradesResponse schema with number conversion.
 */
export const GetPublicMarketTradesResponseSchema = z.object({
  trades: z
    .array(HistoricalMarketTradeSchema)
    .optional()
    .describe('List of trades'),
  bestBid: stringToNumber.describe('Best bid price'),
  bestAsk: stringToNumber.describe('Best ask price'),
});

export const GetServerTimeResponseSchema = z.object({
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
});

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
