/**
 * Swing point type - high or low
 */
export type SwingPointType = 'high' | 'low';

/**
 * Single swing point (Williams Fractal)
 */
export interface SwingPoint {
  readonly index: number;
  readonly price: number;
  readonly type: SwingPointType;
}

/**
 * Trend direction based on swing points
 */
export type SwingTrend = 'uptrend' | 'downtrend' | 'sideways';

/**
 * Default lookback period for Williams Fractal (2 bars each side = 5-bar pattern)
 */
const DEFAULT_LOOKBACK = 2;

/**
 * Detect swing points using Williams Fractal method.
 *
 * Williams Fractal Definition:
 * - Swing High: A bar where the high is higher than the highs of
 *   `lookback` bars before AND `lookback` bars after
 * - Swing Low: A bar where the low is lower than the lows of
 *   `lookback` bars before AND `lookback` bars after
 *
 * Industry standard uses lookback=2 (5-bar pattern).
 *
 * @param highs - Array of high prices (oldest first, index 0 = oldest)
 * @param lows - Array of low prices (oldest first, index 0 = oldest)
 * @param lookback - Number of bars on each side to compare (default: 2)
 * @returns Detected swing points with trend analysis
 */
export function detectSwingPoints(
  highs: readonly number[],
  lows: readonly number[],
  lookback: number = DEFAULT_LOOKBACK,
) {
  const swingHighs = findSwingHighs(highs, lookback);
  const swingLows = findSwingLows(lows, lookback);

  const latestSwingHigh =
    swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : null;
  const latestSwingLow =
    swingLows.length > 0 ? swingLows[swingLows.length - 1] : null;

  const trend = determineTrend(latestSwingHigh, latestSwingLow);

  return {
    swingHighs,
    swingLows,
    latestSwingHigh,
    latestSwingLow,
    trend,
  };
}

/**
 * Find swing highs (Williams Fractal Up).
 *
 * A swing high occurs when a bar's high is strictly higher than
 * the highs of `lookback` bars before AND after it.
 */
function findSwingHighs(
  highs: readonly number[],
  lookback: number,
): SwingPoint[] {
  const swingPoints: SwingPoint[] = [];

  for (let i = lookback; i < highs.length - lookback; i++) {
    if (isSwingHigh(highs, i, lookback)) {
      swingPoints.push({
        index: i,
        price: highs[i],
        type: 'high',
      });
    }
  }

  return swingPoints;
}

/**
 * Find swing lows (Williams Fractal Down).
 *
 * A swing low occurs when a bar's low is strictly lower than
 * the lows of `lookback` bars before AND after it.
 */
function findSwingLows(
  lows: readonly number[],
  lookback: number,
): SwingPoint[] {
  const swingPoints: SwingPoint[] = [];

  for (let i = lookback; i < lows.length - lookback; i++) {
    if (isSwingLow(lows, i, lookback)) {
      swingPoints.push({
        index: i,
        price: lows[i],
        type: 'low',
      });
    }
  }

  return swingPoints;
}

/**
 * Check if bar at index is a swing high.
 */
function isSwingHigh(
  highs: readonly number[],
  index: number,
  lookback: number,
): boolean {
  const currentHigh = highs[index];

  for (let j = 1; j <= lookback; j++) {
    if (currentHigh <= highs[index - j] || currentHigh <= highs[index + j]) {
      return false;
    }
  }

  return true;
}

/**
 * Check if bar at index is a swing low.
 */
function isSwingLow(
  lows: readonly number[],
  index: number,
  lookback: number,
): boolean {
  const currentLow = lows[index];

  for (let j = 1; j <= lookback; j++) {
    if (currentLow >= lows[index - j] || currentLow >= lows[index + j]) {
      return false;
    }
  }

  return true;
}

/**
 * Determine trend based on which swing point occurred more recently.
 *
 * - Uptrend: Latest swing low occurred before latest swing high
 *   (price made a low, then rallied to make a high)
 * - Downtrend: Latest swing high occurred before latest swing low
 *   (price made a high, then declined to make a low)
 * - Sideways: Cannot determine (no swing points or equal indices)
 */
function determineTrend(
  latestSwingHigh: SwingPoint | null,
  latestSwingLow: SwingPoint | null,
): SwingTrend {
  if (!latestSwingHigh || !latestSwingLow) {
    return 'sideways';
  }

  if (latestSwingHigh.index > latestSwingLow.index) {
    return 'uptrend';
  } else if (latestSwingLow.index > latestSwingHigh.index) {
    return 'downtrend';
  }

  return 'sideways';
}
