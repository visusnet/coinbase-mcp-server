import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataService } from '../services';
import { GetAPIKeyPermissionsRequestSchema } from '../services/DataService.request';
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
    this.registerTool(
      'get_api_key_permissions',
      {
        title: 'Get API Key Permissions',
        description: 'Get permissions for the current API key',
        inputSchema: GetAPIKeyPermissionsRequestSchema.shape,
      },
      this.data.getAPIKeyPermissions.bind(this.data),
    );
  }
}
