import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PaymentMethodsService } from '../services';
import * as z from 'zod';
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
    this.server.registerTool(
      'list_payment_methods',
      {
        title: 'List Payment Methods',
        description: 'Get a list of available payment methods',
        inputSchema: {},
      },
      this.call(
        this.paymentMethods.listPaymentMethods.bind(this.paymentMethods),
      ),
    );

    this.server.registerTool(
      'get_payment_method',
      {
        title: 'Get Payment Method',
        description: 'Get details of a specific payment method',
        inputSchema: {
          paymentMethodId: z.string().describe('The ID of the payment method'),
        },
      },
      this.call(this.paymentMethods.getPaymentMethod.bind(this.paymentMethods)),
    );
  }
}
