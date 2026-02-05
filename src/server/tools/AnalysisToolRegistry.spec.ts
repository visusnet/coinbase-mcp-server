import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TechnicalAnalysisService } from '../services';
import { mockTechnicalAnalysisService } from '@test/serviceMocks';
import { AnalysisToolRegistry } from './AnalysisToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('AnalysisToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: AnalysisToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new AnalysisToolRegistry(
      mockServer as unknown as McpServer,
      mockTechnicalAnalysisService as unknown as TechnicalAnalysisService,
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
