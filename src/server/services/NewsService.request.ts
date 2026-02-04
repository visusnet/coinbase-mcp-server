import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const GetNewsSentimentRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of articles to fetch'),
  })
  .describe('Request to get news with sentiment analysis');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetNewsSentimentRequest = z.output<
  typeof GetNewsSentimentRequestSchema
>;
