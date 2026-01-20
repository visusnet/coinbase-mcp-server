import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType.js';
import * as z from 'zod';
import type { ProductsService } from '../services';
import { Granularity } from '../services';
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
        inputSchema: {
          limit: z
            .number()
            .optional()
            .describe('Optional limit of products to return'),
          productType: z
            .nativeEnum(ProductType)
            .optional()
            .describe('Optional product type filter (SPOT, FUTURE)'),
        },
      },
      this.call(this.products.listProducts.bind(this.products)),
    );

    this.server.registerTool(
      'get_product',
      {
        title: 'Get Product',
        description: 'Get details of a specific product',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
        },
      },
      this.call(this.products.getProduct.bind(this.products)),
    );

    this.server.registerTool(
      'get_product_book',
      {
        title: 'Get Product Book',
        description: 'Get the order book for a product',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          limit: z
            .number()
            .optional()
            .describe('Optional limit of orders to return'),
        },
      },
      this.call(this.products.getProductBook.bind(this.products)),
    );

    this.server.registerTool(
      'get_product_candles',
      {
        title: 'Get Product Candles',
        description:
          'Get historic rates (candles) for a product. Use get_product_candles_batch for multiple products.',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          start: z.string().describe('Start time (ISO 8601 format)'),
          end: z.string().describe('End time (ISO 8601 format)'),
          granularity: z
            .nativeEnum(Granularity)
            .describe(
              'Granularity (e.g., ONE_MINUTE, FIVE_MINUTE, ONE_HOUR, ONE_DAY)',
            ),
        },
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
        inputSchema: {
          productIds: z
            .array(z.string())
            .min(1)
            .max(10)
            .describe(
              "Trading pairs to query (e.g., ['BTC-EUR', 'ETH-EUR', 'SOL-EUR']). Max 10 pairs.",
            ),
          start: z.string().describe('Start time (ISO 8601 format)'),
          end: z.string().describe('End time (ISO 8601 format)'),
          granularity: z
            .nativeEnum(Granularity)
            .describe(
              'Granularity (e.g., ONE_MINUTE, FIVE_MINUTE, ONE_HOUR, ONE_DAY)',
            ),
        },
      },
      this.call(this.products.getProductCandlesBatch.bind(this.products)),
    );

    this.server.registerTool(
      'get_market_trades',
      {
        title: 'Get Market Trades',
        description: 'Get recent trades for a product',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          limit: z.number().describe('Limit of trades to return'),
        },
      },
      this.call(this.products.getProductMarketTrades.bind(this.products)),
    );

    this.server.registerTool(
      'get_best_bid_ask',
      {
        title: 'Get Best Bid Ask',
        description: 'Get the best bid and ask prices for one or more products',
        inputSchema: {
          productIds: z
            .array(z.string())
            .optional()
            .describe(
              'Product IDs to get bid/ask for (optional, returns all if omitted)',
            ),
        },
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
        inputSchema: {
          productIds: z
            .array(z.string())
            .min(1)
            .max(10)
            .describe(
              "Trading pairs to query (e.g., ['BTC-EUR', 'ETH-EUR']). Max 10 pairs.",
            ),
          includeOrderBook: z
            .boolean()
            .optional()
            .describe('Include order book levels per asset (default: false)'),
        },
      },
      this.call(this.products.getMarketSnapshot.bind(this.products)),
    );
  }
}
