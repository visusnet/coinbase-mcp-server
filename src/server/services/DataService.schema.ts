import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

/** Portfolio type for API key permissions */
export enum PortfolioType {
  Undefined = 'UNDEFINED',
  Default = 'DEFAULT',
  Consumer = 'CONSUMER',
  Intx = 'INTX',
}

// =============================================================================
// Request Schemas
// =============================================================================

export const GetAPIKeyPermissionsRequestSchema = z.object({});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetAPIKeyPermissionsRequest = z.input<
  typeof GetAPIKeyPermissionsRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

export const GetAPIKeyPermissionsResponseSchema = z.object({
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
});

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type GetAPIKeyPermissionsResponse = z.output<
  typeof GetAPIKeyPermissionsResponseSchema
>;
