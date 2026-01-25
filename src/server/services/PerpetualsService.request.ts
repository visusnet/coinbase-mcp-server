import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListPerpetualsPositionsRequestSchema = z
  .object({
    portfolioUuid: z.string().describe('Portfolio UUID'),
  })
  .describe('Request parameters for listing perpetuals positions');

export const GetPerpetualsPositionRequestSchema = z
  .object({
    portfolioUuid: z.string().describe('Portfolio UUID'),
    symbol: z.string().describe('Product symbol'),
  })
  .describe('Request parameters for getting a perpetuals position');

export const GetPortfolioSummaryRequestSchema = z
  .object({
    portfolioUuid: z.string().describe('Portfolio UUID'),
  })
  .describe('Request parameters for getting portfolio summary');

export const GetPortfolioBalanceRequestSchema = z
  .object({
    portfolioUuid: z.string().describe('Portfolio UUID'),
  })
  .describe('Request parameters for getting portfolio balance');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListPerpetualsPositionsRequest = z.output<
  typeof ListPerpetualsPositionsRequestSchema
>;
export type GetPerpetualsPositionRequest = z.output<
  typeof GetPerpetualsPositionRequestSchema
>;
export type GetPortfolioSummaryRequest = z.output<
  typeof GetPortfolioSummaryRequestSchema
>;
export type GetPortfolioBalanceRequest = z.output<
  typeof GetPortfolioBalanceRequestSchema
>;
