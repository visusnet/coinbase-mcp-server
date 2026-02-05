import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PerpetualsService } from '../services';
import { mockPerpetualsService } from '@test/serviceMocks';
import { PerpetualsToolRegistry } from './PerpetualsToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('PerpetualsToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: PerpetualsToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new PerpetualsToolRegistry(
      mockServer as unknown as McpServer,
      mockPerpetualsService as unknown as PerpetualsService,
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
