import { z } from 'zod';
import { numberToString } from './schema.helpers';

// =============================================================================
// Shared Request Schemas
// =============================================================================

/**
 * Amount schema for requests with number→string conversion for value field.
 * Used for API requests that require string representation of numeric values.
 */
export const AmountSchema = z
  .object({
    value: numberToString.describe('Amount value'),
    currency: z.string().describe('Currency code (e.g., USD, BTC)'),
  })
  .describe('Monetary amount with currency');

export type Amount = z.output<typeof AmountSchema>;
