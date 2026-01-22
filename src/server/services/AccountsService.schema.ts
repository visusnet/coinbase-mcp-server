import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListAccountsRequestSchema = z.object({
  limit: z.number().optional().describe('Maximum number of accounts to return'),
  cursor: z.string().optional().describe('Pagination cursor for next page'),
});

export const GetAccountRequestSchema = z.object({
  accountUuid: z.string().describe('The UUID of the account to retrieve'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListAccountsRequest = z.infer<typeof ListAccountsRequestSchema>;
export type GetAccountRequest = z.infer<typeof GetAccountRequestSchema>;
