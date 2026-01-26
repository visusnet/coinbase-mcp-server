import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  stringToNumber,
  stringToNumberRequired,
  isoToUnix,
  nullToUndefined,
} from './schema.helpers';

describe('schema.helpers', () => {
  describe('nullToUndefined', () => {
    const schema = nullToUndefined(z.string());

    it('should transform null to undefined', () => {
      expect(schema.parse(null)).toBeUndefined();
    });

    it('should pass through non-null values', () => {
      expect(schema.parse('hello')).toBe('hello');
    });

    it('should pass through undefined', () => {
      expect(schema.parse(undefined)).toBeUndefined();
    });
  });

  describe('stringToNumber', () => {
    it('should convert string to number', () => {
      expect(stringToNumber.parse('123.45')).toBe(123.45);
    });

    it('should return undefined for undefined', () => {
      expect(stringToNumber.parse(undefined)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(stringToNumber.parse('')).toBeUndefined();
    });

    it('should pass through numbers', () => {
      expect(stringToNumber.parse(42)).toBe(42);
    });
  });

  describe('stringToNumberRequired', () => {
    it('should convert string to number', () => {
      expect(stringToNumberRequired.parse('123.45')).toBe(123.45);
    });

    it('should throw for undefined', () => {
      expect(() => stringToNumberRequired.parse(undefined)).toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => stringToNumberRequired.parse('')).toThrow();
    });

    it('should pass through numbers', () => {
      expect(stringToNumberRequired.parse(42)).toBe(42);
    });
  });

  describe('isoToUnix', () => {
    it('should convert ISO 8601 timestamp to Unix timestamp string', () => {
      expect(isoToUnix.parse('2025-01-01T00:00:00Z')).toBe('1735689600');
    });

    it('should handle ISO 8601 with timezone offset', () => {
      expect(isoToUnix.parse('2025-01-01T01:00:00+01:00')).toBe('1735689600');
    });

    it('should throw for invalid timestamp', () => {
      expect(() => isoToUnix.parse('invalid-date-string')).toThrow(
        'Invalid timestamp: invalid-date-string',
      );
    });
  });
});
