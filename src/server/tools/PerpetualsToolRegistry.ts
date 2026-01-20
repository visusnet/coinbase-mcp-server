import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PerpetualsService } from '../services';
import * as z from 'zod';
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
        inputSchema: {
          portfolioUuid: z.string().describe('Portfolio UUID'),
        },
      },
      this.call(this.perpetuals.listPositions.bind(this.perpetuals)),
    );

    this.server.registerTool(
      'get_perpetuals_position',
      {
        title: 'Get Perpetuals Position',
        description: 'Get a specific perpetuals position',
        inputSchema: {
          portfolioUuid: z.string().describe('Portfolio UUID'),
          symbol: z.string().describe('Product symbol'),
        },
      },
      this.call(this.perpetuals.getPosition.bind(this.perpetuals)),
    );

    this.server.registerTool(
      'get_perpetuals_portfolio_summary',
      {
        title: 'Get Perpetuals Portfolio Summary',
        description: 'Get perpetuals portfolio summary',
        inputSchema: {
          portfolioUuid: z.string().describe('Portfolio UUID'),
        },
      },
      this.call(this.perpetuals.getPortfolioSummary.bind(this.perpetuals)),
    );

    this.server.registerTool(
      'get_perpetuals_portfolio_balance',
      {
        title: 'Get Perpetuals Portfolio Balance',
        description: 'Get perpetuals portfolio balance',
        inputSchema: {
          portfolioUuid: z.string().describe('Portfolio UUID'),
        },
      },
      this.call(this.perpetuals.getPortfolioBalance.bind(this.perpetuals)),
    );
  }
}
