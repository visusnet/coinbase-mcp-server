import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import type { PublicService } from '../PublicService';
import { Granularity } from '../ProductCandles';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for public data MCP tools (no auth required).
 */
export class PublicToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly publicService: PublicService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'get_server_time',
      {
        title: 'Get Server Time',
        description: 'Get the current server timestamp from Coinbase',
        inputSchema: {},
      },
      this.call(this.publicService.getServerTime.bind(this.publicService)),
    );

    this.server.registerTool(
      'get_public_product',
      {
        title: 'Get Public Product',
        description: 'Get public product information (no auth required)',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
        },
      },
      this.call(this.publicService.getProduct.bind(this.publicService)),
    );

    this.server.registerTool(
      'list_public_products',
      {
        title: 'List Public Products',
        description: 'List all public products (no auth required)',
        inputSchema: {
          limit: z.number().optional().describe('Optional limit'),
          offset: z.number().optional().describe('Optional offset'),
        },
      },
      this.call(this.publicService.listProducts.bind(this.publicService)),
    );

    this.server.registerTool(
      'get_public_product_book',
      {
        title: 'Get Public Product Book',
        description: 'Get public order book (no auth required)',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          limit: z.number().optional().describe('Optional limit'),
        },
      },
      this.call(this.publicService.getProductBook.bind(this.publicService)),
    );

    this.server.registerTool(
      'get_public_product_candles',
      {
        title: 'Get Public Product Candles',
        description: 'Get public candle data (no auth required)',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          start: z.string().describe('Start time (ISO 8601)'),
          end: z.string().describe('End time (ISO 8601)'),
          granularity: z
            .nativeEnum(Granularity)
            .describe(
              'Granularity (e.g., ONE_MINUTE, FIVE_MINUTE, ONE_HOUR, ONE_DAY)',
            ),
        },
      },
      this.call(
        this.publicService.getProductCandlesFixed.bind(this.publicService),
      ),
    );

    this.server.registerTool(
      'get_public_market_trades',
      {
        title: 'Get Public Market Trades',
        description: 'Get public market trades (no auth required)',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          limit: z.number().describe('Limit'),
        },
      },
      this.call(
        this.publicService.getProductMarketTrades.bind(this.publicService),
      ),
    );
  }
}
