import { z } from 'zod';
import { CandleInputSchema } from './common.response';

// =============================================================================
// Shared Candle Schema Helpers
// =============================================================================

/**
 * Creates a candle array schema with minimum count requirement.
 * Returns readonly array type to match service method signatures.
 * @param minCount - Minimum number of candles required
 * @param description - Description for the schema
 */
function CandlesArraySchema(minCount: number, description: string) {
  return z
    .array(CandleInputSchema)
    .min(minCount)
    .readonly()
    .describe(description);
}

// =============================================================================
// Momentum Indicators (7)
// =============================================================================

/**
 * Request schema for RSI calculation.
 */
export const CalculateRsiRequestSchema = z
  .object({
    candles: CandlesArraySchema(
      2,
      'Array of candle data (minimum 2 candles required)',
    ),
    period: z
      .number()
      .int()
      .min(2)
      .optional()
      .describe(
        'Number of candles to analyze (default: 14). ' +
          'Lower values (7-9) react faster but produce more false signals. ' +
          'Higher values (21-25) are slower but more reliable.',
      ),
  })
  .describe('Request parameters for RSI calculation');

export type CalculateRsiRequest = z.output<typeof CalculateRsiRequestSchema>;

/**
 * Request schema for MACD calculation.
 */
export const CalculateMacdRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    fastPeriod: z
      .number()
      .int()
      .min(2)
      .optional()
      .describe('Fast EMA period (default: 12)'),
    slowPeriod: z
      .number()
      .int()
      .min(2)
      .optional()
      .describe('Slow EMA period (default: 26)'),
    signalPeriod: z
      .number()
      .int()
      .min(2)
      .optional()
      .describe('Signal line period (default: 9)'),
  })
  .describe('Request parameters for MACD calculation');

export type CalculateMacdRequest = z.output<typeof CalculateMacdRequestSchema>;

/**
 * Request schema for Stochastic oscillator calculation.
 */
export const CalculateStochasticRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    kPeriod: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'Period for %K line calculation (default: 14). ' +
          'Number of periods to use for the raw stochastic calculation.',
      ),
    dPeriod: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'Period for %D signal line smoothing (default: 3). ' +
          'Moving average period applied to %K to create %D.',
      ),
  })
  .describe('Request parameters for Stochastic oscillator calculation');

export type CalculateStochasticRequest = z.output<
  typeof CalculateStochasticRequestSchema
>;

/**
 * Request schema for ADX calculation.
 */
export const CalculateAdxRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'Period for ADX calculation (default: 14). ' +
          'Shorter periods give faster signals but more noise.',
      ),
  })
  .describe('Request parameters for ADX calculation');

export type CalculateAdxRequest = z.output<typeof CalculateAdxRequestSchema>;

/**
 * Request schema for CCI calculation.
 */
export const CalculateCciRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Period for CCI calculation (default: 20)'),
  })
  .describe('Request parameters for CCI calculation');

export type CalculateCciRequest = z.output<typeof CalculateCciRequestSchema>;

/**
 * Request schema for Williams %R calculation.
 */
export const CalculateWilliamsRRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Period for Williams %R calculation (default: 14)'),
  })
  .describe('Request parameters for Williams %R calculation');

export type CalculateWilliamsRRequest = z.output<
  typeof CalculateWilliamsRRequestSchema
>;

/**
 * Request schema for ROC calculation.
 */
export const CalculateRocRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Period for ROC calculation (default: 12)'),
  })
  .describe('Request parameters for ROC calculation');

export type CalculateRocRequest = z.output<typeof CalculateRocRequestSchema>;

// =============================================================================
// Moving Averages (3)
// =============================================================================

/**
 * Request schema for SMA calculation.
 */
export const CalculateSmaRequestSchema = z
  .object({
    candles: CandlesArraySchema(1, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'Number of candles for SMA calculation (default: 20). ' +
          'Common values: 10, 20, 50, 100, 200.',
      ),
  })
  .describe('Request parameters for SMA calculation');

export type CalculateSmaRequest = z.output<typeof CalculateSmaRequestSchema>;

/**
 * Request schema for EMA calculation.
 */
export const CalculateEmaRequestSchema = z
  .object({
    candles: CandlesArraySchema(1, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'Number of candles for EMA calculation (default: 20). ' +
          'Common values: 9, 12, 20, 26, 50, 200.',
      ),
  })
  .describe('Request parameters for EMA calculation');

export type CalculateEmaRequest = z.output<typeof CalculateEmaRequestSchema>;

/**
 * Request schema for Ichimoku Cloud calculation.
 */
export const CalculateIchimokuCloudRequestSchema = z
  .object({
    candles: CandlesArraySchema(
      52,
      'Array of candle data (minimum 52 for span period)',
    ),
    conversionPeriod: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Tenkan-sen period (default: 9)'),
    basePeriod: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Kijun-sen period (default: 26)'),
    spanPeriod: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Senkou Span B period (default: 52)'),
    displacement: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Cloud displacement (default: 26)'),
  })
  .describe('Request parameters for Ichimoku Cloud calculation');

export type CalculateIchimokuCloudRequest = z.output<
  typeof CalculateIchimokuCloudRequestSchema
>;

// =============================================================================
// Volatility Indicators (4)
// =============================================================================

/**
 * Request schema for Bollinger Bands calculation.
 */
export const CalculateBollingerBandsRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(2)
      .optional()
      .describe('SMA period for middle band (default: 20)'),
    stdDev: z
      .number()
      .min(0.1)
      .optional()
      .describe('Standard deviation multiplier (default: 2)'),
  })
  .describe('Request parameters for Bollinger Bands calculation');

export type CalculateBollingerBandsRequest = z.output<
  typeof CalculateBollingerBandsRequestSchema
>;

/**
 * Request schema for ATR calculation.
 */
export const CalculateAtrRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'Number of periods for ATR calculation (default: 14). ' +
          'Shorter periods (e.g., 7) react faster to volatility changes, ' +
          'longer periods (e.g., 21) provide smoother readings.',
      ),
  })
  .describe('Request parameters for ATR calculation');

export type CalculateAtrRequest = z.output<typeof CalculateAtrRequestSchema>;

/**
 * Request schema for Keltner Channels calculation.
 */
export const CalculateKeltnerChannelsRequestSchema = z
  .object({
    candles: CandlesArraySchema(20, 'Array of candle data'),
    maPeriod: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Moving average period (default: 20)'),
    atrPeriod: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('ATR period (default: 10)'),
    multiplier: z
      .number()
      .min(0.1)
      .optional()
      .describe('ATR multiplier for channel width (default: 2)'),
    useSMA: z
      .boolean()
      .optional()
      .describe('Use SMA instead of EMA (default: false)'),
  })
  .describe('Request parameters for Keltner Channels calculation');

export type CalculateKeltnerChannelsRequest = z.output<
  typeof CalculateKeltnerChannelsRequestSchema
>;

/**
 * Request schema for Parabolic SAR calculation.
 */
export const CalculatePsarRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    step: z
      .number()
      .min(0.001)
      .max(1)
      .optional()
      .describe('Acceleration factor step (default: 0.02)'),
    max: z
      .number()
      .min(0.01)
      .max(1)
      .optional()
      .describe('Maximum acceleration factor (default: 0.2)'),
  })
  .describe('Request parameters for Parabolic SAR calculation');

export type CalculatePsarRequest = z.output<typeof CalculatePsarRequestSchema>;

// =============================================================================
// Volume Indicators (4)
// =============================================================================

/**
 * Request schema for OBV calculation.
 */
export const CalculateObvRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
  })
  .describe('Request parameters for OBV calculation');

export type CalculateObvRequest = z.output<typeof CalculateObvRequestSchema>;

/**
 * Request schema for VWAP calculation.
 */
export const CalculateVwapRequestSchema = z
  .object({
    candles: CandlesArraySchema(1, 'Array of candle data'),
  })
  .describe('Request parameters for VWAP calculation');

export type CalculateVwapRequest = z.output<typeof CalculateVwapRequestSchema>;

/**
 * Request schema for MFI calculation.
 */
export const CalculateMfiRequestSchema = z
  .object({
    candles: CandlesArraySchema(2, 'Array of candle data'),
    period: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Period for MFI calculation (default: 14)'),
  })
  .describe('Request parameters for MFI calculation');

export type CalculateMfiRequest = z.output<typeof CalculateMfiRequestSchema>;

/**
 * Request schema for Volume Profile calculation.
 */
export const CalculateVolumeProfileRequestSchema = z
  .object({
    candles: CandlesArraySchema(1, 'Array of candle data'),
    noOfBars: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Number of price zones (default: 12)'),
  })
  .describe('Request parameters for Volume Profile calculation');

export type CalculateVolumeProfileRequest = z.output<
  typeof CalculateVolumeProfileRequestSchema
>;

// =============================================================================
// Pattern Detection (4)
// =============================================================================

/**
 * Request schema for candlestick pattern detection.
 */
export const DetectCandlestickPatternsRequestSchema = z
  .object({
    candles: CandlesArraySchema(1, 'Array of candle data'),
  })
  .describe('Request parameters for candlestick pattern detection');

export type DetectCandlestickPatternsRequest = z.output<
  typeof DetectCandlestickPatternsRequestSchema
>;

/**
 * Request schema for RSI divergence detection.
 */
export const DetectRsiDivergenceRequestSchema = z
  .object({
    candles: z
      .array(CandleInputSchema)
      .readonly()
      .describe('Array of candle data (oldest first)'),
    rsiPeriod: z
      .number()
      .optional()
      .describe('RSI period for calculation (default: 14)'),
    lookbackPeriod: z
      .number()
      .optional()
      .describe('Lookback period for peak/trough detection (default: 14)'),
  })
  .describe('Request parameters for RSI divergence detection');

export type DetectRsiDivergenceRequest = z.output<
  typeof DetectRsiDivergenceRequestSchema
>;

/**
 * Request schema for chart pattern detection.
 */
export const DetectChartPatternsRequestSchema = z
  .object({
    candles: z
      .array(CandleInputSchema)
      .readonly()
      .describe('Array of candle data (oldest first)'),
    lookbackPeriod: z
      .number()
      .optional()
      .describe('Lookback period for pattern detection (default: 50)'),
  })
  .describe('Request parameters for chart pattern detection');

export type DetectChartPatternsRequest = z.output<
  typeof DetectChartPatternsRequestSchema
>;

/**
 * Request schema for swing point detection.
 */
export const DetectSwingPointsRequestSchema = z
  .object({
    candles: CandlesArraySchema(
      5,
      'Array of candle data (minimum 5 for default lookback)',
    ),
    lookback: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe(
        'Number of bars on each side to compare (default: 2, resulting in 5-bar pattern)',
      ),
  })
  .describe('Request parameters for swing point detection');

export type DetectSwingPointsRequest = z.output<
  typeof DetectSwingPointsRequestSchema
>;

// =============================================================================
// Support/Resistance (2)
// =============================================================================

/**
 * Request schema for Fibonacci Retracement calculation.
 */
export const CalculateFibonacciRetracementRequestSchema = z
  .object({
    start: z
      .number()
      .describe('Start price (low for uptrend, high for downtrend)'),
    end: z.number().describe('End price (high for uptrend, low for downtrend)'),
  })
  .describe('Request parameters for Fibonacci Retracement calculation');

export type CalculateFibonacciRetracementRequest = z.output<
  typeof CalculateFibonacciRetracementRequestSchema
>;

/**
 * Request schema for Pivot Points calculation.
 */
export const CalculatePivotPointsRequestSchema = z
  .object({
    high: z.number().describe('Previous period high price'),
    low: z.number().describe('Previous period low price'),
    close: z.number().describe('Previous period closing price'),
    open: z
      .number()
      .optional()
      .describe('Previous period opening price (required for DeMark type)'),
    type: z
      .enum(['standard', 'fibonacci', 'woodie', 'camarilla', 'demark'])
      .optional()
      .describe('Pivot point calculation type (default: standard)'),
  })
  .describe('Request parameters for Pivot Points calculation');

export type CalculatePivotPointsRequest = z.output<
  typeof CalculatePivotPointsRequestSchema
>;
