import { describe, it, expect } from '@jest/globals';
import { detectSwingPoints } from './swingPoints';

describe('swingPoints (Williams Fractal)', () => {
  describe('detectSwingPoints', () => {
    it('should detect swing high with default lookback (5-bar pattern)', () => {
      // Pattern: lower highs around a peak
      const highs = [100, 102, 105, 102, 100];
      const lows = [98, 100, 103, 100, 98];

      const result = detectSwingPoints(highs, lows);

      expect(result.swingHighs).toHaveLength(1);
      expect(result.swingHighs[0].index).toBe(2);
      expect(result.swingHighs[0].price).toBe(105);
      expect(result.swingHighs[0].type).toBe('high');
    });

    it('should detect swing low with default lookback (5-bar pattern)', () => {
      // Pattern: higher lows around a trough
      const highs = [105, 103, 100, 103, 105];
      const lows = [103, 101, 98, 101, 103];

      const result = detectSwingPoints(highs, lows);

      expect(result.swingLows).toHaveLength(1);
      expect(result.swingLows[0].index).toBe(2);
      expect(result.swingLows[0].price).toBe(98);
      expect(result.swingLows[0].type).toBe('low');
    });

    it('should detect multiple swing highs and lows', () => {
      // Oscillating pattern with multiple swings
      const highs = [100, 105, 110, 105, 100, 95, 100, 105, 110, 105, 100];
      const lows = [95, 100, 105, 100, 95, 90, 95, 100, 105, 100, 95];

      const result = detectSwingPoints(highs, lows);

      expect(result.swingHighs.length).toBeGreaterThan(0);
      expect(result.swingLows.length).toBeGreaterThan(0);
    });

    it('should detect swing points with custom lookback', () => {
      // 3-bar pattern (lookback=1)
      const highs = [100, 105, 100];
      const lows = [98, 103, 98];

      const result = detectSwingPoints(highs, lows, 1);

      expect(result.swingHighs).toHaveLength(1);
      expect(result.swingHighs[0].index).toBe(1);
    });

    it('should return empty arrays when no swings found', () => {
      // Monotonically increasing - no swing highs possible
      const highs = [100, 101, 102, 103, 104];
      const lows = [98, 99, 100, 101, 102];

      const result = detectSwingPoints(highs, lows);

      expect(result.swingHighs).toHaveLength(0);
      expect(result.swingLows).toHaveLength(0);
    });

    it('should return sideways trend when no swing points detected', () => {
      const highs = [100, 101, 102, 103, 104];
      const lows = [98, 99, 100, 101, 102];

      const result = detectSwingPoints(highs, lows);

      expect(result.trend).toBe('sideways');
      expect(result.latestSwingHigh).toBeNull();
      expect(result.latestSwingLow).toBeNull();
    });

    it('should identify uptrend when latest swing low is before latest swing high', () => {
      // Uptrend: low formed first, then price rallied to form high
      const highs = [100, 95, 90, 95, 100, 105, 110, 105, 100];
      const lows = [95, 90, 85, 90, 95, 100, 105, 100, 95];

      const result = detectSwingPoints(highs, lows);

      // Swing low at index 2, swing high at index 6
      expect(result.trend).toBe('uptrend');
      expect(result.latestSwingLow?.index).toBeLessThan(
        result.latestSwingHigh?.index ?? 0,
      );
    });

    it('should identify downtrend when latest swing high is before latest swing low', () => {
      // Downtrend: high formed first, then price declined to form low
      const highs = [100, 105, 110, 105, 100, 95, 90, 95, 100];
      const lows = [95, 100, 105, 100, 95, 90, 85, 90, 95];

      const result = detectSwingPoints(highs, lows);

      // Swing high at index 2, swing low at index 6
      expect(result.trend).toBe('downtrend');
      expect(result.latestSwingHigh?.index).toBeLessThan(
        result.latestSwingLow?.index ?? 0,
      );
    });

    it('should handle minimum candle count for default lookback', () => {
      // Exactly 5 candles (minimum for lookback=2) with swing high
      const highs = [100, 102, 105, 102, 100];
      const lows = [98, 100, 103, 100, 98];

      const result = detectSwingPoints(highs, lows);

      // Should find the swing high at index 2
      // Note: This data only produces a swing high, not a swing low
      // (lows rise toward the center: 98, 100, 103 - not a trough pattern)
      expect(result.swingHighs).toHaveLength(1);
      expect(result.swingHighs[0].index).toBe(2);
    });

    it('should handle edge case with all equal prices', () => {
      const highs = [100, 100, 100, 100, 100];
      const lows = [95, 95, 95, 95, 95];

      const result = detectSwingPoints(highs, lows);

      // No swings when all prices are equal (strict inequality required)
      expect(result.swingHighs).toHaveLength(0);
      expect(result.swingLows).toHaveLength(0);
      expect(result.trend).toBe('sideways');
    });

    it('should require strict inequality for swing detection', () => {
      // Peak equal to neighbor - should NOT be detected as swing
      const highs = [100, 105, 105, 105, 100];
      const lows = [98, 103, 103, 103, 98];

      const result = detectSwingPoints(highs, lows);

      // Index 2 has high=105, but neighbors also have 105
      // Strict inequality means this is NOT a swing high
      expect(result.swingHighs).toHaveLength(0);
    });
  });

  /**
   * Integration tests with realistic market data patterns.
   * These simulate real-world price action that traders encounter.
   */
  describe('realistic market scenarios', () => {
    it('should detect swing points in typical BTC uptrend', () => {
      // Realistic BTC/USD price action: higher highs and higher lows
      const highs = [
        42000,
        42500,
        43000,
        42800,
        42200, // Rally and pullback
        42500,
        43200,
        43800,
        43500,
        43000, // Higher high
        43300,
        44000,
        44500,
        44200,
        43800, // Another higher high
      ];
      const lows = [
        41000,
        41500,
        42000,
        41800,
        41200, // First low
        41500,
        42200,
        42800,
        42500,
        42000, // Higher low
        42300,
        43000,
        43500,
        43200,
        42800, // Even higher low
      ];

      const result = detectSwingPoints(highs, lows);

      // Should find swing points in this trending data
      expect(result.swingHighs.length).toBeGreaterThan(0);
      expect(result.swingLows.length).toBeGreaterThan(0);

      // Verify structure of returned swing points
      result.swingHighs.forEach((sp) => {
        expect(sp).toHaveProperty('index');
        expect(sp).toHaveProperty('price');
        expect(sp.type).toBe('high');
        expect(typeof sp.price).toBe('number');
      });
    });

    it('should detect swing points in volatile crypto crash', () => {
      // Sharp decline with bounces - common in crypto
      const highs = [
        60000,
        58000,
        55000,
        57000,
        54000, // Initial crash with dead cat bounce
        52000,
        50000,
        53000,
        49000,
        48000, // Continued decline
        50000,
        52000,
        51000,
        49000,
        47000, // Another bounce then lower
      ];
      const lows = [
        58000, 55000, 52000, 54000, 51000, 49000, 47000, 50000, 46000, 45000,
        47000, 49000, 48000, 46000, 44000,
      ];

      const result = detectSwingPoints(highs, lows);

      // Verify algorithm handles volatile data
      expect(Array.isArray(result.swingHighs)).toBe(true);
      expect(Array.isArray(result.swingLows)).toBe(true);
      expect(['uptrend', 'downtrend', 'sideways']).toContain(result.trend);
    });

    it('should identify key support/resistance levels from swing points', () => {
      // Range-bound market with clear support and resistance
      const highs = [
        100,
        102,
        105,
        103,
        100, // First test of resistance at 105
        98,
        100,
        104,
        101,
        98, // Retest
        96,
        99,
        105,
        102,
        99, // Another test of 105
      ];
      const lows = [
        95,
        97,
        100,
        98,
        95, // First test of support at 95
        93,
        95,
        99,
        96,
        93, // Retest of support area
        91,
        94,
        100,
        97,
        94,
      ];

      const result = detectSwingPoints(highs, lows);

      // Swing highs should cluster around resistance (105)
      // Swing lows should cluster around support (93-95)
      expect(result.swingHighs.length).toBeGreaterThan(0);
      const highPrices = result.swingHighs.map((sp) => sp.price);
      expect(Math.max(...highPrices)).toBeGreaterThanOrEqual(104);
    });
  });

  describe('response structure validation', () => {
    it('should return correct response structure', () => {
      const highs = [100, 105, 110, 105, 100, 95, 90, 95, 100];
      const lows = [95, 100, 105, 100, 95, 90, 85, 90, 95];

      const result = detectSwingPoints(highs, lows);

      // Verify all required fields are present
      expect(result).toHaveProperty('swingHighs');
      expect(result).toHaveProperty('swingLows');
      expect(result).toHaveProperty('latestSwingHigh');
      expect(result).toHaveProperty('latestSwingLow');
      expect(result).toHaveProperty('trend');

      // Verify types
      expect(Array.isArray(result.swingHighs)).toBe(true);
      expect(Array.isArray(result.swingLows)).toBe(true);
      expect(['uptrend', 'downtrend', 'sideways']).toContain(result.trend);
    });

    it('should set latestSwingHigh to last element of swingHighs array', () => {
      const highs = [100, 105, 100, 95, 100, 106, 100];
      const lows = [95, 100, 95, 90, 95, 101, 95];

      const result = detectSwingPoints(highs, lows, 1);

      expect(result.swingHighs.length).toBeGreaterThan(0);
      expect(result.latestSwingHigh).toEqual(
        result.swingHighs[result.swingHighs.length - 1],
      );
    });

    it('should set latestSwingLow to last element of swingLows array', () => {
      const highs = [105, 100, 105, 110, 105, 99, 105];
      const lows = [100, 95, 100, 105, 100, 94, 100];

      const result = detectSwingPoints(highs, lows, 1);

      expect(result.swingLows.length).toBeGreaterThan(0);
      expect(result.latestSwingLow).toEqual(
        result.swingLows[result.swingLows.length - 1],
      );
    });

    it('should return sideways when swing high and swing low have equal indices', () => {
      // This pattern creates a swing high AND swing low at the same index (middle candle)
      // The middle candle has the highest high AND the lowest low
      const highs = [100, 110, 100]; // Middle high (110) is highest
      const lows = [95, 85, 90]; // Middle low (85) is lowest

      const result = detectSwingPoints(highs, lows, 1);

      // Both swing high and swing low should be at index 1
      expect(result.swingHighs).toHaveLength(1);
      expect(result.swingLows).toHaveLength(1);
      expect(result.swingHighs[0].index).toBe(1);
      expect(result.swingLows[0].index).toBe(1);
      // When indices are equal, trend should be sideways
      expect(result.trend).toBe('sideways');
    });
  });
});
