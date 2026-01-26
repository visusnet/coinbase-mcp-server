import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OrdersService } from '../services';
import {
  ListOrdersRequestSchema,
  GetOrderRequestSchema,
  CreateOrderRequestSchema,
  CancelOrdersRequestSchema,
  ListFillsRequestSchema,
  EditOrderRequestSchema,
  PreviewEditOrderRequestSchema,
  PreviewOrderRequestSchema,
  ClosePositionRequestSchema,
} from '../services/OrdersService.request';
import { ToolRegistry } from './ToolRegistry';

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
    this.registerTool(
      'list_orders',
      {
        title: 'List Orders',
        description: 'Get a list of all historical orders',
        inputSchema: ListOrdersRequestSchema.shape,
      },
      this.orders.listOrders.bind(this.orders),
    );

    this.registerTool(
      'get_order',
      {
        title: 'Get Order',
        description: 'Get details of a specific order by order ID',
        inputSchema: GetOrderRequestSchema.shape,
      },
      this.orders.getOrder.bind(this.orders),
    );

    this.registerTool(
      'create_order',
      {
        title: 'Create Order',
        description: 'Create a new buy or sell order',
        inputSchema: CreateOrderRequestSchema.shape,
      },
      this.orders.createOrder.bind(this.orders),
    );

    this.registerTool(
      'cancel_orders',
      {
        title: 'Cancel Orders',
        description: 'Cancel one or more orders',
        inputSchema: CancelOrdersRequestSchema.shape,
      },
      this.orders.cancelOrders.bind(this.orders),
    );

    this.registerTool(
      'list_fills',
      {
        title: 'List Fills',
        description: 'Get a list of fills (executed trades) for orders',
        inputSchema: ListFillsRequestSchema.shape,
      },
      this.orders.listFills.bind(this.orders),
    );

    this.registerTool(
      'edit_order',
      {
        title: 'Edit Order',
        description: 'Edit an existing order (change price or size)',
        inputSchema: EditOrderRequestSchema.shape,
      },
      this.orders.editOrder.bind(this.orders),
    );

    this.registerTool(
      'preview_edit_order',
      {
        title: 'Preview Edit Order',
        description: 'Preview the result of editing an order before committing',
        inputSchema: PreviewEditOrderRequestSchema.shape,
      },
      this.orders.editOrderPreview.bind(this.orders),
    );

    this.registerTool(
      'preview_order',
      {
        title: 'Preview Order',
        description:
          'Preview the result of creating an order before committing',
        inputSchema: PreviewOrderRequestSchema.shape,
      },
      this.orders.createOrderPreview.bind(this.orders),
    );

    this.registerTool(
      'close_position',
      {
        title: 'Close Position',
        description: 'Close an open position for a product',
        inputSchema: ClosePositionRequestSchema.shape,
      },
      this.orders.closePosition.bind(this.orders),
    );
  }
}
