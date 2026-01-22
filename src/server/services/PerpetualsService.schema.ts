import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListPerpetualsPositionsRequestSchema = z.object({
  portfolioUuid: z.string().describe('Portfolio UUID'),
});

export const GetPerpetualsPositionRequestSchema = z.object({
  portfolioUuid: z.string().describe('Portfolio UUID'),
  symbol: z.string().describe('Product symbol'),
});

export const GetPortfolioSummaryRequestSchema = z.object({
  portfolioUuid: z.string().describe('Portfolio UUID'),
});

export const GetPortfolioBalanceRequestSchema = z.object({
  portfolioUuid: z.string().describe('Portfolio UUID'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListPerpetualsPositionsRequest = z.infer<
  typeof ListPerpetualsPositionsRequestSchema
>;
export type GetPerpetualsPositionRequest = z.infer<
  typeof GetPerpetualsPositionRequestSchema
>;
export type GetPortfolioSummaryRequest = z.infer<
  typeof GetPortfolioSummaryRequestSchema
>;
export type GetPortfolioBalanceRequest = z.infer<
  typeof GetPortfolioBalanceRequestSchema
>;
