import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataService } from '../services';
import { mockDataService } from '@test/serviceMocks';
import { DataToolRegistry } from './DataToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('DataToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: DataToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new DataToolRegistry(
      mockServer as unknown as McpServer,
      mockDataService as unknown as DataService,
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
