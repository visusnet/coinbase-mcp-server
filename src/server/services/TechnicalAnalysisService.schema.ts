import { z } from 'zod';
import { Granularity } from './ProductsService.types';
import { IndicatorType } from './TechnicalAnalysisService.types';

// =============================================================================
// Technical Analysis Request Schemas
// =============================================================================

/**
 * Request schema for single product technical analysis.
 */
export const AnalyzeTechnicalIndicatorsRequestSchema = z.object({
  productId: z
    .string()
    .describe('Product ID to analyze (e.g., "BTC-USD", "ETH-USD")'),
  granularity: z
    .nativeEnum(Granularity)
    .describe(
      'Candle granularity. Common choices: ' +
        'FIFTEEN_MINUTE (intraday), ONE_HOUR (short-term), ONE_DAY (long-term)',
    ),
  candleCount: z
    .number()
    .int()
    .min(5)
    .max(300)
    .optional()
    .describe(
      'Number of candles to analyze (default: 100, min: 5, max: 300). ' +
        'More candles improve pattern detection but increase processing time.',
    ),
  indicators: z
    .array(z.nativeEnum(IndicatorType))
    .optional()
    .describe(
      `Optional list of specific indicators to calculate. ` +
        `If omitted, all ${Object.keys(IndicatorType).length} indicators are calculated. ` +
        `Categories: Momentum (rsi, macd, stochastic, adx, cci, williams_r, roc), ` +
        `Trend (sma, ema, ichimoku, psar), ` +
        `Volatility (bollinger_bands, atr, keltner), ` +
        `Volume (obv, mfi, vwap, volume_profile), ` +
        `Patterns (candlestick_patterns, rsi_divergence, chart_patterns, swing_points), ` +
        `Support/Resistance (pivot_points, fibonacci).`,
    ),
});

export type AnalyzeTechnicalIndicatorsRequest = z.infer<
  typeof AnalyzeTechnicalIndicatorsRequestSchema
>;

/**
 * Request schema for batch (multi-product) technical analysis.
 */
export const AnalyzeTechnicalIndicatorsBatchRequestSchema = z.object({
  productIds: z
    .array(z.string())
    .min(1)
    .max(20)
    .describe(
      'Product IDs to analyze (e.g., ["BTC-USD", "ETH-USD", "SOL-USD"]). Max 20 products.',
    ),
  granularity: z
    .nativeEnum(Granularity)
    .describe(
      'Candle granularity for all products. Common choices: ' +
        'FIFTEEN_MINUTE (intraday), ONE_HOUR (short-term), ONE_DAY (long-term)',
    ),
  candleCount: z
    .number()
    .int()
    .min(5)
    .max(300)
    .optional()
    .describe(
      'Number of candles to analyze per product (default: 100, min: 5, max: 300).',
    ),
  indicators: z
    .array(z.nativeEnum(IndicatorType))
    .optional()
    .describe(
      'Optional list of specific indicators to calculate for all products. ' +
        'If omitted, all 24 indicators are calculated.',
    ),
});

export type AnalyzeTechnicalIndicatorsBatchRequest = z.infer<
  typeof AnalyzeTechnicalIndicatorsBatchRequestSchema
>;
