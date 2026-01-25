import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PerpetualsService } from '../services';
import {
  ListPerpetualsPositionsRequestSchema,
  GetPerpetualsPositionRequestSchema,
  GetPortfolioSummaryRequestSchema,
  GetPortfolioBalanceRequestSchema,
} from '../services/PerpetualsService.request';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for perpetuals-related MCP tools.
 */
export class PerpetualsToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly perpetuals: PerpetualsService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'list_perpetuals_positions',
      {
        title: 'List Perpetuals Positions',
        description: 'Get all perpetuals positions',
        inputSchema: ListPerpetualsPositionsRequestSchema.shape,
      },
      this.call(this.perpetuals.listPositions.bind(this.perpetuals)),
    );

    this.server.registerTool(
      'get_perpetuals_position',
      {
        title: 'Get Perpetuals Position',
        description: 'Get a specific perpetuals position',
        inputSchema: GetPerpetualsPositionRequestSchema.shape,
      },
      this.call(this.perpetuals.getPosition.bind(this.perpetuals)),
    );

    this.server.registerTool(
      'get_perpetuals_portfolio_summary',
      {
        title: 'Get Perpetuals Portfolio Summary',
        description: 'Get perpetuals portfolio summary',
        inputSchema: GetPortfolioSummaryRequestSchema.shape,
      },
      this.call(this.perpetuals.getPortfolioSummary.bind(this.perpetuals)),
    );

    this.server.registerTool(
      'get_perpetuals_portfolio_balance',
      {
        title: 'Get Perpetuals Portfolio Balance',
        description: 'Get perpetuals portfolio balance',
        inputSchema: GetPortfolioBalanceRequestSchema.shape,
      },
      this.call(this.perpetuals.getPortfolioBalance.bind(this.perpetuals)),
    );
  }
}
