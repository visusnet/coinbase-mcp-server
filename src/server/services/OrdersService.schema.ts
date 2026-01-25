import { z } from 'zod';
import { OrderSide, StopPriceDirection } from './OrdersService.types';
import { numberToString, numberToStringOptional } from './schema.helpers';

// =============================================================================
// Order Configuration Request Schemas (number → string field-level transforms)
// =============================================================================

const MarketMarketIocRequestSchema = z.object({
  quoteSize: numberToStringOptional.describe('Quote currency amount to spend'),
  baseSize: numberToStringOptional.describe('Base currency amount to buy/sell'),
});

const LimitLimitGtcRequestSchema = z.object({
  baseSize: numberToString.describe('Base currency amount to buy/sell'),
  limitPrice: numberToString.describe('Limit price for the order'),
  postOnly: z.boolean().optional().describe('Post-only order flag'),
});

const LimitLimitGtdRequestSchema = z.object({
  baseSize: numberToString.describe('Base currency amount to buy/sell'),
  limitPrice: numberToString.describe('Limit price for the order'),
  endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
  postOnly: z.boolean().optional().describe('Post-only order flag'),
});

const LimitLimitFokRequestSchema = z.object({
  baseSize: numberToString.describe('Base currency amount to buy/sell'),
  limitPrice: numberToString.describe('Limit price for the order'),
});

const SorLimitIocRequestSchema = z.object({
  baseSize: numberToString.describe('Base currency amount to buy/sell'),
  limitPrice: numberToString.describe('Limit price for the order'),
});

const StopLimitStopLimitGtcRequestSchema = z.object({
  baseSize: numberToString.describe('Base currency amount to buy/sell'),
  limitPrice: numberToString.describe('Limit price for the order'),
  stopPrice: numberToString.describe('Stop trigger price'),
  stopDirection: z
    .nativeEnum(StopPriceDirection)
    .optional()
    .describe('Direction for stop price trigger'),
});

const StopLimitStopLimitGtdRequestSchema = z.object({
  baseSize: numberToString.describe('Base currency amount to buy/sell'),
  limitPrice: numberToString.describe('Limit price for the order'),
  stopPrice: numberToString.describe('Stop trigger price'),
  endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
  stopDirection: z
    .nativeEnum(StopPriceDirection)
    .optional()
    .describe('Direction for stop price trigger'),
});

const TriggerBracketGtcRequestSchema = z.object({
  baseSize: numberToString.describe('Base currency amount to buy/sell'),
  limitPrice: numberToString.describe('Limit price for the order'),
  stopTriggerPrice: numberToString.describe(
    'Stop trigger price for bracket order',
  ),
});

const TriggerBracketGtdRequestSchema = z.object({
  baseSize: numberToString.describe('Base currency amount to buy/sell'),
  limitPrice: numberToString.describe('Limit price for the order'),
  stopTriggerPrice: numberToString.describe(
    'Stop trigger price for bracket order',
  ),
  endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
});

const OrderConfigurationRequestSchema = z
  .object({
    marketMarketIoc: MarketMarketIocRequestSchema.optional().describe(
      'Market order with immediate-or-cancel execution',
    ),
    limitLimitGtc: LimitLimitGtcRequestSchema.optional().describe(
      'Limit order with good-till-cancelled execution',
    ),
    limitLimitGtd: LimitLimitGtdRequestSchema.optional().describe(
      'Limit order with good-till-date execution',
    ),
    limitLimitFok: LimitLimitFokRequestSchema.optional().describe(
      'Limit order with fill-or-kill execution',
    ),
    sorLimitIoc: SorLimitIocRequestSchema.optional().describe(
      'Smart order routing limit order with immediate-or-cancel execution',
    ),
    stopLimitStopLimitGtc:
      StopLimitStopLimitGtcRequestSchema.optional().describe(
        'Stop-limit order with good-till-cancelled execution',
      ),
    stopLimitStopLimitGtd:
      StopLimitStopLimitGtdRequestSchema.optional().describe(
        'Stop-limit order with good-till-date execution',
      ),
    triggerBracketGtc: TriggerBracketGtcRequestSchema.optional().describe(
      'Trigger bracket order with good-till-cancelled execution',
    ),
    triggerBracketGtd: TriggerBracketGtdRequestSchema.optional().describe(
      'Trigger bracket order with good-till-date execution',
    ),
  })
  .describe('Order configuration (specify one order type)');

// =============================================================================
// Request Schemas
// =============================================================================

export const ListOrdersRequestSchema = z.object({
  productIds: z
    .array(z.string())
    .optional()
    .describe('Optional product IDs to filter by'),
  orderStatus: z
    .array(z.string())
    .optional()
    .describe('Optional order statuses to filter by'),
  limit: z.number().optional().describe('Maximum number of orders to return'),
  cursor: z.string().optional().describe('Pagination cursor for next page'),
});

export const GetOrderRequestSchema = z.object({
  orderId: z.string().describe('The ID of the order to retrieve'),
});

export const CreateOrderRequestSchema = z.object({
  clientOrderId: z.string().describe('Unique client order ID'),
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  side: z.nativeEnum(OrderSide).describe('Order side (BUY or SELL)'),
  orderConfiguration: OrderConfigurationRequestSchema.describe(
    'Order configuration',
  ),
});

export const CancelOrdersRequestSchema = z.object({
  orderIds: z.array(z.string()).describe('Array of order IDs to cancel'),
});

export const ListFillsRequestSchema = z.object({
  orderIds: z
    .array(z.string())
    .optional()
    .describe('Optional order IDs to filter by'),
  productIds: z
    .array(z.string())
    .optional()
    .describe('Optional product IDs to filter by'),
  limit: z.number().optional().describe('Maximum number of fills to return'),
  cursor: z.string().optional().describe('Pagination cursor for next page'),
});

export const EditOrderRequestSchema = z.object({
  orderId: z.string().describe('The ID of the order to edit'),
  price: numberToString.describe('New limit price'),
  size: numberToString.describe('New size'),
});

export const PreviewEditOrderRequestSchema = z.object({
  orderId: z.string().describe('The ID of the order to preview editing'),
  price: numberToString.describe('New limit price'),
  size: numberToString.describe('New size'),
});

export const PreviewOrderRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  side: z.nativeEnum(OrderSide).describe('Order side (BUY or SELL)'),
  orderConfiguration: OrderConfigurationRequestSchema.describe(
    'Order configuration',
  ),
});

export const ClosePositionRequestSchema = z.object({
  clientOrderId: z.string().describe('Unique client order ID'),
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  size: numberToStringOptional.describe(
    'Size to close (optional, closes full position if omitted)',
  ),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListOrdersRequest = z.input<typeof ListOrdersRequestSchema>;
export type GetOrderRequest = z.input<typeof GetOrderRequestSchema>;
export type CreateOrderRequest = z.output<typeof CreateOrderRequestSchema>;
export type CancelOrdersRequest = z.input<typeof CancelOrdersRequestSchema>;
export type ListFillsRequest = z.input<typeof ListFillsRequestSchema>;
export type EditOrderRequest = z.output<typeof EditOrderRequestSchema>;
export type PreviewEditOrderRequest = z.output<
  typeof PreviewEditOrderRequestSchema
>;
export type PreviewOrderRequest = z.output<typeof PreviewOrderRequestSchema>;
export type ClosePositionRequest = z.output<typeof ClosePositionRequestSchema>;

// =============================================================================
// Response Enums
// =============================================================================

import { stringToNumber, stringToNumberRequired } from './schema.helpers';

/** Order execution status */
export enum OrderExecutionStatus {
  Pending = 'PENDING',
  Open = 'OPEN',
  Filled = 'FILLED',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  Failed = 'FAILED',
  UnknownOrderStatus = 'UNKNOWN_ORDER_STATUS',
  Queued = 'QUEUED',
  CancelQueued = 'CANCEL_QUEUED',
}

/** Time in force type */
export enum TimeInForceType {
  UnknownTimeInForce = 'UNKNOWN_TIME_IN_FORCE',
  GoodUntilDateTime = 'GOOD_UNTIL_DATE_TIME',
  GoodUntilCancelled = 'GOOD_UNTIL_CANCELLED',
  ImmediateOrCancel = 'IMMEDIATE_OR_CANCEL',
  FillOrKill = 'FILL_OR_KILL',
}

/** Order type */
export enum OrderType {
  UnknownOrderType = 'UNKNOWN_ORDER_TYPE',
  Market = 'MARKET',
  Limit = 'LIMIT',
  Stop = 'STOP',
  StopLimit = 'STOP_LIMIT',
  Bracket = 'BRACKET',
}

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Schema for OrderConfiguration - parses string numbers from API responses.
 */
const OrderConfigurationResponseSchema = z
  .object({
    marketMarketIoc: z
      .object({
        quoteSize: stringToNumber.describe('Quote currency amount to spend'),
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
      })
      .optional()
      .describe('Market order with immediate-or-cancel execution'),
    limitLimitGtc: z
      .object({
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
        limitPrice: stringToNumber.describe('Limit price for the order'),
        postOnly: z.boolean().optional().describe('Post-only order flag'),
      })
      .optional()
      .describe('Limit order with good-till-cancelled execution'),
    limitLimitGtd: z
      .object({
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
        limitPrice: stringToNumber.describe('Limit price for the order'),
        endTime: z
          .string()
          .optional()
          .describe('Good-till-date expiration time (ISO 8601)'),
        postOnly: z.boolean().optional().describe('Post-only order flag'),
      })
      .optional()
      .describe('Limit order with good-till-date execution'),
    limitLimitFok: z
      .object({
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
        limitPrice: stringToNumber.describe('Limit price for the order'),
      })
      .optional()
      .describe('Limit order with fill-or-kill execution'),
    sorLimitIoc: z
      .object({
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
        limitPrice: stringToNumber.describe('Limit price for the order'),
      })
      .optional()
      .describe('Smart order routing limit order with immediate-or-cancel'),
    stopLimitStopLimitGtc: z
      .object({
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
        limitPrice: stringToNumber.describe('Limit price for the order'),
        stopPrice: stringToNumber.describe('Stop trigger price'),
        stopDirection: z
          .nativeEnum(StopPriceDirection)
          .optional()
          .describe('Direction for stop price trigger'),
      })
      .optional()
      .describe('Stop-limit order with good-till-cancelled execution'),
    stopLimitStopLimitGtd: z
      .object({
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
        limitPrice: stringToNumber.describe('Limit price for the order'),
        stopPrice: stringToNumber.describe('Stop trigger price'),
        endTime: z
          .string()
          .optional()
          .describe('Good-till-date expiration time (ISO 8601)'),
        stopDirection: z
          .nativeEnum(StopPriceDirection)
          .optional()
          .describe('Direction for stop price trigger'),
      })
      .optional()
      .describe('Stop-limit order with good-till-date execution'),
    triggerBracketGtc: z
      .object({
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
        limitPrice: stringToNumber.describe('Limit price for the order'),
        stopTriggerPrice: stringToNumber.describe(
          'Stop trigger price for bracket order',
        ),
      })
      .optional()
      .describe('Trigger bracket order with good-till-cancelled execution'),
    triggerBracketGtd: z
      .object({
        baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
        limitPrice: stringToNumber.describe('Limit price for the order'),
        stopTriggerPrice: stringToNumber.describe(
          'Stop trigger price for bracket order',
        ),
        endTime: z
          .string()
          .optional()
          .describe('Good-till-date expiration time (ISO 8601)'),
      })
      .optional()
      .describe('Trigger bracket order with good-till-date execution'),
  })
  .describe('Order configuration (one order type present)');

/**
 * Schema for SDK Edit type - parses string numbers from API.
 */
const EditResponseSchema = z.object({
  price: stringToNumber.describe('The updated price of the order'),
  size: stringToNumber.describe('The updated size of the order'),
  replaceAcceptTimestamp: z
    .string()
    .optional()
    .describe('Timestamp when the edit was accepted'),
});

const OrderResponseSchema = z.object({
  orderId: z.string().describe('Order ID'),
  productId: z.string().describe('Product ID'),
  userId: z.string().describe('User ID'),
  orderConfiguration: OrderConfigurationResponseSchema.describe(
    'Order configuration',
  ),
  side: z.nativeEnum(OrderSide).describe('Order side (BUY or SELL)'),
  clientOrderId: z.string().describe('Client order ID'),
  status: z.nativeEnum(OrderExecutionStatus).describe('Order execution status'),
  timeInForce: z
    .nativeEnum(TimeInForceType)
    .optional()
    .describe('Time in force type'),
  createdTime: z.string().describe('Order creation timestamp'),
  completionPercentage: stringToNumberRequired.describe(
    'Completion percentage',
  ),
  filledSize: stringToNumber.describe('Filled size'),
  averageFilledPrice: stringToNumberRequired.describe('Average filled price'),
  fee: stringToNumber.describe('Fee amount'),
  numberOfFills: stringToNumberRequired.describe('Number of fills'),
  filledValue: stringToNumber.describe('Filled value'),
  pendingCancel: z.boolean().describe('Whether cancel is pending'),
  sizeInQuote: z.boolean().describe('Whether size is in quote currency'),
  totalFees: stringToNumberRequired.describe('Total fees'),
  sizeInclusiveOfFees: z.boolean().describe('Whether size includes fees'),
  totalValueAfterFees: stringToNumberRequired.describe(
    'Total value after fees',
  ),
  triggerStatus: z.string().optional().describe('Trigger status'),
  orderType: z.nativeEnum(OrderType).optional().describe('Order type'),
  rejectReason: z.string().optional().describe('Rejection reason'),
  settled: z.boolean().optional().describe('Whether order is settled'),
  productType: z.string().optional().describe('Product type'),
  rejectMessage: z.string().optional().describe('Rejection message'),
  cancelMessage: z.string().optional().describe('Cancellation message'),
  orderPlacementSource: z
    .string()
    .optional()
    .describe('Order placement source'),
  outstandingHoldAmount: stringToNumber.describe('Outstanding hold amount'),
  isLiquidation: z
    .boolean()
    .optional()
    .describe('Whether this is a liquidation'),
  lastFillTime: z.string().optional().describe('Last fill timestamp'),
  editHistory: z.array(EditResponseSchema).optional().describe('Edit history'),
  leverage: stringToNumber.describe('Leverage'),
  marginType: z.string().optional().describe('Margin type'),
  retailPortfolioId: z.string().optional().describe('Retail portfolio ID'),
});

export const ListOrdersResponseSchema = z.object({
  orders: z.array(OrderResponseSchema).describe('List of orders'),
  cursor: z.string().optional().describe('Cursor for next page'),
  hasNext: z.boolean().describe('Whether more results are available'),
});

export const GetOrderResponseSchema = z
  .object({
    order: OrderResponseSchema.describe('Order details'),
  })
  .transform((data) => data.order);

// =============================================================================
// Additional Response Enums
// =============================================================================

/** Cancel order failure reason */
export enum CancelOrderFailureReason {
  UnknownCancelFailureReason = 'UNKNOWN_CANCEL_FAILURE_REASON',
  InvalidCancelRequest = 'INVALID_CANCEL_REQUEST',
  UnknownCancelOrder = 'UNKNOWN_CANCEL_ORDER',
  CommanderRejectedCancelOrder = 'COMMANDER_REJECTED_CANCEL_ORDER',
  DuplicateCancelRequest = 'DUPLICATE_CANCEL_REQUEST',
  InvalidCancelProductId = 'INVALID_CANCEL_PRODUCT_ID',
  InvalidCancelFcmTradingSession = 'INVALID_CANCEL_FCM_TRADING_SESSION',
  NotAllowedToCancel = 'NOT_ALLOWED_TO_CANCEL',
  OrderIsFullyFilled = 'ORDER_IS_FULLY_FILLED',
  OrderIsBeingReplaced = 'ORDER_IS_BEING_REPLACED',
}

/** Liquidity indicator for fills */
enum LiquidityIndicator {
  UnknownLiquidityIndicator = 'UNKNOWN_LIQUIDITY_INDICATOR',
  Maker = 'MAKER',
  Taker = 'TAKER',
}

/** Edit order failure reason */
enum EditOrderFailureReason {
  UnknownEditOrderFailureReason = 'UNKNOWN_EDIT_ORDER_FAILURE_REASON',
  CommanderRejectedEditOrder = 'COMMANDER_REJECTED_EDIT_ORDER',
  CannotEditToBelowFilledSize = 'CANNOT_EDIT_TO_BELOW_FILLED_SIZE',
  OrderNotFound = 'ORDER_NOT_FOUND',
  CallerIdMismatch = 'CALLER_ID_MISMATCH',
  OnlyLimitOrderEditsSupported = 'ONLY_LIMIT_ORDER_EDITS_SUPPORTED',
  InvalidEditedSize = 'INVALID_EDITED_SIZE',
  InvalidEditedPrice = 'INVALID_EDITED_PRICE',
  InvalidOriginalSize = 'INVALID_ORIGINAL_SIZE',
  InvalidOriginalPrice = 'INVALID_ORIGINAL_PRICE',
  EditRequestEqualToOriginalRequest = 'EDIT_REQUEST_EQUAL_TO_ORIGINAL_REQUEST',
  OnlyOpenOrdersCanBeEdited = 'ONLY_OPEN_ORDERS_CAN_BE_EDITED',
  SizeInQuoteEditsNotAllowed = 'SIZE_IN_QUOTE_EDITS_NOT_ALLOWED',
  OrderIsAlreadyBeingReplaced = 'ORDER_IS_ALREADY_BEING_REPLACED',
}

/** New order failure reason */
enum NewOrderFailureReason {
  UnknownFailureReason = 'UNKNOWN_FAILURE_REASON',
  UnsupportedOrderConfiguration = 'UNSUPPORTED_ORDER_CONFIGURATION',
  InvalidSide = 'INVALID_SIDE',
  InvalidProductId = 'INVALID_PRODUCT_ID',
  InvalidSizePrecision = 'INVALID_SIZE_PRECISION',
  InvalidPricePrecision = 'INVALID_PRICE_PRECISION',
  InsufficientFund = 'INSUFFICIENT_FUND',
  InvalidLedgerBalance = 'INVALID_LEDGER_BALANCE',
  OrderEntryDisabled = 'ORDER_ENTRY_DISABLED',
  IneligiblePair = 'INELIGIBLE_PAIR',
  InvalidLimitPricePostOnly = 'INVALID_LIMIT_PRICE_POST_ONLY',
  InvalidLimitPrice = 'INVALID_LIMIT_PRICE',
  InvalidNoLiquidity = 'INVALID_NO_LIQUIDITY',
  InvalidRequest = 'INVALID_REQUEST',
  CommanderRejectedNewOrder = 'COMMANDER_REJECTED_NEW_ORDER',
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  InLiquidation = 'IN_LIQUIDATION',
  InvalidMarginType = 'INVALID_MARGIN_TYPE',
  InvalidLeverage = 'INVALID_LEVERAGE',
  UntradableProduct = 'UNTRADABLE_PRODUCT',
  InvalidFcmTradingSession = 'INVALID_FCM_TRADING_SESSION',
  GeofencingRestriction = 'GEOFENCING_RESTRICTION',
}

/** Preview failure reason */
enum PreviewFailureReason {
  UnknownPreviewFailureReason = 'UNKNOWN_PREVIEW_FAILURE_REASON',
  PreviewMissingCommissionRate = 'PREVIEW_MISSING_COMMISSION_RATE',
  PreviewInvalidSide = 'PREVIEW_INVALID_SIDE',
  PreviewInvalidOrderConfig = 'PREVIEW_INVALID_ORDER_CONFIG',
  PreviewInvalidProductId = 'PREVIEW_INVALID_PRODUCT_ID',
  PreviewInvalidSizePrecision = 'PREVIEW_INVALID_SIZE_PRECISION',
  PreviewInvalidPricePrecision = 'PREVIEW_INVALID_PRICE_PRECISION',
  PreviewInsufficientFund = 'PREVIEW_INSUFFICIENT_FUND',
}

/** Preview warning message */
enum PreviewWarningMsg {
  Unknown = 'UNKNOWN',
  BigOrder = 'BIG_ORDER',
  SmallOrder = 'SMALL_ORDER',
}

// =============================================================================
// Additional Response Schemas
// =============================================================================

/**
 * Schema for NewOrderSuccessResponse - successful order creation.
 */
const NewOrderSuccessResponseSchema = z.object({
  orderId: z.string().describe('The ID of the created order'),
  productId: z.string().optional().describe('The trading pair'),
  side: z.nativeEnum(OrderSide).optional().describe('Order side (BUY or SELL)'),
  clientOrderId: z.string().optional().describe('Client-provided order ID'),
});

/**
 * Schema for NewOrderErrorResponse - failed order creation.
 */
const NewOrderErrorResponseSchema = z.object({
  error: z
    .nativeEnum(NewOrderFailureReason)
    .optional()
    .describe('Deprecated failure reason'),
  message: z.string().optional().describe('Generic error message'),
  errorDetails: z.string().optional().describe('Detailed error description'),
  previewFailureReason: z
    .nativeEnum(PreviewFailureReason)
    .optional()
    .describe('Deprecated preview failure reason'),
  newOrderFailureReason: z
    .nativeEnum(NewOrderFailureReason)
    .optional()
    .describe('The reason the order failed'),
});

export const CreateOrderResponseSchema = z.object({
  success: z.boolean().describe('Whether the order was created successfully'),
  successResponse: NewOrderSuccessResponseSchema.optional().describe(
    'Success response details',
  ),
  errorResponse: NewOrderErrorResponseSchema.optional().describe(
    'Error response details',
  ),
  orderConfiguration: OrderConfigurationResponseSchema.optional().describe(
    'The order configuration',
  ),
});

/**
 * Schema for individual cancel order result.
 */
const CancelOrderResultResponseSchema = z.object({
  success: z.boolean().describe('Whether the cancel request was successful'),
  failureReason: z
    .nativeEnum(CancelOrderFailureReason)
    .describe('The reason the cancel failed'),
  orderId: z.string().describe('The ID of the order'),
});

export const CancelOrdersResponseSchema = z.object({
  results: z
    .array(CancelOrderResultResponseSchema)
    .optional()
    .describe('Results of cancel requests'),
});

/**
 * Schema for Fill - individual trade fill.
 */
const FillResponseSchema = z.object({
  entryId: z.string().optional().describe('Unique fill identifier'),
  tradeId: z.string().optional().describe('Trade ID'),
  orderId: z.string().optional().describe('Order ID'),
  tradeTime: z.string().optional().describe('Time of the fill'),
  tradeType: z.string().optional().describe('Type of fill'),
  price: stringToNumber.describe('Fill price'),
  size: stringToNumber.describe('Fill size'),
  commission: stringToNumber.describe('Commission amount'),
  productId: z.string().optional().describe('Trading pair'),
  sequenceTimestamp: z.string().optional().describe('Sequence timestamp'),
  liquidityIndicator: z
    .nativeEnum(LiquidityIndicator)
    .optional()
    .describe('Whether maker or taker'),
  sizeInQuote: z.boolean().optional().describe('Size in quote currency'),
  userId: z.string().optional().describe('User ID'),
  side: z.nativeEnum(OrderSide).optional().describe('Order side'),
  retailPortfolioId: z.string().optional().describe('Portfolio ID'),
});

export const ListFillsResponseSchema = z.object({
  fills: z.array(FillResponseSchema).optional().describe('List of fills'),
  cursor: z.string().optional().describe('Cursor for next page'),
});

const EditOrderErrorResponseSchema = z.object({
  editFailureReason: z
    .nativeEnum(EditOrderFailureReason)
    .optional()
    .describe('Edit failure reason'),
  previewFailureReason: z
    .nativeEnum(PreviewFailureReason)
    .optional()
    .describe('Preview failure reason'),
});

export const EditOrderResponseSchema = z.object({
  success: z.boolean().describe('Whether the edit was successful'),
  errors: z
    .array(EditOrderErrorResponseSchema)
    .optional()
    .describe('List of errors if failed'),
});

export const PreviewEditOrderResponseSchema = z.object({
  errors: z
    .array(EditOrderErrorResponseSchema)
    .describe('List of potential errors'),
  slippage: stringToNumber.describe('Estimated slippage'),
  orderTotal: stringToNumber.describe('Total order amount'),
  commissionTotal: stringToNumber.describe('Total commission'),
  quoteSize: stringToNumber.describe('Quote currency size'),
  baseSize: stringToNumber.describe('Base currency size'),
  bestBid: stringToNumber.describe('Best bid price'),
  bestAsk: stringToNumber.describe('Best ask price'),
  averageFilledPrice: stringToNumber.describe('Average fill price'),
});

export const ClosePositionResponseSchema = z.object({
  success: z.boolean().describe('Whether the close was successful'),
  successResponse: NewOrderSuccessResponseSchema.optional().describe(
    'Success response details',
  ),
  errorResponse: NewOrderErrorResponseSchema.optional().describe(
    'Error response details',
  ),
  orderConfiguration: OrderConfigurationResponseSchema.optional().describe(
    'The order configuration',
  ),
});

export const PreviewOrderResponseSchema = z.object({
  orderTotal: stringToNumberRequired.describe('Total order amount'),
  commissionTotal: stringToNumberRequired.describe('Total commission'),
  errs: z
    .array(z.nativeEnum(PreviewFailureReason))
    .describe('List of potential errors'),
  warning: z
    .array(z.nativeEnum(PreviewWarningMsg))
    .describe('List of warnings'),
  quoteSize: stringToNumberRequired.describe('Quote currency size'),
  baseSize: stringToNumberRequired.describe('Base currency size'),
  bestBid: stringToNumberRequired.describe('Best bid price'),
  bestAsk: stringToNumberRequired.describe('Best ask price'),
  isMax: z.boolean().describe('Whether using maximum available'),
  orderMarginTotal: stringToNumber.describe('Total margin for order'),
  leverage: stringToNumber.describe('Leverage amount'),
  longLeverage: stringToNumber.describe('Long leverage'),
  shortLeverage: stringToNumber.describe('Short leverage'),
  slippage: stringToNumber.describe('Estimated slippage'),
  previewId: z.string().optional().describe('Preview ID'),
  currentLiquidationBuffer: stringToNumber.describe(
    'Current liquidation buffer',
  ),
  projectedLiquidationBuffer: stringToNumber.describe(
    'Projected liquidation buffer',
  ),
  maxLeverage: stringToNumber.describe('Maximum leverage'),
});

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type ListOrdersResponse = z.output<typeof ListOrdersResponseSchema>;
export type GetOrderResponse = z.output<typeof GetOrderResponseSchema>;
export type CreateOrderResponse = z.output<typeof CreateOrderResponseSchema>;
export type CancelOrdersResponse = z.output<typeof CancelOrdersResponseSchema>;
export type ListFillsResponse = z.output<typeof ListFillsResponseSchema>;
export type EditOrderResponse = z.output<typeof EditOrderResponseSchema>;
export type PreviewEditOrderResponse = z.output<
  typeof PreviewEditOrderResponseSchema
>;
export type ClosePositionResponse = z.output<
  typeof ClosePositionResponseSchema
>;
export type PreviewOrderResponse = z.output<typeof PreviewOrderResponseSchema>;
