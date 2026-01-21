import type {
  PivotPointsType,
  PivotPointsOutput,
} from '../indicators/pivotPoints';
import type { RsiDivergence } from '../indicators/rsiDivergence';
import type { VolumeProfileZone } from '../indicators/volumeProfile';
import type { ChartPattern } from '../indicators/chartPatterns';
import type { SwingPoint, SwingTrend } from '../indicators/swingPoints';

// Re-export PivotPointsOutput as it's the return type for calculatePivotPoints
export type { PivotPointsOutput };

// ============================================================================
// Our types
// ============================================================================

/**
 * Candle data structure for technical indicator calculations.
 * All numeric values are provided as numbers (not strings).
 */
export interface CandleInput {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

/**
 * Input for RSI calculation
 */
export interface CalculateRsiInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for RSI calculation
 */
export interface CalculateRsiOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for MACD calculation
 */
export interface CalculateMacdInput {
  readonly candles: readonly CandleInput[];
  readonly fastPeriod?: number;
  readonly slowPeriod?: number;
  readonly signalPeriod?: number;
}

/**
 * Single MACD data point
 */
export interface MacdValue {
  readonly MACD?: number;
  readonly signal?: number;
  readonly histogram?: number;
}

/**
 * Output for MACD calculation
 */
export interface CalculateMacdOutput {
  readonly fastPeriod: number;
  readonly slowPeriod: number;
  readonly signalPeriod: number;
  readonly values: readonly MacdValue[];
  readonly latestValue: MacdValue | null;
}

/**
 * Input for SMA calculation
 */
export interface CalculateSmaInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for SMA calculation
 */
export interface CalculateSmaOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for EMA calculation
 */
export interface CalculateEmaInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for EMA calculation
 */
export interface CalculateEmaOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Bollinger Bands calculation
 */
export interface CalculateBollingerBandsInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
  readonly stdDev?: number;
}

/**
 * Single Bollinger Bands data point
 */
export interface BollingerBandsValue {
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
  readonly pb: number;
  readonly bandwidth: number;
}

/**
 * Output for Bollinger Bands calculation
 */
export interface CalculateBollingerBandsOutput {
  readonly period: number;
  readonly stdDev: number;
  readonly values: readonly BollingerBandsValue[];
  readonly latestValue: BollingerBandsValue | null;
}

/**
 * Input for ATR calculation
 */
export interface CalculateAtrInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for ATR calculation
 */
export interface CalculateAtrOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Stochastic oscillator calculation.
 *
 * Uses the Slow Stochastic variant (most common in trading platforms):
 * - %K is smoothed using the kPeriod lookback window
 * - %D is a simple moving average of %K over dPeriod
 *
 * @see https://www.investopedia.com/terms/s/stochasticoscillator.asp
 */
export interface CalculateStochasticInput {
  readonly candles: readonly CandleInput[];
  /**
   * Lookback period for %K calculation (default: 14).
   * Determines how many periods to consider for the highest high and lowest low.
   */
  readonly kPeriod?: number;
  /**
   * Signal period for %D calculation (default: 3).
   * %D is a simple moving average of %K over this many periods.
   */
  readonly dPeriod?: number;
}

/**
 * Single Stochastic data point.
 *
 * Both values range from 0 to 100:
 * - Values above 80 indicate overbought conditions
 * - Values below 20 indicate oversold conditions
 */
export interface StochasticValue {
  /**
   * %K (fast line): Measures current close relative to the high-low range.
   * Formula: (Close - Lowest Low) / (Highest High - Lowest Low) × 100
   */
  readonly k: number;
  /**
   * %D (slow/signal line): SMA of %K, used for signal crossovers.
   * BUY signal: %K crosses above %D in oversold zone (<20)
   * SELL signal: %K crosses below %D in overbought zone (>80)
   */
  readonly d: number;
}

/**
 * Output for Stochastic calculation
 */
export interface CalculateStochasticOutput {
  readonly kPeriod: number;
  readonly dPeriod: number;
  readonly values: readonly StochasticValue[];
  readonly latestValue: StochasticValue | null;
}

/**
 * Input for ADX calculation
 */
export interface CalculateAdxInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Single ADX data point
 */
export interface AdxValue {
  readonly adx: number;
  readonly pdi: number;
  readonly mdi: number;
}

/**
 * Output for ADX calculation
 */
export interface CalculateAdxOutput {
  readonly period: number;
  readonly values: readonly AdxValue[];
  readonly latestValue: AdxValue | null;
}

/**
 * Input for OBV calculation
 */
export interface CalculateObvInput {
  readonly candles: readonly CandleInput[];
}

/**
 * Output for OBV calculation
 */
export interface CalculateObvOutput {
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for VWAP calculation
 */
export interface CalculateVwapInput {
  readonly candles: readonly CandleInput[];
}

/**
 * Output for VWAP calculation
 */
export interface CalculateVwapOutput {
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for CCI calculation
 */
export interface CalculateCciInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for CCI calculation
 */
export interface CalculateCciOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Williams %R calculation
 */
export interface CalculateWilliamsRInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for Williams %R calculation
 */
export interface CalculateWilliamsROutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for ROC calculation
 */
export interface CalculateRocInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for ROC calculation
 */
export interface CalculateRocOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for MFI calculation
 */
export interface CalculateMfiInput {
  readonly candles: readonly CandleInput[];
  readonly period?: number;
}

/**
 * Output for MFI calculation
 */
export interface CalculateMfiOutput {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Parabolic SAR calculation
 */
export interface CalculatePsarInput {
  readonly candles: readonly CandleInput[];
  readonly step?: number;
  readonly max?: number;
}

/**
 * Output for Parabolic SAR calculation
 */
export interface CalculatePsarOutput {
  readonly step: number;
  readonly max: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Input for Ichimoku Cloud calculation
 */
export interface CalculateIchimokuCloudInput {
  readonly candles: readonly CandleInput[];
  readonly conversionPeriod?: number;
  readonly basePeriod?: number;
  readonly spanPeriod?: number;
  readonly displacement?: number;
}

/**
 * Single Ichimoku Cloud data point.
 *
 * Note: The Chikou Span (Lagging Span) is the current closing price plotted
 * `displacement` periods (default: 26) in the past. For the most recent
 * `displacement` data points, chikou will be null because we cannot know
 * future closing prices. This matches the industry standard behavior of
 * TradingView, MetaTrader, and other professional charting platforms.
 */
export interface IchimokuCloudDataPoint {
  readonly conversion: number;
  readonly base: number;
  readonly spanA: number;
  readonly spanB: number;
  readonly chikou: number | null;
}

/**
 * Output for Ichimoku Cloud calculation
 */
export interface CalculateIchimokuCloudOutput {
  readonly conversionPeriod: number;
  readonly basePeriod: number;
  readonly spanPeriod: number;
  readonly displacement: number;
  readonly values: readonly IchimokuCloudDataPoint[];
  readonly latestValue: IchimokuCloudDataPoint | null;
}

/**
 * Input for Keltner Channels calculation
 */
export interface CalculateKeltnerChannelsInput {
  readonly candles: readonly CandleInput[];
  readonly maPeriod?: number;
  readonly atrPeriod?: number;
  readonly multiplier?: number;
  readonly useSMA?: boolean;
}

/**
 * Single Keltner Channels data point
 */
export interface KeltnerChannelsDataPoint {
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
}

/**
 * Output for Keltner Channels calculation
 */
export interface CalculateKeltnerChannelsOutput {
  readonly maPeriod: number;
  readonly atrPeriod: number;
  readonly multiplier: number;
  readonly useSMA: boolean;
  readonly values: readonly KeltnerChannelsDataPoint[];
  readonly latestValue: KeltnerChannelsDataPoint | null;
}

/**
 * Input for Fibonacci Retracement calculation
 */
export interface CalculateFibonacciRetracementInput {
  readonly start: number;
  readonly end: number;
}

/**
 * Output for Fibonacci Retracement calculation
 */
export interface CalculateFibonacciRetracementOutput {
  readonly start: number;
  readonly end: number;
  readonly trend: 'uptrend' | 'downtrend';
  readonly levels: {
    readonly level: number;
    readonly price: number;
  }[];
}

/**
 * Input for Candlestick Patterns detection
 */
export interface DetectCandlestickPatternsInput {
  readonly candles: readonly CandleInput[];
}

/**
 * Output for Candlestick Patterns detection
 */
export interface DetectCandlestickPatternsOutput {
  readonly bullish: boolean;
  readonly bearish: boolean;
  readonly patterns: {
    readonly name: string;
    readonly type: 'bullish' | 'bearish' | 'neutral';
    readonly detected: boolean;
  }[];
  readonly detectedPatterns: string[];
}

/**
 * Input for Volume Profile calculation
 */
export interface CalculateVolumeProfileInput {
  readonly candles: readonly CandleInput[];
  readonly noOfBars?: number;
}

/**
 * Output for Volume Profile calculation
 */
export interface CalculateVolumeProfileOutput {
  readonly noOfBars: number;
  readonly zones: readonly VolumeProfileZone[];
  readonly pointOfControl: VolumeProfileZone | null;
  readonly valueAreaHigh: number | null;
  readonly valueAreaLow: number | null;
}

/**
 * Input for Pivot Points calculation
 */
export interface CalculatePivotPointsInput {
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly open?: number;
  readonly type?: PivotPointsType;
}

/**
 * Input for RSI Divergence detection
 */
export interface DetectRsiDivergenceInput {
  readonly candles: readonly CandleInput[];
  readonly rsiPeriod?: number;
  readonly lookbackPeriod?: number;
}

/**
 * Output for RSI Divergence detection
 */
export interface DetectRsiDivergenceOutput {
  readonly rsiPeriod: number;
  readonly lookbackPeriod: number;
  readonly rsiValues: readonly number[];
  readonly divergences: readonly RsiDivergence[];
  readonly latestDivergence: RsiDivergence | null;
  readonly hasBullishDivergence: boolean;
  readonly hasBearishDivergence: boolean;
}

/**
 * Input for Chart Pattern detection
 */
export interface DetectChartPatternsInput {
  readonly candles: readonly CandleInput[];
  readonly lookbackPeriod?: number;
}

/**
 * Output for Chart Pattern detection
 */
export interface DetectChartPatternsOutput {
  readonly lookbackPeriod: number;
  readonly patterns: readonly ChartPattern[];
  readonly bullishPatterns: readonly ChartPattern[];
  readonly bearishPatterns: readonly ChartPattern[];
  readonly latestPattern: ChartPattern | null;
}

/**
 * Input for Swing Points detection (Williams Fractal)
 */
export interface DetectSwingPointsInput {
  readonly candles: readonly CandleInput[];
  readonly lookback?: number;
}

/**
 * Output for Swing Points detection (Williams Fractal)
 */
export interface DetectSwingPointsOutput {
  readonly swingHighs: readonly SwingPoint[];
  readonly swingLows: readonly SwingPoint[];
  readonly latestSwingHigh: SwingPoint | null;
  readonly latestSwingLow: SwingPoint | null;
  readonly trend: SwingTrend;
}
