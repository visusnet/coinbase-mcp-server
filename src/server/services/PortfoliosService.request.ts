import { z } from 'zod';
import { AmountSchema } from './common.request';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListPortfoliosRequestSchema = z
  .object({})
  .describe('Request parameters for listing portfolios');

export const CreatePortfolioRequestSchema = z
  .object({
    name: z.string().describe('Name of the portfolio'),
  })
  .describe('Request parameters for creating a portfolio');

export const GetPortfolioRequestSchema = z
  .object({
    portfolioUuid: z.string().describe('The UUID of the portfolio'),
  })
  .describe('Request parameters for getting a portfolio');

export const MovePortfolioFundsRequestSchema = z
  .object({
    funds: AmountSchema.describe('Fund movement details (amount, currency)'),
    sourcePortfolioUuid: z.string().describe('Source portfolio UUID'),
    targetPortfolioUuid: z.string().describe('Target portfolio UUID'),
  })
  .describe('Request parameters for moving funds between portfolios');

export const EditPortfolioRequestSchema = z
  .object({
    portfolioUuid: z.string().describe('The UUID of the portfolio to edit'),
    name: z.string().describe('New name for the portfolio'),
  })
  .describe('Request parameters for editing a portfolio');

export const DeletePortfolioRequestSchema = z
  .object({
    portfolioUuid: z.string().describe('The UUID of the portfolio to delete'),
  })
  .describe('Request parameters for deleting a portfolio');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListPortfoliosRequest = z.output<
  typeof ListPortfoliosRequestSchema
>;
export type CreatePortfolioRequest = z.output<
  typeof CreatePortfolioRequestSchema
>;
export type GetPortfolioRequest = z.output<typeof GetPortfolioRequestSchema>;
export type MovePortfolioFundsRequest = z.output<
  typeof MovePortfolioFundsRequestSchema
>;
export type EditPortfolioRequest = z.output<typeof EditPortfolioRequestSchema>;
export type DeletePortfolioRequest = z.output<
  typeof DeletePortfolioRequestSchema
>;
