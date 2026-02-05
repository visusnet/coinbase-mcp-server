import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FeesService } from '../services';
import { mockFeesService } from '@test/serviceMocks';
import { FeeToolRegistry } from './FeeToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('FeeToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: FeeToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new FeeToolRegistry(
      mockServer as unknown as McpServer,
      mockFeesService as unknown as FeesService,
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
