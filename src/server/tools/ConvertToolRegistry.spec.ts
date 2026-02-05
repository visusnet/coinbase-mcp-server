import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConvertsService } from '../services';
import { mockConvertsService } from '@test/serviceMocks';
import { ConvertToolRegistry } from './ConvertToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('ConvertToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: ConvertToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new ConvertToolRegistry(
      mockServer as unknown as McpServer,
      mockConvertsService as unknown as ConvertsService,
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
