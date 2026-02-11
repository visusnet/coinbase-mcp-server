import { z } from 'zod';
import {
  ConditionOperator,
  IndicatorConditionField,
  TickerConditionField,
} from './MarketEventService.types';

// =============================================================================
// Condition Result Schema
// =============================================================================

/**
 * Result of evaluating a single condition.
 * Contains both the configured threshold and the actual value.
 */
/**
 * Schema for condition field names - union of ticker and indicator fields.
 */
const ConditionFieldSchema = z.union([
  z.nativeEnum(TickerConditionField),
  z.nativeEnum(IndicatorConditionField),
]);

const ConditionResultSchema = z
  .object({
    field: ConditionFieldSchema.describe('Condition field name'),
    operator: z.nativeEnum(ConditionOperator).describe('Comparison operator'),
    threshold: z.number().describe('Configured threshold value'),
    actualValue: z
      .number()
      .nullable()
      .describe('Actual value, null if not calculable'),
    triggered: z.boolean().describe('Whether condition was met'),
  })
  .describe('Result of evaluating a single condition');

export type ConditionResult = z.output<typeof ConditionResultSchema>;

// =============================================================================
// Subscription Result Schema
// =============================================================================

/**
 * Result of evaluating a single subscription's conditions.
 */
const SubscriptionResultSchema = z
  .object({
    productId: z.string().describe('Product ID monitored'),
    triggered: z.boolean().describe('Whether this subscription was triggered'),
    conditions: z
      .array(ConditionResultSchema)
      .describe('All conditions with their evaluation results'),
  })
  .describe('Result of evaluating a single subscription');

export type SubscriptionResult = z.output<typeof SubscriptionResultSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Response when a market event was triggered.
 */
const MarketEventTriggeredResponseSchema = z
  .object({
    status: z.literal('triggered').describe('Event was triggered'),
    subscriptions: z
      .array(SubscriptionResultSchema)
      .describe(
        'All subscriptions with their evaluation results. Multiple subscriptions can have triggered=true.',
      ),
    timestamp: z.string().describe('Event timestamp'),
  })
  .describe('Response when market conditions are met');

export type MarketEventTriggeredResponse = z.output<
  typeof MarketEventTriggeredResponseSchema
>;

/**
 * Response when timeout was reached without trigger.
 */
const MarketEventTimeoutResponseSchema = z
  .object({
    status: z.literal('timeout').describe('Timeout reached without trigger'),
    duration: z.number().describe('How long we waited in seconds'),
    timestamp: z.string().describe('Timeout timestamp'),
  })
  .describe('Response when timeout is reached');

export type MarketEventTimeoutResponse = z.output<
  typeof MarketEventTimeoutResponseSchema
>;

/**
 * Response when connection permanently failed.
 */
const MarketEventErrorResponseSchema = z
  .object({
    status: z.literal('error').describe('Connection error occurred'),
    reason: z.string().describe('Error reason'),
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
