import type { PivotPointsType } from '../indicators/pivotPoints';
import type { RsiDivergence } from '../indicators/rsiDivergence';
import type { VolumeProfileZone } from '../indicators/volumeProfile';
import type { ChartPattern } from '../indicators/chartPatterns';
import type { SwingPoint, SwingTrend } from '../indicators/swingPoints';

// =============================================================================
// Response Types - All indicator outputs
// =============================================================================

/**
 * Response for RSI calculation
 */
export interface CalculateRsiResponse {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
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
 * Response for MACD calculation
 */
export interface CalculateMacdResponse {
  readonly fastPeriod: number;
  readonly slowPeriod: number;
  readonly signalPeriod: number;
  readonly values: readonly MacdValue[];
  readonly latestValue: MacdValue | null;
}

/**
 * Response for SMA calculation
 */
export interface CalculateSmaResponse {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Response for EMA calculation
 */
export interface CalculateEmaResponse {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
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
 * Response for Bollinger Bands calculation
 */
export interface CalculateBollingerBandsResponse {
  readonly period: number;
  readonly stdDev: number;
  readonly values: readonly BollingerBandsValue[];
  readonly latestValue: BollingerBandsValue | null;
}

/**
 * Response for ATR calculation
 */
export interface CalculateAtrResponse {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
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
   * Formula: (Close - Lowest Low) / (Highest High - Lowest Low) x 100
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
 * Response for Stochastic calculation
 */
export interface CalculateStochasticResponse {
  readonly kPeriod: number;
  readonly dPeriod: number;
  readonly values: readonly StochasticValue[];
  readonly latestValue: StochasticValue | null;
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
 * Response for ADX calculation
 */
export interface CalculateAdxResponse {
  readonly period: number;
  readonly values: readonly AdxValue[];
  readonly latestValue: AdxValue | null;
}

/**
 * Response for OBV calculation
 */
export interface CalculateObvResponse {
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Response for VWAP calculation
 */
export interface CalculateVwapResponse {
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Response for CCI calculation
 */
export interface CalculateCciResponse {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Response for Williams %R calculation
 */
export interface CalculateWilliamsRResponse {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Response for ROC calculation
 */
export interface CalculateRocResponse {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Response for MFI calculation
 */
export interface CalculateMfiResponse {
  readonly period: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
}

/**
 * Response for Parabolic SAR calculation
 */
export interface CalculatePsarResponse {
  readonly step: number;
  readonly max: number;
  readonly values: readonly number[];
  readonly latestValue: number | null;
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
 * Response for Ichimoku Cloud calculation
 */
export interface CalculateIchimokuCloudResponse {
  readonly conversionPeriod: number;
  readonly basePeriod: number;
  readonly spanPeriod: number;
  readonly displacement: number;
  readonly values: readonly IchimokuCloudDataPoint[];
  readonly latestValue: IchimokuCloudDataPoint | null;
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
 * Response for Keltner Channels calculation
 */
export interface CalculateKeltnerChannelsResponse {
  readonly maPeriod: number;
  readonly atrPeriod: number;
  readonly multiplier: number;
  readonly useSMA: boolean;
  readonly values: readonly KeltnerChannelsDataPoint[];
  readonly latestValue: KeltnerChannelsDataPoint | null;
}

/**
 * Response for Fibonacci Retracement calculation
 */
export interface CalculateFibonacciRetracementResponse {
  readonly start: number;
  readonly end: number;
  readonly trend: 'uptrend' | 'downtrend';
  readonly levels: {
    readonly level: number;
    readonly price: number;
  }[];
}

/**
 * Response for Candlestick Patterns detection
 */
export interface DetectCandlestickPatternsResponse {
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
 * Response for Volume Profile calculation
 */
export interface CalculateVolumeProfileResponse {
  readonly noOfBars: number;
  readonly zones: readonly VolumeProfileZone[];
  readonly pointOfControl: VolumeProfileZone | null;
  readonly valueAreaHigh: number | null;
  readonly valueAreaLow: number | null;
}

/**
 * Response for RSI Divergence detection
 */
export interface DetectRsiDivergenceResponse {
  readonly rsiPeriod: number;
  readonly lookbackPeriod: number;
  readonly rsiValues: readonly number[];
  readonly divergences: readonly RsiDivergence[];
  readonly latestDivergence: RsiDivergence | null;
  readonly hasBullishDivergence: boolean;
  readonly hasBearishDivergence: boolean;
}

/**
 * Response for Chart Pattern detection
 */
export interface DetectChartPatternsResponse {
  readonly lookbackPeriod: number;
  readonly patterns: readonly ChartPattern[];
  readonly bullishPatterns: readonly ChartPattern[];
  readonly bearishPatterns: readonly ChartPattern[];
  readonly latestPattern: ChartPattern | null;
}

/**
 * Response for Swing Points detection (Williams Fractal)
 */
export interface DetectSwingPointsResponse {
  readonly swingHighs: readonly SwingPoint[];
  readonly swingLows: readonly SwingPoint[];
  readonly latestSwingHigh: SwingPoint | null;
  readonly latestSwingLow: SwingPoint | null;
  readonly trend: SwingTrend;
}

// =============================================================================
// Re-exported types for external consumers
// =============================================================================

export type { PivotPointsType };
