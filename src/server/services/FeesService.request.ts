import { z } from 'zod';
import { ProductType } from './common.request';

// =============================================================================
// Enums
// =============================================================================

/** Contract expiry type for futures */
export enum ContractExpiryType {
  UnknownContractExpiryType = 'UNKNOWN_CONTRACT_EXPIRY_TYPE',
  Expiring = 'EXPIRING',
  Perpetual = 'PERPETUAL',
}

/** Product venue for trading */
export enum ProductVenue {
  UnknownVenueType = 'UNKNOWN_VENUE_TYPE',
  Cbe = 'CBE',
  Fcm = 'FCM',
  Intx = 'INTX',
}

// =============================================================================
// Request Schemas
// =============================================================================

/**
 * Request schema for getting transactions summary.
 * Note: contractExpiryType is only valid for FUTURE products.
 */
export const GetTransactionsSummaryRequestSchema = z
  .object({
    productType: z
      .nativeEnum(ProductType)
      .describe('Product type for fee calculation (SPOT or FUTURE)'),
    contractExpiryType: z
      .nativeEnum(ContractExpiryType)
      .optional()
      .describe('Contract expiry type (only valid for FUTURE products)'),
    productVenue: z.nativeEnum(ProductVenue).describe('Product venue'),
  })
  .describe('Request to get transactions summary with fee tiers');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetTransactionsSummaryRequest = z.output<
  typeof GetTransactionsSummaryRequestSchema
>;
