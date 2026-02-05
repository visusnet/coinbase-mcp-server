import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PublicService } from '../services';
import { mockPublicService } from '@test/serviceMocks';
import { PublicToolRegistry } from './PublicToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('PublicToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: PublicToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new PublicToolRegistry(
      mockServer as unknown as McpServer,
      mockPublicService as unknown as PublicService,
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
