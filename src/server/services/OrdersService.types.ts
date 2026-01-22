// Wrapper types that accept numbers for API convenience (SDK requires strings)
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
// Locally Defined Enums (avoid SDK dependency for these common enums)
// =============================================================================

/** Order side for buy/sell orders */
export enum OrderSide {
  Buy = 'BUY',
  Sell = 'SELL',
}

/** Stop price direction for stop-limit orders */
export enum StopPriceDirection {
  Up = 'STOP_DIRECTION_STOP_UP',
  Down = 'STOP_DIRECTION_STOP_DOWN',
}

// =============================================================================
// SDK Types (for conversion) - these have our own converted counterparts
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

// Note: Order configuration types (MarketMarketIoc, LimitLimitGtc, etc.) and
// Request types (CreateOrderRequest, EditOrderRequest, etc.) are derived from
// Zod schemas in OrdersService.schema.ts

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
  CancelOrderResponse as CancelOrdersResponse,
  ListFillsResponse,
  EditOrderResponse,
  EditOrderPreviewResponse as PreviewEditOrderResponse,
  ClosePositionResponse,
  CreateOrderPreviewResponse as PreviewOrderResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/orders/types';
