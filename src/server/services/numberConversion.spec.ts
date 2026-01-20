import { describe, it, expect } from '@jest/globals';
import {
  toString,
  toStringRequired,
  toNumber,
  toNumberRequired,
  mapSdkCandleToInput,
  mapSdkCandlesToInput,
} from './numberConversion';

describe('numberConversion', () => {
  describe('toString', () => {
    it('should convert number to string', () => {
      expect(toString(123)).toBe('123');
      expect(toString(123.456)).toBe('123.456');
      expect(toString(0)).toBe('0');
      expect(toString(-123.456)).toBe('-123.456');
    });

    it('should return undefined for undefined input', () => {
      expect(toString(undefined)).toBeUndefined();
    });
  });

  describe('toStringRequired', () => {
    it('should convert number to string', () => {
      expect(toStringRequired(123)).toBe('123');
      expect(toStringRequired(123.456)).toBe('123.456');
      expect(toStringRequired(0)).toBe('0');
      expect(toStringRequired(-123.456)).toBe('-123.456');
    });
  });

  describe('toNumber', () => {
    it('should convert string to number', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('123.456')).toBe(123.456);
      expect(toNumber('0')).toBe(0);
      expect(toNumber('-123.456')).toBe(-123.456);
    });

    it('should return undefined for undefined input', () => {
      expect(toNumber(undefined)).toBeUndefined();
    });

    it('should throw Error for invalid number strings', () => {
      expect(() => toNumber('not a number')).toThrow(
        'Invalid number: "not a number"',
      );
      expect(() => toNumber('NaN')).toThrow('Invalid number: "NaN"');
      expect(() => toNumber('Infinity')).toThrow('Invalid number: "Infinity"');
      expect(() => toNumber('-Infinity')).toThrow(
        'Invalid number: "-Infinity"',
      );
    });

    it('should handle empty string', () => {
      expect(() => toNumber('')).toThrow('Invalid number: ""');
    });
  });

  describe('toNumberRequired', () => {
    it('should convert string to number', () => {
      expect(toNumberRequired('123')).toBe(123);
      expect(toNumberRequired('123.456')).toBe(123.456);
      expect(toNumberRequired('0')).toBe(0);
      expect(toNumberRequired('-123.456')).toBe(-123.456);
    });

    it('should throw Error for invalid number strings', () => {
      expect(() => toNumberRequired('not a number')).toThrow(
        'Invalid number: "not a number"',
      );
      expect(() => toNumberRequired('NaN')).toThrow('Invalid number: "NaN"');
      expect(() => toNumberRequired('Infinity')).toThrow(
        'Invalid number: "Infinity"',
      );
      expect(() => toNumberRequired('-Infinity')).toThrow(
        'Invalid number: "-Infinity"',
      );
    });

    it('should handle empty string', () => {
      expect(() => toNumberRequired('')).toThrow('Invalid number: ""');
    });
  });

  describe('mapSdkCandleToInput', () => {
    it('should map SDK candle to CandleInput with number types', () => {
      const sdkCandle = {
        open: '100.5',
        high: '105.0',
        low: '99.0',
        close: '103.5',
        volume: '1000000',
      };

      const result = mapSdkCandleToInput(sdkCandle);

      expect(result).toEqual({
        open: 100.5,
        high: 105.0,
        low: 99.0,
        close: 103.5,
        volume: 1000000,
      });
    });

    it('should default missing values to 0', () => {
      const sdkCandle = {};

      const result = mapSdkCandleToInput(sdkCandle);

      expect(result).toEqual({
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0,
      });
    });

    it('should handle partial candle data', () => {
      const sdkCandle = {
        open: '100.5',
        close: '103.5',
      };

      const result = mapSdkCandleToInput(sdkCandle);

      expect(result).toEqual({
        open: 100.5,
        high: 0,
        low: 0,
        close: 103.5,
        volume: 0,
      });
    });
  });

  describe('mapSdkCandlesToInput', () => {
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

      const result = mapSdkCandlesToInput(sdkCandles);

      expect(result).toEqual([
        { open: 100.5, high: 105.0, low: 99.0, close: 103.5, volume: 1000000 },
        { open: 103.5, high: 108.0, low: 102.0, close: 107.0, volume: 1200000 },
      ]);
    });

    it('should return empty array for undefined input', () => {
      const result = mapSdkCandlesToInput(undefined);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      const result = mapSdkCandlesToInput([]);

      expect(result).toEqual([]);
    });
  });
});
