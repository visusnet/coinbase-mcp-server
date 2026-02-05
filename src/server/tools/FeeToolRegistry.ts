import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FeesService } from '../services';
import { GetTransactionsSummaryRequestSchema } from '../services/FeesService.request';
import { VIEW_API } from './annotations';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for fee-related MCP tools.
 */
export class FeeToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly fees: FeesService,
  ) {
    super(server);
  }

  public register(): void {
    this.registerTool(
      'get_transaction_summary',
      {
        title: 'Get Transaction Summary',
        description: 'Get a summary of transactions with fee tiers',
        inputSchema: GetTransactionsSummaryRequestSchema.shape,
        annotations: VIEW_API,
      },
      this.fees.getTransactionSummary.bind(this.fees),
    );
  }
}
