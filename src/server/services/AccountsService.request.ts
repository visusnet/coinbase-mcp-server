import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListAccountsRequestSchema = z
  .object({
    limit: z
      .number()
      .optional()
      .describe('Maximum number of accounts to return'),
    cursor: z.string().optional().describe('Pagination cursor for next page'),
  })
  .describe('Request parameters for listing accounts');

export const GetAccountRequestSchema = z
  .object({
    accountUuid: z.string().describe('The UUID of the account to retrieve'),
  })
  .describe('Request parameters for getting a single account');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListAccountsRequest = z.output<typeof ListAccountsRequestSchema>;
export type GetAccountRequest = z.output<typeof GetAccountRequestSchema>;
