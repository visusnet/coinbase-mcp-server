import { z } from 'zod';

/**
 * Zod preprocess helper to convert string numbers to numbers.
 * Handles SDK responses that return numeric values as strings.
 * Returns undefined for empty strings or undefined input.
 */
export const zodNumber = z.preprocess(
  (val) => (val === undefined || val === '' ? undefined : Number(val)),
  z.number().optional(),
);

/**
 * Zod preprocess helper for required number fields.
 * Same as zodNumber but the result is required (not optional).
 */
export const zodNumberRequired = z.preprocess(
  (val) => (val === undefined || val === '' ? undefined : Number(val)),
  z.number(),
);
