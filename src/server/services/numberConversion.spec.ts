import { describe, it, expect } from '@jest/globals';
import {
  toString,
  toStringRequired,
  toNumber,
  toNumberRequired,
  toUnixTimestamp,
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

    it('should return undefined for empty string', () => {
      expect(toNumber('')).toBeUndefined();
    });

    it('should handle number input', () => {
      expect(toNumber(123)).toBe(123);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-45.6)).toBe(-45.6);
    });

    it('should throw for invalid number input', () => {
      expect(() => toNumber(NaN)).toThrow('Invalid number: "NaN"');
      expect(() => toNumber(Infinity)).toThrow('Invalid number: "Infinity"');
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

  describe('toUnixTimestamp', () => {
    it('should convert ISO 8601 timestamp to Unix timestamp', () => {
      expect(toUnixTimestamp('2025-01-01T00:00:00Z')).toBe('1735689600');
      expect(toUnixTimestamp('2025-06-15T12:30:00Z')).toBe('1749990600');
    });

    it('should handle timestamps with milliseconds', () => {
      expect(toUnixTimestamp('2025-01-01T00:00:00.000Z')).toBe('1735689600');
    });

    it('should handle timestamps with timezone offset', () => {
      // +00:00 is same as Z
      expect(toUnixTimestamp('2025-01-01T00:00:00+00:00')).toBe('1735689600');
    });

    it('should throw Error for invalid timestamp', () => {
      expect(() => toUnixTimestamp('invalid')).toThrow(
        'Invalid timestamp: invalid',
      );
      expect(() => toUnixTimestamp('')).toThrow('Invalid timestamp: ');
      expect(() => toUnixTimestamp('not-a-date')).toThrow(
        'Invalid timestamp: not-a-date',
      );
    });
  });
});
