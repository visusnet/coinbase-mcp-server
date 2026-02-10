// =============================================================================
// Request Enums
// =============================================================================

/** Order side for buy/sell orders */
export enum OrderSide {
  Buy = 'BUY',
  Sell = 'SELL',
}

/** Direction for stop-limit order triggers */
export enum StopPriceDirection {
  Up = 'STOP_DIRECTION_STOP_UP',
  Down = 'STOP_DIRECTION_STOP_DOWN',
}

// =============================================================================
// Response Enums
// =============================================================================

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
  EditQueued = 'EDIT_QUEUED',
}

export enum TimeInForceType {
  UnknownTimeInForce = 'UNKNOWN_TIME_IN_FORCE',
  GoodUntilDateTime = 'GOOD_UNTIL_DATE_TIME',
  GoodUntilCancelled = 'GOOD_UNTIL_CANCELLED',
  ImmediateOrCancel = 'IMMEDIATE_OR_CANCEL',
  FillOrKill = 'FILL_OR_KILL',
}

export enum OrderType {
  UnknownOrderType = 'UNKNOWN_ORDER_TYPE',
  Market = 'MARKET',
  Limit = 'LIMIT',
  Stop = 'STOP',
  StopLimit = 'STOP_LIMIT',
  Bracket = 'BRACKET',
  TakeProfitStopLoss = 'TAKE_PROFIT_STOP_LOSS',
  Twap = 'TWAP',
  RollOpen = 'ROLL_OPEN',
  RollClose = 'ROLL_CLOSE',
  Liquidation = 'LIQUIDATION',
  Scaled = 'SCALED',
}

export enum TriggerStatus {
  UnknownTriggerStatus = 'UNKNOWN_TRIGGER_STATUS',
  InvalidOrderType = 'INVALID_ORDER_TYPE',
  StopPending = 'STOP_PENDING',
  StopTriggered = 'STOP_TRIGGERED',
}

export enum OrderPlacementSource {
  UnknownPlacementSource = 'UNKNOWN_PLACEMENT_SOURCE',
  RetailSimple = 'RETAIL_SIMPLE',
  RetailAdvanced = 'RETAIL_ADVANCED',
}

export enum MarginType {
  UnknownMarginType = 'UNKNOWN_MARGIN_TYPE',
  Cross = 'CROSS',
  Isolated = 'ISOLATED',
}

export enum CostBasisMethod {
  Unspecified = 'COST_BASIS_METHOD_UNSPECIFIED',
  Hifo = 'COST_BASIS_METHOD_HIFO',
  Lifo = 'COST_BASIS_METHOD_LIFO',
  Fifo = 'COST_BASIS_METHOD_FIFO',
}

export enum DisplayedOrderConfig {
  Unknown = 'UNKNOWN_DISPLAYED_ORDER_CONFIG',
  InstantGfd = 'INSTANT_GFD',
  LimitGfd = 'LIMIT_GFD',
}

export enum EquityTradingSession {
  Unknown = 'UNKNOWN_EQUITY_TRADING_SESSION',
  Normal = 'EQUITY_TRADING_SESSION_NORMAL',
  AfterHours = 'EQUITY_TRADING_SESSION_AFTER_HOURS',
  MultiSession = 'EQUITY_TRADING_SESSION_MULTI_SESSION',
  Overnight = 'EQUITY_TRADING_SESSION_OVERNIGHT',
  PreMarket = 'EQUITY_TRADING_SESSION_PRE_MARKET',
}

export enum RejectReason {
  Unspecified = 'REJECT_REASON_UNSPECIFIED',
  HoldFailure = 'HOLD_FAILURE',
  TooManyOpenOrders = 'TOO_MANY_OPEN_ORDERS',
  InsufficientFunds = 'REJECT_REASON_INSUFFICIENT_FUNDS',
  RateLimitExceeded = 'RATE_LIMIT_EXCEEDED',
}

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

/** Maker/taker classification for fills */
export enum LiquidityIndicator {
  UnknownLiquidityIndicator = 'UNKNOWN_LIQUIDITY_INDICATOR',
  Maker = 'MAKER',
  Taker = 'TAKER',
}

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
  PortfolioNotAllowedForEdits = 'PORTFOLIO_NOT_ALLOWED_FOR_EDITS',
  StrategyNotSupported = 'STRATEGY_NOT_SUPPORTED',
  FieldStoppriceNotSupported = 'FIELD_STOPPRICE_NOT_SUPPORTED',
  FieldDisplaysizeNotSupported = 'FIELD_DISPLAYSIZE_NOT_SUPPORTED',
  FieldEndtimeNotSupported = 'FIELD_ENDTIME_NOT_SUPPORTED',
  InvalidOriginalTime = 'INVALID_ORIGINAL_TIME',
  InvalidNewEndtime = 'INVALID_NEW_ENDTIME',
  NotStarted = 'NOT_STARTED',
  CannotEditFuturesOrder = 'CANNOT_EDIT_FUTURES_ORDER',
  FuturesVenueOrderNotFound = 'FUTURES_VENUE_ORDER_NOT_FOUND',
  CannotEditStopPriceForTriggeredOrder = 'CANNOT_EDIT_STOP_PRICE_FOR_TRIGGERED_ORDER',
  CannotEditOrderPendingCancel = 'CANNOT_EDIT_ORDER_PENDING_CANCEL',
  InsufficientTimeToEdit = 'INSUFFICIENT_TIME_TO_EDIT',
  ExceededMaxAllowedEditRequestCount = 'EXCEEDED_MAX_ALLOWED_EDIT_REQUEST_COUNT',
  CannotCancelActiveAttachedOrder = 'CANNOT_CANCEL_ACTIVE_ATTACHED_ORDER',
  OrderEditInvalidAttachedOrderRequest = 'ORDER_EDIT_INVALID_ATTACHED_ORDER_REQUEST',
  OrderEditOrderTypeNotSupported = 'ORDER_EDIT_ORDER_TYPE_NOT_SUPPORTED',
  CannotEditTriggeredOrder = 'CANNOT_EDIT_TRIGGERED_ORDER',
  InvalidEditedStopPrice = 'INVALID_EDITED_STOP_PRICE',
  InvalidEditedStopLimitPrice = 'INVALID_EDITED_STOP_LIMIT_PRICE',
  InvalidOriginalStopPrice = 'INVALID_ORIGINAL_STOP_PRICE',
  InvalidOriginalStopLimitPrice = 'INVALID_ORIGINAL_STOP_LIMIT_PRICE',
  InvalidOriginalAttachedOrderConfig = 'INVALID_ORIGINAL_ATTACHED_ORDER_CONFIG',
  CannotEditAttachedOrderConfigAfterCreation = 'CANNOT_EDIT_ATTACHED_ORDER_CONFIGURATION_AFTER_CREATION',
  CannotConvertSizeAsset = 'CANNOT_CONVERT_SIZE_ASSET',
  CannotConvertDisplaySizeAsset = 'CANNOT_CONVERT_DISPLAY_SIZE_ASSET',
  CannotEditAttachedOrderSizeWithOpenOriginatingOrder = 'CANNOT_EDIT_ATTACHED_ORDER_SIZE_WITH_OPEN_ORIGINATING_ORDER',
  InvalidEditedTakeProfitPrice = 'INVALID_EDITED_TAKE_PROFIT_PRICE',
  InvalidEditedStopLossPrice = 'INVALID_EDITED_STOP_LOSS_PRICE',
  InvalidEditedAttachedOrderConfiguration = 'INVALID_EDITED_ATTACHED_ORDER_CONFIGURATION',
  CannotEditAttachedSlOrderPrice = 'CANNOT_EDIT_ATTACHED_SL_ORDER_PRICE',
  CannotAddAttachedOrderToOrderType = 'CANNOT_ADD_ATTACHED_ORDER_TO_ORDER_TYPE',
  CannotChangeSideOfOrder = 'CANNOT_CHANGE_SIDE_OF_ORDER',
  CannotChangeOrderTypeOfOrder = 'CANNOT_CHANGE_ORDER_TYPE_OF_ORDER',
  CannotChangeProductIdOfOrder = 'CANNOT_CHANGE_PRODUCT_ID_OF_ORDER',
  PrevClientOrderIdRequiredWhenClientOrderIdProvided = 'PREV_CLIENT_ORDER_ID_REQUIRED_WHEN_CLIENT_ORDER_ID_PROVIDED',
  ClientOrderIdRequiredWhenPrevClientOrderIdProvided = 'CLIENT_ORDER_ID_REQUIRED_WHEN_PREV_CLIENT_ORDER_ID_PROVIDED',
  ClientOrderIdMustBeDifferentFromPrevClientOrderId = 'CLIENT_ORDER_ID_MUST_BE_DIFFERENT_FROM_PREV_CLIENT_ORDER_ID',
  PrevClientOrderIdMustMatchCurrentClientOrderId = 'PREV_CLIENT_ORDER_ID_MUST_MATCH_CURRENT_CLIENT_ORDER_ID',
  CannotModifyAttachedConfigOfNonNewOrder = 'CANNOT_MODIFY_ATTACHED_CONFIG_OF_NON_NEW_ORDER',
  InvalidEditedAttachedOrderConfigNonModifiableValueEdit = 'INVALID_EDITED_ATTACHED_ORDER_CONFIGURATION_NON_MODIFIABLE_VALUE_EDIT',
  AttachedConfigurationIsEqual = 'ATTACHED_CONFIGURATION_IS_EQUAL',
  CannotAddLegToTpslOrder = 'CANNOT_ADD_LEG_TO_TPSL_ORDER',
  CannotRemoveLegFromTpslOrder = 'CANNOT_REMOVE_LEG_FROM_TPSL_ORDER',
  SingleLeggedBracketOrderNotAllowed = 'SINGLE_LEGGED_BRACKET_ORDER_NOT_ALLOWED',
  SingleLeggedAttachedOrderConfigNotAllowed = 'SINGLE_LEGGED_ATTACHED_ORDER_CONFIGURATION_NOT_ALLOWED',
}

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

export enum PreviewFailureReason {
  UnknownPreviewFailureReason = 'UNKNOWN_PREVIEW_FAILURE_REASON',
  PreviewMissingCommissionRate = 'PREVIEW_MISSING_COMMISSION_RATE',
  PreviewInvalidSide = 'PREVIEW_INVALID_SIDE',
  PreviewInvalidOrderConfig = 'PREVIEW_INVALID_ORDER_CONFIG',
  PreviewInvalidProductId = 'PREVIEW_INVALID_PRODUCT_ID',
  PreviewInvalidSizePrecision = 'PREVIEW_INVALID_SIZE_PRECISION',
  PreviewInvalidPricePrecision = 'PREVIEW_INVALID_PRICE_PRECISION',
  PreviewInsufficientFund = 'PREVIEW_INSUFFICIENT_FUND',
  PreviewInvalidOrderTypeForAttached = 'PREVIEW_INVALID_ORDER_TYPE_FOR_ATTACHED',
  PreviewInvalidOrderSideForAttachedTpsl = 'PREVIEW_INVALID_ORDER_SIDE_FOR_ATTACHED_TPSL',
}

export enum PreviewWarningMsg {
  Unknown = 'UNKNOWN',
  BigOrder = 'BIG_ORDER',
  SmallOrder = 'SMALL_ORDER',
}
