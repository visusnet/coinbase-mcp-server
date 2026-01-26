import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FuturesService } from '../services';
import { GetFuturesPositionRequestSchema } from '../services/FuturesService.request';
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
    this.registerTool(
      'list_futures_positions',
      {
        title: 'List Futures Positions',
        description: 'Get all futures positions',
        inputSchema: {},
      },
      this.futures.listPositions.bind(this.futures),
    );

    this.registerTool(
      'get_futures_position',
      {
        title: 'Get Futures Position',
        description: 'Get a specific futures position',
        inputSchema: GetFuturesPositionRequestSchema.shape,
      },
      this.futures.getPosition.bind(this.futures),
    );

    this.registerTool(
      'get_futures_balance_summary',
      {
        title: 'Get Futures Balance Summary',
        description: 'Get futures balance summary',
        inputSchema: {},
      },
      this.futures.getBalanceSummary.bind(this.futures),
    );

    this.registerTool(
      'list_futures_sweeps',
      {
        title: 'List Futures Sweeps',
        description: 'Get all futures sweeps',
        inputSchema: {},
      },
      this.futures.listSweeps.bind(this.futures),
    );
  }
}
