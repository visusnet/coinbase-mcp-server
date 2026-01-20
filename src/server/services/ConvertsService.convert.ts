import type {
  SdkCreateConvertQuoteRequest,
  SdkCreateConvertQuoteResponse,
  SdkCommitConvertTradeResponse,
  SdkGetConvertTradeResponse,
  SdkRatConvertTrade,
  SdkFee,
  SdkUnitPrice,
  SdkScaledAmount,
  SdkTaxInfo,
  SdkAmount,
  Fee,
  ScaledAmount,
  UnitPrice,
  TaxInfo,
  RatConvertTrade,
  CreateConvertQuoteRequest,
  CreateConvertQuoteResponse,
  CommitConvertTradeResponse,
  GetConvertTradeResponse,
} from './ConvertsService.types';
import type { Amount } from './AccountsService.types';
import { toNumber } from './numberConversion';

/**
 * Convert SDK Amount to our Amount type with number value.
 */
function toAmount(sdkAmount: SdkAmount | undefined): Amount | undefined {
  if (!sdkAmount) {
    return undefined;
  }
  const { value, ...unchanged } = sdkAmount;
  return { ...unchanged, value: toNumber(value) };
}

/**
 * Convert SDK Fee to our Fee type with numbers.
 */
function toFee(sdkFee: SdkFee | undefined): Fee | undefined {
  if (!sdkFee) {
    return undefined;
  }
  const { amount, ...unchanged } = sdkFee;
  return {
    ...unchanged,
    amount: toAmount(amount),
  };
}

/**
 * Convert SDK ScaledAmount to our ScaledAmount type with numbers.
 */
function toScaledAmount(
  sdkScaledAmount: SdkScaledAmount | undefined,
): ScaledAmount | undefined {
  if (!sdkScaledAmount) {
    return undefined;
  }
  const { amount, ...unchanged } = sdkScaledAmount;
  return {
    ...unchanged,
    amount: toAmount(amount),
  };
}

/**
 * Convert SDK UnitPrice to our UnitPrice type with numbers.
 */
function toUnitPrice(
  sdkUnitPrice: SdkUnitPrice | undefined,
): UnitPrice | undefined {
  if (!sdkUnitPrice) {
    return undefined;
  }
  return {
    targetToFiat: toScaledAmount(sdkUnitPrice.targetToFiat),
    targetToSource: toScaledAmount(sdkUnitPrice.targetToSource),
    sourceToFiat: toScaledAmount(sdkUnitPrice.sourceToFiat),
  };
}

/**
 * Convert SDK TaxInfo to our TaxInfo type with numbers.
 */
function toTaxInfo(sdkTaxInfo: SdkTaxInfo): TaxInfo {
  const { amount, ...unchanged } = sdkTaxInfo;
  return {
    ...unchanged,
    amount: toAmount(amount),
  };
}

/**
 * Convert SDK RatConvertTrade to our type with numbers.
 */
function toRatConvertTrade(
  sdkTrade: SdkRatConvertTrade | undefined,
): RatConvertTrade | undefined {
  if (!sdkTrade) {
    return undefined;
  }
  const {
    userEnteredAmount,
    amount,
    subtotal,
    total,
    fees,
    totalFee,
    unitPrice,
    exchangeRate,
    taxDetails,
    totalFeeWithoutTax,
    fiatDenotedTotal,
    ...unchanged
  } = sdkTrade;
  return {
    ...unchanged,
    userEnteredAmount: toAmount(userEnteredAmount),
    amount: toAmount(amount),
    subtotal: toAmount(subtotal),
    total: toAmount(total),
    fees: fees?.map(toFee).filter((f): f is Fee => f !== undefined),
    totalFee: toFee(totalFee),
    unitPrice: toUnitPrice(unitPrice),
    exchangeRate: toAmount(exchangeRate),
    taxDetails: taxDetails?.map(toTaxInfo),
    totalFeeWithoutTax: toFee(totalFeeWithoutTax),
    fiatDenotedTotal: toAmount(fiatDenotedTotal),
  };
}

// =============================================================================
// Request Conversions (our types -> SDK types)
// =============================================================================

/**
 * Convert our CreateConvertQuoteRequest to SDK request type.
 */
export function toSdkCreateConvertQuoteRequest(
  request: CreateConvertQuoteRequest,
): SdkCreateConvertQuoteRequest {
  return {
    fromAccount: request.fromAccount,
    toAccount: request.toAccount,
    amount: request.amount.toString(),
  };
}

// =============================================================================
// Response Conversions (SDK types -> our types)
// =============================================================================

/**
 * Convert SDK CreateConvertQuoteResponse to our type.
 */
export function toCreateConvertQuoteResponse(
  sdkResponse: SdkCreateConvertQuoteResponse,
): CreateConvertQuoteResponse {
  return {
    trade: toRatConvertTrade(sdkResponse.trade),
  };
}

/**
 * Convert SDK CommitConvertTradeResponse to our type.
 */
export function toCommitConvertTradeResponse(
  sdkResponse: SdkCommitConvertTradeResponse,
): CommitConvertTradeResponse {
  return {
    trade: toRatConvertTrade(sdkResponse.trade),
  };
}

/**
 * Convert SDK GetConvertTradeResponse to our type.
 */
export function toGetConvertTradeResponse(
  sdkResponse: SdkGetConvertTradeResponse,
): GetConvertTradeResponse {
  return {
    trade: toRatConvertTrade(sdkResponse.trade),
  };
}
