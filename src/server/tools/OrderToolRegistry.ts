import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OrdersService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { OrderSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderSide.js';
import { StopPriceDirection } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/StopPriceDirection.js';
import * as z from 'zod';
import { ToolRegistry } from './ToolRegistry';

/**
 * Shared order configuration schema for order creation.
 */
const orderConfigurationSchema = z
  .object({
    marketMarketIoc: z
      .object({
        quoteSize: z.string().optional(),
        baseSize: z.string().optional(),
      })
      .optional(),
    limitLimitGtc: z
      .object({
        baseSize: z.string(),
        limitPrice: z.string(),
        postOnly: z.boolean().optional(),
      })
      .optional(),
    limitLimitGtd: z
      .object({
        baseSize: z.string(),
        limitPrice: z.string(),
        endTime: z.string(),
        postOnly: z.boolean().optional(),
      })
      .optional(),
    limitLimitFok: z
      .object({
        baseSize: z.string(),
        limitPrice: z.string(),
      })
      .optional(),
    sorLimitIoc: z
      .object({
        baseSize: z.string(),
        limitPrice: z.string(),
      })
      .optional(),
    stopLimitStopLimitGtc: z
      .object({
        baseSize: z.string(),
        limitPrice: z.string(),
        stopPrice: z.string(),
        stopDirection: z.nativeEnum(StopPriceDirection).optional(),
      })
      .optional(),
    stopLimitStopLimitGtd: z
      .object({
        baseSize: z.string(),
        limitPrice: z.string(),
        stopPrice: z.string(),
        endTime: z.string(),
        stopDirection: z.nativeEnum(StopPriceDirection).optional(),
      })
      .optional(),
    triggerBracketGtc: z
      .object({
        baseSize: z.string(),
        limitPrice: z.string(),
        stopTriggerPrice: z.string(),
      })
      .optional(),
    triggerBracketGtd: z
      .object({
        baseSize: z.string(),
        limitPrice: z.string(),
        stopTriggerPrice: z.string(),
        endTime: z.string(),
      })
      .optional(),
  })
  .describe('Order configuration (marketMarketIoc, limitLimitGtc, etc.)');

/**
 * Registry for order-related MCP tools.
 */
export class OrderToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly orders: OrdersService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'list_orders',
      {
        title: 'List Orders',
        description: 'Get a list of all historical orders',
        inputSchema: {
          productIds: z
            .array(z.string())
            .optional()
            .describe('Optional product IDs to filter by'),
          orderStatus: z
            .array(z.string())
            .optional()
            .describe('Optional order statuses to filter by'),
          limit: z
            .number()
            .optional()
            .describe('Optional limit of orders to return'),
        },
      },
      this.call(this.orders.listOrders.bind(this.orders)),
    );

    this.server.registerTool(
      'get_order',
      {
        title: 'Get Order',
        description: 'Get details of a specific order by order ID',
        inputSchema: {
          orderId: z.string().describe('The ID of the order to retrieve'),
        },
      },
      this.call(this.orders.getOrder.bind(this.orders)),
    );

    this.server.registerTool(
      'create_order',
      {
        title: 'Create Order',
        description: 'Create a new buy or sell order',
        inputSchema: {
          clientOrderId: z.string().describe('Unique client order ID'),
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          side: z.nativeEnum(OrderSide).describe('Order side'),
          orderConfiguration: orderConfigurationSchema,
        },
      },
      this.call(this.orders.createOrder.bind(this.orders)),
    );

    this.server.registerTool(
      'cancel_orders',
      {
        title: 'Cancel Orders',
        description: 'Cancel one or more orders',
        inputSchema: {
          orderIds: z
            .array(z.string())
            .describe('Array of order IDs to cancel'),
        },
      },
      this.call(this.orders.cancelOrders.bind(this.orders)),
    );

    this.server.registerTool(
      'list_fills',
      {
        title: 'List Fills',
        description: 'Get a list of fills (executed trades) for orders',
        inputSchema: {
          orderIds: z
            .array(z.string())
            .optional()
            .describe('Optional order IDs to filter by'),
          productIds: z
            .array(z.string())
            .optional()
            .describe('Optional product IDs to filter by'),
          limit: z
            .number()
            .optional()
            .describe('Optional limit of fills to return'),
        },
      },
      this.call(this.orders.listFills.bind(this.orders)),
    );

    this.server.registerTool(
      'edit_order',
      {
        title: 'Edit Order',
        description: 'Edit an existing order (change price or size)',
        inputSchema: {
          orderId: z.string().describe('The ID of the order to edit'),
          price: z.string().describe('New limit price'),
          size: z.string().describe('New size'),
        },
      },
      this.call(this.orders.editOrder.bind(this.orders)),
    );

    this.server.registerTool(
      'preview_edit_order',
      {
        title: 'Preview Edit Order',
        description: 'Preview the result of editing an order before committing',
        inputSchema: {
          orderId: z
            .string()
            .describe('The ID of the order to preview editing'),
          price: z.string().describe('New limit price'),
          size: z.string().describe('New size'),
        },
      },
      this.call(this.orders.editOrderPreview.bind(this.orders)),
    );

    this.server.registerTool(
      'preview_order',
      {
        title: 'Preview Order',
        description:
          'Preview the result of creating an order before committing',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          side: z.nativeEnum(OrderSide).describe('Order side'),
          orderConfiguration: orderConfigurationSchema.describe(
            'Order configuration',
          ),
        },
      },
      this.call(this.orders.createOrderPreview.bind(this.orders)),
    );

    this.server.registerTool(
      'close_position',
      {
        title: 'Close Position',
        description: 'Close an open position for a product',
        inputSchema: {
          clientOrderId: z.string().describe('Unique client order ID'),
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          size: z.string().optional().describe('Size to close (optional)'),
        },
      },
      this.call(this.orders.closePosition.bind(this.orders)),
    );
  }
}
