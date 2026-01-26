import { z } from 'zod';
import { OrderSide, StopPriceDirection } from './OrdersService.types';
import { numberToString, numberToStringOptional } from './schema.helpers';

// =============================================================================
// Order Configuration Sub-Schemas (number -> string field-level transforms)
// =============================================================================

const MarketMarketIocSchema = z
  .object({
    quoteSize: numberToStringOptional.describe(
      'Quote currency amount to spend',
    ),
    baseSize: numberToStringOptional.describe(
      'Base currency amount to buy/sell',
    ),
  })
  .describe('Market order with immediate-or-cancel execution');

const LimitLimitGtcSchema = z
  .object({
    baseSize: numberToString.describe('Base currency amount to buy/sell'),
    limitPrice: numberToString.describe('Limit price for the order'),
    postOnly: z.boolean().optional().describe('Post-only order flag'),
  })
  .describe('Limit order with good-till-cancelled execution');

const LimitLimitGtdSchema = z
  .object({
    baseSize: numberToString.describe('Base currency amount to buy/sell'),
    limitPrice: numberToString.describe('Limit price for the order'),
    endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
    postOnly: z.boolean().optional().describe('Post-only order flag'),
  })
  .describe('Limit order with good-till-date execution');

const LimitLimitFokSchema = z
  .object({
    baseSize: numberToString.describe('Base currency amount to buy/sell'),
    limitPrice: numberToString.describe('Limit price for the order'),
  })
  .describe('Limit order with fill-or-kill execution');

const SorLimitIocSchema = z
  .object({
    baseSize: numberToString.describe('Base currency amount to buy/sell'),
    limitPrice: numberToString.describe('Limit price for the order'),
  })
  .describe(
    'Smart order routing limit order with immediate-or-cancel execution',
  );

const StopLimitStopLimitGtcSchema = z
  .object({
    baseSize: numberToString.describe('Base currency amount to buy/sell'),
    limitPrice: numberToString.describe('Limit price for the order'),
    stopPrice: numberToString.describe('Stop trigger price'),
    stopDirection: z
      .nativeEnum(StopPriceDirection)
      .optional()
      .describe('Direction for stop price trigger'),
  })
  .describe('Stop-limit order with good-till-cancelled execution');

const StopLimitStopLimitGtdSchema = z
  .object({
    baseSize: numberToString.describe('Base currency amount to buy/sell'),
    limitPrice: numberToString.describe('Limit price for the order'),
    stopPrice: numberToString.describe('Stop trigger price'),
    endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
    stopDirection: z
      .nativeEnum(StopPriceDirection)
      .optional()
      .describe('Direction for stop price trigger'),
  })
  .describe('Stop-limit order with good-till-date execution');

const TriggerBracketGtcSchema = z
  .object({
    baseSize: numberToString.describe('Base currency amount to buy/sell'),
    limitPrice: numberToString.describe('Limit price for the order'),
    stopTriggerPrice: numberToString.describe(
      'Stop trigger price for bracket order',
    ),
  })
  .describe('Trigger bracket order with good-till-cancelled execution');

const TriggerBracketGtdSchema = z
  .object({
    baseSize: numberToString.describe('Base currency amount to buy/sell'),
    limitPrice: numberToString.describe('Limit price for the order'),
    stopTriggerPrice: numberToString.describe(
      'Stop trigger price for bracket order',
    ),
    endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
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
      'Smart order routing limit order with immediate-or-cancel execution',
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
  .describe('Order configuration (specify one order type)');

// =============================================================================
// Request Schemas
// =============================================================================

export const ListOrdersRequestSchema = z
  .object({
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
  })
  .describe('Request to list orders');

export const GetOrderRequestSchema = z
  .object({
    orderId: z.string().describe('The ID of the order to retrieve'),
  })
  .describe('Request to get a specific order');

export const CreateOrderRequestSchema = z
  .object({
    clientOrderId: z.string().describe('Unique client order ID'),
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    side: z.nativeEnum(OrderSide).describe('Order side (BUY or SELL)'),
    orderConfiguration: OrderConfigurationSchema.describe(
      'Order configuration',
    ),
  })
  .describe('Request to create a new order');

export const CancelOrdersRequestSchema = z
  .object({
    orderIds: z.array(z.string()).describe('Array of order IDs to cancel'),
  })
  .describe('Request to cancel orders');

export const ListFillsRequestSchema = z
  .object({
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
  })
  .describe('Request to list fills');

export const EditOrderRequestSchema = z
  .object({
    orderId: z.string().describe('The ID of the order to edit'),
    price: numberToString.describe('New limit price'),
    size: numberToString.describe('New size'),
  })
  .describe('Request to edit an order');

export const PreviewEditOrderRequestSchema = z
  .object({
    orderId: z.string().describe('The ID of the order to preview editing'),
    price: numberToString.describe('New limit price'),
    size: numberToString.describe('New size'),
  })
  .describe('Request to preview editing an order');

export const PreviewOrderRequestSchema = z
  .object({
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    side: z.nativeEnum(OrderSide).describe('Order side (BUY or SELL)'),
    orderConfiguration: OrderConfigurationSchema.describe(
      'Order configuration',
    ),
  })
  .describe('Request to preview a new order');

export const ClosePositionRequestSchema = z
  .object({
    clientOrderId: z.string().describe('Unique client order ID'),
    productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
    size: numberToStringOptional.describe(
      'Size to close (optional, closes full position if omitted)',
    ),
  })
  .describe('Request to close a position');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListOrdersRequest = z.output<typeof ListOrdersRequestSchema>;
export type GetOrderRequest = z.output<typeof GetOrderRequestSchema>;
export type CreateOrderRequest = z.output<typeof CreateOrderRequestSchema>;
export type CancelOrdersRequest = z.output<typeof CancelOrdersRequestSchema>;
export type ListFillsRequest = z.output<typeof ListFillsRequestSchema>;
export type EditOrderRequest = z.output<typeof EditOrderRequestSchema>;
export type PreviewEditOrderRequest = z.output<
  typeof PreviewEditOrderRequestSchema
>;
export type PreviewOrderRequest = z.output<typeof PreviewOrderRequestSchema>;
export type ClosePositionRequest = z.output<typeof ClosePositionRequestSchema>;
