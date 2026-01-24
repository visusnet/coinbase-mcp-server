import { z } from 'zod';
import { ContractExpiryType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ContractExpiryType';
import { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType';
import { ProductVenue } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductVenue';
import { GstType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/GstType';
import { zodNumber, zodNumberRequired } from './schema.helpers';

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

export type GetTransactionsSummaryRequest = z.infer<
  typeof GetTransactionsSummaryRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

const TypesDecimalSchema = z.object({
  value: zodNumber,
});

const FeeTierSchema = z.object({
  pricingTier: z.string().optional(),
  usdFrom: zodNumber,
  usdTo: zodNumber,
  takerFeeRate: zodNumber,
  makerFeeRate: zodNumber,
  aopFrom: zodNumber,
  aopTo: zodNumber,
});

const GoodsAndServicesTaxSchema = z.object({
  rate: zodNumber,
  type: z.nativeEnum(GstType).optional(),
});

export const GetTransactionsSummaryResponseSchema = z.object({
  totalVolume: zodNumberRequired,
  totalFees: zodNumberRequired,
  feeTier: FeeTierSchema,
  marginRate: TypesDecimalSchema.optional(),
  goodsAndServicesTax: GoodsAndServicesTaxSchema.optional(),
  advancedTradeOnlyVolume: zodNumber,
  advancedTradeOnlyFees: zodNumber,
  coinbaseProVolume: zodNumber,
  coinbaseProFees: zodNumber,
  totalBalance: zodNumber,
});

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type GetTransactionsSummaryResponse = z.output<
  typeof GetTransactionsSummaryResponseSchema
>;
