import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConvertsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import * as z from 'zod';
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
    this.server.registerTool(
      'create_convert_quote',
      {
        title: 'Create Convert Quote',
        description: 'Create a quote for converting one currency to another',
        inputSchema: {
          fromAccount: z.string().describe('Source account UUID'),
          toAccount: z.string().describe('Destination account UUID'),
          amount: z.string().describe('Amount to convert'),
        },
      },
      this.call(this.converts.createConvertQuote.bind(this.converts)),
    );

    this.server.registerTool(
      'commit_convert_trade',
      {
        title: 'Commit Convert Trade',
        description: 'Commit a currency conversion trade using a quote',
        inputSchema: {
          tradeId: z.string().describe('The trade ID from the quote'),
          fromAccount: z.string().describe('Source account UUID'),
          toAccount: z.string().describe('Destination account UUID'),
        },
      },
      this.call(this.converts.commitConvertTrade.bind(this.converts)),
    );

    this.server.registerTool(
      'get_convert_trade',
      {
        title: 'Get Convert Trade',
        description: 'Get details of a specific conversion trade',
        inputSchema: {
          tradeId: z.string().describe('The trade ID'),
          fromAccount: z.string().describe('Source account UUID'),
          toAccount: z.string().describe('Destination account UUID'),
        },
      },
      this.call(this.converts.GetConvertTrade.bind(this.converts)),
    );
  }
}
