import { z } from 'zod';

import {
  ConditionLogic,
  ConditionOperator,
  IndicatorConditionField,
  TickerConditionField,
} from './EventService.types';
import { OrderConditionField, SubscriptionType } from './EventService.types';
import { OrderExecutionStatus } from './OrdersService.types';
import {
  Granularity,
  GranularitySchema as BaseGranularitySchema,
} from './common.request';

// =============================================================================
// Base Components
// =============================================================================

const OperatorSchema = z
  .nativeEnum(ConditionOperator)
  .describe(
    'Comparison operator. Note: crossAbove/crossBelow require a previous value to detect crossing',
  );

// Indicator conditions use FIVE_MINUTE granularity by default
const GranularitySchema = BaseGranularitySchema.default(
  Granularity.FIVE_MINUTE,
);

// =============================================================================
// Market Ticker Conditions
// =============================================================================

const TickerConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z.literal(TickerConditionField.Price).describe('Current price'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(TickerConditionField.Volume24h)
      .describe('24-hour trading volume'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(TickerConditionField.PercentChange24h)
      .describe('24-hour percent change'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(TickerConditionField.High24h)
      .describe('24-hour high price'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z.literal(TickerConditionField.Low24h).describe('24-hour low price'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(TickerConditionField.High52w)
      .describe('52-week high price'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z.literal(TickerConditionField.Low52w).describe('52-week low price'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(TickerConditionField.BestBid)
      .describe('Current best bid price'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(TickerConditionField.BestAsk)
      .describe('Current best ask price'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(TickerConditionField.BestBidQuantity)
      .describe('Current best bid quantity available'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(TickerConditionField.BestAskQuantity)
      .describe('Current best ask quantity available'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
]);

export type TickerCondition = z.output<typeof TickerConditionSchema>;

// =============================================================================
// Market Indicator Conditions
// =============================================================================

const RsiConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z
      .literal(IndicatorConditionField.Rsi)
      .describe('Relative Strength Index value'),
    granularity: GranularitySchema,
    period: z.number().int().min(2).default(14).describe('RSI period'),
    operator: OperatorSchema,
    value: z
      .number()
      .describe('RSI threshold (typically 30 for oversold, 70 for overbought)'),
  }),
]);

const macdParams = {
  granularity: GranularitySchema,
  fastPeriod: z.number().int().min(2).default(12).describe('Fast EMA period'),
  slowPeriod: z.number().int().min(2).default(26).describe('Slow EMA period'),
  signalPeriod: z
    .number()
    .int()
    .min(2)
    .default(9)
    .describe('Signal line period'),
  operator: OperatorSchema,
  value: z.number().describe('Threshold value to compare against'),
};

const MacdConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z.literal(IndicatorConditionField.Macd).describe('MACD line value'),
    ...macdParams,
  }),
  z.object({
    field: z
      .literal(IndicatorConditionField.MacdHistogram)
      .describe('MACD histogram value'),
    ...macdParams,
  }),
  z.object({
    field: z
      .literal(IndicatorConditionField.MacdSignal)
      .describe('MACD signal line value'),
    ...macdParams,
  }),
]);

const bollingerParams = {
  granularity: GranularitySchema,
  period: z
    .number()
    .int()
    .min(2)
    .default(20)
    .describe('Bollinger Bands period'),
  stdDev: z
    .number()
    .min(0.1)
    .default(2)
    .describe('Standard deviation multiplier'),
  operator: OperatorSchema,
  value: z.number().describe('Threshold value to compare against'),
};

const BollingerConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z
      .literal(IndicatorConditionField.BollingerBands)
      .describe('Bollinger Bands middle band (SMA)'),
    ...bollingerParams,
  }),
  z.object({
    field: z
      .literal(IndicatorConditionField.BollingerBandsUpper)
      .describe('Bollinger Bands upper band'),
    ...bollingerParams,
  }),
  z.object({
    field: z
      .literal(IndicatorConditionField.BollingerBandsLower)
      .describe('Bollinger Bands lower band'),
    ...bollingerParams,
  }),
  z.object({
    field: z
      .literal(IndicatorConditionField.BollingerBandsBandwidth)
      .describe('Bollinger Bands bandwidth'),
    ...bollingerParams,
  }),
  z.object({
    field: z
      .literal(IndicatorConditionField.BollingerBandsPercentB)
      .describe('Bollinger Bands %B (0 = lower band, 1 = upper band)'),
    ...bollingerParams,
  }),
]);

const SmaConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z
      .literal(IndicatorConditionField.Sma)
      .describe('Simple Moving Average value'),
    granularity: GranularitySchema,
    period: z.number().int().min(2).describe('SMA period (required)'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
]);

const EmaConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z
      .literal(IndicatorConditionField.Ema)
      .describe('Exponential Moving Average value'),
    granularity: GranularitySchema,
    period: z.number().int().min(2).describe('EMA period (required)'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
]);

const stochasticParams = {
  granularity: GranularitySchema,
  kPeriod: z
    .number()
    .int()
    .min(1)
    .default(14)
    .describe('Period for %K line calculation'),
  dPeriod: z
    .number()
    .int()
    .min(1)
    .default(3)
    .describe('Period for %D signal line smoothing'),
  operator: OperatorSchema,
  value: z
    .number()
    .describe('Threshold value (typically 20 for oversold, 80 for overbought)'),
};

const StochasticConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z
      .literal(IndicatorConditionField.Stochastic)
      .describe('Stochastic %K value'),
    ...stochasticParams,
  }),
  z.object({
    field: z
      .literal(IndicatorConditionField.StochasticD)
      .describe('Stochastic %D signal line value'),
    ...stochasticParams,
  }),
]);

const IndicatorConditionSchema = z.discriminatedUnion('field', [
  ...RsiConditionSchema.options,
  ...MacdConditionSchema.options,
  ...BollingerConditionSchema.options,
  ...SmaConditionSchema.options,
  ...EmaConditionSchema.options,
  ...StochasticConditionSchema.options,
]);

export type IndicatorCondition = z.output<typeof IndicatorConditionSchema>;

/**
 * A condition to evaluate against ticker data or technical indicators.
 */
const MarketConditionSchema = z
  .discriminatedUnion('field', [
    ...TickerConditionSchema.options,
    ...IndicatorConditionSchema.options,
  ])
  .describe(
    'A condition to evaluate against ticker data or technical indicators',
  );

export type MarketCondition = z.output<typeof MarketConditionSchema>;

/**
 * Type guard to check if a field is a ticker condition field.
 */
export function isTickerConditionField(
  field: string,
): field is TickerConditionField {
  return Object.values(TickerConditionField).includes(
    field as TickerConditionField,
  );
}

/**
 * Type guard to check if a field is an indicator condition field.
 */
function isIndicatorConditionField(
  field: string,
): field is IndicatorConditionField {
  return Object.values(IndicatorConditionField).includes(
    field as IndicatorConditionField,
  );
}

/**
 * Type guard to check if a market condition is an indicator condition.
 */
export function isIndicatorCondition(
  condition: MarketCondition,
): condition is IndicatorCondition {
  return isIndicatorConditionField(condition.field);
}

// =============================================================================
// Order Conditions
// =============================================================================

/**
 * Status condition — triggers when order status is in the target list.
 */
const OrderStatusConditionSchema = z.object({
  field: z
    .literal(OrderConditionField.Status)
    .describe('Order execution status'),
  targetStatus: z
    .array(z.nativeEnum(OrderExecutionStatus))
    .min(1)
    .describe(
      'Target statuses to match (triggers when order status is in this list)',
    ),
});

/**
 * Numeric order conditions — same operators as market conditions.
 */
const OrderNumericConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z
      .literal(OrderConditionField.AvgPrice)
      .describe('Average fill price'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(OrderConditionField.CompletionPercentage)
      .describe('Order completion percentage (0-100)'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(OrderConditionField.CumulativeQuantity)
      .describe('Total quantity filled so far'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z.literal(OrderConditionField.TotalFees).describe('Total fees paid'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(OrderConditionField.FilledValue)
      .describe('Total filled value in quote currency'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
  z.object({
    field: z
      .literal(OrderConditionField.NumberOfFills)
      .describe('Number of individual fills'),
    operator: OperatorSchema,
    value: z.number().describe('Threshold value to compare against'),
  }),
]);

/**
 * Order condition — either a status check or a numeric comparison.
 */
const OrderConditionSchema = z
  .union([OrderStatusConditionSchema, OrderNumericConditionSchema])
  .describe('A condition to evaluate against order data');

export type OrderCondition = z.output<typeof OrderConditionSchema>;
export type OrderStatusCondition = z.output<typeof OrderStatusConditionSchema>;
export type OrderNumericCondition = z.output<
  typeof OrderNumericConditionSchema
>;

/**
 * Type guard for status conditions.
 */
export function isOrderStatusCondition(
  condition: OrderCondition,
): condition is OrderStatusCondition {
  return condition.field === OrderConditionField.Status;
}

// =============================================================================
// Subscription Schemas (discriminated union on type)
// =============================================================================

/**
 * Market subscription — monitor a product's ticker and indicator data.
 */
const MarketSubscriptionSchema = z
  .object({
    type: z.literal(SubscriptionType.Market).describe('Subscription type'),
    productId: z.string().describe('Trading pair to monitor (e.g., "BTC-EUR")'),
    conditions: z
      .array(MarketConditionSchema)
      .min(1)
      .max(5)
      .describe('Conditions that trigger the event'),
    logic: z
      .nativeEnum(ConditionLogic)
      .default(ConditionLogic.ANY)
      .describe('How to combine conditions: "any" (OR) or "all" (AND)'),
  })
  .describe(
    'A market subscription to monitor a specific product with conditions',
  );

export type MarketSubscription = z.output<typeof MarketSubscriptionSchema>;

/**
 * Order subscription — monitor an order's status and fill data.
 */
const OrderSubscriptionSchema = z
  .object({
    type: z.literal(SubscriptionType.Order).describe('Subscription type'),
    orderId: z.string().describe('Order ID to monitor'),
    conditions: z
      .array(OrderConditionSchema)
      .min(1)
      .max(5)
      .describe('Conditions that trigger the event'),
    logic: z
      .nativeEnum(ConditionLogic)
      .default(ConditionLogic.ANY)
      .describe('How to combine conditions: "any" (OR) or "all" (AND)'),
  })
  .describe(
    'An order subscription to monitor a specific order with conditions',
  );

export type OrderSubscription = z.output<typeof OrderSubscriptionSchema>;

/**
 * Discriminated union of all subscription types.
 */
const SubscriptionSchema = z
  .discriminatedUnion('type', [
    MarketSubscriptionSchema,
    OrderSubscriptionSchema,
  ])
  .describe('A subscription — either market or order');

export type Subscription = z.output<typeof SubscriptionSchema>;

// =============================================================================
// Request Schema
// =============================================================================

/**
 * Request schema for wait_for_event tool.
 */
export const WaitForEventRequestSchema = z
  .object({
    subscriptions: z
      .array(SubscriptionSchema)
      .min(1)
      .max(10)
      .describe(
        "Subscriptions to monitor. Supports market (ticker/indicator) and order (status/fill) subscriptions. Triggers when any subscription's conditions are met.",
      ),
    timeout: z
      .number()
      .min(1)
      .max(240)
      .default(55)
      .describe('Wait time in seconds (default: 55, max: 240)'),
  })
  .describe('Request to wait for an event matching specified conditions');

export type WaitForEventRequest = z.output<typeof WaitForEventRequestSchema>;
