import { z } from 'zod';

import {
  ConditionField,
  ConditionLogic,
  ConditionOperator,
} from './MarketEventService.types';

// =============================================================================
// Request Schemas
// =============================================================================

/**
 * A single condition to evaluate against ticker data.
 */
export const ConditionSchema = z
  .object({
    field: z.nativeEnum(ConditionField).describe('The ticker field to monitor'),
    operator: z
      .nativeEnum(ConditionOperator)
      .describe(
        'Comparison operator. Note: crossAbove/crossBelow require a previous value to detect crossing, so they cannot trigger on the first ticker after subscription or reconnect',
      ),
    value: z.number().describe('Threshold value to compare against'),
  })
  .describe('A single condition to evaluate against ticker data');

export type Condition = z.output<typeof ConditionSchema>;

/**
 * A subscription to monitor a specific product with conditions.
 */
export const SubscriptionSchema = z
  .object({
    productId: z.string().describe('Trading pair to monitor (e.g., "BTC-EUR")'),
    conditions: z
      .array(ConditionSchema)
      .min(1)
      .max(5)
      .describe('Conditions that trigger the event'),
    logic: z
      .nativeEnum(ConditionLogic)
      .default(ConditionLogic.ANY)
      .describe('How to combine conditions: "any" (OR) or "all" (AND)'),
  })
  .describe('A subscription to monitor a specific product with conditions');

export type Subscription = z.output<typeof SubscriptionSchema>;

/**
 * Request schema for wait_for_market_event tool.
 */
export const WaitForMarketEventRequestSchema = z
  .object({
    subscriptions: z
      .array(SubscriptionSchema)
      .min(1)
      .max(10)
      .describe('Products and conditions to monitor'),
    timeout: z
      .number()
      .min(1)
      .default(55)
      .describe('Wait time in seconds (default: 55)'),
  })
  .describe('Request to wait for a market event matching specified conditions');

export type WaitForMarketEventRequest = z.output<
  typeof WaitForMarketEventRequestSchema
>;
