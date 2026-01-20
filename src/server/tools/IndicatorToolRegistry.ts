import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import type { TechnicalIndicatorsService } from '../TechnicalIndicatorsService';
import { ToolRegistry } from './ToolRegistry';

/**
 * Shared candle schema for technical indicator inputs.
 */
const candleSchema = z.object({
  open: z.string().describe('Opening price'),
  high: z.string().describe('High price'),
  low: z.string().describe('Low price'),
  close: z.string().describe('Closing price'),
  volume: z.string().describe('Volume'),
});

/**
 * Creates candle array schema with minimum count.
 */
function candlesSchema(minCount: number, description?: string) {
  return z
    .array(candleSchema)
    .min(minCount)
    .describe(description ?? 'Array of candle data');
}

/**
 * Registry for technical indicator MCP tools (23 tools).
 */
export class IndicatorToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly indicators: TechnicalIndicatorsService,
  ) {
    super(server);
  }

  public register(): void {
    this.registerMomentumIndicators();
    this.registerMovingAverages();
    this.registerVolatilityIndicators();
    this.registerVolumeIndicators();
    this.registerPatternDetection();
    this.registerSupportResistance();
  }

  private registerMomentumIndicators(): void {
    this.server.registerTool(
      'calculate_rsi',
      {
        title: 'Calculate RSI',
        description:
          'Calculate Relative Strength Index (RSI) from candle data. ' +
          'RSI measures momentum and identifies overbought (>70) or oversold (<30) conditions. ' +
          'Input candles should be in the same format as returned by get_product_candles.',
        inputSchema: {
          candles: candlesSchema(
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
        },
      },
      this.call(this.indicators.calculateRsi.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_macd',
      {
        title: 'Calculate MACD',
        description:
          'Calculate Moving Average Convergence Divergence (MACD) from candle data. ' +
          'MACD shows trend direction and momentum. Bullish when MACD crosses above signal line, ' +
          'bearish when it crosses below. Histogram shows the difference between MACD and signal.',
        inputSchema: {
          candles: candlesSchema(2),
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
        },
      },
      this.call(this.indicators.calculateMacd.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_stochastic',
      {
        title: 'Calculate Stochastic Oscillator',
        description:
          'Calculate Stochastic oscillator from candle data. ' +
          'Returns %K (fast line) and %D (signal line) values. ' +
          '%K above %D is bullish, below is bearish. ' +
          'Values above 80 indicate overbought, below 20 indicate oversold.',
        inputSchema: {
          candles: candlesSchema(2),
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
        },
      },
      this.call(this.indicators.calculateStochastic.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_adx',
      {
        title: 'Calculate ADX (Average Directional Index)',
        description:
          'Calculate ADX from candle data. ' +
          'Measures trend strength regardless of direction. ' +
          'ADX > 25 indicates strong trend, < 20 indicates weak/no trend. ' +
          'Returns ADX, +DI (bullish pressure), and -DI (bearish pressure).',
        inputSchema: {
          candles: candlesSchema(2),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Period for ADX calculation (default: 14). ' +
                'Shorter periods give faster signals but more noise.',
            ),
        },
      },
      this.call(this.indicators.calculateAdx.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_cci',
      {
        title: 'Calculate CCI (Commodity Channel Index)',
        description:
          'Calculate CCI from candle data. ' +
          'Measures price deviation from statistical mean. ' +
          'Readings above +100 suggest overbought, below -100 suggest oversold. ' +
          'Useful for identifying cyclical trends in commodities and stocks.',
        inputSchema: {
          candles: candlesSchema(2),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Period for CCI calculation (default: 20)'),
        },
      },
      this.call(this.indicators.calculateCci.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_williams_r',
      {
        title: 'Calculate Williams %R',
        description:
          'Calculate Williams %R from candle data. ' +
          'Momentum indicator similar to Stochastic but inverted scale (-100 to 0). ' +
          'Readings above -20 suggest overbought, below -80 suggest oversold. ' +
          'Useful for identifying potential reversal points.',
        inputSchema: {
          candles: candlesSchema(2),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Period for Williams %R calculation (default: 14)'),
        },
      },
      this.call(this.indicators.calculateWilliamsR.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_roc',
      {
        title: 'Calculate ROC (Rate of Change)',
        description:
          'Calculate ROC (Rate of Change) from candle data. ' +
          'Momentum oscillator measuring percentage change between current price and price n periods ago. ' +
          'Positive values indicate upward momentum, negative values indicate downward momentum. ' +
          'Useful for identifying trend strength and potential reversals.',
        inputSchema: {
          candles: candlesSchema(2),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Period for ROC calculation (default: 12)'),
        },
      },
      this.call(this.indicators.calculateRoc.bind(this.indicators)),
    );
  }

  private registerMovingAverages(): void {
    this.server.registerTool(
      'calculate_sma',
      {
        title: 'Calculate SMA',
        description:
          'Calculate Simple Moving Average (SMA) from candle data. ' +
          'SMA equally weights all prices in the period, providing a smoothed trend line. ' +
          'Common periods: 10 (short-term), 20/50 (medium-term), 200 (long-term trend).',
        inputSchema: {
          candles: candlesSchema(1),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Number of candles for SMA calculation (default: 20). ' +
                'Common values: 10, 20, 50, 100, 200.',
            ),
        },
      },
      this.call(this.indicators.calculateSma.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_ema',
      {
        title: 'Calculate EMA',
        description:
          'Calculate Exponential Moving Average (EMA) from candle data. ' +
          'EMA gives more weight to recent prices, making it more responsive than SMA. ' +
          'Common periods: 9 (short-term), 20 (medium-term), 50/200 (long-term trends).',
        inputSchema: {
          candles: candlesSchema(1),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Number of candles for EMA calculation (default: 20). ' +
                'Common values: 9, 12, 20, 26, 50, 200.',
            ),
        },
      },
      this.call(this.indicators.calculateEma.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_ichimoku_cloud',
      {
        title: 'Calculate Ichimoku Cloud',
        description:
          'Calculate Ichimoku Cloud (Ichimoku Kinko Hyo) from candle data. ' +
          'Comprehensive trend indicator with 5 components. ' +
          'Returns conversion line (Tenkan-sen), base line (Kijun-sen), ' +
          'leading span A (Senkou Span A), and leading span B (Senkou Span B). ' +
          'Price above cloud is bullish, below is bearish. ' +
          'Cloud color (green/red) indicates future trend direction.',
        inputSchema: {
          candles: candlesSchema(
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
        },
      },
      this.call(this.indicators.calculateIchimokuCloud.bind(this.indicators)),
    );
  }

  private registerVolatilityIndicators(): void {
    this.server.registerTool(
      'calculate_bollinger_bands',
      {
        title: 'Calculate Bollinger Bands',
        description:
          'Calculate Bollinger Bands from candle data. ' +
          'Returns upper, middle (SMA), and lower bands plus %B (position within bands). ' +
          'Price near upper band suggests overbought, near lower suggests oversold.',
        inputSchema: {
          candles: candlesSchema(2),
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
        },
      },
      this.call(this.indicators.calculateBollingerBands.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_atr',
      {
        title: 'Calculate ATR (Average True Range)',
        description:
          'Calculate ATR from candle data. ' +
          'Measures market volatility by decomposing the entire range of an asset price for a period. ' +
          'Higher ATR indicates higher volatility. Useful for setting stop-losses and position sizing.',
        inputSchema: {
          candles: candlesSchema(2),
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
        },
      },
      this.call(this.indicators.calculateAtr.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_keltner_channels',
      {
        title: 'Calculate Keltner Channels',
        description:
          'Calculate Keltner Channels from candle data. ' +
          'Volatility-based envelope indicator similar to Bollinger Bands but uses ATR. ' +
          'Returns middle (EMA), upper, and lower channel values. ' +
          'Price below lower channel suggests oversold, above upper suggests overbought. ' +
          'BB squeeze inside Keltner signals volatility breakout.',
        inputSchema: {
          candles: candlesSchema(20),
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
        },
      },
      this.call(this.indicators.calculateKeltnerChannels.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_psar',
      {
        title: 'Calculate Parabolic SAR',
        description:
          'Calculate Parabolic SAR from candle data. ' +
          'Trend-following indicator that provides potential entry and exit points. ' +
          'SAR below price indicates uptrend, SAR above price indicates downtrend. ' +
          'SAR flips signal trend reversals.',
        inputSchema: {
          candles: candlesSchema(2),
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
        },
      },
      this.call(this.indicators.calculatePsar.bind(this.indicators)),
    );
  }

  private registerVolumeIndicators(): void {
    this.server.registerTool(
      'calculate_obv',
      {
        title: 'Calculate OBV (On-Balance Volume)',
        description:
          'Calculate OBV from candle data. ' +
          'Measures buying and selling pressure using volume flow. ' +
          'Rising OBV confirms uptrend, falling OBV confirms downtrend. ' +
          'Divergence between price and OBV can signal reversals.',
        inputSchema: {
          candles: candlesSchema(2),
        },
      },
      this.call(this.indicators.calculateObv.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_vwap',
      {
        title: 'Calculate VWAP (Volume Weighted Average Price)',
        description:
          'Calculate VWAP from candle data. ' +
          'Represents the average price weighted by volume. ' +
          'Price above VWAP suggests bullish bias, below suggests bearish. ' +
          'Often used as intraday support/resistance level.',
        inputSchema: {
          candles: candlesSchema(1),
        },
      },
      this.call(this.indicators.calculateVwap.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_mfi',
      {
        title: 'Calculate MFI (Money Flow Index)',
        description:
          'Calculate MFI (Money Flow Index) from candle data. ' +
          'Volume-weighted RSI that measures buying and selling pressure. ' +
          'Readings above 80 suggest overbought, below 20 suggest oversold. ' +
          'Divergences between MFI and price can signal potential reversals.',
        inputSchema: {
          candles: candlesSchema(2),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Period for MFI calculation (default: 14)'),
        },
      },
      this.call(this.indicators.calculateMfi.bind(this.indicators)),
    );

    this.server.registerTool(
      'calculate_volume_profile',
      {
        title: 'Calculate Volume Profile',
        description:
          'Calculate Volume Profile from candle data. ' +
          'Divides price range into zones and shows volume distribution at each level. ' +
          'Returns zones with bullish/bearish volume, Point of Control (highest volume zone), ' +
          'and Value Area (70% of volume). Useful for identifying support/resistance levels.',
        inputSchema: {
          candles: candlesSchema(1),
          noOfBars: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('Number of price zones (default: 12)'),
        },
      },
      this.call(this.indicators.calculateVolumeProfile.bind(this.indicators)),
    );
  }

  private registerPatternDetection(): void {
    this.server.registerTool(
      'detect_candlestick_patterns',
      {
        title: 'Detect Candlestick Patterns',
        description:
          'Detect candlestick patterns from candle data. ' +
          'Identifies 31 patterns including bullish (Hammer, Engulfing, Morning Star, Marubozu, Harami Cross, etc.), ' +
          'bearish (Shooting Star, Evening Star, Three Black Crows, Marubozu, Harami Cross, etc.), and neutral (Doji). ' +
          'Returns overall bullish/bearish bias and list of detected patterns. ' +
          'Useful for identifying potential reversals and continuation signals.',
        inputSchema: {
          candles: candlesSchema(1),
        },
      },
      this.call(
        this.indicators.detectCandlestickPatterns.bind(this.indicators),
      ),
    );

    this.server.registerTool(
      'detect_rsi_divergence',
      {
        title: 'Detect RSI Divergence',
        description:
          'Detect RSI divergences in price data. ' +
          'Identifies bullish divergences (price lower lows, RSI higher lows), ' +
          'bearish divergences (price higher highs, RSI lower highs), ' +
          'hidden bullish (price higher lows, RSI lower lows), and ' +
          'hidden bearish (price lower highs, RSI higher highs). ' +
          'Returns divergences with strength classification (weak/medium/strong).',
        inputSchema: {
          candles: z
            .array(candleSchema)
            .describe('Array of candle data (oldest first)'),
          rsiPeriod: z
            .number()
            .optional()
            .describe('RSI period for calculation (default: 14)'),
          lookbackPeriod: z
            .number()
            .optional()
            .describe(
              'Lookback period for peak/trough detection (default: 14)',
            ),
        },
      },
      this.call(this.indicators.detectRsiDivergence.bind(this.indicators)),
    );

    this.server.registerTool(
      'detect_chart_patterns',
      {
        title: 'Detect Chart Patterns',
        description:
          'Detect chart patterns in price data. ' +
          'Identifies reversal patterns (Double Top/Bottom, Head & Shoulders) ' +
          'and continuation patterns (Ascending/Descending Triangles, Bull/Bear Flags). ' +
          'Returns patterns with direction, confidence level, and price targets.',
        inputSchema: {
          candles: z
            .array(candleSchema)
            .describe('Array of candle data (oldest first)'),
          lookbackPeriod: z
            .number()
            .optional()
            .describe('Lookback period for pattern detection (default: 50)'),
        },
      },
      this.call(this.indicators.detectChartPatterns.bind(this.indicators)),
    );
  }

  private registerSupportResistance(): void {
    this.server.registerTool(
      'calculate_fibonacci_retracement',
      {
        title: 'Calculate Fibonacci Retracement',
        description:
          'Calculate Fibonacci Retracement levels from swing high/low prices. ' +
          'For uptrend: start=low, end=high. For downtrend: start=high, end=low. ' +
          'Returns key retracement levels (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%) ' +
          'plus extension levels (127.2%, 161.8%, 261.8%, 423.6%). ' +
          'Price bouncing at 38.2% or 61.8% suggests support/resistance.',
        inputSchema: {
          start: z
            .number()
            .describe('Start price (low for uptrend, high for downtrend)'),
          end: z
            .number()
            .describe('End price (high for uptrend, low for downtrend)'),
        },
      },
      this.call(
        this.indicators.calculateFibonacciRetracement.bind(this.indicators),
      ),
    );

    this.server.registerTool(
      'calculate_pivot_points',
      {
        title: 'Calculate Pivot Points',
        description:
          'Calculate Pivot Points from previous period OHLC data. ' +
          'Supports Standard, Fibonacci, Woodie, Camarilla, and DeMark calculation types. ' +
          'Returns pivot point with support (S1-S3) and resistance (R1-R3) levels. ' +
          'Used to identify potential support/resistance levels for the next trading period.',
        inputSchema: {
          high: z.string().describe('Previous period high price'),
          low: z.string().describe('Previous period low price'),
          close: z.string().describe('Previous period closing price'),
          open: z
            .string()
            .optional()
            .describe(
              'Previous period opening price (required for DeMark type)',
            ),
          type: z
            .enum(['standard', 'fibonacci', 'woodie', 'camarilla', 'demark'])
            .optional()
            .describe('Pivot point calculation type (default: standard)'),
        },
      },
      this.call(this.indicators.calculatePivotPoints.bind(this.indicators)),
    );
  }
}
