import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PortfoliosService } from '../services';
import * as z from 'zod';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for portfolio-related MCP tools.
 */
export class PortfolioToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly portfolios: PortfoliosService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'list_portfolios',
      {
        title: 'List Portfolios',
        description: 'Get a list of all portfolios',
        inputSchema: {},
      },
      this.call(this.portfolios.listPortfolios.bind(this.portfolios)),
    );

    this.server.registerTool(
      'create_portfolio',
      {
        title: 'Create Portfolio',
        description: 'Create a new portfolio',
        inputSchema: {
          name: z.string().describe('Name of the portfolio'),
        },
      },
      this.call(this.portfolios.createPortfolio.bind(this.portfolios)),
    );

    this.server.registerTool(
      'get_portfolio',
      {
        title: 'Get Portfolio',
        description: 'Get details of a specific portfolio',
        inputSchema: {
          portfolioUuid: z.string().describe('The UUID of the portfolio'),
        },
      },
      this.call(this.portfolios.getPortfolio.bind(this.portfolios)),
    );

    this.server.registerTool(
      'move_portfolio_funds',
      {
        title: 'Move Portfolio Funds',
        description: 'Move funds between portfolios',
        inputSchema: {
          funds: z
            .object({
              value: z.number().describe('Amount to transfer'),
              currency: z.string().describe('Currency code (e.g., USD, BTC)'),
            })
            .describe('Fund movement details (amount, currency)'),
          sourcePortfolioUuid: z.string().describe('Source portfolio UUID'),
          targetPortfolioUuid: z.string().describe('Target portfolio UUID'),
        },
      },
      this.call(this.portfolios.movePortfolioFunds.bind(this.portfolios)),
    );

    this.server.registerTool(
      'edit_portfolio',
      {
        title: 'Edit Portfolio',
        description: 'Edit portfolio details (name)',
        inputSchema: {
          portfolioUuid: z
            .string()
            .describe('The UUID of the portfolio to edit'),
          name: z.string().describe('New name for the portfolio'),
        },
      },
      this.call(this.portfolios.editPortfolio.bind(this.portfolios)),
    );

    this.server.registerTool(
      'delete_portfolio',
      {
        title: 'Delete Portfolio',
        description: 'Delete a portfolio',
        inputSchema: {
          portfolioUuid: z
            .string()
            .describe('The UUID of the portfolio to delete'),
        },
      },
      this.call(this.portfolios.deletePortfolio.bind(this.portfolios)),
    );
  }
}
