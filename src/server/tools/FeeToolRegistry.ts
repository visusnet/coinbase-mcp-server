import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FeesService } from '../services';
import { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType.js';
import { ContractExpiryType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ContractExpiryType.js';
import { ProductVenue } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductVenue.js';
import * as z from 'zod';
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
    this.server.registerTool(
      'get_transaction_summary',
      {
        title: 'Get Transaction Summary',
        description: 'Get a summary of transactions with fee tiers',
        inputSchema: {
          productType: z
            .nativeEnum(ProductType)
            .describe('Product type (SPOT, FUTURE)'),
          contractExpiryType: z
            .nativeEnum(ContractExpiryType)
            .describe('Contract expiry type (for futures)'),
          productVenue: z.nativeEnum(ProductVenue).describe('Product venue'),
        },
      },
      this.call(this.fees.getTransactionSummary.bind(this.fees)),
    );
  }
}
