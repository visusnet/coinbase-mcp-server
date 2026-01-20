import type {
  SdkGetTransactionSummaryResponse,
  SdkTypesDecimal,
  SdkFeeTier,
  SdkGoodsAndServicesTax,
  TypesDecimal,
  FeeTier,
  GoodsAndServicesTax,
  GetTransactionsSummaryResponse,
} from './FeesService.types';
import { toNumber } from './numberConversion';

/**
 * Convert SDK TypesDecimal to our TypesDecimal type with numbers.
 */
function toTypesDecimal(
  sdkDecimal: SdkTypesDecimal | undefined,
): TypesDecimal | undefined {
  if (!sdkDecimal) {
    return undefined;
  }
  const { value, ...unchanged } = sdkDecimal;
  return { ...unchanged, value: toNumber(value) };
}

/**
 * Convert SDK FeeTier to our FeeTier type with numbers.
 */
function toFeeTier(sdkFeeTier: SdkFeeTier): FeeTier {
  const {
    usdFrom,
    usdTo,
    takerFeeRate,
    makerFeeRate,
    aopFrom,
    aopTo,
    ...unchanged
  } = sdkFeeTier;
  return {
    ...unchanged,
    usdFrom: toNumber(usdFrom),
    usdTo: toNumber(usdTo),
    takerFeeRate: toNumber(takerFeeRate),
    makerFeeRate: toNumber(makerFeeRate),
    aopFrom: toNumber(aopFrom),
    aopTo: toNumber(aopTo),
  };
}

/**
 * Convert SDK GoodsAndServicesTax to our type with numbers.
 */
function toGoodsAndServicesTax(
  sdkGst: SdkGoodsAndServicesTax | undefined,
): GoodsAndServicesTax | undefined {
  if (!sdkGst) {
    return undefined;
  }
  const { rate, ...unchanged } = sdkGst;
  return { ...unchanged, rate: toNumber(rate) };
}

/**
 * Convert SDK GetTransactionsSummaryResponse to our type.
 */
export function toGetTransactionsSummaryResponse(
  sdkResponse: SdkGetTransactionSummaryResponse,
): GetTransactionsSummaryResponse {
  const {
    marginRate,
    goodsAndServicesTax,
    feeTier,
    totalBalance,
    ...unchanged
  } = sdkResponse;
  return {
    ...unchanged,
    feeTier: toFeeTier(feeTier),
    marginRate: toTypesDecimal(marginRate),
    goodsAndServicesTax: toGoodsAndServicesTax(goodsAndServicesTax),
    totalBalance: toNumber(totalBalance),
  };
}
