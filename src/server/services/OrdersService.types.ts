// Our types with number instead of string for numeric fields
import type { OrderSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderSide.js';
import type { StopPriceDirection } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/StopPriceDirection.js';

// Market order configuration with numbers
export interface MarketMarketIoc {
  readonly quoteSize?: number;
  readonly baseSize?: number;
}

// Limit order configurations with numbers
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

// Stop-limit order configurations with numbers
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

// Trigger bracket configurations with numbers
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

// Re-export response types unchanged
export type {
  CreateOrderResponse,
  ListOrdersRequest,
  ListOrdersResponse,
  GetOrderRequest,
  GetOrderResponse,
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
