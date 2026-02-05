import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FuturesService } from '../services';
import { mockFuturesService } from '@test/serviceMocks';
import { FuturesToolRegistry } from './FuturesToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('FuturesToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: FuturesToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new FuturesToolRegistry(
      mockServer as unknown as McpServer,
      mockFuturesService as unknown as FuturesService,
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
