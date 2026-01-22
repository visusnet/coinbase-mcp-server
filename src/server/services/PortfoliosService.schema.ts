import { z } from 'zod';

// =============================================================================
// Shared Schemas
// =============================================================================

const FundsSchema = z.object({
  value: z.number().describe('Amount to transfer'),
  currency: z.string().describe('Currency code (e.g., USD, BTC)'),
});

// =============================================================================
// Request Schemas
// =============================================================================

export const ListPortfoliosRequestSchema = z.object({});

export const CreatePortfolioRequestSchema = z.object({
  name: z.string().describe('Name of the portfolio'),
});

export const GetPortfolioRequestSchema = z.object({
  portfolioUuid: z.string().describe('The UUID of the portfolio'),
});

export const MovePortfolioFundsRequestSchema = z.object({
  funds: FundsSchema.describe('Fund movement details (amount, currency)'),
  sourcePortfolioUuid: z.string().describe('Source portfolio UUID'),
  targetPortfolioUuid: z.string().describe('Target portfolio UUID'),
});

export const EditPortfolioRequestSchema = z.object({
  portfolioUuid: z.string().describe('The UUID of the portfolio to edit'),
  name: z.string().describe('New name for the portfolio'),
});

export const DeletePortfolioRequestSchema = z.object({
  portfolioUuid: z.string().describe('The UUID of the portfolio to delete'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListPortfoliosRequest = z.infer<typeof ListPortfoliosRequestSchema>;
export type CreatePortfolioRequest = z.infer<
  typeof CreatePortfolioRequestSchema
>;
export type GetPortfolioRequest = z.infer<typeof GetPortfolioRequestSchema>;
export type MovePortfolioFundsRequest = z.infer<
  typeof MovePortfolioFundsRequestSchema
>;
export type EditPortfolioRequest = z.infer<typeof EditPortfolioRequestSchema>;
export type DeletePortfolioRequest = z.infer<
  typeof DeletePortfolioRequestSchema
>;
