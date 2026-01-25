import { z } from 'zod';

// =============================================================================
// Response Transforms (string → number)
// =============================================================================

/**
 * Transform string to optional number.
 * Handles API responses that return numeric values as strings.
 * Returns undefined for empty strings or undefined input.
 */
export const stringToNumber = z.preprocess(
  (val) => (val === undefined || val === '' ? undefined : Number(val)),
  z.number().optional(),
);

/**
 * Transform string to required number.
 * Same as stringToNumber but the result is required (not optional).
 */
export const stringToNumberRequired = z.preprocess(
  (val) => (val === undefined || val === '' ? undefined : Number(val)),
  z.number(),
);

// =============================================================================
// Request Transforms (number → string)
// =============================================================================

/**
 * Transform required number to string.
 * Use for API request fields that accept numbers from users but must be sent as strings.
 * Using field-level transforms preserves .shape on the parent z.object().
 */
export const numberToString = z.number().transform((n) => n.toString());

/**
 * Transform optional number to optional string.
 * Use for optional API request fields that accept numbers from users but must be sent as strings.
 * Using field-level transforms preserves .shape on the parent z.object().
 */
export const numberToStringOptional = z
  .number()
  .optional()
  .transform((n) => n?.toString());

/**
 * Transform ISO 8601 timestamp to Unix timestamp string.
 * Use for API request fields that accept ISO timestamps from users but must be sent as Unix timestamps.
 * Using field-level transforms preserves .shape on the parent z.object().
 */
export const isoToUnix = z.string().transform((isoString) => {
  const ms = Date.parse(isoString);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid timestamp: ${isoString}`);
  }
  return Math.floor(ms / 1000).toString();
});
