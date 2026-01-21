// Wrapper types with numbers for API convenience
import type { PaymentMethod } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PaymentMethod';
import type { Error as SdkError } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Error';
import type { Disclosure } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Disclosure';
import type { SubscriptionInfo } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/SubscriptionInfo';
import type { TradeIncentiveInfo } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/TradeIncentiveInfo';
import type { TradeStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/TradeStatus';
import type { UserWarning } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/UserWarning';
import type { Amount } from './common.types';

// =============================================================================
// SDK Types (for conversion) - these have our own converted counterparts
// =============================================================================

export type {
  CreateConvertQuoteRequest as SdkCreateConvertQuoteRequest,
  CreateConvertQuoteResponse as SdkCreateConvertQuoteResponse,
  CommitConvertTradeResponse as SdkCommitConvertTradeResponse,
  GetConvertTradeResponse as SdkGetConvertTradeResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/convert/types';
export type { RatConvertTrade as SdkRatConvertTrade } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/RatConvertTrade';
export type { Fee as SdkFee } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Fee';
export type { UnitPrice as SdkUnitPrice } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/UnitPrice';
export type { ScaledAmount as SdkScaledAmount } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/ScaledAmount';
export type { TaxInfo as SdkTaxInfo } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/TaxInfo';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

// Create convert quote request with number types
export interface CreateConvertQuoteRequest {
  readonly fromAccount: string;
  readonly toAccount: string;
  readonly amount: number;
}

// Fee with number amounts
export interface Fee {
  readonly title?: string;
  readonly description?: string;
  readonly amount?: Amount;
  readonly label?: string;
  readonly disclosure?: Disclosure;
}

// ScaledAmount with number amounts
export interface ScaledAmount {
  readonly amount?: Amount;
  readonly scale?: number;
}

// UnitPrice with number amounts
export interface UnitPrice {
  readonly targetToFiat?: ScaledAmount;
  readonly targetToSource?: ScaledAmount;
  readonly sourceToFiat?: ScaledAmount;
}

// TaxInfo with number amounts
export interface TaxInfo {
  readonly name?: string;
  readonly amount?: Amount;
}

// RatConvertTrade with number amounts
export interface RatConvertTrade {
  readonly id?: string;
  readonly status?: TradeStatus;
  readonly userEnteredAmount?: Amount;
  readonly amount?: Amount;
  readonly subtotal?: Amount;
  readonly total?: Amount;
  readonly fees?: Fee[];
  readonly totalFee?: Fee;
  readonly source?: PaymentMethod;
  readonly target?: PaymentMethod;
  readonly unitPrice?: UnitPrice;
  readonly userWarnings?: UserWarning[];
  readonly userReference?: string;
  readonly sourceCurrency?: string;
  readonly targetCurrency?: string;
  readonly cancellationReason?: SdkError;
  readonly sourceId?: string;
  readonly targetId?: string;
  readonly subscriptionInfo?: SubscriptionInfo;
  readonly exchangeRate?: Amount;
  readonly taxDetails?: TaxInfo[];
  readonly tradeIncentiveInfo?: TradeIncentiveInfo;
  readonly totalFeeWithoutTax?: Fee;
  readonly fiatDenotedTotal?: Amount;
}

// Response types with our wrapper types
export interface CreateConvertQuoteResponse {
  readonly trade?: RatConvertTrade;
}

export interface CommitConvertTradeResponse {
  readonly trade?: RatConvertTrade;
}

export interface GetConvertTradeResponse {
  readonly trade?: RatConvertTrade;
}

// =============================================================================
// SDK Types (pass-through) - no conversion needed
// =============================================================================

export type {
  CommitConvertTradeRequest,
  GetConvertTradeRequest,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/convert/types';
