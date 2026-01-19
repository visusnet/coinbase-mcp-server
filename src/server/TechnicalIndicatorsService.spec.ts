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

  describe('calculateEma', () => {
    const generateCandles = (closePrices: number[]): CandleInput[] => {
      return closePrices.map((close) => ({
        open: close.toString(),
        high: (close + 1).toString(),
        low: (close - 1).toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate EMA with default period of 20', () => {
      const closePrices = Array.from({ length: 25 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateEma({ candles });

      expect(result.period).toBe(20);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate EMA with custom period', () => {
      const closePrices = Array.from({ length: 15 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateEma({ candles, period: 9 });

      expect(result.period).toBe(9);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should return null latestValue when not enough data', () => {
      const candles = generateCandles([100, 101]);

      const result = service.calculateEma({ candles, period: 50 });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });

    it('should give more weight to recent prices', () => {
      // Create prices that spike at the end
      const closePrices = [...Array.from({ length: 19 }, () => 100), 150];
      const candles = generateCandles(closePrices);

      const result = service.calculateEma({ candles, period: 10 });

      // EMA should reflect the spike more than a simple average
      expect(result.latestValue).not.toBeNull();
      expect(result.latestValue).toBeGreaterThan(100);
    });
  });

  describe('calculateBollingerBands', () => {
    const generateCandles = (closePrices: number[]): CandleInput[] => {
      return closePrices.map((close) => ({
        open: close.toString(),
        high: (close + 1).toString(),
        low: (close - 1).toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate Bollinger Bands with default settings (20/2)', () => {
      const closePrices = Array.from({ length: 25 }, (_, i) => 100 + i * 0.5);
      const candles = generateCandles(closePrices);

      const result = service.calculateBollingerBands({ candles });

      expect(result.period).toBe(20);
      expect(result.stdDev).toBe(2);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate Bollinger Bands with custom period and stdDev', () => {
      const closePrices = Array.from({ length: 20 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateBollingerBands({
        candles,
        period: 10,
        stdDev: 1.5,
      });

      expect(result.period).toBe(10);
      expect(result.stdDev).toBe(1.5);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return middle, upper, lower bands and %B', () => {
      const closePrices = Array.from({ length: 25 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateBollingerBands({ candles });

      const latestValue = result.latestValue;
      expect(latestValue).not.toBeNull();
      expect(latestValue).toHaveProperty('middle');
      expect(latestValue).toHaveProperty('upper');
      expect(latestValue).toHaveProperty('lower');
      expect(latestValue).toHaveProperty('pb');
      // Upper should be greater than middle, middle greater than lower
      // These values are guaranteed to exist after the not.toBeNull check
      const { upper, middle, lower } = latestValue as {
        upper: number;
        middle: number;
        lower: number;
      };
      expect(upper).toBeGreaterThan(middle);
      expect(middle).toBeGreaterThan(lower);
    });

    it('should return null latestValue when not enough data', () => {
      const candles = generateCandles([100, 101, 102]);

      const result = service.calculateBollingerBands({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateAtr', () => {
    const generateCandles = (
      data: { high: number; low: number; close: number }[],
    ): CandleInput[] => {
      return data.map(({ high, low, close }) => ({
        open: close.toString(),
        high: high.toString(),
        low: low.toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate ATR with default period of 14', () => {
      // Generate 20 candles with varying ranges
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateAtr({ candles });

      expect(result.period).toBe(14);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate ATR with custom period', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateAtr({ candles, period: 5 });

      expect(result.period).toBe(5);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should return higher ATR for more volatile prices', () => {
      // Low volatility data (tight range)
      const lowVolData = Array.from({ length: 20 }, (_, i) => ({
        high: 101 + i,
        low: 99 + i,
        close: 100 + i,
      }));
      const lowVolCandles = generateCandles(lowVolData);

      // High volatility data (wide range)
      const highVolData = Array.from({ length: 20 }, (_, i) => ({
        high: 120 + i,
        low: 80 + i,
        close: 100 + i,
      }));
      const highVolCandles = generateCandles(highVolData);

      const lowVolResult = service.calculateAtr({ candles: lowVolCandles });
      const highVolResult = service.calculateAtr({ candles: highVolCandles });

      expect(lowVolResult.latestValue).not.toBeNull();
      expect(highVolResult.latestValue).not.toBeNull();
      const lowVolValue = lowVolResult.latestValue as number;
      const highVolValue = highVolResult.latestValue as number;
      expect(highVolValue).toBeGreaterThan(lowVolValue);
    });

    it('should return null latestValue when not enough data', () => {
      const data = [
        { high: 105, low: 95, close: 100 },
        { high: 106, low: 96, close: 101 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateAtr({ candles });

      expect(result.period).toBe(14);
      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });

    it('should handle candles with string values correctly', () => {
      const candles: CandleInput[] = [
        {
          open: '100',
          high: '110.5',
          low: '95.25',
          close: '105.75',
          volume: '1000',
        },
        {
          open: '105',
          high: '115.5',
          low: '100.25',
          close: '110.75',
          volume: '1100',
        },
        {
          open: '110',
          high: '120.5',
          low: '105.25',
          close: '115.75',
          volume: '1200',
        },
        {
          open: '115',
          high: '125.5',
          low: '110.25',
          close: '120.75',
          volume: '1300',
        },
        {
          open: '120',
          high: '130.5',
          low: '115.25',
          close: '125.75',
          volume: '1400',
        },
        {
          open: '125',
          high: '135.5',
          low: '120.25',
          close: '130.75',
          volume: '1500',
        },
      ];

      const result = service.calculateAtr({ candles, period: 3 });

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });
  });

  describe('calculateStochastic', () => {
    const generateCandles = (
      data: { high: number; low: number; close: number }[],
    ): CandleInput[] => {
      return data.map(({ high, low, close }) => ({
        open: close.toString(),
        high: high.toString(),
        low: low.toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate Stochastic with default periods (14/3/3)', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateStochastic({ candles });

      expect(result.kPeriod).toBe(14);
      expect(result.dPeriod).toBe(3);
      expect(result.stochPeriod).toBe(3);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate Stochastic with custom periods', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateStochastic({
        candles,
        kPeriod: 5,
        dPeriod: 2,
        stochPeriod: 2,
      });

      expect(result.kPeriod).toBe(5);
      expect(result.dPeriod).toBe(2);
      expect(result.stochPeriod).toBe(2);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return %K and %D values', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateStochastic({ candles });

      expect(result.latestValue).not.toBeNull();
      expect(result.latestValue).toHaveProperty('k');
      expect(result.latestValue).toHaveProperty('d');
    });

    it('should return values between 0 and 100', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i * 2,
        low: 95 + i,
        close: 100 + i + (i % 2 === 0 ? 3 : -3),
      }));
      const candles = generateCandles(data);

      const result = service.calculateStochastic({ candles, kPeriod: 5 });

      expect(result.latestValue).not.toBeNull();
      const { k, d } = result.latestValue as { k: number; d: number };
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThanOrEqual(100);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(100);
    });

    it('should return null latestValue when not enough data', () => {
      const data = [
        { high: 105, low: 95, close: 100 },
        { high: 106, low: 96, close: 101 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateStochastic({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateAdx', () => {
    const generateCandles = (
      data: { high: number; low: number; close: number }[],
    ): CandleInput[] => {
      return data.map(({ high, low, close }) => ({
        open: close.toString(),
        high: high.toString(),
        low: low.toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate ADX with default period of 14', () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateAdx({ candles });

      expect(result.period).toBe(14);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate ADX with custom period', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateAdx({ candles, period: 5 });

      expect(result.period).toBe(5);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return ADX, +DI, and -DI values', () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateAdx({ candles });

      expect(result.latestValue).not.toBeNull();
      expect(result.latestValue).toHaveProperty('adx');
      expect(result.latestValue).toHaveProperty('pdi');
      expect(result.latestValue).toHaveProperty('mdi');
    });

    it('should return ADX values between 0 and 100', () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateAdx({ candles });

      expect(result.latestValue).not.toBeNull();
      const latestValue = result.latestValue as {
        adx: number;
        pdi: number;
        mdi: number;
      };
      expect(latestValue.adx).toBeGreaterThanOrEqual(0);
      expect(latestValue.adx).toBeLessThanOrEqual(100);
    });

    it('should indicate strong trend for consistently rising prices', () => {
      // Strong consistent uptrend
      const trendingData = Array.from({ length: 40 }, (_, i) => ({
        high: 100 + i * 3,
        low: 95 + i * 3,
        close: 98 + i * 3,
      }));
      const candles = generateCandles(trendingData);

      const result = service.calculateAdx({
        candles,
        period: 10,
      });

      expect(result.latestValue).not.toBeNull();
      const adxValue = result.latestValue as {
        adx: number;
        pdi: number;
        mdi: number;
      };
      // Strong uptrend should have ADX above 25 (traditional threshold)
      expect(adxValue.adx).toBeGreaterThan(25);
      // +DI should be greater than -DI in uptrend
      expect(adxValue.pdi).toBeGreaterThan(adxValue.mdi);
    });

    it('should return null latestValue when not enough data', () => {
      const data = [
        { high: 105, low: 95, close: 100 },
        { high: 106, low: 96, close: 101 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateAdx({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateObv', () => {
    const generateCandles = (
      data: { close: number; volume: number }[],
    ): CandleInput[] => {
      return data.map(({ close, volume }) => ({
        open: close.toString(),
        high: (close + 1).toString(),
        low: (close - 1).toString(),
        close: close.toString(),
        volume: volume.toString(),
      }));
    };

    it('should calculate OBV from candle data', () => {
      const data = [
        { close: 100, volume: 1000 },
        { close: 101, volume: 1100 },
        { close: 102, volume: 1200 },
        { close: 101, volume: 900 },
        { close: 103, volume: 1500 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateObv({ candles });

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should increase OBV on up days and decrease on down days', () => {
      // All up days with equal volume
      const upData = [
        { close: 100, volume: 1000 },
        { close: 101, volume: 1000 },
        { close: 102, volume: 1000 },
        { close: 103, volume: 1000 },
      ];
      const upCandles = generateCandles(upData);

      // All down days with equal volume
      const downData = [
        { close: 100, volume: 1000 },
        { close: 99, volume: 1000 },
        { close: 98, volume: 1000 },
        { close: 97, volume: 1000 },
      ];
      const downCandles = generateCandles(downData);

      const upResult = service.calculateObv({ candles: upCandles });
      const downResult = service.calculateObv({ candles: downCandles });

      expect(upResult.latestValue).not.toBeNull();
      expect(downResult.latestValue).not.toBeNull();
      const upObv = upResult.latestValue as number;
      const downObv = downResult.latestValue as number;
      // Up trend should have higher OBV than down trend
      expect(upObv).toBeGreaterThan(downObv);
    });

    it('should return empty values when not enough data', () => {
      const candles = generateCandles([{ close: 100, volume: 1000 }]);

      const result = service.calculateObv({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateVwap', () => {
    const generateCandles = (
      data: { high: number; low: number; close: number; volume: number }[],
    ): CandleInput[] => {
      return data.map(({ high, low, close, volume }) => ({
        open: close.toString(),
        high: high.toString(),
        low: low.toString(),
        close: close.toString(),
        volume: volume.toString(),
      }));
    };

    it('should calculate VWAP from candle data', () => {
      const data = [
        { high: 102, low: 98, close: 100, volume: 1000 },
        { high: 103, low: 99, close: 101, volume: 1100 },
        { high: 104, low: 100, close: 102, volume: 1200 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateVwap({ candles });

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should weight by volume correctly', () => {
      // High volume at high price should pull VWAP up
      const data = [
        { high: 102, low: 98, close: 100, volume: 100 },
        { high: 112, low: 108, close: 110, volume: 10000 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateVwap({ candles });

      expect(result.latestValue).not.toBeNull();
      const latestVwap = result.latestValue as number;
      // VWAP should be closer to 110 than 100 due to higher volume
      expect(latestVwap).toBeGreaterThan(105);
    });

    it('should handle single candle', () => {
      const candles = generateCandles([
        { high: 102, low: 98, close: 100, volume: 1000 },
      ]);

      const result = service.calculateVwap({ candles });

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should return null latestValue when no candles', () => {
      const candles: CandleInput[] = [];

      const result = service.calculateVwap({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateCci', () => {
    const generateCandles = (
      data: { high: number; low: number; close: number }[],
    ): CandleInput[] => {
      return data.map(({ high, low, close }) => ({
        open: close.toString(),
        high: high.toString(),
        low: low.toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate CCI with default period of 20', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateCci({ candles });

      expect(result.period).toBe(20);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate CCI with custom period', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateCci({ candles, period: 10 });

      expect(result.period).toBe(10);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return positive CCI for uptrending prices', () => {
      // Strong uptrend
      const data = Array.from({ length: 25 }, (_, i) => ({
        high: 100 + i * 3,
        low: 95 + i * 3,
        close: 98 + i * 3,
      }));
      const candles = generateCandles(data);

      const result = service.calculateCci({ candles });

      expect(result.latestValue).not.toBeNull();
      // CCI should be positive for uptrend
      const latestValue = result.latestValue as number;
      expect(latestValue).toBeGreaterThan(0);
    });

    it('should return null latestValue when not enough data', () => {
      const data = [
        { high: 105, low: 95, close: 100 },
        { high: 106, low: 96, close: 101 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateCci({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });
});
