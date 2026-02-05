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
import { DESTRUCTIVE_API, VIEW_API } from './annotations';
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
        annotations: VIEW_API,
      },
      this.orders.listOrders.bind(this.orders),
    );

    this.registerTool(
      'get_order',
      {
        title: 'Get Order',
        description: 'Get details of a specific order by order ID',
        inputSchema: GetOrderRequestSchema.shape,
        annotations: VIEW_API,
      },
      this.orders.getOrder.bind(this.orders),
    );

    this.registerTool(
      'create_order',
      {
        title: 'Create Order',
        description: 'Create a new buy or sell order',
        inputSchema: CreateOrderRequestSchema.shape,
        annotations: DESTRUCTIVE_API,
      },
      this.orders.createOrder.bind(this.orders),
    );

    this.registerTool(
      'cancel_orders',
      {
        title: 'Cancel Orders',
        description: 'Cancel one or more orders',
        inputSchema: CancelOrdersRequestSchema.shape,
        annotations: DESTRUCTIVE_API,
      },
      this.orders.cancelOrders.bind(this.orders),
    );

    this.registerTool(
      'list_fills',
      {
        title: 'List Fills',
        description: 'Get a list of fills (executed trades) for orders',
        inputSchema: ListFillsRequestSchema.shape,
        annotations: VIEW_API,
      },
      this.orders.listFills.bind(this.orders),
    );

    this.registerTool(
      'edit_order',
      {
        title: 'Edit Order',
        description: 'Edit an existing order (change price or size)',
        inputSchema: EditOrderRequestSchema.shape,
        annotations: DESTRUCTIVE_API,
      },
      this.orders.editOrder.bind(this.orders),
    );

    this.registerTool(
      'preview_edit_order',
      {
        title: 'Preview Edit Order',
        description: 'Preview the result of editing an order before committing',
        inputSchema: PreviewEditOrderRequestSchema.shape,
        annotations: VIEW_API,
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
        annotations: VIEW_API,
      },
      this.orders.createOrderPreview.bind(this.orders),
    );

    this.registerTool(
      'close_position',
      {
        title: 'Close Position',
        description: 'Close an open position for a product',
        inputSchema: ClosePositionRequestSchema.shape,
        annotations: DESTRUCTIVE_API,
      },
      this.orders.closePosition.bind(this.orders),
    );
  }
}
