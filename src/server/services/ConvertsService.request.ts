import { z } from 'zod';
import { numberToString } from './schema.helpers';

// =============================================================================
// Request Schemas
// =============================================================================

export const CreateConvertQuoteRequestSchema = z
  .object({
    fromAccount: z.string().describe('Source account UUID'),
    toAccount: z.string().describe('Destination account UUID'),
    amount: numberToString.describe('Amount to convert'),
  })
  .describe('Request to create a convert quote');

export const CommitConvertTradeRequestSchema = z
  .object({
    tradeId: z.string().describe('The trade ID from the quote'),
    fromAccount: z.string().describe('Source account UUID'),
    toAccount: z.string().describe('Destination account UUID'),
  })
  .describe('Request to commit a convert trade');

export const GetConvertTradeRequestSchema = z
  .object({
    tradeId: z.string().describe('The trade ID'),
    fromAccount: z.string().describe('Source account UUID'),
    toAccount: z.string().describe('Destination account UUID'),
  })
  .describe('Request to get a convert trade');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type CreateConvertQuoteRequest = z.output<
  typeof CreateConvertQuoteRequestSchema
>;
export type CommitConvertTradeRequest = z.output<
  typeof CommitConvertTradeRequestSchema
>;
export type GetConvertTradeRequest = z.output<
  typeof GetConvertTradeRequestSchema
>;
