import { z } from 'zod';
import { PortfolioType } from './common.response';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Response schema for getting API key permissions.
 */
export const GetAPIKeyPermissionsResponseSchema = z
  .object({
    canView: z
      .boolean()
      .optional()
      .describe('Whether the API key has view permissions'),
    canTrade: z
      .boolean()
      .optional()
      .describe('Whether the API key has trade permissions'),
    canTransfer: z
      .boolean()
      .optional()
      .describe('Whether the API key has deposit/withdrawal permissions'),
    portfolioUuid: z
      .string()
      .optional()
      .describe('The portfolio ID associated with the API key'),
    portfolioType: z
      .nativeEnum(PortfolioType)
      .optional()
      .describe('The type of portfolio'),
  })
  .describe('Response containing API key permissions');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type GetAPIKeyPermissionsResponse = z.output<
  typeof GetAPIKeyPermissionsResponseSchema
>;
