import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

/** Product type for filtering and fee calculation */
export enum ProductType {
  UnknownProductType = 'UNKNOWN_PRODUCT_TYPE',
  Spot = 'SPOT',
  Future = 'FUTURE',
}

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
 */
export const GetTransactionsSummaryRequestSchema = z
  .object({
    productType: z
      .nativeEnum(ProductType)
      .describe('Product type for fee calculation'),
    contractExpiryType: z
      .nativeEnum(ContractExpiryType)
      .describe('Contract expiry type'),
    productVenue: z.nativeEnum(ProductVenue).describe('Product venue'),
  })
  .describe('Request to get transactions summary with fee tiers');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetTransactionsSummaryRequest = z.output<
  typeof GetTransactionsSummaryRequestSchema
>;
