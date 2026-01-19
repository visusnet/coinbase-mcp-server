/**
 * Chart pattern type
 */
export type ChartPatternType =
  | 'double_top'
  | 'double_bottom'
  | 'head_and_shoulders'
  | 'inverse_head_and_shoulders'
  | 'ascending_triangle'
  | 'descending_triangle'
  | 'bull_flag'
  | 'bear_flag'
  | 'cup_and_handle';

/**
 * Chart pattern direction
 */
export type PatternDirection = 'bullish' | 'bearish';

/**
 * Detected chart pattern
 */
export interface ChartPattern {
  readonly type: ChartPatternType;
  readonly direction: PatternDirection;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly confidence: 'low' | 'medium' | 'high';
  readonly priceTarget: number | null;
  readonly neckline: number | null;
}

/** Minimum pattern length in candles */
const MIN_PATTERN_LENGTH = 10;

/** Price tolerance for pattern matching (percentage) */
const PRICE_TOLERANCE = 0.02;

/** Minimum trend length before pattern */
const MIN_TREND_LENGTH = 5;

/**
 * Detect chart patterns in price data.
 */
export function detectChartPatterns(
  high: readonly number[],
  low: readonly number[],
  close: readonly number[],
  lookbackPeriod: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  const startIdx = Math.max(0, close.length - lookbackPeriod);

  // Find local peaks and troughs for pattern detection
  const peaks = findPeaks(high, 3);
  const troughs = findTroughs(low, 3);

  // Detect various patterns
  patterns.push(...detectDoubleTop(high, low, close, peaks, startIdx));
  patterns.push(...detectDoubleBottom(high, low, close, troughs, startIdx));
  patterns.push(
    ...detectHeadAndShoulders(high, low, close, peaks, troughs, startIdx),
  );
  patterns.push(
    ...detectInverseHeadAndShoulders(
      high,
      low,
      close,
      peaks,
      troughs,
      startIdx,
    ),
  );
  patterns.push(
    ...detectAscendingTriangle(high, low, close, peaks, troughs, startIdx),
  );
  patterns.push(
    ...detectDescendingTriangle(high, low, close, peaks, troughs, startIdx),
  );
  patterns.push(...detectBullFlag(high, low, close, startIdx));
  patterns.push(...detectBearFlag(high, low, close, startIdx));
  patterns.push(
    ...detectCupAndHandle(high, low, close, peaks, troughs, startIdx),
  );

  // Sort by end index (most recent first)
  return patterns.sort((a, b) => b.endIndex - a.endIndex);
}

/**
 * Find local peaks in price data.
 */
function findPeaks(data: readonly number[], lookback: number): number[] {
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
 * Find local troughs in price data.
 */
function findTroughs(data: readonly number[], lookback: number): number[] {
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
 * Check if two prices are approximately equal within tolerance.
 */
function pricesEqual(
  price1: number,
  price2: number,
  tolerance: number = PRICE_TOLERANCE,
): boolean {
  return Math.abs(price1 - price2) / Math.max(price1, price2) <= tolerance;
}

/**
 * Detect Double Top pattern (bearish reversal).
 */
function detectDoubleTop(
  high: readonly number[],
  _low: readonly number[],
  close: readonly number[],
  peaks: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  for (let i = 0; i < peaks.length - 1; i++) {
    const firstPeak = peaks[i];
    const secondPeak = peaks[i + 1];

    if (firstPeak < startIdx) {
      continue;
    }
    if (secondPeak - firstPeak < MIN_PATTERN_LENGTH) {
      continue;
    }

    const firstHigh = high[firstPeak];
    const secondHigh = high[secondPeak];

    // Two peaks at similar levels
    if (pricesEqual(firstHigh, secondHigh)) {
      // Find the trough between peaks
      let troughPrice = close[firstPeak];
      for (let j = firstPeak + 1; j < secondPeak; j++) {
        if (close[j] < troughPrice) {
          troughPrice = close[j];
        }
      }

      const neckline = troughPrice;
      const patternHeight = Math.max(firstHigh, secondHigh) - neckline;
      const priceTarget = neckline - patternHeight;

      // Confidence based on pattern clarity
      const peakDiff = Math.abs(firstHigh - secondHigh) / firstHigh;
      const confidence =
        peakDiff < 0.01 ? 'high' : peakDiff < 0.02 ? 'medium' : 'low';

      patterns.push({
        type: 'double_top',
        direction: 'bearish',
        startIndex: firstPeak,
        endIndex: secondPeak,
        confidence,
        priceTarget,
        neckline,
      });
    }
  }

  return patterns;
}

/**
 * Detect Double Bottom pattern (bullish reversal).
 */
function detectDoubleBottom(
  _high: readonly number[],
  low: readonly number[],
  close: readonly number[],
  troughs: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  for (let i = 0; i < troughs.length - 1; i++) {
    const firstTrough = troughs[i];
    const secondTrough = troughs[i + 1];

    if (firstTrough < startIdx) {
      continue;
    }
    if (secondTrough - firstTrough < MIN_PATTERN_LENGTH) {
      continue;
    }

    const firstLow = low[firstTrough];
    const secondLow = low[secondTrough];

    // Two troughs at similar levels
    if (pricesEqual(firstLow, secondLow)) {
      // Find the peak between troughs
      let peakPrice = close[firstTrough];
      for (let j = firstTrough + 1; j < secondTrough; j++) {
        if (close[j] > peakPrice) {
          peakPrice = close[j];
        }
      }

      const neckline = peakPrice;
      const patternHeight = neckline - Math.min(firstLow, secondLow);
      const priceTarget = neckline + patternHeight;

      const troughDiff = Math.abs(firstLow - secondLow) / firstLow;
      const confidence =
        troughDiff < 0.01 ? 'high' : troughDiff < 0.02 ? 'medium' : 'low';

      patterns.push({
        type: 'double_bottom',
        direction: 'bullish',
        startIndex: firstTrough,
        endIndex: secondTrough,
        confidence,
        priceTarget,
        neckline,
      });
    }
  }

  return patterns;
}

/**
 * Detect Head and Shoulders pattern (bearish reversal).
 */
function detectHeadAndShoulders(
  high: readonly number[],
  low: readonly number[],
  _close: readonly number[],
  peaks: readonly number[],
  troughs: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  for (let i = 0; i < peaks.length - 2; i++) {
    const leftShoulder = peaks[i];
    const head = peaks[i + 1];
    const rightShoulder = peaks[i + 2];

    if (leftShoulder < startIdx) {
      continue;
    }
    if (rightShoulder - leftShoulder < MIN_PATTERN_LENGTH) {
      continue;
    }

    const leftShoulderHigh = high[leftShoulder];
    const headHigh = high[head];
    const rightShoulderHigh = high[rightShoulder];

    // Head must be higher than both shoulders
    if (headHigh <= leftShoulderHigh || headHigh <= rightShoulderHigh) {
      continue;
    }

    // Shoulders should be at similar levels
    if (!pricesEqual(leftShoulderHigh, rightShoulderHigh, 0.03)) {
      continue;
    }

    // Find neckline (connect the troughs)
    const troughsBetween = troughs.filter(
      (t) => t > leftShoulder && t < rightShoulder,
    );
    if (troughsBetween.length < 2) {
      continue;
    }

    const neckline =
      (low[troughsBetween[0]] +
        low[troughsBetween[troughsBetween.length - 1]]) /
      2;
    const patternHeight = headHigh - neckline;
    const priceTarget = neckline - patternHeight;

    const shoulderDiff =
      Math.abs(leftShoulderHigh - rightShoulderHigh) / leftShoulderHigh;
    const confidence =
      shoulderDiff < 0.015 ? 'high' : shoulderDiff < 0.025 ? 'medium' : 'low';

    patterns.push({
      type: 'head_and_shoulders',
      direction: 'bearish',
      startIndex: leftShoulder,
      endIndex: rightShoulder,
      confidence,
      priceTarget,
      neckline,
    });
  }

  return patterns;
}

/**
 * Detect Inverse Head and Shoulders pattern (bullish reversal).
 */
function detectInverseHeadAndShoulders(
  high: readonly number[],
  low: readonly number[],
  _close: readonly number[],
  peaks: readonly number[],
  troughs: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  for (let i = 0; i < troughs.length - 2; i++) {
    const leftShoulder = troughs[i];
    const head = troughs[i + 1];
    const rightShoulder = troughs[i + 2];

    if (leftShoulder < startIdx) {
      continue;
    }
    if (rightShoulder - leftShoulder < MIN_PATTERN_LENGTH) {
      continue;
    }

    const leftShoulderLow = low[leftShoulder];
    const headLow = low[head];
    const rightShoulderLow = low[rightShoulder];

    // Head must be lower than both shoulders
    if (headLow >= leftShoulderLow || headLow >= rightShoulderLow) {
      continue;
    }

    // Shoulders should be at similar levels
    if (!pricesEqual(leftShoulderLow, rightShoulderLow, 0.03)) {
      continue;
    }

    // Find neckline (connect the peaks)
    const peaksBetween = peaks.filter(
      (p) => p > leftShoulder && p < rightShoulder,
    );
    if (peaksBetween.length < 2) {
      continue;
    }

    const neckline =
      (high[peaksBetween[0]] + high[peaksBetween[peaksBetween.length - 1]]) / 2;
    const patternHeight = neckline - headLow;
    const priceTarget = neckline + patternHeight;

    const shoulderDiff =
      Math.abs(leftShoulderLow - rightShoulderLow) / leftShoulderLow;
    const confidence =
      shoulderDiff < 0.015 ? 'high' : shoulderDiff < 0.025 ? 'medium' : 'low';

    patterns.push({
      type: 'inverse_head_and_shoulders',
      direction: 'bullish',
      startIndex: leftShoulder,
      endIndex: rightShoulder,
      confidence,
      priceTarget,
      neckline,
    });
  }

  return patterns;
}

/**
 * Detect Ascending Triangle pattern (bullish).
 */
function detectAscendingTriangle(
  high: readonly number[],
  low: readonly number[],
  _close: readonly number[],
  peaks: readonly number[],
  troughs: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  // Need at least 2 peaks and 2 troughs
  const recentPeaks = peaks.filter((p) => p >= startIdx);
  const recentTroughs = troughs.filter((t) => t >= startIdx);

  if (recentPeaks.length < 2 || recentTroughs.length < 2) {
    return patterns;
  }

  // Check for flat resistance (similar highs)
  const peakHighs = recentPeaks.map((p) => high[p]);
  const avgHigh = peakHighs.reduce((a, b) => a + b, 0) / peakHighs.length;
  const flatResistance = peakHighs.every((h) => pricesEqual(h, avgHigh, 0.015));

  // Check for rising support (higher lows)
  const troughLows = recentTroughs.map((t) => low[t]);
  const risingSupport = troughLows.every(
    (l, i) => i === 0 || l >= troughLows[i - 1] * 0.99,
  );

  if (flatResistance && risingSupport && recentTroughs.length >= 2) {
    const startIndex = Math.min(recentPeaks[0], recentTroughs[0]);
    const endIndex = Math.max(
      recentPeaks[recentPeaks.length - 1],
      recentTroughs[recentTroughs.length - 1],
    );

    const resistance = avgHigh;
    const patternHeight = resistance - troughLows[0];
    const priceTarget = resistance + patternHeight;

    patterns.push({
      type: 'ascending_triangle',
      direction: 'bullish',
      startIndex,
      endIndex,
      confidence: 'medium',
      priceTarget,
      neckline: resistance,
    });
  }

  return patterns;
}

/**
 * Detect Descending Triangle pattern (bearish).
 */
function detectDescendingTriangle(
  high: readonly number[],
  low: readonly number[],
  _close: readonly number[],
  peaks: readonly number[],
  troughs: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  const recentPeaks = peaks.filter((p) => p >= startIdx);
  const recentTroughs = troughs.filter((t) => t >= startIdx);

  if (recentPeaks.length < 2 || recentTroughs.length < 2) {
    return patterns;
  }

  // Check for flat support (similar lows)
  const troughLows = recentTroughs.map((t) => low[t]);
  const avgLow = troughLows.reduce((a, b) => a + b, 0) / troughLows.length;
  const flatSupport = troughLows.every((l) => pricesEqual(l, avgLow, 0.015));

  // Check for falling resistance (lower highs)
  const peakHighs = recentPeaks.map((p) => high[p]);
  const fallingResistance = peakHighs.every(
    (h, i) => i === 0 || h <= peakHighs[i - 1] * 1.01,
  );

  if (flatSupport && fallingResistance && recentPeaks.length >= 2) {
    const startIndex = Math.min(recentPeaks[0], recentTroughs[0]);
    const endIndex = Math.max(
      recentPeaks[recentPeaks.length - 1],
      recentTroughs[recentTroughs.length - 1],
    );

    const support = avgLow;
    const patternHeight = peakHighs[0] - support;
    const priceTarget = support - patternHeight;

    patterns.push({
      type: 'descending_triangle',
      direction: 'bearish',
      startIndex,
      endIndex,
      confidence: 'medium',
      priceTarget,
      neckline: support,
    });
  }

  return patterns;
}

/**
 * Find the actual start of an uptrend (swing low) by looking backward.
 * Returns the index of the swing low that initiated the rally.
 */
function findUptrendStart(
  close: readonly number[],
  low: readonly number[],
  endIdx: number,
  minLookback: number,
): number {
  // Start from endIdx and look backward to find the swing low
  let lowestIdx = endIdx;
  let lowestPrice = low[endIdx];

  // Look backward up to a reasonable distance (max 50 candles or available data)
  const maxLookback = Math.min(50, endIdx);

  for (let i = endIdx; i >= endIdx - maxLookback && i >= 0; i--) {
    // Track the lowest point
    if (low[i] < lowestPrice) {
      lowestPrice = low[i];
      lowestIdx = i;
    }

    // Check if we've found a significant swing low
    // (price rose at least 2% from the low before dropping again)
    const distanceFromLow = endIdx - lowestIdx;
    if (distanceFromLow >= minLookback) {
      const gain = (close[endIdx] - lowestPrice) / lowestPrice;
      if (gain >= 0.05) {
        // Found a valid swing low with 5%+ gain
        return lowestIdx;
      }
    }
  }

  // Fallback to the lowest point found
  return lowestIdx;
}

/**
 * Find the actual start of a downtrend (swing high) by looking backward.
 * Returns the index of the swing high that initiated the decline.
 */
function findDowntrendStart(
  close: readonly number[],
  high: readonly number[],
  endIdx: number,
  minLookback: number,
): number {
  // Start from endIdx and look backward to find the swing high
  let highestIdx = endIdx;
  let highestPrice = high[endIdx];

  // Look backward up to a reasonable distance (max 50 candles or available data)
  const maxLookback = Math.min(50, endIdx);

  for (let i = endIdx; i >= endIdx - maxLookback && i >= 0; i--) {
    // Track the highest point
    if (high[i] > highestPrice) {
      highestPrice = high[i];
      highestIdx = i;
    }

    // Check if we've found a significant swing high
    // (price dropped at least 2% from the high before rising again)
    const distanceFromHigh = endIdx - highestIdx;
    if (distanceFromHigh >= minLookback) {
      const loss = (highestPrice - close[endIdx]) / highestPrice;
      if (loss >= 0.05) {
        // Found a valid swing high with 5%+ loss
        return highestIdx;
      }
    }
  }

  // Fallback to the highest point found
  return highestIdx;
}

/**
 * Detect Bull Flag pattern (bullish continuation).
 */
function detectBullFlag(
  high: readonly number[],
  low: readonly number[],
  close: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  // Look for strong upward move followed by consolidation
  for (
    let i = startIdx + MIN_TREND_LENGTH;
    i < close.length - MIN_PATTERN_LENGTH;
    i++
  ) {
    // Find the actual start of the uptrend (swing low)
    const poleStart = findUptrendStart(close, low, i, MIN_TREND_LENGTH);
    const poleEnd = i;

    // Skip if pole start is before the analysis window
    if (poleStart < startIdx) {
      continue;
    }

    const poleGain = (close[poleEnd] - close[poleStart]) / close[poleStart];

    if (poleGain < 0.05) {
      continue;
    } // Need at least 5% gain

    // Check for consolidation (flag)
    const flagEnd = Math.min(i + MIN_PATTERN_LENGTH, close.length - 1);
    let maxFlag = high[i];
    let minFlag = low[i];

    for (let j = i; j <= flagEnd; j++) {
      maxFlag = Math.max(maxFlag, high[j]);
      minFlag = Math.min(minFlag, low[j]);
    }

    const flagRange = (maxFlag - minFlag) / close[i];
    const isConsolidating = flagRange < 0.05; // Flag should be tight

    // Check for slight downward drift (characteristic of bull flag)
    const flagDrift = (close[flagEnd] - close[i]) / close[i];
    const isDownwardDrift = flagDrift < 0 && flagDrift > -0.03;

    if (isConsolidating && isDownwardDrift) {
      const poleHeight = close[poleEnd] - close[poleStart];
      const priceTarget = close[flagEnd] + poleHeight;

      patterns.push({
        type: 'bull_flag',
        direction: 'bullish',
        startIndex: poleStart,
        endIndex: flagEnd,
        confidence: poleGain > 0.1 ? 'high' : 'medium',
        priceTarget,
        neckline: maxFlag,
      });
    }
  }

  return patterns;
}

/**
 * Detect Bear Flag pattern (bearish continuation).
 */
function detectBearFlag(
  high: readonly number[],
  low: readonly number[],
  close: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  // Look for strong downward move followed by consolidation
  for (
    let i = startIdx + MIN_TREND_LENGTH;
    i < close.length - MIN_PATTERN_LENGTH;
    i++
  ) {
    // Find the actual start of the downtrend (swing high)
    const poleStart = findDowntrendStart(close, high, i, MIN_TREND_LENGTH);
    const poleEnd = i;

    // Skip if pole start is before the analysis window
    if (poleStart < startIdx) {
      continue;
    }

    const poleLoss = (close[poleStart] - close[poleEnd]) / close[poleStart];

    if (poleLoss < 0.05) {
      continue;
    } // Need at least 5% loss

    // Check for consolidation (flag)
    const flagEnd = Math.min(i + MIN_PATTERN_LENGTH, close.length - 1);
    let maxFlag = high[i];
    let minFlag = low[i];

    for (let j = i; j <= flagEnd; j++) {
      maxFlag = Math.max(maxFlag, high[j]);
      minFlag = Math.min(minFlag, low[j]);
    }

    const flagRange = (maxFlag - minFlag) / close[i];
    const isConsolidating = flagRange < 0.05;

    // Check for slight upward drift (characteristic of bear flag)
    const flagDrift = (close[flagEnd] - close[i]) / close[i];
    const isUpwardDrift = flagDrift > 0 && flagDrift < 0.03;

    if (isConsolidating && isUpwardDrift) {
      const poleHeight = close[poleStart] - close[poleEnd];
      const priceTarget = close[flagEnd] - poleHeight;

      patterns.push({
        type: 'bear_flag',
        direction: 'bearish',
        startIndex: poleStart,
        endIndex: flagEnd,
        confidence: poleLoss > 0.1 ? 'high' : 'medium',
        priceTarget,
        neckline: minFlag,
      });
    }
  }

  return patterns;
}

/**
 * Detect Cup and Handle pattern (bullish continuation).
 * The pattern consists of:
 * 1. Left lip (initial peak)
 * 2. Cup formation (U-shaped decline and recovery)
 * 3. Handle (small pullback)
 * 4. Breakout above the resistance
 */
function detectCupAndHandle(
  high: readonly number[],
  low: readonly number[],
  close: readonly number[],
  peaks: readonly number[],
  troughs: readonly number[],
  startIdx: number,
): ChartPattern[] {
  const patterns: ChartPattern[] = [];

  // Need at least 2 peaks (left lip and right lip) and 1 trough (cup bottom)
  for (let i = 0; i < peaks.length - 1; i++) {
    const leftLip = peaks[i];
    const rightLip = peaks[i + 1];

    if (leftLip < startIdx) {
      continue;
    }

    // Find the lowest trough between the two peaks (cup bottom)
    const troughsBetween = troughs.filter((t) => t > leftLip && t < rightLip);
    if (troughsBetween.length === 0) {
      continue;
    }

    const cupBottom = troughsBetween.reduce(
      (minIdx, t) => (low[t] < low[minIdx] ? t : minIdx),
      troughsBetween[0],
    );

    const leftLipPrice = high[leftLip];
    const rightLipPrice = high[rightLip];
    const cupBottomPrice = low[cupBottom];

    // Cup depth should be 10-35% of the left lip price
    const cupDepth = (leftLipPrice - cupBottomPrice) / leftLipPrice;
    if (cupDepth < 0.1 || cupDepth > 0.35) {
      continue;
    }

    // Right lip should be within 3% of left lip (resistance level)
    if (!pricesEqual(leftLipPrice, rightLipPrice, 0.03)) {
      continue;
    }

    // Check for U-shape: cup bottom should be roughly in the middle
    const cupMidpoint = (leftLip + rightLip) / 2;
    const bottomDeviation =
      Math.abs(cupBottom - cupMidpoint) / (rightLip - leftLip);
    if (bottomDeviation > 0.3) {
      continue; // V-shaped or asymmetric
    }

    // Look for handle after right lip (small pullback)
    const handleStart = rightLip;
    const maxHandleLength = Math.min(
      (rightLip - leftLip) / 2,
      close.length - rightLip - 1,
    );

    if (maxHandleLength < 3) {
      continue;
    }

    // Find handle low (pullback)
    let handleLow = close[handleStart];
    let handleLowIdx = handleStart;
    const handleEnd = Math.min(
      handleStart + Math.floor(maxHandleLength),
      close.length - 1,
    );

    for (let j = handleStart; j <= handleEnd; j++) {
      if (low[j] < handleLow) {
        handleLow = low[j];
        handleLowIdx = j;
      }
    }

    // Handle should retrace 1/3 to 1/2 of cup height
    const handleRetracement =
      (rightLipPrice - handleLow) / (rightLipPrice - cupBottomPrice);
    if (handleRetracement < 0.1 || handleRetracement > 0.5) {
      continue;
    }

    // Handle should stay in upper half of cup
    const cupMidPrice = (leftLipPrice + cupBottomPrice) / 2;
    if (handleLow < cupMidPrice) {
      continue;
    }

    // Calculate price target (cup depth added to breakout)
    const cupHeight = leftLipPrice - cupBottomPrice;
    const priceTarget = leftLipPrice + cupHeight;

    // Confidence based on cup symmetry and handle quality
    const confidence =
      bottomDeviation < 0.15 && handleRetracement >= 0.2 ? 'high' : 'medium';

    patterns.push({
      type: 'cup_and_handle',
      direction: 'bullish',
      startIndex: leftLip,
      endIndex: handleLowIdx,
      confidence,
      priceTarget,
      neckline: leftLipPrice,
    });
  }

  return patterns;
}
