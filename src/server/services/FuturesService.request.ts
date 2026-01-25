import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

/**
 * Request schema for getting a specific futures position.
 */
export const GetFuturesPositionRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  })
  .describe('Request to get a specific futures position');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetFuturesPositionRequest = z.output<
  typeof GetFuturesPositionRequestSchema
>;
