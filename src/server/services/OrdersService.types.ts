// =============================================================================
// Request Enums
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
// Response Enums
// =============================================================================

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
export enum LiquidityIndicator {
  UnknownLiquidityIndicator = 'UNKNOWN_LIQUIDITY_INDICATOR',
  Maker = 'MAKER',
  Taker = 'TAKER',
}

/** Edit order failure reason */
export enum EditOrderFailureReason {
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
export enum NewOrderFailureReason {
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
export enum PreviewFailureReason {
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
export enum PreviewWarningMsg {
  Unknown = 'UNKNOWN',
  BigOrder = 'BIG_ORDER',
  SmallOrder = 'SMALL_ORDER',
}
