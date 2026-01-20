// Our types with number instead of string for numeric fields
import type { GstType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/GstType';

// =============================================================================
// SDK Type Re-exports
// =============================================================================

export type { GetTransactionSummaryResponse as SdkGetTransactionSummaryResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetTransactionSummaryResponse';
export type { TypesDecimal as SdkTypesDecimal } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/TypesDecimal';
export type { FeeTier as SdkFeeTier } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FeeTier';
export type { GoodsAndServicesTax as SdkGoodsAndServicesTax } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GoodsAndServicesTax';

// Re-export request type unchanged (no numeric string fields)
export type { GetTransactionsSummaryRequest } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/fees/types';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

// TypesDecimal with number value
export interface TypesDecimal {
  readonly value?: number;
}

// FeeTier with number values for rates and bounds
export interface FeeTier {
  readonly pricingTier?: string;
  readonly usdFrom?: number;
  readonly usdTo?: number;
  readonly takerFeeRate?: number;
  readonly makerFeeRate?: number;
  readonly aopFrom?: number;
  readonly aopTo?: number;
}

// GoodsAndServicesTax with number rate
export interface GoodsAndServicesTax {
  readonly rate?: number;
  readonly type?: GstType;
}

// Response with number types
export interface GetTransactionsSummaryResponse {
  readonly totalVolume: number;
  readonly totalFees: number;
  readonly feeTier: FeeTier;
  readonly marginRate?: TypesDecimal;
  readonly goodsAndServicesTax?: GoodsAndServicesTax;
  readonly advancedTradeOnlyVolume?: number;
  readonly advancedTradeOnlyFees?: number;
  readonly coinbaseProVolume?: number;
  readonly coinbaseProFees?: number;
  readonly totalBalance?: number;
}
