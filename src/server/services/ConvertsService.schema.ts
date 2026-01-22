import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const CreateConvertQuoteRequestSchema = z.object({
  fromAccount: z.string().describe('Source account UUID'),
  toAccount: z.string().describe('Destination account UUID'),
  amount: z.number().describe('Amount to convert'),
});

export const CommitConvertTradeRequestSchema = z.object({
  tradeId: z.string().describe('The trade ID from the quote'),
  fromAccount: z.string().describe('Source account UUID'),
  toAccount: z.string().describe('Destination account UUID'),
});

export const GetConvertTradeRequestSchema = z.object({
  tradeId: z.string().describe('The trade ID'),
  fromAccount: z.string().describe('Source account UUID'),
  toAccount: z.string().describe('Destination account UUID'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type CreateConvertQuoteRequest = z.infer<
  typeof CreateConvertQuoteRequestSchema
>;
export type CommitConvertTradeRequest = z.infer<
  typeof CommitConvertTradeRequestSchema
>;
export type GetConvertTradeRequest = z.infer<
  typeof GetConvertTradeRequestSchema
>;
