import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { NewsService } from '../services';
import { NewsToolRegistry } from './NewsToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('NewsToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let mockNewsService: { getNewsSentiment: jest.Mock };
  let registry: NewsToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    mockNewsService = { getNewsSentiment: jest.fn() };
    registry = new NewsToolRegistry(
      mockServer as unknown as McpServer,
      mockNewsService as unknown as NewsService,
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
