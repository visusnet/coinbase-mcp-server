import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PortfoliosService } from '../services';
import {
  ListPortfoliosRequestSchema,
  CreatePortfolioRequestSchema,
  GetPortfolioRequestSchema,
  MovePortfolioFundsRequestSchema,
  EditPortfolioRequestSchema,
  DeletePortfolioRequestSchema,
} from '../services/PortfoliosService.request';
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
    this.registerTool(
      'list_portfolios',
      {
        title: 'List Portfolios',
        description: 'Get a list of all portfolios',
        inputSchema: ListPortfoliosRequestSchema.shape,
      },
      this.portfolios.listPortfolios.bind(this.portfolios),
    );

    this.registerTool(
      'create_portfolio',
      {
        title: 'Create Portfolio',
        description: 'Create a new portfolio',
        inputSchema: CreatePortfolioRequestSchema.shape,
      },
      this.portfolios.createPortfolio.bind(this.portfolios),
    );

    this.registerTool(
      'get_portfolio',
      {
        title: 'Get Portfolio',
        description: 'Get details of a specific portfolio',
        inputSchema: GetPortfolioRequestSchema.shape,
      },
      this.portfolios.getPortfolio.bind(this.portfolios),
    );

    this.registerTool(
      'move_portfolio_funds',
      {
        title: 'Move Portfolio Funds',
        description: 'Move funds between portfolios',
        inputSchema: MovePortfolioFundsRequestSchema.shape,
      },
      this.portfolios.movePortfolioFunds.bind(this.portfolios),
    );

    this.registerTool(
      'edit_portfolio',
      {
        title: 'Edit Portfolio',
        description: 'Edit portfolio details (name)',
        inputSchema: EditPortfolioRequestSchema.shape,
      },
      this.portfolios.editPortfolio.bind(this.portfolios),
    );

    this.registerTool(
      'delete_portfolio',
      {
        title: 'Delete Portfolio',
        description: 'Delete a portfolio',
        inputSchema: DeletePortfolioRequestSchema.shape,
      },
      this.portfolios.deletePortfolio.bind(this.portfolios),
    );
  }
}
