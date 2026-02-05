import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PaymentMethodsService } from '../services';
import {
  ListPaymentMethodsRequestSchema,
  GetPaymentMethodRequestSchema,
} from '../services/PaymentMethodsService.request';
import { VIEW_API } from './annotations';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for payment method MCP tools.
 */
export class PaymentToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly paymentMethods: PaymentMethodsService,
  ) {
    super(server);
  }

  public register(): void {
    this.registerTool(
      'list_payment_methods',
      {
        title: 'List Payment Methods',
        description: 'Get a list of available payment methods',
        inputSchema: ListPaymentMethodsRequestSchema.shape,
        annotations: VIEW_API,
      },
      this.paymentMethods.listPaymentMethods.bind(this.paymentMethods),
    );

    this.registerTool(
      'get_payment_method',
      {
        title: 'Get Payment Method',
        description: 'Get details of a specific payment method',
        inputSchema: GetPaymentMethodRequestSchema.shape,
        annotations: VIEW_API,
      },
      this.paymentMethods.getPaymentMethod.bind(this.paymentMethods),
    );
  }
}
