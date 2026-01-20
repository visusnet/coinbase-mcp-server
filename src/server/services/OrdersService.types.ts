// Wrapper types that accept numbers for API convenience (SDK requires strings)
import type { OrderSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderSide.js';
import type { StopPriceDirection } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/StopPriceDirection.js';
import type { Edit } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Edit';
import type { MarginType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/MarginType';
import type { OrderConfiguration as SdkOrderConfiguration } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/OrderConfiguration';
import type { OrderExecutionStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderExecutionStatus';
import type { OrderPlacementSource } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderPlacementSource';
import type { OrderType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderType';
import type { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType';
import type { RejectReason } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/RejectReason';
import type { StopTriggerStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/StopTriggerStatus';
import type { TimeInForceType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/TimeInForceType';

// =============================================================================
// SDK Type Re-exports
// =============================================================================

export type {
  ListOrdersResponse as SdkListOrdersResponse,
  GetOrderResponse as SdkGetOrderResponse,
  CreateOrderRequest as SdkCreateOrderRequest,
  EditOrderRequest as SdkEditOrderRequest,
  EditOrderPreviewRequest as SdkPreviewEditOrderRequest,
  ClosePositionRequest as SdkClosePositionRequest,
  CreateOrderPreviewRequest as SdkPreviewOrderRequest,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/orders/types';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

/** Market order configuration for immediate-or-cancel execution */
export interface MarketMarketIoc {
  readonly quoteSize?: number;
  readonly baseSize?: number;
}

/** Limit order configuration for good-till-cancelled execution */
export interface LimitLimitGtc {
  readonly baseSize: number;
  readonly limitPrice: number;
  readonly postOnly?: boolean;
}

export interface LimitLimitGtd {
  readonly baseSize: number;
  readonly limitPrice: number;
  readonly endTime: string;
  readonly postOnly?: boolean;
}

export interface LimitLimitFok {
  readonly baseSize: number;
  readonly limitPrice: number;
}

export interface SorLimitIoc {
  readonly baseSize: number;
  readonly limitPrice: number;
}

/** Stop-limit order configuration for good-till-cancelled execution */
export interface StopLimitStopLimitGtc {
  readonly baseSize: number;
  readonly limitPrice: number;
  readonly stopPrice: number;
  readonly stopDirection?: StopPriceDirection;
}

export interface StopLimitStopLimitGtd {
  readonly baseSize: number;
  readonly limitPrice: number;
  readonly stopPrice: number;
  readonly endTime: string;
  readonly stopDirection?: StopPriceDirection;
}

/** Trigger bracket order configuration for good-till-cancelled execution */
export interface TriggerBracketGtc {
  readonly baseSize: number;
  readonly limitPrice: number;
  readonly stopTriggerPrice: number;
}

export interface TriggerBracketGtd {
  readonly baseSize: number;
  readonly limitPrice: number;
  readonly stopTriggerPrice: number;
  readonly endTime: string;
}

// Full order configuration with all types
export interface OrderConfiguration {
  readonly marketMarketIoc?: MarketMarketIoc;
  readonly limitLimitGtc?: LimitLimitGtc;
  readonly limitLimitGtd?: LimitLimitGtd;
  readonly limitLimitFok?: LimitLimitFok;
  readonly sorLimitIoc?: SorLimitIoc;
  readonly stopLimitStopLimitGtc?: StopLimitStopLimitGtc;
  readonly stopLimitStopLimitGtd?: StopLimitStopLimitGtd;
  readonly triggerBracketGtc?: TriggerBracketGtc;
  readonly triggerBracketGtd?: TriggerBracketGtd;
}

// Create order request with number types
export interface CreateOrderRequest {
  readonly clientOrderId: string;
  readonly productId: string;
  readonly side: OrderSide;
  readonly orderConfiguration: OrderConfiguration;
}

// Edit order request with number types
export interface EditOrderRequest {
  readonly orderId: string;
  readonly price: number;
  readonly size: number;
}

// Preview edit order request with number types
export interface PreviewEditOrderRequest {
  readonly orderId: string;
  readonly price: number;
  readonly size: number;
}

// Close position request with number types
export interface ClosePositionRequest {
  readonly clientOrderId: string;
  readonly productId: string;
  readonly size?: number;
}

// Preview order request with number types
export interface PreviewOrderRequest {
  readonly productId: string;
  readonly side: OrderSide;
  readonly orderConfiguration: OrderConfiguration;
}

// Order type with numbers instead of strings for numeric fields
export interface Order {
  readonly orderId: string;
  readonly productId: string;
  readonly userId: string;
  readonly orderConfiguration: SdkOrderConfiguration;
  readonly side: OrderSide;
  readonly clientOrderId: string;
  readonly status: OrderExecutionStatus;
  readonly timeInForce?: TimeInForceType;
  readonly createdTime: string;
  readonly completionPercentage: number;
  readonly filledSize?: number;
  readonly averageFilledPrice: number;
  readonly fee?: number;
  readonly numberOfFills: number;
  readonly filledValue?: number;
  readonly pendingCancel: boolean;
  readonly sizeInQuote: boolean;
  readonly totalFees: number;
  readonly sizeInclusiveOfFees: boolean;
  readonly totalValueAfterFees: number;
  readonly triggerStatus?: StopTriggerStatus;
  readonly orderType?: OrderType;
  readonly rejectReason?: RejectReason;
  readonly settled?: boolean;
  readonly productType?: ProductType;
  readonly rejectMessage?: string;
  readonly cancelMessage?: string;
  readonly orderPlacementSource?: OrderPlacementSource;
  readonly outstandingHoldAmount?: number;
  readonly isLiquidation?: boolean;
  readonly lastFillTime?: string;
  readonly editHistory?: Array<Edit>;
  readonly leverage?: number;
  readonly marginType?: MarginType;
  readonly retailPortfolioId?: string;
}

// Response type aliases with our Order type
export type GetOrderResponse = Order;

// ListOrdersResponse with our Order type
export interface ListOrdersResponse {
  readonly orders?: Order[];
  readonly cursor?: string;
  readonly hasNext: boolean;
}

// Re-export other response types unchanged (no numeric fields to convert)
export type {
  CreateOrderResponse,
  ListOrdersRequest,
  GetOrderRequest,
  CancelOrdersRequest,
  CancelOrderResponse as CancelOrdersResponse,
  ListFillsRequest,
  ListFillsResponse,
  EditOrderResponse,
  EditOrderPreviewResponse as PreviewEditOrderResponse,
  ClosePositionResponse,
  CreateOrderPreviewResponse as PreviewOrderResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/orders/types';

// Re-export OrderSide for convenience
export { OrderSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderSide.js';
