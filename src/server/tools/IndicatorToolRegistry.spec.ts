import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TechnicalIndicatorsService } from '../services';
import { mockTechnicalIndicatorsService } from '@test/serviceMocks';
import { IndicatorToolRegistry } from './IndicatorToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('IndicatorToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: IndicatorToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new IndicatorToolRegistry(
      mockServer as unknown as McpServer,
      mockTechnicalIndicatorsService as unknown as TechnicalIndicatorsService,
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
