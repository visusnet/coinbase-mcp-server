import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PublicService } from '../services';
import {
  GetPublicProductRequestSchema,
  ListPublicProductsRequestSchema,
  GetPublicProductBookRequestSchema,
  GetPublicProductCandlesRequestSchema,
  GetPublicMarketTradesRequestSchema,
} from '../services/PublicService.request';
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
        inputSchema: GetPublicProductRequestSchema.shape,
      },
      this.call(this.publicService.getProduct.bind(this.publicService)),
    );

    this.server.registerTool(
      'list_public_products',
      {
        title: 'List Public Products',
        description: 'List all public products (no auth required)',
        inputSchema: ListPublicProductsRequestSchema.shape,
      },
      this.call(this.publicService.listProducts.bind(this.publicService)),
    );

    this.server.registerTool(
      'get_public_product_book',
      {
        title: 'Get Public Product Book',
        description: 'Get public order book (no auth required)',
        inputSchema: GetPublicProductBookRequestSchema.shape,
      },
      this.call(this.publicService.getProductBook.bind(this.publicService)),
    );

    this.server.registerTool(
      'get_public_product_candles',
      {
        title: 'Get Public Product Candles',
        description: 'Get public candle data (no auth required)',
        inputSchema: GetPublicProductCandlesRequestSchema.shape,
      },
      this.call(this.publicService.getProductCandles.bind(this.publicService)),
    );

    this.server.registerTool(
      'get_public_market_trades',
      {
        title: 'Get Public Market Trades',
        description: 'Get public market trades (no auth required)',
        inputSchema: GetPublicMarketTradesRequestSchema.shape,
      },
      this.call(
        this.publicService.getProductMarketTrades.bind(this.publicService),
      ),
    );
  }
}
