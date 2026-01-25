import { z } from 'zod';
import { stringToNumber, stringToNumberRequired } from './schema.helpers';

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

/** Goods and services tax type */
enum GstType {
  Inclusive = 'INCLUSIVE',
  Exclusive = 'EXCLUSIVE',
}

// =============================================================================
// Request Schemas
// =============================================================================

export const GetTransactionsSummaryRequestSchema = z.object({
  productType: z
    .nativeEnum(ProductType)
    .describe('Product type for fee calculation'),
  contractExpiryType: z
    .nativeEnum(ContractExpiryType)
    .describe('Contract expiry type'),
  productVenue: z.nativeEnum(ProductVenue).describe('Product venue'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetTransactionsSummaryRequest = z.input<
  typeof GetTransactionsSummaryRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

const TypesDecimalResponseSchema = z.object({
  value: stringToNumber.describe('Decimal value'),
});

const FeeTierResponseSchema = z.object({
  pricingTier: z.string().optional().describe('Pricing tier name'),
  usdFrom: stringToNumber.describe('USD volume lower bound'),
  usdTo: stringToNumber.describe('USD volume upper bound'),
  takerFeeRate: stringToNumber.describe('Taker fee rate'),
  makerFeeRate: stringToNumber.describe('Maker fee rate'),
  aopFrom: stringToNumber.describe('AOP lower bound'),
  aopTo: stringToNumber.describe('AOP upper bound'),
});

const GoodsAndServicesTaxResponseSchema = z.object({
  rate: stringToNumber.describe('GST rate'),
  type: z
    .nativeEnum(GstType)
    .optional()
    .describe('GST type (INCLUSIVE or EXCLUSIVE)'),
});

export const GetTransactionsSummaryResponseSchema = z.object({
  totalVolume: stringToNumberRequired.describe('Total trading volume'),
  totalFees: stringToNumberRequired.describe('Total fees paid'),
  feeTier: FeeTierResponseSchema.describe('Current fee tier information'),
  marginRate: TypesDecimalResponseSchema.optional().describe('Margin rate'),
  goodsAndServicesTax:
    GoodsAndServicesTaxResponseSchema.optional().describe('GST information'),
  advancedTradeOnlyVolume: stringToNumber.describe(
    'Advanced Trade only volume',
  ),
  advancedTradeOnlyFees: stringToNumber.describe('Advanced Trade only fees'),
  coinbaseProVolume: stringToNumber.describe('Coinbase Pro volume'),
  coinbaseProFees: stringToNumber.describe('Coinbase Pro fees'),
  totalBalance: stringToNumber.describe('Total account balance'),
});

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type GetTransactionsSummaryResponse = z.output<
  typeof GetTransactionsSummaryResponseSchema
>;
