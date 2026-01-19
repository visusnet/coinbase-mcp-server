import { RSI } from '@thuantan2060/technicalindicators';

/** Minimum candles between peaks/troughs for valid divergence */
const MIN_DISTANCE = 3;

/**
 * RSI Divergence type
 */
export type RsiDivergenceType =
  | 'bullish'
  | 'bearish'
  | 'hidden_bullish'
  | 'hidden_bearish';

/**
 * Single RSI Divergence occurrence
 */
export interface RsiDivergence {
  readonly type: RsiDivergenceType;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly priceStart: number;
  readonly priceEnd: number;
  readonly rsiStart: number;
  readonly rsiEnd: number;
  readonly strength: 'weak' | 'medium' | 'strong';
}

/**
 * Calculate RSI values from close prices.
 */
export function calculateRsiValues(
  closePrices: readonly number[],
  period: number,
): number[] {
  return RSI.calculate({
    period,
    values: [...closePrices],
  });
}

/**
 * Find local peaks (highs) in a data series.
 */
export function findLocalPeaks(
  data: readonly number[],
  lookback: number,
): number[] {
  const peaks: number[] = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    let isPeak = true;
    for (let j = 1; j <= lookback; j++) {
      if (data[i] <= data[i - j] || data[i] <= data[i + j]) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) {
      peaks.push(i);
    }
  }
  return peaks;
}

/**
 * Find local troughs (lows) in a data series.
 */
export function findLocalTroughs(
  data: readonly number[],
  lookback: number,
): number[] {
  const troughs: number[] = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    let isTrough = true;
    for (let j = 1; j <= lookback; j++) {
      if (data[i] >= data[i - j] || data[i] >= data[i + j]) {
        isTrough = false;
        break;
      }
    }
    if (isTrough) {
      troughs.push(i);
    }
  }
  return troughs;
}

/**
 * Detect all divergences of a specific type.
 */
export function detectDivergences(
  type: RsiDivergenceType,
  priceExtrema: readonly number[],
  prices: readonly number[],
  rsiValues: readonly number[],
  rsiOffset: number,
): RsiDivergence[] {
  const divergences: RsiDivergence[] = [];

  for (let i = 0; i < priceExtrema.length - 1; i++) {
    for (let j = i + 1; j < priceExtrema.length; j++) {
      const startIdx = priceExtrema[i];
      const endIdx = priceExtrema[j];

      if (endIdx - startIdx < MIN_DISTANCE) {
        continue;
      }

      const rsiStartIdx = startIdx - rsiOffset;
      const rsiEndIdx = endIdx - rsiOffset;

      if (
        rsiStartIdx < 0 ||
        rsiEndIdx < 0 ||
        rsiStartIdx >= rsiValues.length ||
        rsiEndIdx >= rsiValues.length
      ) {
        continue;
      }

      const priceStart = prices[startIdx];
      const priceEnd = prices[endIdx];
      const rsiStart = rsiValues[rsiStartIdx];
      const rsiEnd = rsiValues[rsiEndIdx];

      if (isDivergence(type, priceStart, priceEnd, rsiStart, rsiEnd)) {
        divergences.push({
          type,
          startIndex: startIdx,
          endIndex: endIdx,
          priceStart,
          priceEnd,
          rsiStart,
          rsiEnd,
          strength: calculateStrength(priceStart, priceEnd, rsiStart, rsiEnd),
        });
      }
    }
  }

  return divergences;
}

/**
 * Check if price/RSI movement matches the divergence type.
 */
function isDivergence(
  type: RsiDivergenceType,
  priceStart: number,
  priceEnd: number,
  rsiStart: number,
  rsiEnd: number,
): boolean {
  switch (type) {
    case 'bearish':
      // Price higher high, RSI lower high
      return priceEnd > priceStart && rsiEnd < rsiStart;
    case 'bullish':
      // Price lower low, RSI higher low
      return priceEnd < priceStart && rsiEnd > rsiStart;
    case 'hidden_bearish':
      // Price lower high, RSI higher high
      return priceEnd < priceStart && rsiEnd > rsiStart;
    case 'hidden_bullish':
      // Price higher low, RSI lower low
      return priceEnd > priceStart && rsiEnd < rsiStart;
  }
}

/**
 * Calculate divergence strength based on price and RSI difference.
 */
function calculateStrength(
  priceStart: number,
  priceEnd: number,
  rsiStart: number,
  rsiEnd: number,
): 'weak' | 'medium' | 'strong' {
  const priceDiff = Math.abs(((priceEnd - priceStart) / priceStart) * 100);
  const rsiDiff = Math.abs(rsiEnd - rsiStart);

  if (priceDiff > 5 && rsiDiff > 10) {
    return 'strong';
  } else if (priceDiff > 2 && rsiDiff > 5) {
    return 'medium';
  }
  return 'weak';
}
