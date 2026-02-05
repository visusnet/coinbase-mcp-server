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
import { DESTRUCTIVE_API, VIEW_API } from './annotations';
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
        annotations: VIEW_API,
      },
      this.portfolios.listPortfolios.bind(this.portfolios),
    );

    this.registerTool(
      'create_portfolio',
      {
        title: 'Create Portfolio',
        description: 'Create a new portfolio',
        inputSchema: CreatePortfolioRequestSchema.shape,
        annotations: DESTRUCTIVE_API,
      },
      this.portfolios.createPortfolio.bind(this.portfolios),
    );

    this.registerTool(
      'get_portfolio',
      {
        title: 'Get Portfolio',
        description: 'Get details of a specific portfolio',
        inputSchema: GetPortfolioRequestSchema.shape,
        annotations: VIEW_API,
      },
      this.portfolios.getPortfolio.bind(this.portfolios),
    );

    this.registerTool(
      'move_portfolio_funds',
      {
        title: 'Move Portfolio Funds',
        description: 'Move funds between portfolios',
        inputSchema: MovePortfolioFundsRequestSchema.shape,
        annotations: DESTRUCTIVE_API,
      },
      this.portfolios.movePortfolioFunds.bind(this.portfolios),
    );

    this.registerTool(
      'edit_portfolio',
      {
        title: 'Edit Portfolio',
        description: 'Edit portfolio details (name)',
        inputSchema: EditPortfolioRequestSchema.shape,
        annotations: DESTRUCTIVE_API,
      },
      this.portfolios.editPortfolio.bind(this.portfolios),
    );

    this.registerTool(
      'delete_portfolio',
      {
        title: 'Delete Portfolio',
        description: 'Delete a portfolio',
        inputSchema: DeletePortfolioRequestSchema.shape,
        annotations: DESTRUCTIVE_API,
      },
      this.portfolios.deletePortfolio.bind(this.portfolios),
    );
  }
}
