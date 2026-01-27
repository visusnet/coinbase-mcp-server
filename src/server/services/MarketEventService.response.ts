import { z } from 'zod';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Ticker data returned in responses (without productId since it's keyed separately).
 */
export const TickerResponseSchema = z
  .object({
    price: z.number().describe('Current price'),
    volume24h: z.number().describe('24-hour volume'),
    percentChange24h: z.number().describe('24-hour percent change'),
    high24h: z.number().describe('24-hour high'),
    low24h: z.number().describe('24-hour low'),
    high52w: z.number().describe('52-week high'),
    low52w: z.number().describe('52-week low'),
    bestBid: z.number().describe('Best bid price'),
    bestAsk: z.number().describe('Best ask price'),
    bestBidQuantity: z.number().describe('Best bid quantity'),
    bestAskQuantity: z.number().describe('Best ask quantity'),
    timestamp: z.string().describe('Ticker timestamp'),
  })
  .describe('Ticker data without productId');

export type TickerResponse = z.output<typeof TickerResponseSchema>;

/**
 * A condition that was triggered.
 */
export const TriggeredConditionSchema = z
  .object({
    field: z.string().describe('Field that triggered'),
    operator: z.string().describe('Operator used'),
    threshold: z.number().describe('Configured threshold'),
    actualValue: z.number().describe('Actual value that triggered'),
  })
  .describe('A condition that was triggered');

export type TriggeredCondition = z.output<typeof TriggeredConditionSchema>;

/**
 * Response when a market event was triggered.
 */
export const MarketEventTriggeredResponseSchema = z
  .object({
    status: z.literal('triggered').describe('Event was triggered'),
    productId: z.string().describe('Product that triggered'),
    triggeredConditions: z
      .array(TriggeredConditionSchema)
      .describe('Conditions that were met'),
    ticker: TickerResponseSchema.describe('Current ticker data'),
    timestamp: z.string().describe('Event timestamp'),
  })
  .describe('Response when a market event was triggered');

export type MarketEventTriggeredResponse = z.output<
  typeof MarketEventTriggeredResponseSchema
>;

/**
 * Response when timeout was reached without trigger.
 */
export const MarketEventTimeoutResponseSchema = z
  .object({
    status: z.literal('timeout').describe('Timeout reached without trigger'),
    lastTickers: z
      .record(z.string(), TickerResponseSchema)
      .describe('Last known ticker for each subscribed product'),
    duration: z.number().describe('How long we waited in seconds'),
    timestamp: z.string().describe('Timeout timestamp'),
  })
  .describe('Response when timeout was reached without trigger');

export type MarketEventTimeoutResponse = z.output<
  typeof MarketEventTimeoutResponseSchema
>;

/**
 * Response when connection permanently failed.
 */
export const MarketEventErrorResponseSchema = z
  .object({
    status: z.literal('error').describe('Connection error occurred'),
    reason: z.string().describe('Error reason'),
    lastTickers: z
      .record(z.string(), TickerResponseSchema)
      .describe('Last known ticker for each subscribed product'),
    timestamp: z.string().describe('Error timestamp'),
  })
  .describe('Response when connection permanently failed');

export type MarketEventErrorResponse = z.output<
  typeof MarketEventErrorResponseSchema
>;

/**
 * Discriminated union for wait_for_market_event response.
 */
export const WaitForMarketEventResponseSchema = z
  .discriminatedUnion('status', [
    MarketEventTriggeredResponseSchema,
    MarketEventTimeoutResponseSchema,
    MarketEventErrorResponseSchema,
  ])
  .describe('Response for wait_for_market_event tool');

export type WaitForMarketEventResponse = z.output<
  typeof WaitForMarketEventResponseSchema
>;
