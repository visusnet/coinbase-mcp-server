import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const GetFuturesPositionRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetFuturesPositionRequest = z.infer<
  typeof GetFuturesPositionRequestSchema
>;
