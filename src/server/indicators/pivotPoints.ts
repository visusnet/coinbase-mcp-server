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
 * Output for Pivot Points calculation
 */
export interface PivotPointsOutput {
  readonly type: PivotPointsType;
  readonly pivotPoint: number;
  readonly resistance1: number;
  readonly resistance2: number;
  readonly resistance3: number;
  readonly support1: number;
  readonly support2: number;
  readonly support3: number;
}

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
): PivotPointsOutput {
  const pp = (high + low + close) / 3;
  const range = high - low;
  return {
    type: 'standard' as PivotPointsType,
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
): PivotPointsOutput {
  const pp = (high + low + close) / 3;
  const range = high - low;
  return {
    type: 'fibonacci' as PivotPointsType,
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
 */
export function calculateWoodiePivotPoints(
  high: number,
  low: number,
  close: number,
): PivotPointsOutput {
  const pp = (high + low + 2 * close) / 4;
  const range = high - low;
  return {
    type: 'woodie' as PivotPointsType,
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
 * Calculate Camarilla Pivot Points.
 */
export function calculateCamarillaPivotPoints(
  high: number,
  low: number,
  close: number,
): PivotPointsOutput {
  const pp = (high + low + close) / 3;
  const range = high - low;
  return {
    type: 'camarilla' as PivotPointsType,
    pivotPoint: pp,
    resistance1: close + (range * 1.1) / 12,
    resistance2: close + (range * 1.1) / 6,
    resistance3: close + (range * 1.1) / 4,
    support1: close - (range * 1.1) / 12,
    support2: close - (range * 1.1) / 6,
    support3: close - (range * 1.1) / 4,
  };
}

/**
 * Calculate DeMark Pivot Points.
 * DeMark method only defines R1/S1. For R2/R3/S2/S3, we extend with
 * Standard pivot formulas using the DeMark pivot point.
 */
export function calculateDemarkPivotPoints(
  high: number,
  low: number,
  close: number,
  open: number,
): PivotPointsOutput {
  let x: number;
  if (close < open) {
    x = high + 2 * low + close;
  } else if (close > open) {
    x = 2 * high + low + close;
  } else {
    x = high + low + 2 * close;
  }
  const pp = x / 4;
  const range = high - low;

  // DeMark R1/S1
  const r1 = x / 2 - low;
  const s1 = x / 2 - high;

  // Extended levels using Standard formulas with DeMark pivot
  return {
    type: 'demark' as PivotPointsType,
    pivotPoint: pp,
    resistance1: r1,
    resistance2: pp + range, // Standard R2 formula
    resistance3: high + 2 * (pp - low), // Standard R3 formula
    support1: s1,
    support2: pp - range, // Standard S2 formula
    support3: low - 2 * (high - pp), // Standard S3 formula
  };
}
