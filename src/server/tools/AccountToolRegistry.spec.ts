import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AccountsService } from '../services';
import { mockAccountsService } from '@test/serviceMocks';
import { AccountToolRegistry } from './AccountToolRegistry';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

describe('AccountToolRegistry', () => {
  let mockServer: { registerTool: jest.Mock };
  let registry: AccountToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = { registerTool: jest.fn() };
    registry = new AccountToolRegistry(
      mockServer as unknown as McpServer,
      mockAccountsService as unknown as AccountsService,
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
