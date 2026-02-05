import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PaymentMethodsService } from '../services';
import { mockPaymentMethodsService } from '@test/serviceMocks';
import { PaymentToolRegistry } from './PaymentToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('PaymentToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: PaymentToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new PaymentToolRegistry(
      mockServer as unknown as McpServer,
      mockPaymentMethodsService as unknown as PaymentMethodsService,
    );
  });

  it('should register tools with correct annotations', () => {
    registry.register();

    const toolAnnotations = (
      mockServer.registerTool.mock.calls as [
        string,
        { annotations?: ToolAnnotations },
      ][]
    ).map(([name, options]) => ({
      name,
      annotations: options.annotations,
    }));

    expect(toolAnnotations).toMatchSnapshot();
  });
});
