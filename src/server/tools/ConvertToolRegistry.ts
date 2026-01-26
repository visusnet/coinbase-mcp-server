import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConvertsService } from '../services';
import {
  CreateConvertQuoteRequestSchema,
  CommitConvertTradeRequestSchema,
  GetConvertTradeRequestSchema,
} from '../services/ConvertsService.request';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for convert-related MCP tools.
 */
export class ConvertToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly converts: ConvertsService,
  ) {
    super(server);
  }

  public register(): void {
    this.registerTool(
      'create_convert_quote',
      {
        title: 'Create Convert Quote',
        description: 'Create a quote for converting one currency to another',
        inputSchema: CreateConvertQuoteRequestSchema.shape,
      },
      this.converts.createConvertQuote.bind(this.converts),
    );

    this.registerTool(
      'commit_convert_trade',
      {
        title: 'Commit Convert Trade',
        description: 'Commit a currency conversion trade using a quote',
        inputSchema: CommitConvertTradeRequestSchema.shape,
      },
      this.converts.commitConvertTrade.bind(this.converts),
    );

    this.registerTool(
      'get_convert_trade',
      {
        title: 'Get Convert Trade',
        description: 'Get details of a specific conversion trade',
        inputSchema: GetConvertTradeRequestSchema.shape,
      },
      this.converts.getConvertTrade.bind(this.converts),
    );
  }
}
