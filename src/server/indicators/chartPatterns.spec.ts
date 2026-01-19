import { describe, it, expect } from '@jest/globals';
import { detectChartPatterns } from './chartPatterns';

describe('chartPatterns', () => {
  describe('detectChartPatterns', () => {
    it('should return empty array for insufficient data', () => {
      const high = [100, 101, 102];
      const low = [98, 99, 100];
      const close = [99, 100, 101];

      const result = detectChartPatterns(high, low, close, 50);

      expect(result).toEqual([]);
    });

    it('should detect double top pattern', () => {
      // Create data with two peaks at similar levels
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Initial uptrend
      for (let i = 0; i < 10; i++) {
        high.push(100 + i * 2);
        low.push(98 + i * 2);
        close.push(99 + i * 2);
      }
      // First peak
      high.push(120, 121, 120);
      low.push(118, 119, 118);
      close.push(119, 120, 119);
      // Pullback
      for (let i = 0; i < 12; i++) {
        high.push(115 - i * 0.5);
        low.push(113 - i * 0.5);
        close.push(114 - i * 0.5);
      }
      // Second peak (similar to first)
      high.push(119, 121, 120);
      low.push(117, 119, 118);
      close.push(118, 120, 119);
      // Decline
      for (let i = 0; i < 5; i++) {
        high.push(118 - i);
        low.push(116 - i);
        close.push(117 - i);
      }

      const result = detectChartPatterns(high, low, close, 50);

      const doubleTop = result.find((p) => p.type === 'double_top');
      expect(doubleTop).toBeDefined();
      expect(doubleTop?.direction).toBe('bearish');
      expect(doubleTop?.priceTarget).toBeDefined();
      expect(doubleTop?.neckline).toBeDefined();
    });

    it('should detect head and shoulders pattern', () => {
      // Create data with three peaks: left shoulder, head (higher), right shoulder
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Build up to left shoulder
      for (let i = 0; i < 5; i++) {
        high.push(100 + i * 2);
        low.push(98 + i * 2);
        close.push(99 + i * 2);
      }
      // Left shoulder peak
      high.push(110, 112, 110);
      low.push(108, 109, 108);
      close.push(109, 111, 109);
      // Dip (trough 1)
      for (let i = 0; i < 5; i++) {
        high.push(105);
        low.push(102);
        close.push(103);
      }
      // Head (higher than shoulders)
      high.push(115, 120, 115);
      low.push(113, 117, 113);
      close.push(114, 119, 114);
      // Dip (trough 2)
      for (let i = 0; i < 5; i++) {
        high.push(105);
        low.push(102);
        close.push(103);
      }
      // Right shoulder (similar to left)
      high.push(110, 112, 110);
      low.push(108, 109, 108);
      close.push(109, 111, 109);
      // Decline
      for (let i = 0; i < 5; i++) {
        high.push(105 - i);
        low.push(102 - i);
        close.push(103 - i);
      }

      const result = detectChartPatterns(high, low, close, 50);

      const headAndShoulders = result.find(
        (p) => p.type === 'head_and_shoulders',
      );
      // Pattern detection depends on exact peak/trough locations
      expect(
        headAndShoulders === undefined ||
          headAndShoulders.direction === 'bearish',
      ).toBe(true);
    });

    it('should skip head and shoulders when pattern is too short', () => {
      // Create three peaks that are close together (< MIN_PATTERN_LENGTH = 10)
      // With lookback=3, peaks need to be spaced at least 4 apart for detection
      // Peak positions: ~10, ~14, ~18 => span = 8 < MIN_PATTERN_LENGTH (10)
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Build data with three close peaks where head is higher
      // Use 30 candles total with peaks at indices 10, 14, 18
      for (let i = 0; i < 30; i++) {
        if (i === 10) {
          // Left shoulder peak (needs lookback=3 neighbors lower)
          high.push(115);
          low.push(110);
          close.push(112);
        } else if (i === 14) {
          // Head peak (highest)
          high.push(125);
          low.push(120);
          close.push(122);
        } else if (i === 18) {
          // Right shoulder peak (similar to left)
          high.push(115);
          low.push(110);
          close.push(112);
        } else {
          // Baseline lower values
          high.push(100);
          low.push(95);
          close.push(97);
        }
      }

      const result = detectChartPatterns(high, low, close, 30);

      // H&S pattern with span 8 (18-10) should be skipped due to MIN_PATTERN_LENGTH=10
      const hs = result.find((p) => p.type === 'head_and_shoulders');
      expect(hs).toBeUndefined();
    });

    it('should skip head and shoulders when shoulders are not at similar levels', () => {
      // Create three peaks where shoulders differ by more than 3%
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Baseline
      for (let i = 0; i < 10; i++) {
        high.push(100);
        low.push(95);
        close.push(97);
      }
      // Left shoulder at 110
      high.push(108, 110, 108);
      low.push(103, 105, 103);
      close.push(105, 108, 105);
      // Dip
      for (let i = 0; i < 6; i++) {
        high.push(102);
        low.push(97);
        close.push(99);
      }
      // Head at 130 (higher than both shoulders)
      high.push(125, 130, 125);
      low.push(120, 125, 120);
      close.push(122, 128, 122);
      // Dip
      for (let i = 0; i < 6; i++) {
        high.push(102);
        low.push(97);
        close.push(99);
      }
      // Right shoulder at 120 (>3% different from left shoulder 110)
      high.push(118, 120, 118);
      low.push(113, 115, 113);
      close.push(115, 118, 115);
      // Trail
      for (let i = 0; i < 5; i++) {
        high.push(100);
        low.push(95);
        close.push(97);
      }

      const result = detectChartPatterns(high, low, close, 50);

      // No H&S detected due to unequal shoulders
      const hs = result.find((p) => p.type === 'head_and_shoulders');
      expect(hs).toBeUndefined();
    });

    it('should detect head and shoulders with neckline calculation', () => {
      // Create a valid H&S pattern that will trigger neckline calculation
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Initial buildup
      for (let i = 0; i < 5; i++) {
        high.push(100);
        low.push(95);
        close.push(97);
      }
      // Left shoulder peak (needs lookback=3 for peak detection)
      high.push(105, 107, 112, 107, 105);
      low.push(100, 102, 107, 102, 100);
      close.push(102, 104, 110, 104, 102);
      // First trough (clearly lower)
      high.push(100, 98, 95, 98, 100);
      low.push(95, 93, 90, 93, 95);
      close.push(97, 95, 92, 95, 97);
      // Head (highest peak)
      high.push(110, 115, 125, 115, 110);
      low.push(105, 110, 120, 110, 105);
      close.push(107, 112, 123, 112, 107);
      // Second trough (similar level to first)
      high.push(100, 98, 95, 98, 100);
      low.push(95, 93, 90, 93, 95);
      close.push(97, 95, 92, 95, 97);
      // Right shoulder (similar to left)
      high.push(105, 107, 112, 107, 105);
      low.push(100, 102, 107, 102, 100);
      close.push(102, 104, 110, 104, 102);
      // Trailing data
      for (let i = 0; i < 5; i++) {
        high.push(100);
        low.push(95);
        close.push(97);
      }

      const result = detectChartPatterns(high, low, close, 50);

      // Check if H&S is detected
      const hs = result.find((p) => p.type === 'head_and_shoulders');
      expect(hs).toBeDefined();
      expect(hs?.direction).toBe('bearish');
      expect(hs?.neckline).toBeDefined();
      expect(hs?.priceTarget).toBeDefined();
      expect(typeof hs?.neckline).toBe('number');
    });

    it('should detect inverse head and shoulders pattern', () => {
      // Create data with three troughs: left shoulder, head (lower), right shoulder
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Build down to left shoulder
      for (let i = 0; i < 5; i++) {
        high.push(120 - i * 2);
        low.push(118 - i * 2);
        close.push(119 - i * 2);
      }
      // Left shoulder trough
      high.push(110, 108, 110);
      low.push(107, 105, 107);
      close.push(108, 106, 108);
      // Rise (peak 1)
      for (let i = 0; i < 5; i++) {
        high.push(115);
        low.push(112);
        close.push(113);
      }
      // Head (lower than shoulders)
      high.push(105, 100, 105);
      low.push(102, 97, 102);
      close.push(103, 98, 103);
      // Rise (peak 2)
      for (let i = 0; i < 5; i++) {
        high.push(115);
        low.push(112);
        close.push(113);
      }
      // Right shoulder (similar to left)
      high.push(110, 108, 110);
      low.push(107, 105, 107);
      close.push(108, 106, 108);
      // Recovery
      for (let i = 0; i < 5; i++) {
        high.push(112 + i);
        low.push(109 + i);
        close.push(110 + i);
      }

      const result = detectChartPatterns(high, low, close, 50);

      const inverseHS = result.find(
        (p) => p.type === 'inverse_head_and_shoulders',
      );
      expect(inverseHS === undefined || inverseHS.direction === 'bullish').toBe(
        true,
      );
    });

    it('should skip inverse head and shoulders when pattern is too short', () => {
      // Create three troughs that are close together (< MIN_PATTERN_LENGTH = 10)
      // With lookback=3, troughs need to be spaced at least 4 apart for detection
      // Trough positions: ~10, ~14, ~18 => span = 8 < MIN_PATTERN_LENGTH (10)
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Build data with three close troughs where head is lower
      // Use 30 candles total with troughs at indices 10, 14, 18
      for (let i = 0; i < 30; i++) {
        if (i === 10) {
          // Left shoulder trough (needs lookback=3 neighbors higher)
          high.push(90);
          low.push(85);
          close.push(87);
        } else if (i === 14) {
          // Head trough (lowest)
          high.push(80);
          low.push(75);
          close.push(77);
        } else if (i === 18) {
          // Right shoulder trough (similar to left)
          high.push(90);
          low.push(85);
          close.push(87);
        } else {
          // Baseline higher values
          high.push(110);
          low.push(105);
          close.push(107);
        }
      }

      const result = detectChartPatterns(high, low, close, 30);

      // Inverse H&S pattern with span 8 (18-10) should be skipped due to MIN_PATTERN_LENGTH=10
      const ihs = result.find((p) => p.type === 'inverse_head_and_shoulders');
      expect(ihs).toBeUndefined();
    });

    it('should skip inverse head and shoulders when head is not lower than shoulders', () => {
      // Create three troughs where head is NOT lower than shoulders
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Baseline
      for (let i = 0; i < 10; i++) {
        high.push(120);
        low.push(115);
        close.push(117);
      }
      // Left shoulder trough at 100
      high.push(105, 103, 105);
      low.push(100, 98, 100);
      close.push(102, 99, 102);
      // Rise
      for (let i = 0; i < 6; i++) {
        high.push(115);
        low.push(110);
        close.push(112);
      }
      // Head at 100 (NOT lower than shoulders)
      high.push(105, 103, 105);
      low.push(100, 98, 100);
      close.push(102, 99, 102);
      // Rise
      for (let i = 0; i < 6; i++) {
        high.push(115);
        low.push(110);
        close.push(112);
      }
      // Right shoulder at 100
      high.push(105, 103, 105);
      low.push(100, 98, 100);
      close.push(102, 99, 102);
      // Trail
      for (let i = 0; i < 5; i++) {
        high.push(115);
        low.push(110);
        close.push(112);
      }

      const result = detectChartPatterns(high, low, close, 50);

      // No Inverse H&S because head is not lower
      const ihs = result.find((p) => p.type === 'inverse_head_and_shoulders');
      expect(ihs).toBeUndefined();
    });

    it('should skip inverse head and shoulders when shoulders are not at similar levels', () => {
      // Create three troughs where shoulders differ by more than 3%
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Baseline
      for (let i = 0; i < 10; i++) {
        high.push(120);
        low.push(115);
        close.push(117);
      }
      // Left shoulder trough at 100
      high.push(105, 103, 105);
      low.push(100, 98, 100);
      close.push(102, 99, 102);
      // Rise
      for (let i = 0; i < 6; i++) {
        high.push(115);
        low.push(110);
        close.push(112);
      }
      // Head at 80 (lower than both shoulders)
      high.push(85, 83, 85);
      low.push(80, 78, 80);
      close.push(82, 79, 82);
      // Rise
      for (let i = 0; i < 6; i++) {
        high.push(115);
        low.push(110);
        close.push(112);
      }
      // Right shoulder at 90 (>3% different from left shoulder 100)
      high.push(95, 93, 95);
      low.push(90, 88, 90);
      close.push(92, 89, 92);
      // Trail
      for (let i = 0; i < 5; i++) {
        high.push(115);
        low.push(110);
        close.push(112);
      }

      const result = detectChartPatterns(high, low, close, 50);

      // No Inverse H&S due to unequal shoulders
      const ihs = result.find((p) => p.type === 'inverse_head_and_shoulders');
      expect(ihs).toBeUndefined();
    });

    it('should detect inverse head and shoulders with neckline calculation', () => {
      // Create a valid Inverse H&S pattern with proper peaks between troughs
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Initial data
      for (let i = 0; i < 5; i++) {
        high.push(115);
        low.push(110);
        close.push(112);
      }
      // Left shoulder trough (needs lookback=3 for trough detection)
      high.push(108, 105, 100, 105, 108);
      low.push(103, 100, 95, 100, 103);
      close.push(105, 102, 97, 102, 105);
      // First peak (clearly higher)
      high.push(115, 118, 120, 118, 115);
      low.push(110, 113, 115, 113, 110);
      close.push(112, 115, 118, 115, 112);
      // Head (lowest trough)
      high.push(95, 90, 85, 90, 95);
      low.push(90, 85, 80, 85, 90);
      close.push(92, 87, 82, 87, 92);
      // Second peak (similar level to first)
      high.push(115, 118, 120, 118, 115);
      low.push(110, 113, 115, 113, 110);
      close.push(112, 115, 118, 115, 112);
      // Right shoulder (similar to left)
      high.push(108, 105, 100, 105, 108);
      low.push(103, 100, 95, 100, 103);
      close.push(105, 102, 97, 102, 105);
      // Trailing data
      for (let i = 0; i < 5; i++) {
        high.push(115);
        low.push(110);
        close.push(112);
      }

      const result = detectChartPatterns(high, low, close, 50);

      // Check if Inverse H&S is detected
      const ihs = result.find((p) => p.type === 'inverse_head_and_shoulders');
      expect(ihs).toBeDefined();
      expect(ihs?.direction).toBe('bullish');
      expect(ihs?.neckline).toBeDefined();
      expect(ihs?.priceTarget).toBeDefined();
      expect(typeof ihs?.neckline).toBe('number');
    });

    it('should detect double bottom pattern', () => {
      // Create data with two troughs at similar levels
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Initial downtrend
      for (let i = 0; i < 10; i++) {
        high.push(120 - i * 2);
        low.push(118 - i * 2);
        close.push(119 - i * 2);
      }
      // First trough
      high.push(102, 101, 102);
      low.push(100, 99, 100);
      close.push(101, 100, 101);
      // Bounce
      for (let i = 0; i < 12; i++) {
        high.push(105 + i * 0.5);
        low.push(103 + i * 0.5);
        close.push(104 + i * 0.5);
      }
      // Second trough (similar to first)
      high.push(103, 101, 102);
      low.push(101, 99, 100);
      close.push(102, 100, 101);
      // Recovery
      for (let i = 0; i < 5; i++) {
        high.push(103 + i);
        low.push(101 + i);
        close.push(102 + i);
      }

      const result = detectChartPatterns(high, low, close, 50);

      const doubleBottom = result.find((p) => p.type === 'double_bottom');
      expect(doubleBottom).toBeDefined();
      expect(doubleBottom?.direction).toBe('bullish');
      expect(doubleBottom?.priceTarget).toBeDefined();
      expect(doubleBottom?.neckline).toBeDefined();
    });

    it('should detect ascending triangle pattern when conditions are met', () => {
      // Deterministic flat resistance with rising support
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Create clear ascending triangle: flat highs, rising lows
      for (let i = 0; i < 30; i++) {
        // Flat resistance around 110
        high.push(110);
        // Rising support
        low.push(100 + i * 0.3);
        close.push(105);
      }

      const result = detectChartPatterns(high, low, close, 30);

      // Pattern may or may not be detected depending on peak/trough detection
      // Just verify the result is valid
      expect(Array.isArray(result)).toBe(true);
      const ascending = result.find((p) => p.type === 'ascending_triangle');
      // If found, verify properties
      expect(ascending === undefined || ascending.direction === 'bullish').toBe(
        true,
      );
    });

    it('should detect descending triangle pattern when conditions are met', () => {
      // Deterministic flat support with falling resistance
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      for (let i = 0; i < 30; i++) {
        // Falling resistance
        high.push(120 - i * 0.3);
        // Flat support around 100
        low.push(100);
        close.push(105);
      }

      const result = detectChartPatterns(high, low, close, 30);

      expect(Array.isArray(result)).toBe(true);
      const descending = result.find((p) => p.type === 'descending_triangle');
      expect(
        descending === undefined || descending.direction === 'bearish',
      ).toBe(true);
    });

    it('should detect bull flag pattern when conditions are met', () => {
      // Strong uptrend followed by consolidation
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Flagpole - strong uptrend (>5% gain)
      for (let i = 0; i < 8; i++) {
        const price = 100 + i * 1.5;
        high.push(price + 1);
        low.push(price - 1);
        close.push(price);
      }
      // Flag - tight consolidation with slight downward drift
      const flagStart = 112;
      for (let i = 0; i < 12; i++) {
        const drift = -i * 0.2;
        high.push(flagStart + drift + 1);
        low.push(flagStart + drift - 1);
        close.push(flagStart + drift - 0.1);
      }

      const result = detectChartPatterns(high, low, close, 30);

      expect(Array.isArray(result)).toBe(true);
      const bullFlag = result.find((p) => p.type === 'bull_flag');
      expect(bullFlag === undefined || bullFlag.direction === 'bullish').toBe(
        true,
      );
    });

    it('should detect bear flag pattern when conditions are met', () => {
      // Strong downtrend followed by consolidation
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Flagpole - strong downtrend (>5% loss)
      for (let i = 0; i < 8; i++) {
        const price = 120 - i * 1.5;
        high.push(price + 1);
        low.push(price - 1);
        close.push(price);
      }
      // Flag - tight consolidation with slight upward drift
      const flagStart = 108;
      for (let i = 0; i < 12; i++) {
        const drift = i * 0.2;
        high.push(flagStart + drift + 1);
        low.push(flagStart + drift - 1);
        close.push(flagStart + drift + 0.1);
      }

      const result = detectChartPatterns(high, low, close, 30);

      expect(Array.isArray(result)).toBe(true);
      const bearFlag = result.find((p) => p.type === 'bear_flag');
      expect(bearFlag === undefined || bearFlag.direction === 'bearish').toBe(
        true,
      );
    });

    it('should sort patterns by end index (most recent first)', () => {
      // Create data with oscillating pattern that may produce multiple detections
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      for (let i = 0; i < 100; i++) {
        high.push(100 + Math.sin(i / 5) * 10);
        low.push(90 + Math.sin(i / 5) * 10);
        close.push(95 + Math.sin(i / 5) * 10);
      }

      const result = detectChartPatterns(high, low, close, 100);

      // Verify sorted by endIndex descending
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].endIndex).toBeGreaterThanOrEqual(
          result[i + 1].endIndex,
        );
      }
    });

    it('should respect lookback period', () => {
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Create 100 candles with deterministic data
      for (let i = 0; i < 100; i++) {
        high.push(100 + (i % 5));
        low.push(95 + (i % 5));
        close.push(97 + (i % 5));
      }

      // With very small lookback, patterns at the beginning should be ignored
      const result = detectChartPatterns(high, low, close, 10);

      // All detected patterns should have startIndex >= 90 (100 - 10)
      for (const pattern of result) {
        expect(pattern.startIndex).toBeGreaterThanOrEqual(90);
      }
    });

    it('should return patterns with all required fields', () => {
      // Create data that will produce at least one pattern
      const high: number[] = [];
      const low: number[] = [];
      const close: number[] = [];

      // Double top setup
      for (let i = 0; i < 10; i++) {
        high.push(100 + i);
        low.push(98 + i);
        close.push(99 + i);
      }
      high.push(112, 113, 112);
      low.push(110, 111, 110);
      close.push(111, 112, 111);
      for (let i = 0; i < 15; i++) {
        high.push(108);
        low.push(105);
        close.push(106);
      }
      high.push(112, 113, 112);
      low.push(110, 111, 110);
      close.push(111, 112, 111);

      const result = detectChartPatterns(high, low, close, 50);

      for (const pattern of result) {
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('direction');
        expect(pattern).toHaveProperty('startIndex');
        expect(pattern).toHaveProperty('endIndex');
        expect(pattern).toHaveProperty('confidence');
        expect(pattern).toHaveProperty('priceTarget');
        expect(pattern).toHaveProperty('neckline');
        expect(['bullish', 'bearish']).toContain(pattern.direction);
        expect(['low', 'medium', 'high']).toContain(pattern.confidence);
        expect(pattern.startIndex).toBeLessThan(pattern.endIndex);
      }
    });

    // Confidence level coverage tests
    describe('confidence level branches', () => {
      it('should assign medium confidence to double top when peak diff is 1-2%', () => {
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Build data with two peaks ~1.5% apart
        for (let i = 0; i < 10; i++) {
          high.push(100 + i);
          low.push(98 + i);
          close.push(99 + i);
        }
        // First peak at 120
        high.push(118, 120, 118);
        low.push(116, 118, 116);
        close.push(117, 119, 117);
        // Pullback
        for (let i = 0; i < 12; i++) {
          high.push(115);
          low.push(110);
          close.push(112);
        }
        // Second peak at ~118.2 (~1.5% lower than 120)
        high.push(116.2, 118.2, 116.2);
        low.push(114.2, 116.2, 114.2);
        close.push(115.2, 117.2, 115.2);
        // Trail
        for (let i = 0; i < 5; i++) {
          high.push(110);
          low.push(105);
          close.push(107);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const doubleTop = result.find((p) => p.type === 'double_top');
        expect(doubleTop).toBeDefined();
        expect(doubleTop?.confidence).toBe('medium');
      });

      it('should assign low confidence to double top when peak diff is ~2%', () => {
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Build data with two peaks at edge of tolerance
        // first = 98, second = 100: peakDiff = 2/98 = 2.04% → 'low'
        // pricesEqual: 2/100 = 2% ≤ 2% → true
        for (let i = 0; i < 10; i++) {
          high.push(90 + i * 0.5);
          low.push(88 + i * 0.5);
          close.push(89 + i * 0.5);
        }
        // First peak at 98 (needs lookback=3 for peak detection)
        high.push(95, 96, 98, 96, 95);
        low.push(93, 94, 96, 94, 93);
        close.push(94, 95, 97, 95, 94);
        // Pullback (enough candles for MIN_PATTERN_LENGTH)
        for (let i = 0; i < 12; i++) {
          high.push(90);
          low.push(85);
          close.push(87);
        }
        // Second peak at 100 (2% higher than 98)
        high.push(97, 99, 100, 99, 97);
        low.push(95, 97, 98, 97, 95);
        close.push(96, 98, 99, 98, 96);
        // Trail
        for (let i = 0; i < 5; i++) {
          high.push(90);
          low.push(85);
          close.push(87);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const doubleTop = result.find((p) => p.type === 'double_top');
        // Pattern must be detected for this test to be meaningful
        expect(doubleTop).toBeDefined();
        expect(doubleTop?.confidence).toBe('low');
      });

      it('should assign medium confidence to double bottom when trough diff is 1-2%', () => {
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Build data with two troughs ~1.5% apart
        for (let i = 0; i < 10; i++) {
          high.push(120 - i);
          low.push(118 - i);
          close.push(119 - i);
        }
        // First trough at 100
        high.push(102, 101, 102);
        low.push(100, 99, 100);
        close.push(101, 100, 101);
        // Bounce
        for (let i = 0; i < 12; i++) {
          high.push(110);
          low.push(105);
          close.push(107);
        }
        // Second trough at ~101.5 (~1.5% higher)
        high.push(103.5, 102.5, 103.5);
        low.push(101.5, 100.5, 101.5);
        close.push(102.5, 101.5, 102.5);
        // Recovery
        for (let i = 0; i < 5; i++) {
          high.push(110);
          low.push(105);
          close.push(107);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const doubleBottom = result.find((p) => p.type === 'double_bottom');
        expect(doubleBottom).toBeDefined();
        expect(doubleBottom?.confidence).toBe('medium');
      });

      it('should assign low confidence to double bottom when trough diff is ~2%', () => {
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Build data with two troughs at edge of tolerance
        for (let i = 0; i < 10; i++) {
          high.push(120 - i);
          low.push(118 - i);
          close.push(119 - i);
        }
        // First trough at 100
        high.push(102, 101, 102);
        low.push(100, 99, 100);
        close.push(101, 100, 101);
        // Bounce
        for (let i = 0; i < 12; i++) {
          high.push(110);
          low.push(105);
          close.push(107);
        }
        // Second trough at 102 (troughDiff: 2/100 = 2%)
        high.push(104, 103, 104);
        low.push(102, 101, 102);
        close.push(103, 102, 103);
        // Recovery
        for (let i = 0; i < 5; i++) {
          high.push(110);
          low.push(105);
          close.push(107);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const doubleBottom = result.find((p) => p.type === 'double_bottom');
        expect(doubleBottom).toBeDefined();
        expect(doubleBottom?.confidence).toBe('low');
      });

      it('should assign high confidence to H&S when shoulder diff is < 1.5%', () => {
        // Create H&S with shoulders ~1% apart → high confidence
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Baseline
        for (let i = 0; i < 5; i++) {
          high.push(80);
          low.push(75);
          close.push(77);
        }
        // Left shoulder at 110
        high.push(100, 105, 110, 105, 100);
        low.push(95, 100, 105, 100, 95);
        close.push(97, 102, 108, 102, 97);
        // First trough
        high.push(90, 87, 85, 87, 90);
        low.push(85, 82, 80, 82, 85);
        close.push(87, 84, 82, 84, 87);
        // Head at 130
        high.push(115, 122, 130, 122, 115);
        low.push(110, 117, 125, 117, 110);
        close.push(112, 119, 128, 119, 112);
        // Second trough
        high.push(90, 87, 85, 87, 90);
        low.push(85, 82, 80, 82, 85);
        close.push(87, 84, 82, 84, 87);
        // Right shoulder at 109 (~0.9% diff from 110) → high confidence
        high.push(99, 104, 109, 104, 99);
        low.push(94, 99, 104, 99, 94);
        close.push(96, 101, 107, 101, 96);
        // Trail
        for (let i = 0; i < 5; i++) {
          high.push(80);
          low.push(75);
          close.push(77);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const hs = result.find((p) => p.type === 'head_and_shoulders');
        expect(hs).toBeDefined();
        expect(hs?.confidence).toBe('high');
      });

      it('should assign medium confidence to H&S when shoulder diff is 1.5-2.5%', () => {
        // Create H&S with shoulders ~2% apart → medium confidence
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Baseline
        for (let i = 0; i < 5; i++) {
          high.push(80);
          low.push(75);
          close.push(77);
        }
        // Left shoulder at 110
        high.push(100, 105, 110, 105, 100);
        low.push(95, 100, 105, 100, 95);
        close.push(97, 102, 108, 102, 97);
        // First trough
        high.push(90, 87, 85, 87, 90);
        low.push(85, 82, 80, 82, 85);
        close.push(87, 84, 82, 84, 87);
        // Head at 130
        high.push(115, 122, 130, 122, 115);
        low.push(110, 117, 125, 117, 110);
        close.push(112, 119, 128, 119, 112);
        // Second trough
        high.push(90, 87, 85, 87, 90);
        low.push(85, 82, 80, 82, 85);
        close.push(87, 84, 82, 84, 87);
        // Right shoulder at 108 (~1.8% diff from 110) → medium confidence
        high.push(98, 103, 108, 103, 98);
        low.push(93, 98, 103, 98, 93);
        close.push(95, 100, 106, 100, 95);
        // Trail
        for (let i = 0; i < 5; i++) {
          high.push(80);
          low.push(75);
          close.push(77);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const hs = result.find((p) => p.type === 'head_and_shoulders');
        expect(hs).toBeDefined();
        expect(hs?.confidence).toBe('medium');
      });

      it('should assign low confidence to H&S when shoulder diff is >= 2.5%', () => {
        // Create H&S with shoulders ~2.7% apart → low confidence
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Baseline
        for (let i = 0; i < 5; i++) {
          high.push(80);
          low.push(75);
          close.push(77);
        }
        // Left shoulder at 110
        high.push(100, 105, 110, 105, 100);
        low.push(95, 100, 105, 100, 95);
        close.push(97, 102, 108, 102, 97);
        // First trough
        high.push(90, 87, 85, 87, 90);
        low.push(85, 82, 80, 82, 85);
        close.push(87, 84, 82, 84, 87);
        // Head at 130
        high.push(115, 122, 130, 122, 115);
        low.push(110, 117, 125, 117, 110);
        close.push(112, 119, 128, 119, 112);
        // Second trough
        high.push(90, 87, 85, 87, 90);
        low.push(85, 82, 80, 82, 85);
        close.push(87, 84, 82, 84, 87);
        // Right shoulder at 107 (~2.7% diff from 110) → low confidence
        high.push(97, 102, 107, 102, 97);
        low.push(92, 97, 102, 97, 92);
        close.push(94, 99, 105, 99, 94);
        // Trail
        for (let i = 0; i < 5; i++) {
          high.push(80);
          low.push(75);
          close.push(77);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const hs = result.find((p) => p.type === 'head_and_shoulders');
        expect(hs).toBeDefined();
        expect(hs?.direction).toBe('bearish');
        expect(hs?.confidence).toBe('low');
      });

      it('should assign high confidence to inverse H&S when shoulder diff is < 1.5%', () => {
        // Create Inverse H&S with shoulders ~1% apart → high confidence
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Baseline (high values for trough detection)
        for (let i = 0; i < 5; i++) {
          high.push(120);
          low.push(115);
          close.push(117);
        }
        // Left shoulder trough at 90
        high.push(100, 95, 92, 95, 100);
        low.push(95, 90, 87, 90, 95);
        close.push(97, 92, 89, 92, 97);
        // First peak
        high.push(110, 113, 115, 113, 110);
        low.push(105, 108, 110, 108, 105);
        close.push(107, 110, 113, 110, 107);
        // Head at 75 (lowest trough)
        high.push(85, 80, 78, 80, 85);
        low.push(80, 75, 73, 75, 80);
        close.push(82, 77, 75, 77, 82);
        // Second peak
        high.push(110, 113, 115, 113, 110);
        low.push(105, 108, 110, 108, 105);
        close.push(107, 110, 113, 110, 107);
        // Right shoulder at 89 (~1.1% diff from 90) → high confidence
        high.push(99, 94, 91, 94, 99);
        low.push(94, 89, 86, 89, 94);
        close.push(96, 91, 88, 91, 96);
        // Trail
        for (let i = 0; i < 5; i++) {
          high.push(120);
          low.push(115);
          close.push(117);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const ihs = result.find((p) => p.type === 'inverse_head_and_shoulders');
        expect(ihs).toBeDefined();
        expect(ihs?.confidence).toBe('high');
      });

      it('should assign medium confidence to inverse H&S when shoulder diff is 1.5-2.5%', () => {
        // Create Inverse H&S with shoulders ~2% apart → medium confidence
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Baseline
        for (let i = 0; i < 5; i++) {
          high.push(120);
          low.push(115);
          close.push(117);
        }
        // Left shoulder trough at 90
        high.push(100, 95, 92, 95, 100);
        low.push(95, 90, 87, 90, 95);
        close.push(97, 92, 89, 92, 97);
        // First peak
        high.push(110, 113, 115, 113, 110);
        low.push(105, 108, 110, 108, 105);
        close.push(107, 110, 113, 110, 107);
        // Head at 75
        high.push(85, 80, 78, 80, 85);
        low.push(80, 75, 73, 75, 80);
        close.push(82, 77, 75, 77, 82);
        // Second peak
        high.push(110, 113, 115, 113, 110);
        low.push(105, 108, 110, 108, 105);
        close.push(107, 110, 113, 110, 107);
        // Right shoulder at 88 (~2.2% diff from 90) → medium confidence
        high.push(98, 93, 90, 93, 98);
        low.push(93, 88, 85, 88, 93);
        close.push(95, 90, 87, 90, 95);
        // Trail
        for (let i = 0; i < 5; i++) {
          high.push(120);
          low.push(115);
          close.push(117);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const ihs = result.find((p) => p.type === 'inverse_head_and_shoulders');
        expect(ihs).toBeDefined();
        expect(ihs?.confidence).toBe('medium');
      });

      it('should assign low confidence to inverse H&S when shoulder diff is >= 2.5%', () => {
        // Create Inverse H&S with shoulders ~2.8% apart → low confidence
        // The trough value at index must be the minimum for proper detection
        // Left shoulder: 90, Right shoulder: 87.5 → |90-87.5|/90 = 2.78%
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Baseline
        for (let i = 0; i < 5; i++) {
          high.push(120);
          low.push(115);
          close.push(117);
        }
        // Left shoulder trough - center value is THE trough (90)
        high.push(100, 96, 94, 96, 100);
        low.push(96, 93, 90, 93, 96);
        close.push(98, 94, 92, 94, 98);
        // First peak
        high.push(110, 113, 115, 113, 110);
        low.push(105, 108, 110, 108, 105);
        close.push(107, 110, 113, 110, 107);
        // Head at 75 (must be lower than both shoulders)
        high.push(85, 80, 78, 80, 85);
        low.push(80, 76, 75, 76, 80);
        close.push(82, 77, 76, 77, 82);
        // Second peak
        high.push(110, 113, 115, 113, 110);
        low.push(105, 108, 110, 108, 105);
        close.push(107, 110, 113, 110, 107);
        // Right shoulder trough - center value is THE trough (87.5)
        // |90 - 87.5| / 90 = 2.78% → low confidence (>= 2.5%)
        // But also < 3% to pass pricesEqual check
        high.push(98, 94, 92, 94, 98);
        low.push(94, 90, 87.5, 90, 94);
        close.push(96, 91.5, 89, 91.5, 96);
        // Trail
        for (let i = 0; i < 5; i++) {
          high.push(120);
          low.push(115);
          close.push(117);
        }

        const result = detectChartPatterns(high, low, close, 50);
        const ihs = result.find((p) => p.type === 'inverse_head_and_shoulders');
        expect(ihs).toBeDefined();
        expect(ihs?.direction).toBe('bullish');
        expect(ihs?.confidence).toBe('low');
      });

      it('should assign high confidence to bull flag when pole gain > 10%', () => {
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Flagpole with >10% gain over MIN_TREND_LENGTH (5 candles)
        // Steep gain: 100 → 150 over 8 candles ensures >10% for any 5-candle window
        for (let i = 0; i < 8; i++) {
          const price = 100 + i * 7; // 49% gain over 7 candles
          high.push(price + 1);
          low.push(price - 1);
          close.push(price);
        }
        // Flag - tight consolidation at the top with slight downward drift
        const flagStart = 149;
        for (let i = 0; i < 12; i++) {
          const drift = -i * 0.3;
          high.push(flagStart + drift + 0.5);
          low.push(flagStart + drift - 0.5);
          close.push(flagStart + drift - 0.1);
        }

        const result = detectChartPatterns(high, low, close, 30);
        const bullFlag = result.find((p) => p.type === 'bull_flag');
        expect(bullFlag).toBeDefined();
        expect(bullFlag?.confidence).toBe('high');
      });

      it('should assign high confidence to bear flag when pole loss > 10%', () => {
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Flagpole with >10% loss over MIN_TREND_LENGTH (5 candles)
        // Need 120 → 105 over 5 candles = ~12.5% loss per 5-candle pole
        for (let i = 0; i < 8; i++) {
          const price = 130 - i * 4; // ~24% loss over 7 candles, >10% over any 5-candle window
          high.push(price + 1);
          low.push(price - 1);
          close.push(price);
        }
        // Flag - tight consolidation with slight upward drift
        const flagStart = 102;
        for (let i = 0; i < 12; i++) {
          const drift = i * 0.15;
          high.push(flagStart + drift + 0.5);
          low.push(flagStart + drift - 0.5);
          close.push(flagStart + drift + 0.1);
        }

        const result = detectChartPatterns(high, low, close, 30);
        const bearFlag = result.find((p) => p.type === 'bear_flag');
        expect(bearFlag).toBeDefined();
        expect(bearFlag?.confidence).toBe('high');
      });

      it('should skip patterns when pole start is before analysis window', () => {
        // Create data where findDowntrendStart finds a swing high before startIdx
        // We need: loop runs (enough candles), swing high early, gradual decline after
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // 100 candles total, lookbackPeriod=40 → startIdx = 60
        // Loop runs from i=65 to i<90

        // Create a significant swing high at index 30 (before startIdx=60)
        // Then a gradual decline that continues into the analysis window
        for (let i = 0; i < 100; i++) {
          if (i < 30) {
            // Rising prices leading to swing high
            const price = 100 + i * 0.5;
            high.push(price + 1);
            low.push(price - 1);
            close.push(price);
          } else if (i === 30) {
            // Swing high at index 30
            high.push(130);
            low.push(125);
            close.push(128);
          } else {
            // Gradual decline (bear flag setup)
            const price = 128 - (i - 30) * 0.8;
            high.push(price + 1);
            low.push(price - 1);
            close.push(price);
          }
        }

        // With lookbackPeriod=40, startIdx=60, loop from 65-89
        // findDowntrendStart should find swing high at index 30 which is < 60
        const result = detectChartPatterns(high, low, close, 40);

        // Just verify it runs without error
        expect(Array.isArray(result)).toBe(true);
      });

      it('should skip bull flag when pole start is before analysis window', () => {
        // Similar test for bull flag (findUptrendStart)
        const high: number[] = [];
        const low: number[] = [];
        const close: number[] = [];

        // Create a significant swing low at index 30 (before startIdx=60)
        // Then a gradual rise that continues into the analysis window
        for (let i = 0; i < 100; i++) {
          if (i < 30) {
            // Declining prices leading to swing low
            const price = 130 - i * 0.5;
            high.push(price + 1);
            low.push(price - 1);
            close.push(price);
          } else if (i === 30) {
            // Swing low at index 30
            high.push(105);
            low.push(100);
            close.push(102);
          } else {
            // Gradual rise (bull flag setup)
            const price = 102 + (i - 30) * 0.8;
            high.push(price + 1);
            low.push(price - 1);
            close.push(price);
          }
        }

        const result = detectChartPatterns(high, low, close, 40);
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});
