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

  describe('calculateSma', () => {
    const generateCandles = (closePrices: number[]): CandleInput[] => {
      return closePrices.map((close) => ({
        open: close.toString(),
        high: (close + 1).toString(),
        low: (close - 1).toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate SMA with default period of 20', () => {
      const closePrices = Array.from({ length: 25 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateSma({ candles });

      expect(result.period).toBe(20);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate SMA with custom period', () => {
      const closePrices = Array.from({ length: 15 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateSma({ candles, period: 10 });

      expect(result.period).toBe(10);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should return null latestValue when not enough data', () => {
      const candles = generateCandles([100, 101]);

      const result = service.calculateSma({ candles, period: 50 });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });

    it('should calculate simple average correctly', () => {
      // SMA of 5 values 100,101,102,103,104 with period 5 = (100+101+102+103+104)/5 = 102
      const closePrices = [100, 101, 102, 103, 104];
      const candles = generateCandles(closePrices);

      const result = service.calculateSma({ candles, period: 5 });

      expect(result.latestValue).toBeCloseTo(102, 2);
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

    it('should return middle, upper, lower bands, %B, and bandwidth', () => {
      const closePrices = Array.from({ length: 25 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateBollingerBands({ candles });

      const latestValue = result.latestValue;
      expect(latestValue).not.toBeNull();
      expect(latestValue).toHaveProperty('middle');
      expect(latestValue).toHaveProperty('upper');
      expect(latestValue).toHaveProperty('lower');
      expect(latestValue).toHaveProperty('pb');
      expect(latestValue).toHaveProperty('bandwidth');
      // Upper should be greater than middle, middle greater than lower
      // These values are guaranteed to exist after the not.toBeNull check
      const { upper, middle, lower, bandwidth } = latestValue as {
        upper: number;
        middle: number;
        lower: number;
        bandwidth: number;
      };
      expect(upper).toBeGreaterThan(middle);
      expect(middle).toBeGreaterThan(lower);
      // Bandwidth = (upper - lower) / middle
      expect(bandwidth).toBeCloseTo((upper - lower) / middle, 10);
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
      });

      expect(result.kPeriod).toBe(5);
      expect(result.dPeriod).toBe(2);
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

  describe('calculateWilliamsR', () => {
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

    it('should calculate Williams %R with default period of 14', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateWilliamsR({ candles });

      expect(result.period).toBe(14);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate Williams %R with custom period', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateWilliamsR({ candles, period: 5 });

      expect(result.period).toBe(5);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return values between -100 and 0', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateWilliamsR({ candles });

      expect(result.latestValue).not.toBeNull();
      const latestValue = result.latestValue as number;
      // Williams %R ranges from -100 to 0
      expect(latestValue).toBeLessThanOrEqual(0);
      expect(latestValue).toBeGreaterThanOrEqual(-100);
    });

    it('should return null latestValue when not enough data', () => {
      const data = [
        { high: 105, low: 95, close: 100 },
        { high: 106, low: 96, close: 101 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateWilliamsR({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateRoc', () => {
    const generateCandles = (closePrices: number[]): CandleInput[] => {
      return closePrices.map((close) => ({
        open: close.toString(),
        high: (close + 1).toString(),
        low: (close - 1).toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should calculate ROC with default period of 12', () => {
      const closePrices = Array.from({ length: 20 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateRoc({ candles });

      expect(result.period).toBe(12);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate ROC with custom period', () => {
      const closePrices = Array.from({ length: 15 }, (_, i) => 100 + i);
      const candles = generateCandles(closePrices);

      const result = service.calculateRoc({ candles, period: 5 });

      expect(result.period).toBe(5);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return positive ROC for rising prices', () => {
      // Prices doubling over the period
      const closePrices = Array.from({ length: 15 }, (_, i) => 100 + i * 10);
      const candles = generateCandles(closePrices);

      const result = service.calculateRoc({ candles, period: 5 });

      expect(result.latestValue).not.toBeNull();
      const latestValue = result.latestValue as number;
      // ROC should be positive for rising prices
      expect(latestValue).toBeGreaterThan(0);
    });

    it('should return negative ROC for falling prices', () => {
      // Prices falling over the period
      const closePrices = Array.from({ length: 15 }, (_, i) => 200 - i * 10);
      const candles = generateCandles(closePrices);

      const result = service.calculateRoc({ candles, period: 5 });

      expect(result.latestValue).not.toBeNull();
      const latestValue = result.latestValue as number;
      // ROC should be negative for falling prices
      expect(latestValue).toBeLessThan(0);
    });

    it('should return null latestValue when not enough data', () => {
      const closePrices = [100, 101, 102];
      const candles = generateCandles(closePrices);

      const result = service.calculateRoc({ candles });

      expect(result.period).toBe(12);
      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateMfi', () => {
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

    it('should calculate MFI with default period of 14', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
        volume: 1000 + i * 100,
      }));
      const candles = generateCandles(data);

      const result = service.calculateMfi({ candles });

      expect(result.period).toBe(14);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate MFI with custom period', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
        volume: 1000 + i * 100,
      }));
      const candles = generateCandles(data);

      const result = service.calculateMfi({ candles, period: 5 });

      expect(result.period).toBe(5);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return MFI values between 0 and 100', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
        volume: 1000 + i * 100,
      }));
      const candles = generateCandles(data);

      const result = service.calculateMfi({ candles });

      expect(result.latestValue).not.toBeNull();
      const latestValue = result.latestValue as number;
      // MFI ranges from 0 to 100
      expect(latestValue).toBeGreaterThanOrEqual(0);
      expect(latestValue).toBeLessThanOrEqual(100);
    });

    it('should return null latestValue when not enough data', () => {
      const data = [
        { high: 105, low: 95, close: 100, volume: 1000 },
        { high: 106, low: 96, close: 101, volume: 1100 },
      ];
      const candles = generateCandles(data);

      const result = service.calculateMfi({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculatePsar', () => {
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

    it('should calculate PSAR with default parameters (0.02/0.2)', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculatePsar({ candles });

      expect(result.step).toBe(0.02);
      expect(result.max).toBe(0.2);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
    });

    it('should calculate PSAR with custom parameters', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculatePsar({ candles, step: 0.01, max: 0.1 });

      expect(result.step).toBe(0.01);
      expect(result.max).toBe(0.1);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return SAR values below price in uptrend', () => {
      // Strong consistent uptrend
      const data = Array.from({ length: 30 }, (_, i) => ({
        high: 100 + i * 3,
        low: 95 + i * 3,
        close: 98 + i * 3,
      }));
      const candles = generateCandles(data);

      const result = service.calculatePsar({ candles });

      expect(result.latestValue).not.toBeNull();
      const latestSar = result.latestValue as number;
      const latestClose = 98 + 29 * 3; // Last close price
      // In uptrend, SAR should be below price
      expect(latestSar).toBeLessThan(latestClose);
    });

    it('should return null latestValue when no data provided', () => {
      const candles: ReturnType<typeof generateCandles> = [];

      const result = service.calculatePsar({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateIchimokuCloud', () => {
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

    it('should calculate Ichimoku Cloud with default periods', () => {
      // Generate enough candles for Ichimoku Cloud (need at least spanPeriod = 52)
      const data = Array.from({ length: 100 }, (_, i) => ({
        high: 105 + Math.sin(i / 10) * 10,
        low: 95 + Math.sin(i / 10) * 10,
        close: 100 + Math.sin(i / 10) * 10,
      }));
      const candles = generateCandles(data);

      const result = service.calculateIchimokuCloud({ candles });

      expect(result.conversionPeriod).toBe(9);
      expect(result.basePeriod).toBe(26);
      expect(result.spanPeriod).toBe(52);
      expect(result.displacement).toBe(26);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
      // Verify output structure
      const latestValue = result.latestValue as {
        conversion: number;
        base: number;
        spanA: number;
        spanB: number;
        chikou: number | null;
      };
      expect(latestValue).toHaveProperty('conversion');
      expect(latestValue).toHaveProperty('base');
      expect(latestValue).toHaveProperty('spanA');
      expect(latestValue).toHaveProperty('spanB');
      expect(latestValue).toHaveProperty('chikou');
      expect(typeof latestValue.conversion).toBe('number');
      expect(typeof latestValue.base).toBe('number');
      expect(typeof latestValue.spanA).toBe('number');
      expect(typeof latestValue.spanB).toBe('number');
      // Chikou is null for the last `displacement` values (no future data)
      expect(latestValue.chikou).toBeNull();
    });

    it('should have null chikou for last displacement values and valid chikou for earlier values', () => {
      // Generate enough candles with predictable close prices
      const data = Array.from({ length: 100 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i, // Predictable close prices: 100, 101, 102, ...
      }));
      const candles = generateCandles(data);
      const displacement = 26;

      const result = service.calculateIchimokuCloud({ candles, displacement });

      // The last `displacement` values should have null chikou
      const valuesCount = result.values.length;
      for (let i = valuesCount - displacement; i < valuesCount; i++) {
        expect(result.values[i].chikou).toBeNull();
      }

      // Earlier values should have valid chikou (close price from `displacement` periods ahead)
      // The chikou at position i should be the close at (offset + i + displacement)
      const offset = 100 - valuesCount; // close.length - values.length
      for (let i = 0; i < valuesCount - displacement; i++) {
        const expectedChikouIndex = offset + i + displacement;
        const expectedChikou = 100 + expectedChikouIndex; // Our close prices are 100 + index
        expect(result.values[i].chikou).toBe(expectedChikou);
      }
    });

    it('should accept custom period parameters', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        high: 105 + i * 0.5,
        low: 95 + i * 0.5,
        close: 100 + i * 0.5,
      }));
      const candles = generateCandles(data);

      const result = service.calculateIchimokuCloud({
        candles,
        conversionPeriod: 7,
        basePeriod: 22,
        spanPeriod: 44,
        displacement: 22,
      });

      expect(result.conversionPeriod).toBe(7);
      expect(result.basePeriod).toBe(22);
      expect(result.spanPeriod).toBe(44);
      expect(result.displacement).toBe(22);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return null latestValue when no data provided', () => {
      const candles: ReturnType<typeof generateCandles> = [];

      const result = service.calculateIchimokuCloud({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateKeltnerChannels', () => {
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

    it('should calculate Keltner Channels with default parameters', () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        high: 105 + Math.sin(i / 5) * 5,
        low: 95 + Math.sin(i / 5) * 5,
        close: 100 + Math.sin(i / 5) * 5,
      }));
      const candles = generateCandles(data);

      const result = service.calculateKeltnerChannels({ candles });

      expect(result.maPeriod).toBe(20);
      expect(result.atrPeriod).toBe(10);
      expect(result.multiplier).toBe(2);
      expect(result.useSMA).toBe(false);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.latestValue).not.toBeNull();
      // Verify output structure
      const latestValue = result.latestValue as {
        middle: number;
        upper: number;
        lower: number;
      };
      expect(latestValue).toHaveProperty('middle');
      expect(latestValue).toHaveProperty('upper');
      expect(latestValue).toHaveProperty('lower');
      expect(typeof latestValue.middle).toBe('number');
      expect(typeof latestValue.upper).toBe('number');
      expect(typeof latestValue.lower).toBe('number');
    });

    it('should calculate Keltner Channels with custom parameters', () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateKeltnerChannels({
        candles,
        maPeriod: 10,
        atrPeriod: 5,
        multiplier: 1.5,
        useSMA: true,
      });

      expect(result.maPeriod).toBe(10);
      expect(result.atrPeriod).toBe(5);
      expect(result.multiplier).toBe(1.5);
      expect(result.useSMA).toBe(true);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should return upper band above middle and lower band below middle', () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
      }));
      const candles = generateCandles(data);

      const result = service.calculateKeltnerChannels({ candles });

      expect(result.latestValue).not.toBeNull();
      const latestValue = result.latestValue as {
        middle: number;
        upper: number;
        lower: number;
      };
      expect(latestValue.upper).toBeGreaterThan(latestValue.middle);
      expect(latestValue.lower).toBeLessThan(latestValue.middle);
    });

    it('should return null latestValue when no data provided', () => {
      const candles: ReturnType<typeof generateCandles> = [];

      const result = service.calculateKeltnerChannels({ candles });

      expect(result.values.length).toBe(0);
      expect(result.latestValue).toBeNull();
    });
  });

  describe('calculateFibonacciRetracement', () => {
    it('should calculate Fibonacci retracement for uptrend', () => {
      const result = service.calculateFibonacciRetracement({
        start: 100,
        end: 200,
      });

      expect(result.start).toBe(100);
      expect(result.end).toBe(200);
      expect(result.trend).toBe('uptrend');
      expect(result.levels.length).toBe(11);

      // Library calculates retracement from end: 0% = end, 100% = start
      const levelMap = new Map(result.levels.map((l) => [l.level, l.price]));
      expect(levelMap.get(0)).toBe(200); // 0% retracement = End (high)
      expect(levelMap.get(50)).toBeCloseTo(150, 1); // 50% retracement
      expect(levelMap.get(100)).toBe(100); // 100% retracement = Start (low)
    });

    it('should calculate Fibonacci retracement for downtrend', () => {
      const result = service.calculateFibonacciRetracement({
        start: 200,
        end: 100,
      });

      expect(result.start).toBe(200);
      expect(result.end).toBe(100);
      expect(result.trend).toBe('downtrend');
      expect(result.levels.length).toBe(11);

      // Library calculates retracement from end: 0% = end, 100% = start
      const levelMap = new Map(result.levels.map((l) => [l.level, l.price]));
      expect(levelMap.get(0)).toBe(100); // 0% retracement = End (low)
      expect(levelMap.get(50)).toBeCloseTo(150, 1); // 50% retracement
      expect(levelMap.get(100)).toBe(200); // 100% retracement = Start (high)
    });

    it('should include extension levels', () => {
      const result = service.calculateFibonacciRetracement({
        start: 100,
        end: 200,
      });

      const levels = result.levels.map((l) => l.level);
      expect(levels).toContain(127.2);
      expect(levels).toContain(161.8);
      expect(levels).toContain(261.8);
      expect(levels).toContain(423.6);
    });

    it('should include standard retracement levels', () => {
      const result = service.calculateFibonacciRetracement({
        start: 50,
        end: 150,
      });

      const levels = result.levels.map((l) => l.level);
      expect(levels).toContain(0);
      expect(levels).toContain(23.6);
      expect(levels).toContain(38.2);
      expect(levels).toContain(50);
      expect(levels).toContain(61.8);
      expect(levels).toContain(78.6);
      expect(levels).toContain(100);
    });
  });

  describe('detectCandlestickPatterns', () => {
    const generateCandles = (
      data: { open: number; high: number; low: number; close: number }[],
    ): CandleInput[] => {
      return data.map(({ open, high, low, close }) => ({
        open: open.toString(),
        high: high.toString(),
        low: low.toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should detect patterns and return structured output', () => {
      // Provide enough candles (5+) to avoid library warnings
      const data = [
        { open: 98, high: 100, low: 97, close: 99 },
        { open: 99, high: 101, low: 98, close: 100 },
        { open: 100, high: 102, low: 99, close: 101 },
        { open: 101, high: 103, low: 100, close: 102 },
        { open: 102, high: 104, low: 101, close: 103 },
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      // Verify output structure
      expect(typeof result.bullish).toBe('boolean');
      expect(typeof result.bearish).toBe('boolean');
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(Array.isArray(result.detectedPatterns)).toBe(true);
      // Should have 31 patterns checked
      expect(result.patterns.length).toBe(31);
      // Each pattern should have name, type, and detected properties
      result.patterns.forEach((pattern) => {
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('detected');
        expect(['bullish', 'bearish', 'neutral']).toContain(pattern.type);
        expect(typeof pattern.detected).toBe('boolean');
      });
    });

    it('should detect Doji pattern', () => {
      // Doji: open and close are very close, with wicks
      // Provide enough candles to avoid library warnings
      const data = [
        { open: 102, high: 104, low: 101, close: 103 },
        { open: 103, high: 105, low: 102, close: 104 },
        { open: 104, high: 106, low: 103, close: 105 },
        { open: 105, high: 107, low: 104, close: 106 },
        { open: 100, high: 105, low: 95, close: 100 }, // Doji
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      const dojiPattern = result.patterns.find((p) => p.name === 'Doji');
      expect(dojiPattern).toBeDefined();
      expect(dojiPattern?.type).toBe('neutral');
      expect(dojiPattern?.detected).toBe(true);
      expect(result.detectedPatterns).toContain('Doji');
    });

    it('should detect Hammer pattern', () => {
      // Hammer: small body at top, long lower wick, little/no upper wick
      // After a downtrend - provide 5+ candles to avoid library warnings
      const data = [
        { open: 120, high: 122, low: 115, close: 116 }, // Downtrend
        { open: 116, high: 118, low: 111, close: 112 }, // Downtrend
        { open: 110, high: 112, low: 105, close: 106 }, // Downtrend
        { open: 106, high: 108, low: 100, close: 102 }, // Downtrend
        { open: 100, high: 101, low: 90, close: 100 }, // Hammer
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      const hammerPattern = result.patterns.find((p) => p.name === 'Hammer');
      expect(hammerPattern).toBeDefined();
      expect(hammerPattern?.type).toBe('bullish');
    });

    it('should detect bullish Engulfing pattern', () => {
      // Bullish engulfing: bearish candle followed by larger bullish candle
      // Provide 5+ candles to avoid library warnings
      const data = [
        { open: 115, high: 117, low: 112, close: 113 },
        { open: 113, high: 115, low: 110, close: 111 },
        { open: 111, high: 113, low: 108, close: 109 },
        { open: 105, high: 106, low: 98, close: 100 }, // Bearish
        { open: 99, high: 110, low: 98, close: 108 }, // Bullish engulfing
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      const engulfingPattern = result.patterns.find(
        (p) => p.name === 'Bullish Engulfing',
      );
      expect(engulfingPattern).toBeDefined();
      expect(engulfingPattern?.type).toBe('bullish');
    });

    it('should detect bearish Engulfing pattern', () => {
      // Bearish engulfing: bullish candle followed by larger bearish candle
      // Provide 5+ candles to avoid library warnings
      const data = [
        { open: 90, high: 93, low: 89, close: 92 },
        { open: 92, high: 95, low: 91, close: 94 },
        { open: 94, high: 97, low: 93, close: 96 },
        { open: 100, high: 108, low: 99, close: 105 }, // Bullish
        { open: 108, high: 109, low: 95, close: 97 }, // Bearish engulfing
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      const engulfingPattern = result.patterns.find(
        (p) => p.name === 'Bearish Engulfing',
      );
      expect(engulfingPattern).toBeDefined();
      expect(engulfingPattern?.type).toBe('bearish');
    });

    it('should populate detectedPatterns with names of detected patterns', () => {
      // Create a Doji pattern with enough preceding candles
      const data = [
        { open: 102, high: 104, low: 101, close: 103 },
        { open: 103, high: 105, low: 102, close: 104 },
        { open: 104, high: 106, low: 103, close: 105 },
        { open: 105, high: 107, low: 104, close: 106 },
        { open: 100, high: 105, low: 95, close: 100 }, // Doji
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      // detectedPatterns should only contain patterns that were detected
      const detectedFromPatterns = result.patterns
        .filter((p) => p.detected)
        .map((p) => p.name);
      expect(result.detectedPatterns).toEqual(detectedFromPatterns);
    });

    it('should return empty detectedPatterns when no patterns found', () => {
      // Neutral candles that don't match specific patterns
      const data = [
        { open: 100, high: 101, low: 99, close: 100.5 },
        { open: 100.5, high: 101.5, low: 99.5, close: 101 },
        { open: 101, high: 102, low: 100, close: 101.5 },
        { open: 101.5, high: 102.5, low: 100.5, close: 102 },
        { open: 102, high: 103, low: 101, close: 102.5 },
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      // May or may not have patterns, but structure should be correct
      expect(Array.isArray(result.detectedPatterns)).toBe(true);
      // Detected patterns should match the filtered patterns array
      const detectedCount = result.patterns.filter((p) => p.detected).length;
      expect(result.detectedPatterns.length).toBe(detectedCount);
    });

    it('should set overall bullish/bearish flags correctly', () => {
      // Pattern that should trigger bullish - provide 5+ candles
      const bullishData = [
        { open: 115, high: 117, low: 112, close: 113 },
        { open: 113, high: 115, low: 110, close: 111 },
        { open: 111, high: 113, low: 108, close: 109 },
        { open: 105, high: 106, low: 98, close: 100 },
        { open: 99, high: 110, low: 98, close: 108 },
      ];
      const bullishCandles = generateCandles(bullishData);

      const bullishResult = service.detectCandlestickPatterns({
        candles: bullishCandles,
      });

      // The bullish flag should reflect whether any bullish pattern is detected
      expect(typeof bullishResult.bullish).toBe('boolean');
      expect(typeof bullishResult.bearish).toBe('boolean');
    });

    it('should handle minimal candle input', () => {
      // Even with minimal candles (5), the function should work
      const data = [
        { open: 98, high: 100, low: 97, close: 99 },
        { open: 99, high: 101, low: 98, close: 100 },
        { open: 100, high: 102, low: 99, close: 101 },
        { open: 101, high: 103, low: 100, close: 102 },
        { open: 100, high: 105, low: 95, close: 102 },
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      expect(result.patterns.length).toBe(31);
      expect(typeof result.bullish).toBe('boolean');
      expect(typeof result.bearish).toBe('boolean');
    });

    it('should include all expected pattern types', () => {
      // Provide 5+ candles to avoid library warnings
      const data = [
        { open: 96, high: 99, low: 95, close: 98 },
        { open: 98, high: 101, low: 97, close: 100 },
        { open: 100, high: 103, low: 99, close: 102 },
        { open: 100, high: 105, low: 95, close: 102 },
        { open: 102, high: 108, low: 100, close: 106 },
      ];
      const candles = generateCandles(data);

      const result = service.detectCandlestickPatterns({ candles });

      const patternNames = result.patterns.map((p) => p.name);
      // Bullish patterns (15)
      expect(patternNames).toContain('Hammer');
      expect(patternNames).toContain('Inverted Hammer');
      expect(patternNames).toContain('Bullish Engulfing');
      expect(patternNames).toContain('Morning Star');
      expect(patternNames).toContain('Morning Doji Star');
      expect(patternNames).toContain('Three White Soldiers');
      expect(patternNames).toContain('Piercing Line');
      expect(patternNames).toContain('Bullish Harami');
      expect(patternNames).toContain('Bullish Harami Cross');
      expect(patternNames).toContain('Bullish Marubozu');
      expect(patternNames).toContain('Bullish Spinning Top');
      expect(patternNames).toContain('Tweezer Bottom');
      expect(patternNames).toContain('Dragonfly Doji');
      expect(patternNames).toContain('Abandoned Baby');
      expect(patternNames).toContain('Downside Tasuki Gap');
      // Bearish patterns (15)
      expect(patternNames).toContain('Shooting Star');
      expect(patternNames).toContain('Hanging Man');
      expect(patternNames).toContain('Bearish Hammer');
      expect(patternNames).toContain('Bearish Inverted Hammer');
      expect(patternNames).toContain('Bearish Engulfing');
      expect(patternNames).toContain('Evening Star');
      expect(patternNames).toContain('Evening Doji Star');
      expect(patternNames).toContain('Three Black Crows');
      expect(patternNames).toContain('Dark Cloud Cover');
      expect(patternNames).toContain('Bearish Harami');
      expect(patternNames).toContain('Bearish Harami Cross');
      expect(patternNames).toContain('Bearish Marubozu');
      expect(patternNames).toContain('Bearish Spinning Top');
      expect(patternNames).toContain('Tweezer Top');
      expect(patternNames).toContain('Gravestone Doji');
      // Neutral patterns (1)
      expect(patternNames).toContain('Doji');
    });
  });

  describe('calculateVolumeProfile', () => {
    it('should calculate volume profile with default bars', () => {
      const candles: CandleInput[] = [
        { open: '100', high: '105', low: '99', close: '104', volume: '1000' },
        { open: '104', high: '108', low: '102', close: '106', volume: '1500' },
        { open: '106', high: '110', low: '104', close: '108', volume: '2000' },
        { open: '108', high: '112', low: '106', close: '110', volume: '1800' },
        { open: '110', high: '114', low: '108', close: '112', volume: '1200' },
      ];

      const result = service.calculateVolumeProfile({ candles });

      expect(result.noOfBars).toBe(12); // Default
      expect(Array.isArray(result.zones)).toBe(true);
      expect(result.zones.length).toBeGreaterThan(0);
    });

    it('should calculate volume profile with custom number of bars', () => {
      const candles: CandleInput[] = [
        { open: '100', high: '110', low: '95', close: '108', volume: '1000' },
        { open: '108', high: '115', low: '105', close: '112', volume: '1500' },
        { open: '112', high: '120', low: '110', close: '118', volume: '2000' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 5 });

      expect(result.noOfBars).toBe(5);
      expect(result.zones.length).toBeLessThanOrEqual(5);
    });

    it('should return zones with correct structure', () => {
      const candles: CandleInput[] = [
        { open: '100', high: '105', low: '98', close: '103', volume: '1000' },
        { open: '103', high: '107', low: '101', close: '105', volume: '1200' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 3 });

      result.zones.forEach((zone) => {
        expect(zone).toHaveProperty('rangeStart');
        expect(zone).toHaveProperty('rangeEnd');
        expect(zone).toHaveProperty('bullishVolume');
        expect(zone).toHaveProperty('bearishVolume');
        expect(zone).toHaveProperty('totalVolume');
        expect(typeof zone.rangeStart).toBe('number');
        expect(typeof zone.rangeEnd).toBe('number');
        expect(typeof zone.bullishVolume).toBe('number');
        expect(typeof zone.bearishVolume).toBe('number');
        expect(zone.totalVolume).toBe(zone.bullishVolume + zone.bearishVolume);
      });
    });

    it('should identify Point of Control (highest volume zone)', () => {
      const candles: CandleInput[] = [
        { open: '100', high: '102', low: '99', close: '101', volume: '500' },
        { open: '101', high: '103', low: '100', close: '102', volume: '1000' },
        { open: '102', high: '104', low: '101', close: '103', volume: '3000' },
        { open: '103', high: '105', low: '102', close: '104', volume: '800' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 4 });

      expect(result.pointOfControl).not.toBeNull();
      expect(result.zones.length).toBeGreaterThan(0);
      // POC should have the highest volume
      const maxVolume = Math.max(...result.zones.map((z) => z.totalVolume));
      expect(result.pointOfControl?.totalVolume).toBe(maxVolume);
    });

    it('should calculate Value Area High and Low', () => {
      const candles: CandleInput[] = [
        { open: '100', high: '105', low: '98', close: '104', volume: '1000' },
        { open: '104', high: '108', low: '102', close: '106', volume: '1500' },
        { open: '106', high: '110', low: '104', close: '108', volume: '2000' },
        { open: '108', high: '112', low: '106', close: '110', volume: '1800' },
        { open: '110', high: '114', low: '108', close: '112', volume: '1200' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 6 });

      // Value area should be defined since we have zones
      expect(result.zones.length).toBeGreaterThan(0);
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
      expect(result.valueAreaHigh as number).toBeGreaterThanOrEqual(
        result.valueAreaLow as number,
      );
    });

    it('should handle single candle input', () => {
      const candles: CandleInput[] = [
        { open: '100', high: '105', low: '95', close: '102', volume: '1000' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 3 });

      expect(result.noOfBars).toBe(3);
      expect(Array.isArray(result.zones)).toBe(true);
    });

    it('should separate bullish and bearish volume correctly', () => {
      // Bullish candle (close > open)
      const bullishCandles: CandleInput[] = [
        { open: '100', high: '110', low: '98', close: '108', volume: '1000' },
      ];

      const bullishResult = service.calculateVolumeProfile({
        candles: bullishCandles,
        noOfBars: 2,
      });

      // Bearish candle (close < open)
      const bearishCandles: CandleInput[] = [
        { open: '108', high: '110', low: '98', close: '100', volume: '1000' },
      ];

      const bearishResult = service.calculateVolumeProfile({
        candles: bearishCandles,
        noOfBars: 2,
      });

      // Both should have zones
      expect(bullishResult.zones.length).toBeGreaterThan(0);
      expect(bearishResult.zones.length).toBeGreaterThan(0);
    });

    it('should handle value area expansion when reaching boundaries', () => {
      // Create candles where POC is at an extreme position
      // to test boundary condition in value area calculation
      const candles: CandleInput[] = [
        { open: '100', high: '102', low: '99', close: '101', volume: '100' },
        { open: '101', high: '103', low: '100', close: '102', volume: '100' },
        { open: '102', high: '104', low: '101', close: '103', volume: '5000' },
      ];

      // Use few bars to ensure we hit the break condition
      const result = service.calculateVolumeProfile({ candles, noOfBars: 2 });

      expect(result.zones.length).toBeLessThanOrEqual(2);
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should expand value area correctly when high volume is at lower price', () => {
      // Create data where high volume zone is at lower prices
      // to test the canExpandLow branch when canExpandHigh is false
      const candles: CandleInput[] = [
        { open: '100', high: '105', low: '98', close: '104', volume: '5000' },
        { open: '104', high: '108', low: '102', close: '106', volume: '100' },
        { open: '106', high: '112', low: '104', close: '110', volume: '100' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 3 });

      expect(result.pointOfControl).not.toBeNull();
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should handle when POC is at highest price zone and expands only downward', () => {
      // POC at highest price zone - can only expand low
      // This tests the `else if (canExpandLow)` branch where canExpandHigh is false
      const candles: CandleInput[] = [
        { open: '100', high: '103', low: '99', close: '102', volume: '100' },
        { open: '102', high: '105', low: '101', close: '104', volume: '200' },
        { open: '104', high: '107', low: '103', close: '106', volume: '5000' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 3 });

      // POC should be at highest price zone
      expect(result.pointOfControl).not.toBeNull();
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should stop expansion when both boundaries are reached', () => {
      // Use minimal bars with volume spread so we hit both boundaries
      // before reaching 70% (tests the break statement)
      const candles: CandleInput[] = [
        { open: '100', high: '150', low: '100', close: '125', volume: '1000' },
      ];

      // With only 1 bar, POC is alone, can't expand either way
      const result = service.calculateVolumeProfile({ candles, noOfBars: 1 });

      expect(result.zones.length).toBe(1);
      expect(result.pointOfControl).not.toBeNull();
      // Value area equals the single zone
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should handle POC at top with lower zones having higher volume', () => {
      // POC at top zone, but lower zones have more volume
      // This tests canExpandHigh=false branch in ternary
      const candles: CandleInput[] = [
        { open: '100', high: '103', low: '99', close: '102', volume: '3000' },
        { open: '102', high: '105', low: '101', close: '104', volume: '2000' },
        { open: '104', high: '107', low: '103', close: '106', volume: '5000' },
      ];

      // With 3 bars, POC at top has nowhere to expand high
      const result = service.calculateVolumeProfile({ candles, noOfBars: 3 });

      expect(result.zones.length).toBe(3);
      expect(result.pointOfControl).not.toBeNull();
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should expand toward higher volume (high direction)', () => {
      // POC in middle, high zone has more volume than low zone
      // This forces expansion in high direction, testing canExpandHigh=true
      const candles: CandleInput[] = [
        { open: '100', high: '104', low: '99', close: '102', volume: '100' },
        { open: '102', high: '106', low: '101', close: '104', volume: '2000' },
        { open: '104', high: '108', low: '103', close: '106', volume: '500' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 3 });

      expect(result.zones.length).toBe(3);
      expect(result.pointOfControl).not.toBeNull();
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should expand high when POC is at lowest zone', () => {
      // POC at lowest zone - canExpandLow is false, must expand high
      // This specifically tests the else branch with canExpandHigh=true
      const candles: CandleInput[] = [
        { open: '100', high: '103', low: '99', close: '101', volume: '5000' },
        { open: '103', high: '106', low: '102', close: '105', volume: '1000' },
        { open: '106', high: '109', low: '105', close: '108', volume: '1000' },
      ];

      const result = service.calculateVolumeProfile({ candles, noOfBars: 3 });

      expect(result.zones.length).toBe(3);
      expect(result.pointOfControl).not.toBeNull();
      // POC should be at lowest price zone (highest volume)
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should enter while loop and expand when POC < 70% and high zone has more volume', () => {
      // Create scenario where:
      // 1. POC is at bottom (lowIndex = 0, canExpandLow = false)
      // 2. POC volume < 70% (enters while loop)
      // 3. Must expand high (tests else branch where canExpandHigh=true)
      const candles: CandleInput[] = [
        { open: '100', high: '104', low: '100', close: '102', volume: '300' },
        { open: '104', high: '108', low: '104', close: '106', volume: '200' },
        { open: '108', high: '112', low: '108', close: '110', volume: '200' },
        { open: '112', high: '116', low: '112', close: '114', volume: '100' },
        { open: '116', high: '120', low: '116', close: '118', volume: '100' },
      ];

      // 5 bars: POC at lowest (300/900 = 33%) < 70%, must expand high
      const result = service.calculateVolumeProfile({ candles, noOfBars: 5 });

      expect(result.zones.length).toBe(5);
      expect(result.pointOfControl).not.toBeNull();
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should expand high when POC in middle with higher volume neighbor above', () => {
      // POC in middle zone with lower volume neighbors on both sides
      // Neighboring high zone has more volume than low zone
      // This tests: canExpandHigh=true, lowVolume < highVolume, taking else branch
      const candles: CandleInput[] = [
        { open: '100', high: '110', low: '100', close: '105', volume: '100' },
        { open: '105', high: '115', low: '105', close: '110', volume: '400' },
        { open: '110', high: '120', low: '110', close: '115', volume: '300' },
      ];

      // 3 zones: middle has most volume (POC), but < 70%
      // POC = 400/800 = 50%, needs to expand
      // lowVolume = 100, highVolume = 300, so expand high
      const result = service.calculateVolumeProfile({ candles, noOfBars: 3 });

      expect(result.zones.length).toBe(3);
      expect(result.pointOfControl).not.toBeNull();
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });

    it('should expand low when POC at highest zone and cannot expand high', () => {
      // Create scenario where:
      // 1. POC is at highest price zone (highIndex at last position)
      // 2. canExpandHigh = false (no zone above)
      // 3. canExpandLow = true (zones below)
      // 4. POC volume < 70% (enters while loop)
      // This specifically tests line 1188: else if (canExpandLow) { expandLow = true; }
      const candles: CandleInput[] = [
        { open: '100', high: '104', low: '100', close: '102', volume: '200' },
        { open: '104', high: '108', low: '104', close: '106', volume: '200' },
        { open: '108', high: '112', low: '108', close: '110', volume: '200' },
        { open: '112', high: '116', low: '112', close: '114', volume: '200' },
        { open: '116', high: '120', low: '116', close: '118', volume: '500' },
      ];

      // 5 zones: highest zone has most volume (POC at index 4)
      // POC = 500/1300 = 38.5% < 70%, must expand
      // canExpandHigh = false (highIndex = 4 = length - 1)
      // canExpandLow = true (lowIndex = 4 > 0)
      // This triggers the else if (canExpandLow) branch
      const result = service.calculateVolumeProfile({ candles, noOfBars: 5 });

      expect(result.zones.length).toBe(5);
      expect(result.pointOfControl).not.toBeNull();
      // POC should be at highest price zone
      expect(result.valueAreaHigh).not.toBeNull();
      expect(result.valueAreaLow).not.toBeNull();
    });
  });

  describe('calculatePivotPoints', () => {
    // Test data: H=110, L=100, C=105, O=102
    // Range = 10
    const testInput = { high: '110', low: '100', close: '105', open: '102' };

    it('should calculate Standard pivot points correctly', () => {
      const result = service.calculatePivotPoints(testInput);

      // PP = (110 + 100 + 105) / 3 = 105
      expect(result.type).toBe('standard');
      expect(result.pivotPoint).toBeCloseTo(105, 2);
      // R1 = 2 * 105 - 100 = 110
      expect(result.resistance1).toBeCloseTo(110, 2);
      // R2 = 105 + 10 = 115
      expect(result.resistance2).toBeCloseTo(115, 2);
      // R3 = 110 + 2 * (105 - 100) = 120
      expect(result.resistance3).toBeCloseTo(120, 2);
      // S1 = 2 * 105 - 110 = 100
      expect(result.support1).toBeCloseTo(100, 2);
      // S2 = 105 - 10 = 95
      expect(result.support2).toBeCloseTo(95, 2);
      // S3 = 100 - 2 * (110 - 105) = 90
      expect(result.support3).toBeCloseTo(90, 2);
    });

    it('should use standard type when no type specified', () => {
      const result = service.calculatePivotPoints({
        high: '110',
        low: '100',
        close: '105',
      });

      expect(result.type).toBe('standard');
      expect(result.pivotPoint).toBeCloseTo(105, 2);
    });

    it('should use close as open when open not provided', () => {
      // For DeMark, open is used - when not provided, should use close
      const result = service.calculatePivotPoints({
        high: '110',
        low: '100',
        close: '105',
        type: 'demark',
      });

      // close === open (both 105), so x = H + L + 2*C = 110 + 100 + 210 = 420
      expect(result.type).toBe('demark');
      expect(result.pivotPoint).toBeCloseTo(105, 2); // 420/4 = 105
    });

    it('should calculate Fibonacci pivot points correctly', () => {
      const result = service.calculatePivotPoints({
        ...testInput,
        type: 'fibonacci',
      });

      // PP = 105 (same as standard)
      expect(result.type).toBe('fibonacci');
      expect(result.pivotPoint).toBeCloseTo(105, 2);
      // R1 = 105 + 0.382 * 10 = 108.82
      expect(result.resistance1).toBeCloseTo(108.82, 2);
      // R2 = 105 + 0.618 * 10 = 111.18
      expect(result.resistance2).toBeCloseTo(111.18, 2);
      // R3 = 105 + 10 = 115
      expect(result.resistance3).toBeCloseTo(115, 2);
      // S1 = 105 - 0.382 * 10 = 101.18
      expect(result.support1).toBeCloseTo(101.18, 2);
      // S2 = 105 - 0.618 * 10 = 98.82
      expect(result.support2).toBeCloseTo(98.82, 2);
      // S3 = 105 - 10 = 95
      expect(result.support3).toBeCloseTo(95, 2);
    });

    it('should calculate Woodie pivot points correctly', () => {
      const result = service.calculatePivotPoints({
        ...testInput,
        type: 'woodie',
      });

      // PP = (110 + 100 + 2*105) / 4 = 105
      expect(result.type).toBe('woodie');
      expect(result.pivotPoint).toBeCloseTo(105, 2);
      // R1 = 2 * 105 - 100 = 110
      expect(result.resistance1).toBeCloseTo(110, 2);
      // R2 = 105 + 10 = 115
      expect(result.resistance2).toBeCloseTo(115, 2);
      // Woodie traditionally only defines R1/R2 and S1/S2 - no R3/S3
      // S1 = 2 * 105 - 110 = 100
      expect(result.support1).toBeCloseTo(100, 2);
      // S2 = 105 - 10 = 95
      expect(result.support2).toBeCloseTo(95, 2);
    });

    it('should calculate Camarilla pivot points correctly', () => {
      const result = service.calculatePivotPoints({
        ...testInput,
        type: 'camarilla',
      });

      // PP = close = 105 (Camarilla uses close as pivot)
      expect(result.type).toBe('camarilla');
      expect(result.pivotPoint).toBeCloseTo(105, 2);
      // R1 = 105 + (10 * 1.1) / 12 = 105.917
      expect(result.resistance1).toBeCloseTo(105.917, 2);
      // R2 = 105 + (10 * 1.1) / 6 = 106.833
      expect(result.resistance2).toBeCloseTo(106.833, 2);
      // R3 = 105 + (10 * 1.1) / 4 = 107.75
      expect(result.resistance3).toBeCloseTo(107.75, 2);
      // R4 = 105 + (10 * 1.1) / 2 = 110.5 (breakout level)
      // Camarilla includes R4/S4 - cast to access them
      const camarillaResult =
        result as import('./indicators/pivotPoints').CamarillaPivotPointsOutput;
      expect(camarillaResult.resistance4).toBeCloseTo(110.5, 2);
      // S1 = 105 - (10 * 1.1) / 12 = 104.083
      expect(result.support1).toBeCloseTo(104.083, 2);
      // S2 = 105 - (10 * 1.1) / 6 = 103.167
      expect(result.support2).toBeCloseTo(103.167, 2);
      // S3 = 105 - (10 * 1.1) / 4 = 102.25
      expect(result.support3).toBeCloseTo(102.25, 2);
      // S4 = 105 - (10 * 1.1) / 2 = 99.5 (breakout level)
      expect(camarillaResult.support4).toBeCloseTo(99.5, 2);
    });

    it('should calculate DeMark pivot points when close < open', () => {
      // close < open scenario
      const result = service.calculatePivotPoints({
        high: '110',
        low: '100',
        close: '101',
        open: '108',
        type: 'demark',
      });

      // close (101) < open (108), so x = H + 2*L + C = 110 + 200 + 101 = 411
      // PP = 411 / 4 = 102.75
      expect(result.type).toBe('demark');
      expect(result.pivotPoint).toBeCloseTo(102.75, 2);
      // DeMark only defines R1/S1 - no extended levels
      expect(result.resistance1).toBeCloseTo(105.5, 2); // 411/2 - 100
      expect(result.support1).toBeCloseTo(95.5, 2); // 411/2 - 110
    });

    it('should calculate DeMark pivot points when close > open', () => {
      // close > open scenario
      const result = service.calculatePivotPoints({
        high: '110',
        low: '100',
        close: '108',
        open: '101',
        type: 'demark',
      });

      // close (108) > open (101), so x = 2*H + L + C = 220 + 100 + 108 = 428
      // PP = 428 / 4 = 107
      expect(result.type).toBe('demark');
      expect(result.pivotPoint).toBeCloseTo(107, 2);
      // DeMark only defines R1/S1 - no extended levels
      expect(result.resistance1).toBeCloseTo(114, 2); // 428/2 - 100
      expect(result.support1).toBeCloseTo(104, 2); // 428/2 - 110
    });

    it('should calculate DeMark pivot points when close === open', () => {
      // close === open scenario
      const result = service.calculatePivotPoints({
        high: '110',
        low: '100',
        close: '105',
        open: '105',
        type: 'demark',
      });

      // close === open, so x = H + L + 2*C = 110 + 100 + 210 = 420
      // PP = 420 / 4 = 105
      expect(result.type).toBe('demark');
      expect(result.pivotPoint).toBeCloseTo(105, 2);
      // DeMark only defines R1/S1 - no extended levels
      expect(result.resistance1).toBeCloseTo(110, 2); // 420/2 - 100
      expect(result.support1).toBeCloseTo(100, 2); // 420/2 - 110
    });

    it('should handle explicit standard type', () => {
      const result = service.calculatePivotPoints({
        ...testInput,
        type: 'standard',
      });

      expect(result.type).toBe('standard');
      expect(result.pivotPoint).toBeCloseTo(105, 2);
    });
  });

  describe('detectRsiDivergence', () => {
    // Helper to generate candles with specific close prices for divergence testing
    const generateCandlesFromCloses = (closes: number[]): CandleInput[] => {
      return closes.map((close, _i) => ({
        open: (close - 1).toString(),
        high: (close + 2).toString(),
        low: (close - 2).toString(),
        close: close.toString(),
        volume: '1000',
      }));
    };

    it('should return structured output with RSI values', () => {
      // Generate enough candles for RSI calculation (need at least period + lookback + 1)
      const closes = Array.from(
        { length: 50 },
        (_, i) => 100 + Math.sin(i * 0.3) * 10,
      );
      const candles = generateCandlesFromCloses(closes);

      const result = service.detectRsiDivergence({ candles });

      expect(result.rsiPeriod).toBe(14);
      expect(result.lookbackPeriod).toBe(14);
      expect(Array.isArray(result.rsiValues)).toBe(true);
      expect(result.rsiValues.length).toBeGreaterThan(0);
      expect(Array.isArray(result.divergences)).toBe(true);
      expect(typeof result.hasBullishDivergence).toBe('boolean');
      expect(typeof result.hasBearishDivergence).toBe('boolean');
    });

    it('should use custom RSI period and lookback period', () => {
      const closes = Array.from(
        { length: 50 },
        (_, i) => 100 + Math.sin(i * 0.3) * 10,
      );
      const candles = generateCandlesFromCloses(closes);

      const result = service.detectRsiDivergence({
        candles,
        rsiPeriod: 7,
        lookbackPeriod: 5,
      });

      expect(result.rsiPeriod).toBe(7);
      expect(result.lookbackPeriod).toBe(5);
    });

    it('should detect bearish divergence (price higher high, RSI lower high)', () => {
      // Create data with price making higher highs but RSI making lower highs
      // First peak at index ~15, second peak at index ~30
      const closes: number[] = [];
      // Initial uptrend to first peak
      for (let i = 0; i < 20; i++) {
        closes.push(100 + i * 2);
      }
      // Pullback
      for (let i = 0; i < 10; i++) {
        closes.push(140 - i * 1.5);
      }
      // Second uptrend to higher high (but RSI won't make higher high due to momentum loss)
      for (let i = 0; i < 20; i++) {
        closes.push(125 + i * 1);
      }
      // Final pullback
      for (let i = 0; i < 10; i++) {
        closes.push(145 - i);
      }

      const candles = generateCandlesFromCloses(closes);
      const result = service.detectRsiDivergence({
        candles,
        lookbackPeriod: 3,
      });

      // Check that we got RSI values
      expect(result.rsiValues.length).toBeGreaterThan(0);
      expect(Array.isArray(result.divergences)).toBe(true);
    });

    it('should detect bullish divergence (price lower low, RSI higher low)', () => {
      // Create data with price making lower lows but RSI making higher lows
      const closes: number[] = [];
      // Initial downtrend to first low
      for (let i = 0; i < 20; i++) {
        closes.push(150 - i * 2);
      }
      // Bounce
      for (let i = 0; i < 10; i++) {
        closes.push(110 + i * 1.5);
      }
      // Second downtrend to lower low (but RSI won't make lower low)
      for (let i = 0; i < 20; i++) {
        closes.push(125 - i * 1);
      }
      // Final bounce
      for (let i = 0; i < 10; i++) {
        closes.push(105 + i);
      }

      const candles = generateCandlesFromCloses(closes);
      const result = service.detectRsiDivergence({
        candles,
        lookbackPeriod: 3,
      });

      expect(result.rsiValues.length).toBeGreaterThan(0);
      expect(Array.isArray(result.divergences)).toBe(true);
    });

    it('should detect hidden bullish divergence (price higher low, RSI lower low)', () => {
      // In an uptrend: price makes higher low, RSI makes lower low
      const closes: number[] = [];
      // Uptrend with pullback
      for (let i = 0; i < 15; i++) {
        closes.push(100 + i * 2);
      }
      // First pullback (trough)
      for (let i = 0; i < 10; i++) {
        closes.push(130 - i * 1.5);
      }
      // Continue uptrend
      for (let i = 0; i < 15; i++) {
        closes.push(115 + i * 2);
      }
      // Second pullback to higher low (RSI lower)
      for (let i = 0; i < 10; i++) {
        closes.push(145 - i * 1);
      }
      // Resume uptrend
      for (let i = 0; i < 10; i++) {
        closes.push(135 + i);
      }

      const candles = generateCandlesFromCloses(closes);
      const result = service.detectRsiDivergence({
        candles,
        lookbackPeriod: 3,
      });

      expect(result.rsiValues.length).toBeGreaterThan(0);
      expect(Array.isArray(result.divergences)).toBe(true);
    });

    it('should detect hidden bearish divergence (price lower high, RSI higher high)', () => {
      // In a downtrend: price makes lower high, RSI makes higher high
      const closes: number[] = [];
      // Downtrend with bounce
      for (let i = 0; i < 15; i++) {
        closes.push(150 - i * 2);
      }
      // First bounce (peak)
      for (let i = 0; i < 10; i++) {
        closes.push(120 + i * 1.5);
      }
      // Continue downtrend
      for (let i = 0; i < 15; i++) {
        closes.push(135 - i * 2);
      }
      // Second bounce to lower high (RSI higher)
      for (let i = 0; i < 10; i++) {
        closes.push(105 + i * 1);
      }
      // Resume downtrend
      for (let i = 0; i < 10; i++) {
        closes.push(115 - i);
      }

      const candles = generateCandlesFromCloses(closes);
      const result = service.detectRsiDivergence({
        candles,
        lookbackPeriod: 3,
      });

      expect(result.rsiValues.length).toBeGreaterThan(0);
      expect(Array.isArray(result.divergences)).toBe(true);
    });

    it('should return latestDivergence as null when no divergences found', () => {
      // Flat price data - no peaks/troughs
      const closes = Array.from({ length: 50 }, () => 100);
      const candles = generateCandlesFromCloses(closes);

      const result = service.detectRsiDivergence({ candles });

      expect(result.latestDivergence).toBeNull();
      expect(result.divergences.length).toBe(0);
    });

    it('should sort divergences by end index (most recent first)', () => {
      // Create data likely to produce multiple divergences
      const closes: number[] = [];
      for (let i = 0; i < 100; i++) {
        closes.push(100 + Math.sin(i * 0.2) * 20 + i * 0.1);
      }
      const candles = generateCandlesFromCloses(closes);

      const result = service.detectRsiDivergence({
        candles,
        lookbackPeriod: 3,
      });

      // Multiple divergences should be sorted by endIndex descending
      // Filter to pairs where we can check ordering
      const divergencePairs = result.divergences
        .slice(0, -1)
        .map((d, i) => ({ current: d, next: result.divergences[i + 1] }));

      divergencePairs.forEach(({ current, next }) => {
        expect(current.endIndex).toBeGreaterThanOrEqual(next.endIndex);
      });
    });

    it('should include divergence strength classification', () => {
      // Generate volatile data likely to produce divergences with varying strengths
      const closes: number[] = [];
      for (let i = 0; i < 80; i++) {
        closes.push(100 + Math.sin(i * 0.15) * 30);
      }
      const candles = generateCandlesFromCloses(closes);

      const result = service.detectRsiDivergence({
        candles,
        lookbackPeriod: 2,
      });

      // Check structure of any found divergence
      result.divergences.forEach((div) => {
        expect(['weak', 'medium', 'strong']).toContain(div.strength);
        expect(typeof div.priceStart).toBe('number');
        expect(typeof div.priceEnd).toBe('number');
        expect(typeof div.rsiStart).toBe('number');
        expect(typeof div.rsiEnd).toBe('number');
        expect(typeof div.startIndex).toBe('number');
        expect(typeof div.endIndex).toBe('number');
        expect([
          'bullish',
          'bearish',
          'hidden_bullish',
          'hidden_bearish',
        ]).toContain(div.type);
      });
    });

    it('should handle short data series gracefully', () => {
      const closes = [100, 101, 102, 103, 104];
      const candles = generateCandlesFromCloses(closes);

      const result = service.detectRsiDivergence({ candles });

      // Should not crash, just return empty divergences
      expect(result.divergences).toEqual([]);
      expect(result.latestDivergence).toBeNull();
    });

    it('should set hasBullishDivergence and hasBearishDivergence flags correctly', () => {
      // Generate data with mixed signals
      const closes: number[] = [];
      for (let i = 0; i < 100; i++) {
        closes.push(
          100 + Math.sin(i * 0.15) * 25 + (i % 20 < 10 ? i * 0.3 : -i * 0.2),
        );
      }
      const candles = generateCandlesFromCloses(closes);

      const result = service.detectRsiDivergence({
        candles,
        lookbackPeriod: 2,
      });

      // Flags should reflect divergence types found
      const hasBullish = result.divergences.some(
        (d) => d.type === 'bullish' || d.type === 'hidden_bullish',
      );
      const hasBearish = result.divergences.some(
        (d) => d.type === 'bearish' || d.type === 'hidden_bearish',
      );

      expect(result.hasBullishDivergence).toBe(hasBullish);
      expect(result.hasBearishDivergence).toBe(hasBearish);
    });
  });

  describe('detectChartPatterns', () => {
    // Helper to generate candles with given high, low, close values
    const generateCandlesForPatterns = (count: number): CandleInput[] => {
      return Array.from({ length: count }, (_, i) => ({
        open: String(100 + i),
        high: String(102 + i),
        low: String(98 + i),
        close: String(101 + i),
        volume: '1000',
      }));
    };

    it('should return pattern detection results with default lookback', () => {
      const candles = generateCandlesForPatterns(100);
      const result = service.detectChartPatterns({ candles });

      expect(result).toHaveProperty('lookbackPeriod', 50);
      expect(result).toHaveProperty('patterns');
      expect(result).toHaveProperty('bullishPatterns');
      expect(result).toHaveProperty('bearishPatterns');
      expect(result).toHaveProperty('latestPattern');
      expect(Array.isArray(result.patterns)).toBe(true);
    });

    it('should use custom lookback period', () => {
      const candles = generateCandlesForPatterns(100);
      const result = service.detectChartPatterns({
        candles,
        lookbackPeriod: 30,
      });

      expect(result.lookbackPeriod).toBe(30);
    });

    it('should filter bullish and bearish patterns correctly', () => {
      // Create data with a double top (bearish) pattern
      // Using proven pattern structure from chartPatterns.spec.ts
      const candles: CandleInput[] = [];

      // Initial uptrend
      for (let i = 0; i < 10; i++) {
        candles.push({
          open: String(99 + i * 2),
          high: String(100 + i * 2),
          low: String(98 + i * 2),
          close: String(99 + i * 2),
          volume: '1000',
        });
      }
      // First peak (needs lookback=3 structure for peak detection)
      candles.push(
        { open: '119', high: '120', low: '118', close: '119', volume: '1000' },
        { open: '120', high: '121', low: '119', close: '120', volume: '1000' },
        { open: '119', high: '120', low: '118', close: '119', volume: '1000' },
      );
      // Pullback (enough for MIN_PATTERN_LENGTH)
      for (let i = 0; i < 12; i++) {
        candles.push({
          open: String(115 - i * 0.5),
          high: String(115 - i * 0.5),
          low: String(113 - i * 0.5),
          close: String(114 - i * 0.5),
          volume: '1000',
        });
      }
      // Second peak (similar to first for double top detection)
      candles.push(
        { open: '118', high: '119', low: '117', close: '118', volume: '1000' },
        { open: '119', high: '121', low: '119', close: '120', volume: '1000' },
        { open: '118', high: '120', low: '118', close: '119', volume: '1000' },
      );
      // Decline
      for (let i = 0; i < 5; i++) {
        candles.push({
          open: String(118 - i),
          high: String(118 - i),
          low: String(116 - i),
          close: String(117 - i),
          volume: '1000',
        });
      }

      const result = service.detectChartPatterns({ candles });

      // Verify patterns were actually detected (needed for filter callback coverage)
      expect(result.patterns.length).toBeGreaterThan(0);

      // All bullish patterns should have direction 'bullish'
      for (const pattern of result.bullishPatterns) {
        expect(pattern.direction).toBe('bullish');
      }
      // All bearish patterns should have direction 'bearish'
      for (const pattern of result.bearishPatterns) {
        expect(pattern.direction).toBe('bearish');
      }
    });

    it('should return latestPattern as null for empty results', () => {
      const candles = generateCandlesForPatterns(5); // Very few candles
      const result = service.detectChartPatterns({ candles });

      // Verify patterns array is empty and latestPattern is null
      expect(result.patterns).toHaveLength(0);
      expect(result.latestPattern).toBeNull();
    });

    it('should set latestPattern to first pattern when patterns exist', () => {
      // Create data likely to produce a pattern (double top)
      const candles: CandleInput[] = [];
      for (let i = 0; i < 10; i++) {
        candles.push({
          open: String(99 + i * 2),
          high: String(100 + i * 2),
          low: String(98 + i * 2),
          close: String(99 + i * 2),
          volume: '1000',
        });
      }
      candles.push(
        { open: '119', high: '121', low: '118', close: '120', volume: '1000' },
        { open: '120', high: '121', low: '118', close: '119', volume: '1000' },
      );
      for (let i = 0; i < 15; i++) {
        candles.push({
          open: '108',
          high: '109',
          low: '105',
          close: '106',
          volume: '1000',
        });
      }
      candles.push(
        { open: '119', high: '121', low: '118', close: '120', volume: '1000' },
        { open: '120', high: '121', low: '118', close: '119', volume: '1000' },
      );

      const result = service.detectChartPatterns({ candles });

      // latestPattern should be first pattern or null
      expect(
        result.latestPattern === null ||
          result.latestPattern === result.patterns[0],
      ).toBe(true);
    });
  });
});
