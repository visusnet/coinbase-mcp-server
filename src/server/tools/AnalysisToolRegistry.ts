import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import type { TechnicalAnalysisService } from '../services';
import { IndicatorType, Granularity } from '../services';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for technical analysis MCP tools (2 tools).
 *
 * Provides:
 * - `analyze_technical_indicators` - Single product analysis
 * - `analyze_technical_indicators_batch` - Multi-product parallel analysis
 *
 * Both tools combine candle fetching and indicator calculation server-side,
 * reducing context usage by ~90-95%.
 */
export class AnalysisToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly analysis: TechnicalAnalysisService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'analyze_technical_indicators',
      {
        title: 'Analyze Technical Indicators',
        description:
          'Analyze technical indicators for a cryptocurrency product. ' +
          'This tool fetches candle data and calculates indicators server-side, ' +
          'returning only computed values to reduce context usage. ' +
          'Supports 24 indicators across 6 categories: ' +
          'Momentum (RSI, MACD, Stochastic, ADX, CCI, Williams %R, ROC), ' +
          'Trend (SMA, EMA, Ichimoku, PSAR), ' +
          'Volatility (Bollinger Bands, ATR, Keltner), ' +
          'Volume (OBV, MFI, VWAP, Volume Profile), ' +
          'Patterns (Candlestick, RSI Divergence, Chart Patterns, Swing Points), ' +
          'Support/Resistance (Pivot Points, Fibonacci). ' +
          'Pivot Points use daily candles (industry standard). ' +
          'Fibonacci uses Williams Fractal swing detection (industry standard).',
        inputSchema: {
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
        },
      },
      this.call(this.analysis.analyzeTechnicalIndicators.bind(this.analysis)),
    );

    this.server.registerTool(
      'analyze_technical_indicators_batch',
      {
        title: 'Analyze Technical Indicators (Batch)',
        description:
          'Analyze technical indicators for multiple cryptocurrency products in parallel. ' +
          'Use this instead of multiple single calls when analyzing several products. ' +
          'Returns results for each product with a summary ranking by signal score. ' +
          'Supports the same 24 indicators as analyze_technical_indicators.',
        inputSchema: {
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
        },
      },
      this.call(
        this.analysis.analyzeTechnicalIndicatorsBatch.bind(this.analysis),
      ),
    );
  }
}
