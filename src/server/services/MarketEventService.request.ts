import { z } from 'zod';

import {
  ConditionLogic,
  ConditionOperator,
  IndicatorConditionField,
  TickerConditionField,
} from './MarketEventService.types';
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
// Ticker Conditions
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

/**
 * Type guard to check if a field is a ticker field.
 */
export function isTickerField(field: string): field is TickerConditionField {
  return Object.values(TickerConditionField).includes(
    field as TickerConditionField,
  );
}

// =============================================================================
// RSI Condition
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

// =============================================================================
// MACD Conditions
// =============================================================================

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

// =============================================================================
// Bollinger Bands Conditions
// =============================================================================

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

// =============================================================================
// SMA Condition
// =============================================================================

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

// =============================================================================
// EMA Condition
// =============================================================================

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

// =============================================================================
// Stochastic Conditions
// =============================================================================

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

// =============================================================================
// Indicator Condition Type (union of all indicator conditions)
// =============================================================================

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
 * Type guard to check if a condition is an indicator condition.
 */
export function isIndicatorCondition(
  condition: Condition,
): condition is IndicatorCondition {
  return Object.values(IndicatorConditionField).includes(
    condition.field as IndicatorConditionField,
  );
}

// =============================================================================
// Combined Condition Schema
// =============================================================================

/**
 * A condition to evaluate against ticker data or technical indicators.
 */
const ConditionSchema = z
  .discriminatedUnion('field', [
    // Ticker conditions
    ...TickerConditionSchema.options,

    // Indicator conditions
    ...IndicatorConditionSchema.options,
  ])
  .describe(
    'A condition to evaluate against ticker data or technical indicators',
  );

export type Condition = z.output<typeof ConditionSchema>;

// =============================================================================
// Subscription Schema
// =============================================================================

/**
 * A subscription to monitor a specific product with conditions.
 */
const SubscriptionSchema = z
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

// =============================================================================
// Request Schema
// =============================================================================

/**
 * Request schema for wait_for_market_event tool.
 */
export const WaitForMarketEventRequestSchema = z
  .object({
    subscriptions: z
      .array(SubscriptionSchema)
      .min(1)
      .max(10)
      .describe(
        "Products and conditions to monitor. If multiple subscriptions are provided, the event triggers when any subscription's conditions are met.",
      ),
    timeout: z
      .number()
      .min(1)
      .max(240)
      .default(55)
      .describe('Wait time in seconds (default: 55, max: 240)'),
  })
  .describe('Request to wait for a market event matching specified conditions');

export type WaitForMarketEventRequest = z.output<
  typeof WaitForMarketEventRequestSchema
>;
