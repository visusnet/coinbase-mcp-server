import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TechnicalIndicatorsService } from '../services';
import {
  CalculateRsiRequestSchema,
  CalculateMacdRequestSchema,
  CalculateStochasticRequestSchema,
  CalculateAdxRequestSchema,
  CalculateCciRequestSchema,
  CalculateWilliamsRRequestSchema,
  CalculateRocRequestSchema,
  CalculateSmaRequestSchema,
  CalculateEmaRequestSchema,
  CalculateIchimokuCloudRequestSchema,
  CalculateBollingerBandsRequestSchema,
  CalculateAtrRequestSchema,
  CalculateKeltnerChannelsRequestSchema,
  CalculatePsarRequestSchema,
  CalculateObvRequestSchema,
  CalculateVwapRequestSchema,
  CalculateMfiRequestSchema,
  CalculateVolumeProfileRequestSchema,
  DetectCandlestickPatternsRequestSchema,
  DetectRsiDivergenceRequestSchema,
  DetectChartPatternsRequestSchema,
  DetectSwingPointsRequestSchema,
  CalculateFibonacciRetracementRequestSchema,
  CalculatePivotPointsRequestSchema,
} from '../services/TechnicalIndicatorsService.schema';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for technical indicator MCP tools (24 tools).
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
        inputSchema: CalculateRsiRequestSchema.shape,
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
        inputSchema: CalculateMacdRequestSchema.shape,
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
        inputSchema: CalculateStochasticRequestSchema.shape,
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
        inputSchema: CalculateAdxRequestSchema.shape,
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
        inputSchema: CalculateCciRequestSchema.shape,
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
        inputSchema: CalculateWilliamsRRequestSchema.shape,
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
        inputSchema: CalculateRocRequestSchema.shape,
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
        inputSchema: CalculateSmaRequestSchema.shape,
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
        inputSchema: CalculateEmaRequestSchema.shape,
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
        inputSchema: CalculateIchimokuCloudRequestSchema.shape,
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
        inputSchema: CalculateBollingerBandsRequestSchema.shape,
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
        inputSchema: CalculateAtrRequestSchema.shape,
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
        inputSchema: CalculateKeltnerChannelsRequestSchema.shape,
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
        inputSchema: CalculatePsarRequestSchema.shape,
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
        inputSchema: CalculateObvRequestSchema.shape,
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
        inputSchema: CalculateVwapRequestSchema.shape,
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
        inputSchema: CalculateMfiRequestSchema.shape,
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
        inputSchema: CalculateVolumeProfileRequestSchema.shape,
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
        inputSchema: DetectCandlestickPatternsRequestSchema.shape,
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
        inputSchema: DetectRsiDivergenceRequestSchema.shape,
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
        inputSchema: DetectChartPatternsRequestSchema.shape,
      },
      this.call(this.indicators.detectChartPatterns.bind(this.indicators)),
    );

    this.server.registerTool(
      'detect_swing_points',
      {
        title: 'Detect Swing Points (Williams Fractals)',
        description:
          'Detect swing highs and swing lows using Williams Fractal method. ' +
          "A swing high occurs when a bar's high is higher than the surrounding bars. " +
          "A swing low occurs when a bar's low is lower than the surrounding bars. " +
          'Useful for identifying support/resistance levels, trend direction, and Fibonacci retracement points.',
        inputSchema: DetectSwingPointsRequestSchema.shape,
      },
      this.call(this.indicators.detectSwingPoints.bind(this.indicators)),
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
        inputSchema: CalculateFibonacciRetracementRequestSchema.shape,
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
        inputSchema: CalculatePivotPointsRequestSchema.shape,
      },
      this.call(this.indicators.calculatePivotPoints.bind(this.indicators)),
    );
  }
}
