import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

/**
 * Request schema for getting API key permissions.
 */
export const GetAPIKeyPermissionsRequestSchema = z
  .object({})
  .describe('Request to get API key permissions');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetAPIKeyPermissionsRequest = z.output<
  typeof GetAPIKeyPermissionsRequestSchema
>;
