import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PortfoliosService } from '../services';
import { mockPortfoliosService } from '@test/serviceMocks';
import { PortfolioToolRegistry } from './PortfolioToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('PortfolioToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: PortfolioToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new PortfolioToolRegistry(
      mockServer as unknown as McpServer,
      mockPortfoliosService as unknown as PortfoliosService,
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
