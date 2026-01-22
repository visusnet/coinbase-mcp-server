import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProductsService } from '../services';
import {
  ListProductsRequestSchema,
  GetProductRequestSchema,
  GetProductBookRequestSchema,
  GetProductCandlesRequestSchema,
  GetProductCandlesBatchRequestSchema,
  GetProductMarketTradesRequestSchema,
  GetBestBidAskRequestSchema,
  GetMarketSnapshotRequestSchema,
} from '../services/ProductsService.schema';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for product-related MCP tools.
 */
export class ProductToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly products: ProductsService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'list_products',
      {
        title: 'List Products',
        description: 'Get a list of all tradable products',
        inputSchema: ListProductsRequestSchema.shape,
      },
      this.call(this.products.listProducts.bind(this.products)),
    );

    this.server.registerTool(
      'get_product',
      {
        title: 'Get Product',
        description: 'Get details of a specific product',
        inputSchema: GetProductRequestSchema.shape,
      },
      this.call(this.products.getProduct.bind(this.products)),
    );

    this.server.registerTool(
      'get_product_book',
      {
        title: 'Get Product Book',
        description: 'Get the order book for a product',
        inputSchema: GetProductBookRequestSchema.shape,
      },
      this.call(this.products.getProductBook.bind(this.products)),
    );

    this.server.registerTool(
      'get_product_candles',
      {
        title: 'Get Product Candles',
        description:
          'Get historic rates (candles) for a product. Use get_product_candles_batch for multiple products.',
        inputSchema: GetProductCandlesRequestSchema.shape,
      },
      this.call(this.products.getProductCandles.bind(this.products)),
    );

    this.server.registerTool(
      'get_product_candles_batch',
      {
        title: 'Get Product Candles Batch',
        description:
          'Get historic candle data for multiple trading pairs in a single call. ' +
          'More efficient than calling get_product_candles multiple times. ' +
          'Returns the last N candles (specified by limit) for each product.',
        inputSchema: GetProductCandlesBatchRequestSchema.shape,
      },
      this.call(this.products.getProductCandlesBatch.bind(this.products)),
    );

    this.server.registerTool(
      'get_market_trades',
      {
        title: 'Get Market Trades',
        description: 'Get recent trades for a product',
        inputSchema: GetProductMarketTradesRequestSchema.shape,
      },
      this.call(this.products.getProductMarketTrades.bind(this.products)),
    );

    this.server.registerTool(
      'get_best_bid_ask',
      {
        title: 'Get Best Bid Ask',
        description: 'Get the best bid and ask prices for one or more products',
        inputSchema: GetBestBidAskRequestSchema.shape,
      },
      this.call(this.products.getBestBidAsk.bind(this.products)),
    );

    this.server.registerTool(
      'get_market_snapshot',
      {
        title: 'Get Market Snapshot',
        description:
          'Get comprehensive market snapshot for one or more trading pairs. ' +
          'Returns price, bid, ask, spread, volume, and 24h change in a single call. ' +
          'Use this instead of separate get_best_bid_ask and get_product calls.',
        inputSchema: GetMarketSnapshotRequestSchema.shape,
      },
      this.call(this.products.getMarketSnapshot.bind(this.products)),
    );
  }
}
