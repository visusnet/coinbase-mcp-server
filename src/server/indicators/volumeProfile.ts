import { VolumeProfile } from '@thuantan2060/technicalindicators';

/**
 * Single Volume Profile zone
 */
export interface VolumeProfileZone {
  readonly rangeStart: number;
  readonly rangeEnd: number;
  readonly bullishVolume: number;
  readonly bearishVolume: number;
  readonly totalVolume: number;
}

/** Value Area percentage (70% of total volume) */
const VALUE_AREA_PERCENTAGE = 0.7;

/**
 * Calculate volume zones using the technicalindicators library.
 */
export function calculateZones(
  open: readonly number[],
  high: readonly number[],
  low: readonly number[],
  close: readonly number[],
  volume: readonly number[],
  noOfBars: number,
): VolumeProfileZone[] {
  // Library types are incorrect - VolumeProfile.calculate() declares number[]
  // but actually returns zone objects at runtime. Cast via unknown is required.
  const result = VolumeProfile.calculate({
    open: [...open],
    high: [...high],
    low: [...low],
    close: [...close],
    volume: [...volume],
    noOfBars,
  }) as unknown as VolumeProfileZone[];

  return result.map((zone) => ({
    rangeStart: zone.rangeStart,
    rangeEnd: zone.rangeEnd,
    bullishVolume: zone.bullishVolume,
    bearishVolume: zone.bearishVolume,
    totalVolume: zone.totalVolume,
  }));
}

/**
 * Find Point of Control - the zone with highest total volume.
 */
export function findPointOfControl(
  zones: readonly VolumeProfileZone[],
): VolumeProfileZone | null {
  let pointOfControl: VolumeProfileZone | null = null;
  let maxVolume = 0;

  for (const zone of zones) {
    if (zone.totalVolume > maxVolume) {
      maxVolume = zone.totalVolume;
      pointOfControl = zone;
    }
  }

  return pointOfControl;
}

/**
 * Calculate Value Area - the price range containing 70% of total volume around POC.
 */
export function calculateValueArea(
  zones: readonly VolumeProfileZone[],
  pointOfControl: VolumeProfileZone | null,
): { valueAreaHigh: number | null; valueAreaLow: number | null } {
  if (zones.length === 0 || pointOfControl === null) {
    return { valueAreaHigh: null, valueAreaLow: null };
  }

  const totalVolume = zones.reduce((sum, z) => sum + z.totalVolume, 0);
  const targetVolume = totalVolume * VALUE_AREA_PERCENTAGE;

  const sortedZones = [...zones].sort((a, b) => a.rangeStart - b.rangeStart);
  const pocIndex = sortedZones.findIndex(
    (z) =>
      z.rangeStart === pointOfControl.rangeStart &&
      z.rangeEnd === pointOfControl.rangeEnd,
  );

  let accumulatedVolume = pointOfControl.totalVolume;
  let lowIndex = pocIndex;
  let highIndex = pocIndex;

  // Expand outward from POC until we reach 70% volume
  // Note: When all zones are included, accumulated = 100% >= 70% target,
  // so the loop always exits via the condition before running out of zones.
  while (accumulatedVolume < targetVolume) {
    const canExpandLow = lowIndex > 0;
    const canExpandHigh = highIndex < sortedZones.length - 1;

    const expandLow = shouldExpandLow(
      sortedZones,
      lowIndex,
      highIndex,
      canExpandLow,
      canExpandHigh,
    );

    if (expandLow) {
      lowIndex--;
      accumulatedVolume += sortedZones[lowIndex].totalVolume;
    } else {
      highIndex++;
      accumulatedVolume += sortedZones[highIndex].totalVolume;
    }
  }

  return {
    valueAreaLow: sortedZones[lowIndex].rangeStart,
    valueAreaHigh: sortedZones[highIndex].rangeEnd,
  };
}

/**
 * Determine whether to expand the value area downward or upward.
 */
function shouldExpandLow(
  zones: readonly VolumeProfileZone[],
  lowIndex: number,
  highIndex: number,
  canExpandLow: boolean,
  canExpandHigh: boolean,
): boolean {
  if (canExpandLow && canExpandHigh) {
    const lowVolume = zones[lowIndex - 1].totalVolume;
    const highVolume = zones[highIndex + 1].totalVolume;
    return lowVolume >= highVolume;
  }
  return canExpandLow;
}
