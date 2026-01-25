import { z } from 'zod';
import {
  OrderSide,
  StopPriceDirection,
  OrderExecutionStatus,
  TimeInForceType,
  OrderType,
  CancelOrderFailureReason,
  LiquidityIndicator,
  EditOrderFailureReason,
  NewOrderFailureReason,
  PreviewFailureReason,
  PreviewWarningMsg,
} from './OrdersService.types';
import { stringToNumber, stringToNumberRequired } from './schema.helpers';

// =============================================================================
// Order Configuration Sub-Schemas (string -> number parsing)
// =============================================================================

const MarketMarketIocSchema = z
  .object({
    quoteSize: stringToNumber.describe('Quote currency amount to spend'),
    baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
  })
  .describe('Market order with immediate-or-cancel execution');

const LimitLimitGtcSchema = z
  .object({
    baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
    limitPrice: stringToNumber.describe('Limit price for the order'),
    postOnly: z.boolean().optional().describe('Post-only order flag'),
  })
  .describe('Limit order with good-till-cancelled execution');

const LimitLimitGtdSchema = z
  .object({
    baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
    limitPrice: stringToNumber.describe('Limit price for the order'),
    endTime: z
      .string()
      .optional()
      .describe('Good-till-date expiration time (ISO 8601)'),
    postOnly: z.boolean().optional().describe('Post-only order flag'),
  })
  .describe('Limit order with good-till-date execution');

const LimitLimitFokSchema = z
  .object({
    baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
    limitPrice: stringToNumber.describe('Limit price for the order'),
  })
  .describe('Limit order with fill-or-kill execution');

const SorLimitIocSchema = z
  .object({
    baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
    limitPrice: stringToNumber.describe('Limit price for the order'),
  })
  .describe('Smart order routing limit order with immediate-or-cancel');

const StopLimitStopLimitGtcSchema = z
  .object({
    baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
    limitPrice: stringToNumber.describe('Limit price for the order'),
    stopPrice: stringToNumber.describe('Stop trigger price'),
    stopDirection: z
      .nativeEnum(StopPriceDirection)
      .optional()
      .describe('Direction for stop price trigger'),
  })
  .describe('Stop-limit order with good-till-cancelled execution');

const StopLimitStopLimitGtdSchema = z
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
  .describe('Stop-limit order with good-till-date execution');

const TriggerBracketGtcSchema = z
  .object({
    baseSize: stringToNumber.describe('Base currency amount to buy/sell'),
    limitPrice: stringToNumber.describe('Limit price for the order'),
    stopTriggerPrice: stringToNumber.describe(
      'Stop trigger price for bracket order',
    ),
  })
  .describe('Trigger bracket order with good-till-cancelled execution');

const TriggerBracketGtdSchema = z
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
  .describe('Trigger bracket order with good-till-date execution');

const OrderConfigurationSchema = z
  .object({
    marketMarketIoc: MarketMarketIocSchema.optional().describe(
      'Market order with immediate-or-cancel execution',
    ),
    limitLimitGtc: LimitLimitGtcSchema.optional().describe(
      'Limit order with good-till-cancelled execution',
    ),
    limitLimitGtd: LimitLimitGtdSchema.optional().describe(
      'Limit order with good-till-date execution',
    ),
    limitLimitFok: LimitLimitFokSchema.optional().describe(
      'Limit order with fill-or-kill execution',
    ),
    sorLimitIoc: SorLimitIocSchema.optional().describe(
      'Smart order routing limit order with immediate-or-cancel',
    ),
    stopLimitStopLimitGtc: StopLimitStopLimitGtcSchema.optional().describe(
      'Stop-limit order with good-till-cancelled execution',
    ),
    stopLimitStopLimitGtd: StopLimitStopLimitGtdSchema.optional().describe(
      'Stop-limit order with good-till-date execution',
    ),
    triggerBracketGtc: TriggerBracketGtcSchema.optional().describe(
      'Trigger bracket order with good-till-cancelled execution',
    ),
    triggerBracketGtd: TriggerBracketGtdSchema.optional().describe(
      'Trigger bracket order with good-till-date execution',
    ),
  })
  .describe('Order configuration (one order type present)');

// =============================================================================
// Sub-Schemas for Response Objects
// =============================================================================

/**
 * Schema for SDK Edit type - parses string numbers from API.
 */
const EditSchema = z
  .object({
    price: stringToNumber.describe('The updated price of the order'),
    size: stringToNumber.describe('The updated size of the order'),
    replaceAcceptTimestamp: z
      .string()
      .optional()
      .describe('Timestamp when the edit was accepted'),
  })
  .describe('Edit history entry');

const OrderSchema = z
  .object({
    orderId: z.string().describe('Order ID'),
    productId: z.string().describe('Product ID'),
    userId: z.string().describe('User ID'),
    orderConfiguration: OrderConfigurationSchema.describe(
      'Order configuration',
    ),
    side: z.nativeEnum(OrderSide).describe('Order side (BUY or SELL)'),
    clientOrderId: z.string().describe('Client order ID'),
    status: z
      .nativeEnum(OrderExecutionStatus)
      .describe('Order execution status'),
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
    editHistory: z.array(EditSchema).optional().describe('Edit history'),
    leverage: stringToNumber.describe('Leverage'),
    marginType: z.string().optional().describe('Margin type'),
    retailPortfolioId: z.string().optional().describe('Retail portfolio ID'),
  })
  .describe('Order details');

/**
 * Schema for NewOrderSuccessResponse - successful order creation.
 */
const NewOrderSuccessSchema = z
  .object({
    orderId: z.string().describe('The ID of the created order'),
    productId: z.string().optional().describe('The trading pair'),
    side: z
      .nativeEnum(OrderSide)
      .optional()
      .describe('Order side (BUY or SELL)'),
    clientOrderId: z.string().optional().describe('Client-provided order ID'),
  })
  .describe('Successful order creation response');

/**
 * Schema for NewOrderErrorResponse - failed order creation.
 */
const NewOrderErrorSchema = z
  .object({
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
  })
  .describe('Failed order creation response');

/**
 * Schema for individual cancel order result.
 */
const CancelOrderResultSchema = z
  .object({
    success: z.boolean().describe('Whether the cancel request was successful'),
    failureReason: z
      .nativeEnum(CancelOrderFailureReason)
      .describe('The reason the cancel failed'),
    orderId: z.string().describe('The ID of the order'),
  })
  .describe('Cancel order result');

/**
 * Schema for Fill - individual trade fill.
 */
const FillSchema = z
  .object({
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
  })
  .describe('Trade fill details');

const EditOrderErrorSchema = z
  .object({
    editFailureReason: z
      .nativeEnum(EditOrderFailureReason)
      .optional()
      .describe('Edit failure reason'),
    previewFailureReason: z
      .nativeEnum(PreviewFailureReason)
      .optional()
      .describe('Preview failure reason'),
  })
  .describe('Edit order error details');

// =============================================================================
// Response Schemas
// =============================================================================

export const ListOrdersResponseSchema = z
  .object({
    orders: z.array(OrderSchema).describe('List of orders'),
    cursor: z.string().optional().describe('Cursor for next page'),
    hasNext: z.boolean().describe('Whether more results are available'),
  })
  .describe('Response from listing orders');

export const GetOrderResponseSchema = z
  .object({
    order: OrderSchema.describe('Order details'),
  })
  .transform((data) => data.order)
  .describe('Response from getting a specific order');

export const CreateOrderResponseSchema = z
  .object({
    success: z.boolean().describe('Whether the order was created successfully'),
    successResponse: NewOrderSuccessSchema.optional().describe(
      'Success response details',
    ),
    errorResponse: NewOrderErrorSchema.optional().describe(
      'Error response details',
    ),
    orderConfiguration: OrderConfigurationSchema.optional().describe(
      'The order configuration',
    ),
  })
  .describe('Response from creating an order');

export const CancelOrdersResponseSchema = z
  .object({
    results: z
      .array(CancelOrderResultSchema)
      .optional()
      .describe('Results of cancel requests'),
  })
  .describe('Response from cancelling orders');

export const ListFillsResponseSchema = z
  .object({
    fills: z.array(FillSchema).optional().describe('List of fills'),
    cursor: z.string().optional().describe('Cursor for next page'),
  })
  .describe('Response from listing fills');

export const EditOrderResponseSchema = z
  .object({
    success: z.boolean().describe('Whether the edit was successful'),
    errors: z
      .array(EditOrderErrorSchema)
      .optional()
      .describe('List of errors if failed'),
  })
  .describe('Response from editing an order');

export const PreviewEditOrderResponseSchema = z
  .object({
    errors: z.array(EditOrderErrorSchema).describe('List of potential errors'),
    slippage: stringToNumber.describe('Estimated slippage'),
    orderTotal: stringToNumber.describe('Total order amount'),
    commissionTotal: stringToNumber.describe('Total commission'),
    quoteSize: stringToNumber.describe('Quote currency size'),
    baseSize: stringToNumber.describe('Base currency size'),
    bestBid: stringToNumber.describe('Best bid price'),
    bestAsk: stringToNumber.describe('Best ask price'),
    averageFilledPrice: stringToNumber.describe('Average fill price'),
  })
  .describe('Response from previewing an order edit');

export const ClosePositionResponseSchema = z
  .object({
    success: z.boolean().describe('Whether the close was successful'),
    successResponse: NewOrderSuccessSchema.optional().describe(
      'Success response details',
    ),
    errorResponse: NewOrderErrorSchema.optional().describe(
      'Error response details',
    ),
    orderConfiguration: OrderConfigurationSchema.optional().describe(
      'The order configuration',
    ),
  })
  .describe('Response from closing a position');

export const PreviewOrderResponseSchema = z
  .object({
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
  })
  .describe('Response from previewing an order');

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
