import { z } from 'zod';
import { OrderSide, StopPriceDirection } from './OrdersService.types';

// =============================================================================
// Order Configuration Schemas
// =============================================================================

const MarketMarketIocSchema = z.object({
  quoteSize: z.number().optional().describe('Quote currency amount to spend'),
  baseSize: z.number().optional().describe('Base currency amount to buy/sell'),
});

const LimitLimitGtcSchema = z.object({
  baseSize: z.number().describe('Base currency amount to buy/sell'),
  limitPrice: z.number().describe('Limit price for the order'),
  postOnly: z.boolean().optional().describe('Post-only order flag'),
});

const LimitLimitGtdSchema = z.object({
  baseSize: z.number().describe('Base currency amount to buy/sell'),
  limitPrice: z.number().describe('Limit price for the order'),
  endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
  postOnly: z.boolean().optional().describe('Post-only order flag'),
});

const LimitLimitFokSchema = z.object({
  baseSize: z.number().describe('Base currency amount to buy/sell'),
  limitPrice: z.number().describe('Limit price for the order'),
});

const SorLimitIocSchema = z.object({
  baseSize: z.number().describe('Base currency amount to buy/sell'),
  limitPrice: z.number().describe('Limit price for the order'),
});

const StopLimitStopLimitGtcSchema = z.object({
  baseSize: z.number().describe('Base currency amount to buy/sell'),
  limitPrice: z.number().describe('Limit price for the order'),
  stopPrice: z.number().describe('Stop trigger price'),
  stopDirection: z
    .nativeEnum(StopPriceDirection)
    .optional()
    .describe('Direction for stop price trigger'),
});

const StopLimitStopLimitGtdSchema = z.object({
  baseSize: z.number().describe('Base currency amount to buy/sell'),
  limitPrice: z.number().describe('Limit price for the order'),
  stopPrice: z.number().describe('Stop trigger price'),
  endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
  stopDirection: z
    .nativeEnum(StopPriceDirection)
    .optional()
    .describe('Direction for stop price trigger'),
});

const TriggerBracketGtcSchema = z.object({
  baseSize: z.number().describe('Base currency amount to buy/sell'),
  limitPrice: z.number().describe('Limit price for the order'),
  stopTriggerPrice: z.number().describe('Stop trigger price for bracket order'),
});

const TriggerBracketGtdSchema = z.object({
  baseSize: z.number().describe('Base currency amount to buy/sell'),
  limitPrice: z.number().describe('Limit price for the order'),
  stopTriggerPrice: z.number().describe('Stop trigger price for bracket order'),
  endTime: z.string().describe('Good-till-date expiration time (ISO 8601)'),
});

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
  orderConfiguration: OrderConfigurationSchema.describe('Order configuration'),
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
  price: z.number().describe('New limit price'),
  size: z.number().describe('New size'),
});

export const PreviewEditOrderRequestSchema = z.object({
  orderId: z.string().describe('The ID of the order to preview editing'),
  price: z.number().describe('New limit price'),
  size: z.number().describe('New size'),
});

export const PreviewOrderRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  side: z.nativeEnum(OrderSide).describe('Order side (BUY or SELL)'),
  orderConfiguration: OrderConfigurationSchema.describe('Order configuration'),
});

export const ClosePositionRequestSchema = z.object({
  clientOrderId: z.string().describe('Unique client order ID'),
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  size: z
    .number()
    .optional()
    .describe('Size to close (optional, closes full position if omitted)'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type OrderConfiguration = z.infer<typeof OrderConfigurationSchema>;
export type ListOrdersRequest = z.infer<typeof ListOrdersRequestSchema>;
export type GetOrderRequest = z.infer<typeof GetOrderRequestSchema>;
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type CancelOrdersRequest = z.infer<typeof CancelOrdersRequestSchema>;
export type ListFillsRequest = z.infer<typeof ListFillsRequestSchema>;
export type EditOrderRequest = z.infer<typeof EditOrderRequestSchema>;
export type PreviewEditOrderRequest = z.infer<
  typeof PreviewEditOrderRequestSchema
>;
export type PreviewOrderRequest = z.infer<typeof PreviewOrderRequestSchema>;
export type ClosePositionRequest = z.infer<typeof ClosePositionRequestSchema>;
