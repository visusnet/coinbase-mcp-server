/**
 * Pivot Points calculation type
 */
export type PivotPointsType =
  | 'standard'
  | 'fibonacci'
  | 'woodie'
  | 'camarilla'
  | 'demark';

/**
 * Standard Pivot Points output (PP, R1-R3, S1-S3)
 */
export interface StandardPivotPointsOutput {
  readonly type: 'standard';
  readonly pivotPoint: number;
  readonly resistance1: number;
  readonly resistance2: number;
  readonly resistance3: number;
  readonly support1: number;
  readonly support2: number;
  readonly support3: number;
}

/**
 * Fibonacci Pivot Points output (PP, R1-R3, S1-S3)
 */
export interface FibonacciPivotPointsOutput {
  readonly type: 'fibonacci';
  readonly pivotPoint: number;
  readonly resistance1: number;
  readonly resistance2: number;
  readonly resistance3: number;
  readonly support1: number;
  readonly support2: number;
  readonly support3: number;
}

/**
 * Woodie Pivot Points output (PP, R1-R2, S1-S2)
 * Note: Woodie method traditionally only defines R1/R2 and S1/S2.
 */
export interface WoodiePivotPointsOutput {
  readonly type: 'woodie';
  readonly pivotPoint: number;
  readonly resistance1: number;
  readonly resistance2: number;
  readonly support1: number;
  readonly support2: number;
}

/**
 * Camarilla Pivot Points output (PP, R1-R4, S1-S4)
 * Includes all 8 traditional Camarilla levels plus pivot point.
 */
export interface CamarillaPivotPointsOutput {
  readonly type: 'camarilla';
  readonly pivotPoint: number;
  readonly resistance1: number;
  readonly resistance2: number;
  readonly resistance3: number;
  readonly resistance4: number;
  readonly support1: number;
  readonly support2: number;
  readonly support3: number;
  readonly support4: number;
}

/**
 * DeMark Pivot Points output (PP, R1, S1)
 * Note: DeMark method only defines R1 and S1, no extended levels.
 */
export interface DemarkPivotPointsOutput {
  readonly type: 'demark';
  readonly pivotPoint: number;
  readonly resistance1: number;
  readonly support1: number;
}

/**
 * Union type for all Pivot Points output types
 */
export type PivotPointsOutput =
  | StandardPivotPointsOutput
  | FibonacciPivotPointsOutput
  | WoodiePivotPointsOutput
  | CamarillaPivotPointsOutput
  | DemarkPivotPointsOutput;

/** Fibonacci retracement level 1 - 38.2% */
const FIBONACCI_RETRACEMENT_LEVEL_1 = 0.382;

/** Fibonacci retracement level 2 - 61.8% (golden ratio) */
const FIBONACCI_RETRACEMENT_LEVEL_2 = 0.618;

/**
 * Calculate Standard Pivot Points.
 */
export function calculateStandardPivotPoints(
  high: number,
  low: number,
  close: number,
): StandardPivotPointsOutput {
  const pp = (high + low + close) / 3;
  const range = high - low;
  return {
    type: 'standard',
    pivotPoint: pp,
    resistance1: 2 * pp - low,
    resistance2: pp + range,
    resistance3: high + 2 * (pp - low),
    support1: 2 * pp - high,
    support2: pp - range,
    support3: low - 2 * (high - pp),
  };
}

/**
 * Calculate Fibonacci Pivot Points.
 */
export function calculateFibonacciPivotPoints(
  high: number,
  low: number,
  close: number,
): FibonacciPivotPointsOutput {
  const pp = (high + low + close) / 3;
  const range = high - low;
  return {
    type: 'fibonacci',
    pivotPoint: pp,
    resistance1: pp + FIBONACCI_RETRACEMENT_LEVEL_1 * range,
    resistance2: pp + FIBONACCI_RETRACEMENT_LEVEL_2 * range,
    resistance3: pp + range,
    support1: pp - FIBONACCI_RETRACEMENT_LEVEL_1 * range,
    support2: pp - FIBONACCI_RETRACEMENT_LEVEL_2 * range,
    support3: pp - range,
  };
}

/**
 * Calculate Woodie Pivot Points.
 * Note: Woodie method traditionally only defines R1/R2 and S1/S2.
 */
export function calculateWoodiePivotPoints(
  high: number,
  low: number,
  close: number,
): WoodiePivotPointsOutput {
  const pp = (high + low + 2 * close) / 4;
  const range = high - low;
  return {
    type: 'woodie',
    pivotPoint: pp,
    resistance1: 2 * pp - low,
    resistance2: pp + range,
    support1: 2 * pp - high,
    support2: pp - range,
  };
}

/**
 * Calculate Camarilla Pivot Points.
 *
 * Note: The original Camarilla method does not define a traditional pivot point.
 * Following common industry practice (TradingView, many trading platforms),
 * we use the closing price as the pivot point reference level.
 *
 * Camarilla defines 8 levels (R1-R4, S1-S4):
 * - R4/S4 are breakout levels (range × 1.1/2)
 * - R3/S3 are key reversal levels (range × 1.1/4)
 * - R2/S2 are secondary levels (range × 1.1/6)
 * - R1/S1 are minor levels (range × 1.1/12)
 */
export function calculateCamarillaPivotPoints(
  high: number,
  low: number,
  close: number,
): CamarillaPivotPointsOutput {
  const range = high - low;
  return {
    type: 'camarilla',
    pivotPoint: close, // Camarilla uses close as reference point
    resistance1: close + (range * 1.1) / 12,
    resistance2: close + (range * 1.1) / 6,
    resistance3: close + (range * 1.1) / 4,
    resistance4: close + (range * 1.1) / 2,
    support1: close - (range * 1.1) / 12,
    support2: close - (range * 1.1) / 6,
    support3: close - (range * 1.1) / 4,
    support4: close - (range * 1.1) / 2,
  };
}

/**
 * Calculate DeMark Pivot Points.
 * Note: DeMark method only defines PP, R1, and S1. No extended levels.
 */
export function calculateDemarkPivotPoints(
  high: number,
  low: number,
  close: number,
  open: number,
): DemarkPivotPointsOutput {
  let x: number;
  if (close < open) {
    x = high + 2 * low + close;
  } else if (close > open) {
    x = 2 * high + low + close;
  } else {
    x = high + low + 2 * close;
  }
  const pp = x / 4;

  return {
    type: 'demark',
    pivotPoint: pp,
    resistance1: x / 2 - low,
    support1: x / 2 - high,
  };
}
