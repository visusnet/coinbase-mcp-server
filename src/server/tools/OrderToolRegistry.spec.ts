import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OrdersService } from '../services';
import { mockOrdersService } from '@test/serviceMocks';
import { OrderToolRegistry } from './OrderToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('OrderToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: OrderToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new OrderToolRegistry(
      mockServer as unknown as McpServer,
      mockOrdersService as unknown as OrdersService,
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
