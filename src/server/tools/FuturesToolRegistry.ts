import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FuturesService } from '../services';
import { GetFuturesPositionRequestSchema } from '../services/FuturesService.schema';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for futures-related MCP tools.
 */
export class FuturesToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly futures: FuturesService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'list_futures_positions',
      {
        title: 'List Futures Positions',
        description: 'Get all futures positions',
        inputSchema: {},
      },
      this.call(this.futures.listPositions.bind(this.futures)),
    );

    this.server.registerTool(
      'get_futures_position',
      {
        title: 'Get Futures Position',
        description: 'Get a specific futures position',
        inputSchema: GetFuturesPositionRequestSchema.shape,
      },
      this.call(this.futures.getPosition.bind(this.futures)),
    );

    this.server.registerTool(
      'get_futures_balance_summary',
      {
        title: 'Get Futures Balance Summary',
        description: 'Get futures balance summary',
        inputSchema: {},
      },
      this.call(this.futures.getBalanceSummary.bind(this.futures)),
    );

    this.server.registerTool(
      'list_futures_sweeps',
      {
        title: 'List Futures Sweeps',
        description: 'Get all futures sweeps',
        inputSchema: {},
      },
      this.call(this.futures.listSweeps.bind(this.futures)),
    );
  }
}
