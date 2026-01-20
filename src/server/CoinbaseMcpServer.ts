import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Express, Request, Response } from 'express';
import {
  CoinbaseAdvTradeClient,
  CoinbaseAdvTradeCredentials,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
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
} from './services';
import { TechnicalIndicatorsService } from './TechnicalIndicatorsService';
import { TechnicalAnalysisService } from './TechnicalAnalysisService';
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

export class CoinbaseMcpServer {
  private readonly app: Express;
  private readonly client: CoinbaseAdvTradeClient;
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

  constructor(apiKey: string, privateKey: string) {
    const credentials = new CoinbaseAdvTradeCredentials(apiKey, privateKey);
    this.client = new CoinbaseAdvTradeClient(credentials);

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

    this.app = createMcpExpressApp();

    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.post('/mcp', async (req: Request, res: Response) => {
      const server = this.createMcpServerInstance();
      try {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // stateless mode
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);

        res.on('close', () => {
          void transport.close();
          void server.close();
        });
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    this.app.get('/mcp', (_req: Request, res: Response) => {
      res.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: 'Method not allowed. Use POST for MCP requests.',
        },
        id: null,
      });
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

TOOL CATEGORIES (71 total):
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
- Technical Analysis (1): analyze_technical_indicators

BEST PRACTICES:
1. Always preview_order before create_order
2. Check balances with list_accounts first
3. Use get_transaction_summary to understand fees
4. For candles: timestamps are converted to Unix automatically
5. Provide market context when relevant
6. Use analyze_technical_indicators for efficient multi-indicator analysis (reduces context by ~90%)
7. Use individual indicator tools (calculate_*, detect_*) when you need specific indicator values`,
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
      },
    );
    this.registerToolsForServer(server);
    this.registerPromptsForServer(server);
    return server;
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`Coinbase MCP Server listening on port ${port}`);
    });
  }
}
