import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PortfoliosService } from '../services';
import {
  ListPortfoliosRequestSchema,
  CreatePortfolioRequestSchema,
  GetPortfolioRequestSchema,
  MovePortfolioFundsRequestSchema,
  EditPortfolioRequestSchema,
  DeletePortfolioRequestSchema,
} from '../services/PortfoliosService.schema';
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
        inputSchema: ListPortfoliosRequestSchema.shape,
      },
      this.call(this.portfolios.listPortfolios.bind(this.portfolios)),
    );

    this.server.registerTool(
      'create_portfolio',
      {
        title: 'Create Portfolio',
        description: 'Create a new portfolio',
        inputSchema: CreatePortfolioRequestSchema.shape,
      },
      this.call(this.portfolios.createPortfolio.bind(this.portfolios)),
    );

    this.server.registerTool(
      'get_portfolio',
      {
        title: 'Get Portfolio',
        description: 'Get details of a specific portfolio',
        inputSchema: GetPortfolioRequestSchema.shape,
      },
      this.call(this.portfolios.getPortfolio.bind(this.portfolios)),
    );

    this.server.registerTool(
      'move_portfolio_funds',
      {
        title: 'Move Portfolio Funds',
        description: 'Move funds between portfolios',
        inputSchema: MovePortfolioFundsRequestSchema.shape,
      },
      this.call(this.portfolios.movePortfolioFunds.bind(this.portfolios)),
    );

    this.server.registerTool(
      'edit_portfolio',
      {
        title: 'Edit Portfolio',
        description: 'Edit portfolio details (name)',
        inputSchema: EditPortfolioRequestSchema.shape,
      },
      this.call(this.portfolios.editPortfolio.bind(this.portfolios)),
    );

    this.server.registerTool(
      'delete_portfolio',
      {
        title: 'Delete Portfolio',
        description: 'Delete a portfolio',
        inputSchema: DeletePortfolioRequestSchema.shape,
      },
      this.call(this.portfolios.deletePortfolio.bind(this.portfolios)),
    );
  }
}
