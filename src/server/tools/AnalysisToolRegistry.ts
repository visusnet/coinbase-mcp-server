import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TechnicalAnalysisService } from '../services';
import {
  AnalyzeTechnicalIndicatorsRequestSchema,
  AnalyzeTechnicalIndicatorsBatchRequestSchema,
} from '../services/TechnicalAnalysisService.request';
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
    this.registerTool(
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
        inputSchema: AnalyzeTechnicalIndicatorsRequestSchema.shape,
      },
      this.analysis.analyzeTechnicalIndicators.bind(this.analysis),
    );

    this.registerTool(
      'analyze_technical_indicators_batch',
      {
        title: 'Analyze Technical Indicators (Batch)',
        description:
          'Analyze technical indicators for multiple cryptocurrency products in parallel. ' +
          'Use this instead of multiple single calls when analyzing several products. ' +
          'Returns results for each product with a summary ranking by signal score. ' +
          'Supports the same 24 indicators as analyze_technical_indicators.',
        inputSchema: AnalyzeTechnicalIndicatorsBatchRequestSchema.shape,
      },
      this.analysis.analyzeTechnicalIndicatorsBatch.bind(this.analysis),
    );
  }
}
