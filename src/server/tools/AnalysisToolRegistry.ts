import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import type { TechnicalAnalysisService } from '../services';
import { IndicatorType, Granularity } from '../services';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for technical analysis MCP tools (1 tool).
 *
 * Provides the `analyze_technical_indicators` tool which combines
 * candle fetching and indicator calculation server-side, reducing
 * context usage by ~90-95%.
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
  }
}
