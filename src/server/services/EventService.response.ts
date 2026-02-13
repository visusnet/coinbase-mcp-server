import { z } from 'zod';
import {
  ConditionOperator,
  IndicatorConditionField,
  TickerConditionField,
} from './EventService.types';
import { OrderConditionField, SubscriptionType } from './EventService.types';
import { OrderExecutionStatus } from './OrdersService.types';

// =============================================================================
// Market Condition Result Schema
// =============================================================================

/**
 * Schema for market condition field names - union of ticker and indicator fields.
 */
const MarketConditionFieldSchema = z.union([
  z.nativeEnum(TickerConditionField),
  z.nativeEnum(IndicatorConditionField),
]);

/**
 * Result of evaluating a single market condition.
 * Contains both the configured threshold and the actual value.
 */
const MarketConditionResultSchema = z
  .object({
    field: MarketConditionFieldSchema.describe('Condition field name'),
    operator: z.nativeEnum(ConditionOperator).describe('Comparison operator'),
    threshold: z.number().describe('Configured threshold value'),
    actualValue: z
      .number()
      .nullable()
      .describe('Actual value, null if not calculable'),
    triggered: z.boolean().describe('Whether condition was met'),
  })
  .describe('Result of evaluating a single market condition');

export type MarketConditionResult = z.output<
  typeof MarketConditionResultSchema
>;

// =============================================================================
// Order Condition Result Schemas (discriminated union on field)
// =============================================================================

/**
 * Result of evaluating an order status condition.
 */
const OrderStatusConditionResultSchema = z
  .object({
    field: z.literal(OrderConditionField.Status).describe('Status field'),
    triggered: z.boolean().describe('Whether condition was met'),
    targetStatus: z
      .array(z.nativeEnum(OrderExecutionStatus))
      .describe('Target statuses to match'),
    actualStatus: z
      .nativeEnum(OrderExecutionStatus)
      .optional()
      .describe('Actual order status, undefined if no event received'),
  })
  .describe('Result of evaluating an order status condition');

export type OrderStatusConditionResult = z.output<
  typeof OrderStatusConditionResultSchema
>;

/**
 * Schema for numeric order condition fields (all fields except status).
 */
const OrderNumericFieldSchema = z.enum([
  OrderConditionField.AvgPrice,
  OrderConditionField.CompletionPercentage,
  OrderConditionField.CumulativeQuantity,
  OrderConditionField.TotalFees,
  OrderConditionField.FilledValue,
  OrderConditionField.NumberOfFills,
]);

/**
 * Result of evaluating a numeric order condition.
 */
const OrderNumericConditionResultSchema = z
  .object({
    field: OrderNumericFieldSchema.describe('Numeric order field'),
    triggered: z.boolean().describe('Whether condition was met'),
    operator: z.nativeEnum(ConditionOperator).describe('Comparison operator'),
    threshold: z.number().describe('Configured threshold value'),
    actualValue: z
      .number()
      .nullable()
      .describe('Actual value, null if not available'),
  })
  .describe('Result of evaluating a numeric order condition');

export type OrderNumericConditionResult = z.output<
  typeof OrderNumericConditionResultSchema
>;

/**
 * Result of evaluating a single order condition (discriminated union on field).
 */
const OrderConditionResultSchema = z
  .union([OrderStatusConditionResultSchema, OrderNumericConditionResultSchema])
  .describe('Result of evaluating an order condition');

export type OrderConditionResult = z.output<typeof OrderConditionResultSchema>;

// =============================================================================
// Subscription Result Schemas (discriminated union on type)
// =============================================================================

/**
 * Result of evaluating a market subscription's conditions.
 */
const MarketSubscriptionResultSchema = z
  .object({
    type: z.literal(SubscriptionType.Market).describe('Subscription type'),
    productId: z.string().describe('Product ID monitored'),
    triggered: z.boolean().describe('Whether this subscription was triggered'),
    conditions: z
      .array(MarketConditionResultSchema)
      .describe('All conditions with their evaluation results'),
  })
  .describe('Result of evaluating a market subscription');

export type MarketSubscriptionResult = z.output<
  typeof MarketSubscriptionResultSchema
>;

/**
 * Result of evaluating an order subscription's conditions.
 */
const OrderSubscriptionResultSchema = z
  .object({
    type: z.literal(SubscriptionType.Order).describe('Subscription type'),
    orderId: z.string().describe('Order ID monitored'),
    triggered: z.boolean().describe('Whether this subscription was triggered'),
    conditions: z
      .array(OrderConditionResultSchema)
      .describe('All conditions with their evaluation results'),
  })
  .describe('Result of evaluating an order subscription');

export type OrderSubscriptionResult = z.output<
  typeof OrderSubscriptionResultSchema
>;

/**
 * Result of evaluating any subscription (discriminated union on type).
 */
const SubscriptionResultSchema = z
  .discriminatedUnion('type', [
    MarketSubscriptionResultSchema,
    OrderSubscriptionResultSchema,
  ])
  .describe('Result of evaluating a subscription');

export type SubscriptionResult = z.output<typeof SubscriptionResultSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Response when an event was triggered.
 */
const EventTriggeredResponseSchema = z
  .object({
    status: z.literal('triggered').describe('Event was triggered'),
    subscriptions: z
      .array(SubscriptionResultSchema)
      .describe(
        'All subscriptions with their evaluation results. Multiple subscriptions can have triggered=true.',
      ),
    timestamp: z.string().describe('Event timestamp'),
  })
  .describe('Response when event conditions are met');

export type EventTriggeredResponse = z.output<
  typeof EventTriggeredResponseSchema
>;

/**
 * Response when timeout was reached without trigger.
 */
const EventTimeoutResponseSchema = z
  .object({
    status: z.literal('timeout').describe('Timeout reached without trigger'),
    duration: z.number().describe('How long we waited in seconds'),
    timestamp: z.string().describe('Timeout timestamp'),
  })
  .describe('Response when timeout is reached');

export type EventTimeoutResponse = z.output<typeof EventTimeoutResponseSchema>;

/**
 * Response when connection permanently failed.
 */
const EventErrorResponseSchema = z
  .object({
    status: z.literal('error').describe('Connection error occurred'),
    reason: z.string().describe('Error reason'),
    timestamp: z.string().describe('Error timestamp'),
  })
  .describe('Response when connection permanently failed');

export type EventErrorResponse = z.output<typeof EventErrorResponseSchema>;

/**
 * Discriminated union for wait_for_event response.
 */
export const WaitForEventResponseSchema = z
  .discriminatedUnion('status', [
    EventTriggeredResponseSchema,
    EventTimeoutResponseSchema,
    EventErrorResponseSchema,
  ])
  .describe('Response for wait_for_event tool');

export type WaitForEventResponse = z.output<typeof WaitForEventResponseSchema>;
