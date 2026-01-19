import { describe, it, expect } from '@jest/globals';
import {
  TechnicalIndicatorsService,
  CandleInput,
} from './TechnicalIndicatorsService';

describe('TechnicalIndicatorsService', () => {
  let service: TechnicalIndicatorsService;

  beforeEach(() => {
    service = new TechnicalIndicatorsService();
  });

  describe('calculateRsi', () => {
    const generateCandles = (closePrices: number[]): CandleInput[] => {
      return closePrices.map((close) => ({
        open: close.toString(),
        high: (close + 1).toString(),
        low: (close - 1).toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate RSI with default period of 14', () => {
      // Generate 20 candles with ascending prices
      const closePrices = Array.from({ length: 20 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateRsi({ candles });

      expect(result.period).toBe(14);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
      // RSI should be high (overbought) for ascending prices
      expect(result.latestValue).toBeGreaterThan(50);
    });

    it('should calculate RSI with custom period', () => {
      const closePrices = Array.from({ length: 15 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateRsi({ candles, period: 5 });

      expect(result.period).toBe(5);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should return low RSI for descending prices', () => {
      // Generate candles with descending prices
      const closePrices = Array.from({ length: 20 }, (_, i) => 120 - i);
      const candles = generateCandles(closePrices);

      const result = service.calculateRsi({ candles });

      expect(result.latestValue).not.toBeNull();
      // RSI should be low (oversold) for descending prices
      expect(result.latestValue).toBeLessThan(50);
    });

    it('should return null latestValue when not enough data', () => {
      // Only 2 candles, not enough for RSI with default period 14
      const candles = generateCandles([100, 101]);

      const result = service.calculateRsi({ candles });

      expect(result.period).toBe(14);
      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });

    it('should handle volatile price data', () => {
      // Alternating prices
      const closePrices = [
        100, 110, 95, 115, 90, 120, 85, 125, 80, 130, 75, 135, 70, 140, 65,
      ];
      const candles = generateCandles(closePrices);

      const result = service.calculateRsi({ candles, period: 5 });

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
      // RSI should be between 0 and 100
      expect(result.latestValue).toBeGreaterThanOrEqual(0);
      expect(result.latestValue).toBeLessThanOrEqual(100);
    });

    it('should parse string close prices correctly', () => {
      const candles: CandleInput[] = [
        {
          open: '100.5',
          high: '102.0',
          low: '99.0',
          close: '101.25',
          volume: '1000',
        },
        {
          open: '101.25',
          high: '103.0',
          low: '100.0',
          close: '102.50',
          volume: '1100',
        },
        {
          open: '102.50',
          high: '104.0',
          low: '101.0',
          close: '103.75',
          volume: '1200',
        },
        {
          open: '103.75',
          high: '105.0',
          low: '102.0',
          close: '104.00',
          volume: '1300',
        },
        {
          open: '104.00',
          high: '106.0',
          low: '103.0',
          close: '105.25',
          volume: '1400',
        },
      ];

      const result = service.calculateRsi({ candles, period: 3 });

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });
  });

  describe('calculateMacd', () => {
    const generateCandles = (closePrices: number[]): CandleInput[] => {
      return closePrices.map((close) => ({
        open: close.toString(),
        high: (close + 1).toString(),
        low: (close - 1).toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate MACD with default periods (12/26/9)', () => {
      // Generate 35 candles with trending prices
      const closePrices = Array.from({ length: 35 }, (_, i) => 100 + i * 0.5);
      const candles = generateCandles(closePrices);

      const result = service.calculateMacd({ candles });

      expect(result.fastPeriod).toBe(12);
      expect(result.slowPeriod).toBe(26);
      expect(result.signalPeriod).toBe(9);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate MACD with custom periods', () => {
      const closePrices = Array.from({ length: 30 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateMacd({
        candles,
        fastPeriod: 8,
        slowPeriod: 17,
        signalPeriod: 5,
      });

      expect(result.fastPeriod).toBe(8);
      expect(result.slowPeriod).toBe(17);
      expect(result.signalPeriod).toBe(5);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return MACD, signal, and histogram values', () => {
      const closePrices = Array.from({ length: 40 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateMacd({ candles });

      expect(result.latestValue).not.toBeNull();
      expect(result.latestValue).toHaveProperty('MACD');
      expect(result.latestValue).toHaveProperty('signal');
      expect(result.latestValue).toHaveProperty('histogram');
    });

    it('should return null latestValue when not enough data', () => {
      const candles = generateCandles([100, 101, 102]);

      const result = service.calculateMacd({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });
});
