/**
 * Technical Analysis type definitions.
 *
 * Defines all types for the analyze_technical_indicators tool which
 * provides integrated candle fetching and indicator calculation.
 */

import { Granularity } from './ProductsService.types';

/**
 * All supported indicator types (24 total).
 *
 * Categories:
 * - Momentum (7): rsi, macd, stochastic, adx, cci, williams_r, roc
 * - Trend (4): sma, ema, ichimoku, psar
 * - Volatility (3): bollinger_bands, atr, keltner
 * - Volume (4): obv, mfi, vwap, volume_profile
 * - Patterns (4): candlestick_patterns, rsi_divergence, chart_patterns, swing_points
 * - Support/Resistance (2): pivot_points, fibonacci
 */
export enum IndicatorType {
  // Momentum (7)
  RSI = 'rsi',
  MACD = 'macd',
  STOCHASTIC = 'stochastic',
  ADX = 'adx',
  CCI = 'cci',
  WILLIAMS_R = 'williams_r',
  ROC = 'roc',
  // Trend (4)
  SMA = 'sma',
  EMA = 'ema',
  ICHIMOKU = 'ichimoku',
  PSAR = 'psar',
  // Volatility (3)
  BOLLINGER_BANDS = 'bollinger_bands',
  ATR = 'atr',
  KELTNER = 'keltner',
  // Volume (4)
  OBV = 'obv',
  MFI = 'mfi',
  VWAP = 'vwap',
  VOLUME_PROFILE = 'volume_profile',
  // Pattern Detection (4)
  CANDLESTICK_PATTERNS = 'candlestick_patterns',
  RSI_DIVERGENCE = 'rsi_divergence',
  CHART_PATTERNS = 'chart_patterns',
  SWING_POINTS = 'swing_points',
  // Support/Resistance (2)
  PIVOT_POINTS = 'pivot_points',
  FIBONACCI = 'fibonacci',
}

/**
 * Request input for analyze_technical_indicators tool.
 */
export interface AnalyzeTechnicalIndicatorsRequest {
  /** Product ID (e.g., "BTC-USD") */
  readonly productId: string;
  /** Candle granularity (e.g., FIFTEEN_MINUTE, ONE_HOUR) */
  readonly granularity: Granularity;
  /** Number of candles to fetch (default: 100) */
  readonly candleCount?: number;
  /** Specific indicators to calculate (default: all 24) */
  readonly indicators?: readonly IndicatorType[];
}

/**
 * Signal direction based on indicator analysis.
 */
export type SignalDirection =
  | 'STRONG_BUY'
  | 'BUY'
  | 'NEUTRAL'
  | 'SELL'
  | 'STRONG_SELL';

/**
 * Confidence level of the signal.
 */
export type SignalConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Aggregated signal from all calculated indicators.
 */
export interface AggregatedSignal {
  /** Score from -100 (strong sell) to +100 (strong buy) */
  readonly score: number;
  /** Direction interpretation of the score */
  readonly direction: SignalDirection;
  /** Confidence based on indicator agreement */
  readonly confidence: SignalConfidence;
}

/**
 * Price summary for the analyzed period.
 */
export interface PriceSummary {
  /** Current (latest) price */
  readonly current: number;
  /** Open price of the period */
  readonly open: number;
  /** Highest price in the period */
  readonly high: number;
  /** Lowest price in the period */
  readonly low: number;
  /** 24-hour price change percentage */
  readonly change24h: number;
}

// ============================================================================
// Indicator Result Types
// ============================================================================

/**
 * RSI indicator result.
 */
export interface RsiResult {
  /** RSI value (0-100) */
  readonly value: number;
  /** Signal interpretation (overbought, neutral, oversold) */
  readonly signal: string;
}

/**
 * MACD indicator result.
 */
export interface MacdResult {
  /** MACD line value */
  readonly macd: number;
  /** Signal line value */
  readonly signal: number;
  /** Histogram value (MACD - Signal) */
  readonly histogram: number;
  /** Crossover status (bullish, bearish, none) */
  readonly crossover: string;
}

/**
 * Stochastic oscillator result.
 */
export interface StochasticResult {
  /** %K fast line value */
  readonly k: number;
  /** %D signal line value */
  readonly d: number;
  /** Signal interpretation */
  readonly signal: string;
}

/**
 * ADX (Average Directional Index) result.
 */
export interface AdxResult {
  /** ADX value */
  readonly adx: number;
  /** Positive directional indicator */
  readonly pdi: number;
  /** Negative directional indicator */
  readonly mdi: number;
  /** Trend strength (strong, weak, none) */
  readonly trendStrength: string;
}

/**
 * CCI (Commodity Channel Index) result.
 */
export interface CciResult {
  /** CCI value */
  readonly value: number;
  /** Signal interpretation */
  readonly signal: string;
}

/**
 * Williams %R result.
 */
export interface WilliamsRResult {
  /** Williams %R value (-100 to 0) */
  readonly value: number;
  /** Signal interpretation */
  readonly signal: string;
}

/**
 * ROC (Rate of Change) result.
 */
export interface RocResult {
  /** ROC percentage value */
  readonly value: number;
  /** Signal interpretation */
  readonly signal: string;
}

/**
 * Momentum indicators grouped result.
 */
export interface MomentumIndicators {
  rsi?: RsiResult;
  macd?: MacdResult;
  stochastic?: StochasticResult;
  adx?: AdxResult;
  cci?: CciResult;
  williamsR?: WilliamsRResult;
  roc?: RocResult;
}

/**
 * SMA (Simple Moving Average) result.
 */
export interface SmaResult {
  /** SMA value */
  readonly value: number;
  /** Trend based on price vs SMA */
  readonly trend: string;
}

/**
 * EMA (Exponential Moving Average) result.
 */
export interface EmaResult {
  /** EMA value */
  readonly value: number;
  /** Trend based on price vs EMA */
  readonly trend: string;
}

/**
 * Ichimoku Cloud result.
 */
export interface IchimokuResult {
  /** Tenkan-sen (conversion line) */
  readonly tenkan: number;
  /** Kijun-sen (base line) */
  readonly kijun: number;
  /** Senkou Span A (leading span A) */
  readonly senkouA: number;
  /** Senkou Span B (leading span B) */
  readonly senkouB: number;
  /** Signal interpretation */
  readonly signal: string;
}

/**
 * Parabolic SAR result.
 */
export interface PsarResult {
  /** PSAR value */
  readonly value: number;
  /** Trend direction (up, down) */
  readonly trend: string;
}

/**
 * Trend indicators grouped result.
 */
export interface TrendIndicators {
  sma?: SmaResult;
  ema?: EmaResult;
  ichimoku?: IchimokuResult;
  psar?: PsarResult;
}

/**
 * Bollinger Bands result.
 */
export interface BollingerBandsResult {
  /** Upper band value */
  readonly upper: number;
  /** Middle band (SMA) value */
  readonly middle: number;
  /** Lower band value */
  readonly lower: number;
  /** %B value (position within bands) */
  readonly percentB: number;
  /** Signal interpretation */
  readonly signal: string;
}

/**
 * ATR (Average True Range) result.
 */
export interface AtrResult {
  /** ATR value */
  readonly value: number;
  /** Volatility level (high, normal, low) */
  readonly volatility: string;
}

/**
 * Keltner Channels result.
 */
export interface KeltnerResult {
  /** Upper channel value */
  readonly upper: number;
  /** Middle channel (EMA) value */
  readonly middle: number;
  /** Lower channel value */
  readonly lower: number;
  /** Signal interpretation */
  readonly signal: string;
}

/**
 * Volatility indicators grouped result.
 */
export interface VolatilityIndicators {
  bollingerBands?: BollingerBandsResult;
  atr?: AtrResult;
  keltner?: KeltnerResult;
}

/**
 * OBV (On-Balance Volume) result.
 */
export interface ObvResult {
  /** OBV value */
  readonly value: number;
  /** Trend based on OBV direction */
  readonly trend: string;
}

/**
 * MFI (Money Flow Index) result.
 */
export interface MfiResult {
  /** MFI value (0-100) */
  readonly value: number;
  /** Signal interpretation */
  readonly signal: string;
}

/**
 * VWAP (Volume Weighted Average Price) result.
 */
export interface VwapResult {
  /** VWAP value */
  readonly value: number;
  /** Price position relative to VWAP */
  readonly position: string;
}

/**
 * Volume Profile result.
 */
export interface VolumeProfileResult {
  /** Point of Control (highest volume price) */
  readonly poc: number;
  /** Value Area High */
  readonly valueAreaHigh: number;
  /** Value Area Low */
  readonly valueAreaLow: number;
}

/**
 * Volume indicators grouped result.
 */
export interface VolumeIndicators {
  obv?: ObvResult;
  mfi?: MfiResult;
  vwap?: VwapResult;
  volumeProfile?: VolumeProfileResult;
}

/**
 * Candlestick patterns result.
 */
export interface CandlestickPatternsResult {
  /** Detected pattern names */
  readonly patterns: readonly string[];
  /** Overall bias (bullish, bearish, neutral) */
  readonly bias: string;
}

/**
 * RSI Divergence result.
 */
export interface RsiDivergenceResult {
  /** Divergence type (bullish, bearish, hidden_bullish, hidden_bearish, null) */
  readonly type: string | null;
  /** Divergence strength (weak, medium, strong, null) */
  readonly strength: string | null;
}

/**
 * Chart patterns result.
 */
export interface ChartPatternsResult {
  /** Detected pattern names */
  readonly patterns: readonly string[];
  /** Overall direction (bullish, bearish, null) */
  readonly direction: string | null;
}

/**
 * Swing points result.
 */
export interface SwingPointsResult {
  /** Latest swing high price */
  readonly latestSwingHigh: number | null;
  /** Latest swing low price */
  readonly latestSwingLow: number | null;
  /** Detected trend (uptrend, downtrend, sideways) */
  readonly trend: string;
  /** Number of swing highs detected */
  readonly swingHighCount: number;
  /** Number of swing lows detected */
  readonly swingLowCount: number;
}

/**
 * Pattern detection indicators grouped result.
 */
export interface PatternIndicators {
  candlestickPatterns?: CandlestickPatternsResult;
  rsiDivergence?: RsiDivergenceResult;
  chartPatterns?: ChartPatternsResult;
  swingPoints?: SwingPointsResult;
}

/**
 * Pivot Points result.
 */
export interface PivotPointsResult {
  /** Central pivot point */
  readonly pivot: number;
  /** Resistance level 1 */
  readonly r1: number;
  /** Resistance level 2 */
  readonly r2: number;
  /** Resistance level 3 */
  readonly r3: number;
  /** Support level 1 */
  readonly s1: number;
  /** Support level 2 */
  readonly s2: number;
  /** Support level 3 */
  readonly s3: number;
  /** Data source (always 'daily' for industry standard) */
  readonly source: 'daily';
}

/**
 * Fibonacci retracement result.
 */
export interface FibonacciResult {
  /** Detected trend used for calculation */
  readonly trend: string;
  /** Retracement and extension levels */
  readonly levels: Readonly<Record<string, number>>;
  /** Swing high price used */
  readonly swingHigh: number;
  /** Swing low price used */
  readonly swingLow: number;
}

/**
 * Support/Resistance indicators grouped result.
 */
export interface SupportResistanceIndicators {
  pivotPoints?: PivotPointsResult;
  fibonacci?: FibonacciResult;
}

/**
 * All indicators grouped by category.
 */
export interface IndicatorResults {
  momentum?: MomentumIndicators;
  trend?: TrendIndicators;
  volatility?: VolatilityIndicators;
  volume?: VolumeIndicators;
  patterns?: PatternIndicators;
  supportResistance?: SupportResistanceIndicators;
}

/**
 * Response from analyze_technical_indicators tool.
 *
 * Contains:
 * - Metadata (productId, granularity, candleCount, timestamp)
 * - Price summary (current, open, high, low, change24h)
 * - Calculated indicators grouped by category
 * - Aggregated signal (score, direction, confidence)
 *
 * Does NOT contain raw candle data to minimize context usage.
 */
export interface AnalyzeTechnicalIndicatorsResponse {
  /** Product ID that was analyzed */
  readonly productId: string;
  /** Granularity used for candles */
  readonly granularity: string;
  /** Number of candles analyzed */
  readonly candleCount: number;
  /** ISO 8601 timestamp of analysis */
  readonly timestamp: string;
  /** Price summary for the period */
  readonly price: PriceSummary;
  /** Calculated indicator results */
  readonly indicators: IndicatorResults;
  /** Aggregated trading signal */
  readonly signal: AggregatedSignal;
}
