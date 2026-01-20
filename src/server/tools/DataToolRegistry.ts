import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for data API MCP tools.
 */
export class DataToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly data: DataService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'get_api_key_permissions',
      {
        title: 'Get API Key Permissions',
        description: 'Get permissions for the current API key',
        inputSchema: {},
      },
      this.call(this.data.getAPIKeyPermissions.bind(this.data)),
    );
  }
}
