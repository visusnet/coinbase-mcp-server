import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProductsService } from '../services';
import { mockProductsService } from '@test/serviceMocks';
import { ProductToolRegistry } from './ProductToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('ProductToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: ProductToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new ProductToolRegistry(
      mockServer as unknown as McpServer,
      mockProductsService as unknown as ProductsService,
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
