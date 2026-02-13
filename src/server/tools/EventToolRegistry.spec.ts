import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { EventService } from '../services';
import { mockEventService } from '@test/serviceMocks';
import { EventToolRegistry } from './EventToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('EventToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: EventToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new EventToolRegistry(
      mockServer as unknown as McpServer,
      mockEventService as unknown as EventService,
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
