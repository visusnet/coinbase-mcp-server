import { randomUUID } from 'node:crypto';
import http from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Express, Request, Response } from 'express';
import { logger } from '../logger';
import { CoinbaseClient } from '@client/CoinbaseClient';
import { CoinbaseCredentials } from '@client/CoinbaseCredentials';
import {
  AccountsService,
  OrdersService,
  ConvertsService,
  FeesService,
  PaymentMethodsService,
  PortfoliosService,
  FuturesService,
  PerpetualsService,
  DataService,
  ProductsService,
  PublicService,
  TechnicalIndicatorsService,
  TechnicalAnalysisService,
  MarketEventService,
  NewsService,
} from '@server/services';
import { MarketDataPool } from '@server/services/MarketDataPool';
import { ToolRegistry } from './tools/ToolRegistry';
import { AccountToolRegistry } from './tools/AccountToolRegistry';
import { OrderToolRegistry } from './tools/OrderToolRegistry';
import { ProductToolRegistry } from './tools/ProductToolRegistry';
import { FeeToolRegistry } from './tools/FeeToolRegistry';
import { PortfolioToolRegistry } from './tools/PortfolioToolRegistry';
import { ConvertToolRegistry } from './tools/ConvertToolRegistry';
import { PublicToolRegistry } from './tools/PublicToolRegistry';
import { PaymentToolRegistry } from './tools/PaymentToolRegistry';
import { FuturesToolRegistry } from './tools/FuturesToolRegistry';
import { PerpetualsToolRegistry } from './tools/PerpetualsToolRegistry';
import { DataToolRegistry } from './tools/DataToolRegistry';
import { IndicatorToolRegistry } from './tools/IndicatorToolRegistry';
import { AnalysisToolRegistry } from './tools/AnalysisToolRegistry';
import { MarketEventToolRegistry } from './tools/MarketEventToolRegistry';
import { NewsToolRegistry } from './tools/NewsToolRegistry';

const SERVER_INSTRUCTIONS = `Cryptocurrency trading server for Coinbase Advanced Trade API.

WHEN TO USE THIS SERVER:
- Portfolio: "what's my balance", "show my accounts", "list portfolios"
- Trading: "buy 0.1 BTC", "place a limit order", "cancel my orders"
- Market Data: "BTC price", "show ETH candles", "order book for SOL"
- Analysis: "analyze BTC with RSI and MACD", "detect chart patterns"
- Sentiment: "news sentiment for BTC", "check ETH headlines"
- Events: "alert me when BTC drops below 90000"

NOT FOR THIS SERVER:
- General web search or browsing websites
- News unrelated to specific trading pairs
- External wallet transfers (on-chain transactions)
- Other exchanges (Binance, Kraken, etc.)
- DeFi, NFTs, or on-chain operations

OUTPUT FORMAT:
All tools accept an optional "format" parameter:
- "json" (default): Standard JSON, best for nested data
- "toon": Compact format, ~35% fewer tokens for lists

Use format:"toon" for list operations (list_accounts, list_orders,
list_products, get_product_candles) to reduce token usage.

TOON format uses a schema header followed by comma-separated rows:
  accounts[3]{uuid,name,currency,balance}:
    abc-123,BTC Wallet,BTC,0.54
    def-456,ETH Wallet,ETH,2.5
    ghi-789,EUR Wallet,EUR,1234.56
  hasNext: false

Read TOON by matching values to the field names in {brackets}.`;

export class CoinbaseMcpServer {
  private readonly app: Express;
  private readonly client: CoinbaseClient;
  private readonly accounts: AccountsService;
  private readonly orders: OrdersService;
  private readonly products: ProductsService;
  private readonly converts: ConvertsService;
  private readonly fees: FeesService;
  private readonly paymentMethods: PaymentMethodsService;
  private readonly portfolios: PortfoliosService;
  private readonly futures: FuturesService;
  private readonly perpetuals: PerpetualsService;
  private readonly publicService: PublicService;
  private readonly data: DataService;
  private readonly technicalIndicators: TechnicalIndicatorsService;
  private readonly technicalAnalysis: TechnicalAnalysisService;
  private readonly marketEvent: MarketEventService;
  private readonly news: NewsService;
  private readonly marketDataPool: MarketDataPool;
  private readonly sessions = new Map<string, StreamableHTTPServerTransport>();
  private shutdownHandler: (() => void) | null = null;

  constructor(apiKey: string, privateKey: string) {
    const credentials = new CoinbaseCredentials(apiKey, privateKey);
    this.client = new CoinbaseClient(credentials);

    // Initialize all services with the client
    this.accounts = new AccountsService(this.client);
    this.orders = new OrdersService(this.client);
    this.products = new ProductsService(this.client);
    this.converts = new ConvertsService(this.client);
    this.fees = new FeesService(this.client);
    this.paymentMethods = new PaymentMethodsService(this.client);
    this.portfolios = new PortfoliosService(this.client);
    this.futures = new FuturesService(this.client);
    this.perpetuals = new PerpetualsService(this.client);
    this.publicService = new PublicService(this.client);
    this.data = new DataService(this.client);
    this.technicalIndicators = new TechnicalIndicatorsService();
    this.technicalAnalysis = new TechnicalAnalysisService(
      this.products,
      this.technicalIndicators,
    );
    this.marketDataPool = new MarketDataPool(
      credentials,
      this.products,
      (reason) => {
        logger.server.error({ reason }, 'Market data connection lost');
      },
    );
    this.marketEvent = new MarketEventService(
      this.technicalIndicators,
      this.marketDataPool,
    );
    this.news = new NewsService();

    this.app = createMcpExpressApp();

    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.post('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      if (sessionId) {
        const transport = this.sessions.get(sessionId);
        if (transport) {
          await transport.handleRequest(req, res, req.body);
          return;
        }
        // Session not found — fall through to create new session
        // This handles server restarts gracefully (stale session IDs from clients)
        logger.server.debug(
          { sessionId },
          'Stale session ID, creating new session',
        );
      }

      try {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            // Store transport immediately when session is initialized
            // This avoids race conditions where requests might arrive before storage
            this.sessions.set(sessionId, transport);
          },
        });
        const server = this.createMcpServerInstance();

        transport.onclose = () => {
          if (transport.sessionId) {
            this.sessions.delete(transport.sessionId);
          }
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.server.error({ err: error }, 'Error handling MCP request');
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: 'Internal server error' },
            id: null,
          });
        }
      }
    });

    this.app.get('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      const transport = sessionId ? this.sessions.get(sessionId) : undefined;

      if (transport) {
        await transport.handleRequest(req, res);
      } else {
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Session not found' },
          id: null,
        });
      }
    });

    this.app.delete('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      const transport = sessionId ? this.sessions.get(sessionId) : undefined;

      if (transport) {
        await transport.handleRequest(req, res);
      } else {
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Session not found' },
          id: null,
        });
      }
    });
  }

  private registerToolsForServer(server: McpServer): void {
    const registries: ToolRegistry[] = [
      new AccountToolRegistry(server, this.accounts),
      new OrderToolRegistry(server, this.orders),
      new ProductToolRegistry(server, this.products),
      new FeeToolRegistry(server, this.fees),
      new PortfolioToolRegistry(server, this.portfolios),
      new ConvertToolRegistry(server, this.converts),
      new PublicToolRegistry(server, this.publicService),
      new PaymentToolRegistry(server, this.paymentMethods),
      new FuturesToolRegistry(server, this.futures),
      new PerpetualsToolRegistry(server, this.perpetuals),
      new DataToolRegistry(server, this.data),
      new IndicatorToolRegistry(server, this.technicalIndicators),
      new AnalysisToolRegistry(server, this.technicalAnalysis),
      new MarketEventToolRegistry(server, this.marketEvent),
      new NewsToolRegistry(server, this.news),
    ];

    registries.forEach((r) => {
      r.register();
    });
  }

  private registerPromptsForServer(server: McpServer): void {
    server.registerPrompt(
      'assist',
      {
        description: 'A prompt to help with trading on Coinbase Advanced Trade',
      },
      () => {
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `You are a Coinbase Advanced Trade assistant.

TOOL CATEGORIES (74 total):
- Accounts (2): list_accounts, get_account
- Orders (9): create_order, preview_order, list_orders, get_order, cancel_orders, edit_order, preview_edit_order, list_fills, close_position
- Products (8): list_products, get_product, get_product_candles, get_product_candles_batch, get_best_bid_ask, get_market_snapshot, get_product_book, get_market_trades
- Portfolios (6): list_portfolios, create_portfolio, get_portfolio, edit_portfolio, delete_portfolio, move_portfolio_funds
- Conversions (3): create_convert_quote, commit_convert_trade, get_convert_trade
- Public Data (6): get_server_time, list_public_products, get_public_product, get_public_product_book, get_public_product_candles, get_public_market_trades
- Payment Methods (2): list_payment_methods, get_payment_method
- Futures (4): list_futures_positions, get_futures_position, get_futures_balance_summary, list_futures_sweeps
- Perpetuals (4): list_perpetuals_positions, get_perpetuals_position, get_perpetuals_portfolio_summary, get_perpetuals_portfolio_balance
- Info (2): get_api_key_permissions, get_transaction_summary
- Technical Indicators (24): calculate_rsi, calculate_macd, calculate_sma, calculate_ema, calculate_bollinger_bands, calculate_atr, calculate_stochastic, calculate_adx, calculate_obv, calculate_vwap, calculate_cci, calculate_williams_r, calculate_roc, calculate_mfi, calculate_psar, calculate_ichimoku_cloud, calculate_keltner_channels, calculate_fibonacci_retracement, detect_candlestick_patterns, calculate_volume_profile, calculate_pivot_points, detect_rsi_divergence, detect_chart_patterns, detect_swing_points
- Technical Analysis (2): analyze_technical_indicators, analyze_technical_indicators_batch
- Market Events (1): wait_for_market_event
- Market Intelligence (1): get_news_sentiment

BEST PRACTICES:
1. Always preview_order before create_order
2. Check balances with list_accounts first
3. Use get_transaction_summary to understand fees
4. For candles: timestamps are converted to Unix automatically
5. Provide market context when relevant
6. Use analyze_technical_indicators for efficient multi-indicator analysis (reduces context by ~90%)
7. Use analyze_technical_indicators_batch when analyzing multiple products (returns ranking by signal score)
8. Use individual indicator tools (calculate_*, detect_*) when you need specific indicator values
9. Use wait_for_market_event for event-driven monitoring instead of polling with sleep
10. Consider market sentiment before significant trades - Use get_news_sentiment to check recent headlines`,
              },
            },
          ],
        };
      },
    );
  }

  public getExpressApp(): Express {
    return this.app;
  }

  /**
   * Returns a new stateless McpServer instance, with tools and prompts registered.
   * Used for tests and in-memory transport scenarios.
   */
  public getMcpServer(): McpServer {
    return this.createMcpServerInstance();
  }

  /**
   * Shared logic for creating a new stateless McpServer instance with tools/prompts registered.
   */
  private createMcpServerInstance(): McpServer {
    const server = new McpServer(
      {
        name: 'coinbase-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
        instructions: SERVER_INSTRUCTIONS,
      },
    );
    this.registerToolsForServer(server);
    this.registerPromptsForServer(server);
    return server;
  }

  /**
   * Closes the server and cleans up resources.
   */
  public close(): void {
    if (this.shutdownHandler) {
      process.off('SIGTERM', this.shutdownHandler);
      process.off('SIGINT', this.shutdownHandler);
      this.shutdownHandler = null;
    }
    this.marketDataPool.close();
    for (const [id, transport] of this.sessions) {
      void transport.close();
      this.sessions.delete(id);
    }
  }

  public listen(port: number): http.Server {
    const httpServer = this.app.listen(port, () => {
      logger.server.info(`Coinbase MCP Server listening on port ${port}`);
    });

    let isShuttingDown = false;
    const shutdown = (): void => {
      if (isShuttingDown) {
        return;
      }
      isShuttingDown = true;
      logger.server.info('Shutting down...');

      try {
        this.close();
      } catch (error: unknown) {
        logger.server.error({ err: error }, 'Error during shutdown cleanup');
      }

      const forceExitTimeout = setTimeout(() => {
        logger.server.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, 10_000);
      forceExitTimeout.unref();

      httpServer.close(() => {
        clearTimeout(forceExitTimeout);
        process.exit(0);
      });
    };

    this.shutdownHandler = shutdown;
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.server.error(`Port ${port} is already in use`);
        logger.server.error('Try a different port with: PORT=<port> npm start');
      } else {
        logger.server.error(`Error starting server: ${error.message}`);
      }
      process.exit(1);
    });

    return httpServer;
  }

  public async listenStdio(): Promise<void> {
    const mcpServer = this.createMcpServerInstance();
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    logger.server.info('Coinbase MCP Server running on stdio');
  }
}
