import { describe, it, expect } from '@jest/globals';
import {
  calculateZones,
  findPointOfControl,
  calculateValueArea,
  VolumeProfileZone,
} from './volumeProfile';

describe('volumeProfile helpers', () => {
  describe('calculateValueArea', () => {
    it('should return nulls when zones array is empty', () => {
      const result = calculateValueArea([], null);

      expect(result.valueAreaHigh).toBeNull();
      expect(result.valueAreaLow).toBeNull();
    });

    it('should return nulls when POC is null', () => {
      const zones: VolumeProfileZone[] = [
        {
          rangeStart: 100,
          rangeEnd: 105,
          bullishVolume: 500,
          bearishVolume: 500,
          totalVolume: 1000,
        },
      ];

      const result = calculateValueArea(zones, null);

      expect(result.valueAreaHigh).toBeNull();
      expect(result.valueAreaLow).toBeNull();
    });
  });

  describe('findPointOfControl', () => {
    it('should return null for empty zones', () => {
      const result = findPointOfControl([]);
      expect(result).toBeNull();
    });

    it('should find zone with highest volume', () => {
      const zones: VolumeProfileZone[] = [
        {
          rangeStart: 100,
          rangeEnd: 105,
          bullishVolume: 100,
          bearishVolume: 100,
          totalVolume: 200,
        },
        {
          rangeStart: 105,
          rangeEnd: 110,
          bullishVolume: 500,
          bearishVolume: 500,
          totalVolume: 1000,
        },
        {
          rangeStart: 110,
          rangeEnd: 115,
          bullishVolume: 150,
          bearishVolume: 150,
          totalVolume: 300,
        },
      ];

      const result = findPointOfControl(zones);

      expect(result).not.toBeNull();
      expect(result?.rangeStart).toBe(105);
      expect(result?.totalVolume).toBe(1000);
    });
  });

  describe('calculateZones', () => {
    it('should calculate zones from OHLCV data', () => {
      const open = [100, 105, 110];
      const high = [105, 110, 115];
      const low = [98, 103, 108];
      const close = [104, 108, 112];
      const volume = [1000, 1500, 2000];

      const result = calculateZones(open, high, low, close, volume, 3);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((zone) => {
        expect(zone).toHaveProperty('rangeStart');
        expect(zone).toHaveProperty('rangeEnd');
        expect(zone).toHaveProperty('totalVolume');
      });
    });
  });
});
