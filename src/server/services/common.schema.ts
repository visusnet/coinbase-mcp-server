import { z } from 'zod';
import { zodNumber } from './schema.helpers';

// =============================================================================
// Shared Response Schemas
// =============================================================================

/**
 * Amount schema with string→number conversion for value field.
 */
export const AmountSchema = z.object({
  value: zodNumber,
  currency: z.string().optional(),
});
