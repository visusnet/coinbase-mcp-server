import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MarketEventService } from '../services';
import { mockMarketEventService } from '@test/serviceMocks';
import { MarketEventToolRegistry } from './MarketEventToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('MarketEventToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: MarketEventToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new MarketEventToolRegistry(
      mockServer as unknown as McpServer,
      mockMarketEventService as unknown as MarketEventService,
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
