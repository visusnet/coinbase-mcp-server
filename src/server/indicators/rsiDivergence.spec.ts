import { describe, it, expect } from '@jest/globals';
import {
  calculateRsiValues,
  findLocalPeaks,
  findLocalTroughs,
  detectDivergences,
} from './rsiDivergence';

describe('rsiDivergence helpers', () => {
  describe('calculateRsiValues', () => {
    it('should calculate RSI values', () => {
      const closePrices = Array.from({ length: 20 }, (_, i) => 100 + i);
      const result = calculateRsiValues(closePrices, 14);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findLocalPeaks', () => {
    it('should find peaks in data', () => {
      const data = [100, 105, 110, 105, 100, 95, 100, 105, 100];
      const result = findLocalPeaks(data, 2);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty for monotonic data', () => {
      const data = [100, 101, 102, 103, 104, 105];
      const result = findLocalPeaks(data, 1);

      expect(result.length).toBe(0);
    });
  });

  describe('findLocalTroughs', () => {
    it('should find troughs in data', () => {
      const data = [100, 95, 90, 95, 100, 105, 100, 95, 100];
      const result = findLocalTroughs(data, 2);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('detectDivergences', () => {
    it('should skip extrema pairs that are too close (< MIN_DISTANCE)', () => {
      // Create extrema that are only 2 apart (less than MIN_DISTANCE of 3)
      const priceExtrema = [0, 2]; // Distance is 2
      const prices = [100, 98, 96, 94, 92];
      const rsiValues = [70, 68, 66, 64, 62];
      const rsiOffset = 0;

      const result = detectDivergences(
        'bullish',
        priceExtrema,
        prices,
        rsiValues,
        rsiOffset,
      );

      // Should return empty because extrema are too close
      expect(result.length).toBe(0);
    });

    it('should detect divergences when extrema are far enough apart', () => {
      // Create extrema that are 4 apart (>= MIN_DISTANCE of 3)
      const priceExtrema = [0, 4];
      // Bullish: price lower low, RSI higher low
      const prices = [100, 98, 96, 94, 90]; // Price going down
      const rsiValues = [30, 32, 34, 36, 40]; // RSI going up
      const rsiOffset = 0;

      const result = detectDivergences(
        'bullish',
        priceExtrema,
        prices,
        rsiValues,
        rsiOffset,
      );

      expect(result.length).toBe(1);
      expect(result[0].type).toBe('bullish');
    });

    it('should skip when RSI indices are out of bounds', () => {
      const priceExtrema = [0, 5];
      const prices = [100, 98, 96, 94, 92, 90];
      const rsiValues = [30, 32]; // Only 2 RSI values
      const rsiOffset = 10; // High offset makes indices negative or out of bounds

      const result = detectDivergences(
        'bullish',
        priceExtrema,
        prices,
        rsiValues,
        rsiOffset,
      );

      expect(result.length).toBe(0);
    });

    it('should detect bearish divergence', () => {
      const priceExtrema = [0, 4];
      // Bearish: price higher high, RSI lower high
      const prices = [100, 102, 104, 106, 110];
      const rsiValues = [70, 68, 66, 64, 60];
      const rsiOffset = 0;

      const result = detectDivergences(
        'bearish',
        priceExtrema,
        prices,
        rsiValues,
        rsiOffset,
      );

      expect(result.length).toBe(1);
      expect(result[0].type).toBe('bearish');
    });

    it('should detect hidden bullish divergence', () => {
      const priceExtrema = [0, 4];
      // Hidden bullish: price higher low, RSI lower low
      const prices = [100, 102, 104, 106, 110];
      const rsiValues = [40, 38, 36, 34, 30];
      const rsiOffset = 0;

      const result = detectDivergences(
        'hidden_bullish',
        priceExtrema,
        prices,
        rsiValues,
        rsiOffset,
      );

      expect(result.length).toBe(1);
      expect(result[0].type).toBe('hidden_bullish');
    });

    it('should detect hidden bearish divergence', () => {
      const priceExtrema = [0, 4];
      // Hidden bearish: price lower high, RSI higher high
      const prices = [110, 108, 106, 104, 100];
      const rsiValues = [60, 62, 64, 66, 70];
      const rsiOffset = 0;

      const result = detectDivergences(
        'hidden_bearish',
        priceExtrema,
        prices,
        rsiValues,
        rsiOffset,
      );

      expect(result.length).toBe(1);
      expect(result[0].type).toBe('hidden_bearish');
    });

    it('should calculate divergence strength as strong', () => {
      const priceExtrema = [0, 4];
      const prices = [100, 102, 104, 106, 120]; // >5% change
      const rsiValues = [70, 68, 66, 64, 55]; // >10 point change
      const rsiOffset = 0;

      const result = detectDivergences(
        'bearish',
        priceExtrema,
        prices,
        rsiValues,
        rsiOffset,
      );

      expect(result[0].strength).toBe('strong');
    });

    it('should calculate divergence strength as medium', () => {
      const priceExtrema = [0, 4];
      const prices = [100, 101, 102, 103, 104]; // ~4% change
      const rsiValues = [70, 69, 68, 67, 62]; // 8 point change
      const rsiOffset = 0;

      const result = detectDivergences(
        'bearish',
        priceExtrema,
        prices,
        rsiValues,
        rsiOffset,
      );

      expect(result[0].strength).toBe('medium');
    });
  });
});
