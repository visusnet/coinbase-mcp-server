import { z } from 'zod';
import {
  nullToUndefined,
  stringToNumber,
  stringToNumberRequired,
} from './schema.helpers';

// =============================================================================
// Enums
// =============================================================================

/** Goods and services tax type */
enum GstType {
  Inclusive = 'INCLUSIVE',
  Exclusive = 'EXCLUSIVE',
}

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Types decimal schema.
 */
const TypesDecimalSchema = z
  .object({
    value: stringToNumber.describe('Decimal value'),
  })
  .describe('Decimal value wrapper');

/**
 * Fee tier schema.
 */
const FeeTierSchema = z
  .object({
    pricingTier: z.string().optional().describe('Pricing tier name'),
    usdFrom: stringToNumber.describe('USD volume lower bound'),
    usdTo: stringToNumber.describe('USD volume upper bound'),
    takerFeeRate: stringToNumber.describe('Taker fee rate'),
    makerFeeRate: stringToNumber.describe('Maker fee rate'),
    aopFrom: stringToNumber.describe('AOP lower bound'),
    aopTo: stringToNumber.describe('AOP upper bound'),
  })
  .describe('Fee tier information');

/**
 * Goods and services tax schema.
 */
const GoodsAndServicesTaxSchema = z
  .object({
    rate: stringToNumber.describe('GST rate'),
    type: z
      .nativeEnum(GstType)
      .optional()
      .describe('GST type (INCLUSIVE or EXCLUSIVE)'),
  })
  .describe('Goods and services tax information');

/**
 * Response schema for getting transactions summary.
 */
export const GetTransactionsSummaryResponseSchema = z
  .object({
    totalVolume: stringToNumberRequired.describe('Total trading volume'),
    totalFees: stringToNumberRequired.describe('Total fees paid'),
    feeTier: nullToUndefined(FeeTierSchema).describe(
      'Current fee tier information',
    ),
    marginRate: nullToUndefined(TypesDecimalSchema).describe('Margin rate'),
    goodsAndServicesTax: nullToUndefined(GoodsAndServicesTaxSchema).describe(
      'GST information',
    ),
    advancedTradeOnlyVolume: stringToNumber.describe(
      'Advanced Trade only volume',
    ),
    advancedTradeOnlyFees: stringToNumber.describe('Advanced Trade only fees'),
    coinbaseProVolume: stringToNumber.describe('Coinbase Pro volume'),
    coinbaseProFees: stringToNumber.describe('Coinbase Pro fees'),
    totalBalance: stringToNumber.describe('Total account balance'),
  })
  .describe('Response containing transactions summary with fee tiers');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type GetTransactionsSummaryResponse = z.output<
  typeof GetTransactionsSummaryResponseSchema
>;
