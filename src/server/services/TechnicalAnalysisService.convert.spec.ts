import { describe, it, expect } from '@jest/globals';
import { toCandleInputs } from './TechnicalAnalysisService.convert';

describe('TechnicalAnalysisService.convert', () => {
  describe('toCandleInputs', () => {
    it('should map SDK candle to CandleInput with number types', () => {
      const sdkCandles = [
        {
          open: '100.5',
          high: '105.0',
          low: '99.0',
          close: '103.5',
          volume: '1000000',
        },
      ];

      const result = toCandleInputs(sdkCandles);

      expect(result).toEqual([
        {
          open: 100.5,
          high: 105.0,
          low: 99.0,
          close: 103.5,
          volume: 1000000,
        },
      ]);
    });

    it('should default missing values to 0', () => {
      const sdkCandles = [{}];

      const result = toCandleInputs(sdkCandles);

      expect(result).toEqual([
        {
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          volume: 0,
        },
      ]);
    });

    it('should handle partial candle data', () => {
      const sdkCandles = [
        {
          open: '100.5',
          close: '103.5',
        },
      ];

      const result = toCandleInputs(sdkCandles);

      expect(result).toEqual([
        {
          open: 100.5,
          high: 0,
          low: 0,
          close: 103.5,
          volume: 0,
        },
      ]);
    });

    it('should map array of SDK candles to CandleInput[]', () => {
      const sdkCandles = [
        {
          open: '100.5',
          high: '105.0',
          low: '99.0',
          close: '103.5',
          volume: '1000000',
        },
        {
          open: '103.5',
          high: '108.0',
          low: '102.0',
          close: '107.0',
          volume: '1200000',
        },
      ];

      const result = toCandleInputs(sdkCandles);

      expect(result).toEqual([
        { open: 100.5, high: 105.0, low: 99.0, close: 103.5, volume: 1000000 },
        { open: 103.5, high: 108.0, low: 102.0, close: 107.0, volume: 1200000 },
      ]);
    });

    it('should return empty array for undefined input', () => {
      const result = toCandleInputs(undefined);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      const result = toCandleInputs([]);

      expect(result).toEqual([]);
    });
  });
});
