import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Express, Request, Response } from 'express';
import {
  CoinbaseAdvTradeClient,
  CoinbaseAdvTradeCredentials,
  AccountsService,
  OrdersService,
  ConvertsService,
  FeesService,
  PaymentMethodsService,
  PortfoliosService,
  FuturesService,
  PerpetualsService,
  DataService,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import * as z from 'zod';
import { OrderSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderSide.js';
import { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType.js';
import { ContractExpiryType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ContractExpiryType.js';
import { ProductVenue } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductVenue.js';
import { StopPriceDirection } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/StopPriceDirection.js';
import { ProductsService } from './ProductsService';
import { PublicService } from './PublicService';
import { TechnicalIndicatorsService } from './TechnicalIndicatorsService';
import { Granularity } from './ProductCandles';

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
    // ===== ACCOUNTS =====

    server.registerTool(
      'list_accounts',
      {
        title: 'List Accounts',
        description: 'Get a list of all accounts with their balances',
        inputSchema: {},
      },
      this.call(this.accounts.listAccounts.bind(this.accounts)),
    );

    server.registerTool(
      'get_account',
      {
        title: 'Get Account',
        description: 'Get details of a specific account by UUID',
        inputSchema: {
          accountUuid: z
            .string()
            .describe('The UUID of the account to retrieve'),
        },
      },
      this.call(this.accounts.getAccount.bind(this.accounts)),
    );

    // ===== ORDERS =====

    server.registerTool(
      'list_orders',
      {
        title: 'List Orders',
        description: 'Get a list of all historical orders',
        inputSchema: {
          productIds: z
            .array(z.string())
            .optional()
            .describe('Optional product IDs to filter by'),
          orderStatus: z
            .array(z.string())
            .optional()
            .describe('Optional order statuses to filter by'),
          limit: z
            .number()
            .optional()
            .describe('Optional limit of orders to return'),
        },
      },
      this.call(this.orders.listOrders.bind(this.orders)),
    );

    server.registerTool(
      'get_order',
      {
        title: 'Get Order',
        description: 'Get details of a specific order by order ID',
        inputSchema: {
          orderId: z.string().describe('The ID of the order to retrieve'),
        },
      },
      this.call(this.orders.getOrder.bind(this.orders)),
    );

    server.registerTool(
      'create_order',
      {
        title: 'Create Order',
        description: 'Create a new buy or sell order',
        inputSchema: {
          clientOrderId: z.string().describe('Unique client order ID'),
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          side: z.nativeEnum(OrderSide).describe('Order side'),
          orderConfiguration: z
            .object({
              marketMarketIoc: z
                .object({
                  quoteSize: z.string().optional(),
                  baseSize: z.string().optional(),
                })
                .optional(),
              limitLimitGtc: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  postOnly: z.boolean().optional(),
                })
                .optional(),
              limitLimitGtd: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  endTime: z.string(),
                  postOnly: z.boolean().optional(),
                })
                .optional(),
              limitLimitFok: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                })
                .optional(),
              sorLimitIoc: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                })
                .optional(),
              stopLimitStopLimitGtc: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  stopPrice: z.string(),
                  stopDirection: z.nativeEnum(StopPriceDirection).optional(),
                })
                .optional(),
              stopLimitStopLimitGtd: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  stopPrice: z.string(),
                  endTime: z.string(),
                  stopDirection: z.nativeEnum(StopPriceDirection).optional(),
                })
                .optional(),
              triggerBracketGtc: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  stopTriggerPrice: z.string(),
                })
                .optional(),
              triggerBracketGtd: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  stopTriggerPrice: z.string(),
                  endTime: z.string(),
                })
                .optional(),
            })
            .describe(
              'Order configuration (marketMarketIoc, limitLimitGtc, etc.)',
            ),
        },
      },
      this.call(this.orders.createOrder.bind(this.orders)),
    );

    server.registerTool(
      'cancel_orders',
      {
        title: 'Cancel Orders',
        description: 'Cancel one or more orders',
        inputSchema: {
          orderIds: z
            .array(z.string())
            .describe('Array of order IDs to cancel'),
        },
      },
      this.call(this.orders.cancelOrders.bind(this.orders)),
    );

    // ===== PRODUCTS =====

    server.registerTool(
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

    server.registerTool(
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

    server.registerTool(
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

    server.registerTool(
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
      this.call(this.products.getProductCandlesFixed.bind(this.products)),
    );

    server.registerTool(
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

    server.registerTool(
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

    server.registerTool(
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

    server.registerTool(
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

    // ===== FEES =====

    server.registerTool(
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

    // ===== PORTFOLIOS =====

    server.registerTool(
      'list_portfolios',
      {
        title: 'List Portfolios',
        description: 'Get a list of all portfolios',
        inputSchema: {},
      },
      this.call(this.portfolios.listPortfolios.bind(this.portfolios)),
    );

    server.registerTool(
      'create_portfolio',
      {
        title: 'Create Portfolio',
        description: 'Create a new portfolio',
        inputSchema: {
          name: z.string().describe('Name of the portfolio'),
        },
      },
      this.call(this.portfolios.createPortfolio.bind(this.portfolios)),
    );

    // ===== FILLS =====

    server.registerTool(
      'list_fills',
      {
        title: 'List Fills',
        description: 'Get a list of fills (executed trades) for orders',
        inputSchema: {
          orderIds: z
            .array(z.string())
            .optional()
            .describe('Optional order IDs to filter by'),
          productIds: z
            .array(z.string())
            .optional()
            .describe('Optional product IDs to filter by'),
          limit: z
            .number()
            .optional()
            .describe('Optional limit of fills to return'),
        },
      },
      this.call(this.orders.listFills.bind(this.orders)),
    );

    // ===== EDIT ORDERS =====

    server.registerTool(
      'edit_order',
      {
        title: 'Edit Order',
        description: 'Edit an existing order (change price or size)',
        inputSchema: {
          orderId: z.string().describe('The ID of the order to edit'),
          price: z.string().describe('New limit price'),
          size: z.string().describe('New size'),
        },
      },
      this.call(this.orders.editOrder.bind(this.orders)),
    );

    server.registerTool(
      'preview_edit_order',
      {
        title: 'Preview Edit Order',
        description: 'Preview the result of editing an order before committing',
        inputSchema: {
          orderId: z
            .string()
            .describe('The ID of the order to preview editing'),
          price: z.string().describe('New limit price'),
          size: z.string().describe('New size'),
        },
      },
      this.call(this.orders.editOrderPreview.bind(this.orders)),
    );

    server.registerTool(
      'preview_order',
      {
        title: 'Preview Order',
        description:
          'Preview the result of creating an order before committing',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          side: z.nativeEnum(OrderSide).describe('Order side'),
          orderConfiguration: z
            .object({
              marketMarketIoc: z
                .object({
                  quoteSize: z.string().optional(),
                  baseSize: z.string().optional(),
                })
                .optional(),
              limitLimitGtc: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  postOnly: z.boolean().optional(),
                })
                .optional(),
              limitLimitGtd: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  endTime: z.string(),
                  postOnly: z.boolean().optional(),
                })
                .optional(),
              limitLimitFok: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                })
                .optional(),
              sorLimitIoc: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                })
                .optional(),
              stopLimitStopLimitGtc: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  stopPrice: z.string(),
                  stopDirection: z.nativeEnum(StopPriceDirection).optional(),
                })
                .optional(),
              stopLimitStopLimitGtd: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  stopPrice: z.string(),
                  endTime: z.string(),
                  stopDirection: z.nativeEnum(StopPriceDirection).optional(),
                })
                .optional(),
              triggerBracketGtc: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  stopTriggerPrice: z.string(),
                })
                .optional(),
              triggerBracketGtd: z
                .object({
                  baseSize: z.string(),
                  limitPrice: z.string(),
                  stopTriggerPrice: z.string(),
                  endTime: z.string(),
                })
                .optional(),
            })
            .describe('Order configuration'),
        },
      },
      this.call(this.orders.createOrderPreview.bind(this.orders)),
    );

    server.registerTool(
      'close_position',
      {
        title: 'Close Position',
        description: 'Close an open position for a product',
        inputSchema: {
          clientOrderId: z.string().describe('Unique client order ID'),
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
          size: z.string().optional().describe('Size to close (optional)'),
        },
      },
      this.call(this.orders.closePosition.bind(this.orders)),
    );

    // ===== CONVERTS =====

    server.registerTool(
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

    server.registerTool(
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

    server.registerTool(
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

    // ===== PUBLIC DATA =====

    server.registerTool(
      'get_server_time',
      {
        title: 'Get Server Time',
        description: 'Get the current server timestamp from Coinbase',
        inputSchema: {},
      },
      this.call(this.publicService.getServerTime.bind(this.publicService)),
    );

    server.registerTool(
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

    server.registerTool(
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

    server.registerTool(
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

    server.registerTool(
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

    server.registerTool(
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

    // ===== PAYMENT METHODS =====

    server.registerTool(
      'list_payment_methods',
      {
        title: 'List Payment Methods',
        description: 'Get a list of available payment methods',
        inputSchema: {},
      },
      this.call(
        this.paymentMethods.listPaymentMethods.bind(this.paymentMethods),
      ),
    );

    server.registerTool(
      'get_payment_method',
      {
        title: 'Get Payment Method',
        description: 'Get details of a specific payment method',
        inputSchema: {
          paymentMethodId: z.string().describe('The ID of the payment method'),
        },
      },
      this.call(this.paymentMethods.getPaymentMethod.bind(this.paymentMethods)),
    );

    // ===== PORTFOLIO OPERATIONS =====

    server.registerTool(
      'get_portfolio',
      {
        title: 'Get Portfolio',
        description: 'Get details of a specific portfolio',
        inputSchema: {
          portfolioUuid: z.string().describe('The UUID of the portfolio'),
        },
      },
      this.call(this.portfolios.getPortfolio.bind(this.portfolios)),
    );

    server.registerTool(
      'move_portfolio_funds',
      {
        title: 'Move Portfolio Funds',
        description: 'Move funds between portfolios',
        inputSchema: {
          funds: z
            .object({
              value: z.string().describe('Amount to transfer'),
              currency: z.string().describe('Currency code (e.g., USD, BTC)'),
            })
            .describe('Fund movement details (amount, currency)'),
          sourcePortfolioUuid: z.string().describe('Source portfolio UUID'),
          targetPortfolioUuid: z.string().describe('Target portfolio UUID'),
        },
      },
      this.call(this.portfolios.movePortfolioFunds.bind(this.portfolios)),
    );

    server.registerTool(
      'edit_portfolio',
      {
        title: 'Edit Portfolio',
        description: 'Edit portfolio details (name)',
        inputSchema: {
          portfolioUuid: z
            .string()
            .describe('The UUID of the portfolio to edit'),
          name: z.string().describe('New name for the portfolio'),
        },
      },
      this.call(this.portfolios.editPortfolio.bind(this.portfolios)),
    );

    server.registerTool(
      'delete_portfolio',
      {
        title: 'Delete Portfolio',
        description: 'Delete a portfolio',
        inputSchema: {
          portfolioUuid: z
            .string()
            .describe('The UUID of the portfolio to delete'),
        },
      },
      this.call(this.portfolios.deletePortfolio.bind(this.portfolios)),
    );

    // ===== FUTURES =====

    server.registerTool(
      'list_futures_positions',
      {
        title: 'List Futures Positions',
        description: 'Get all futures positions',
        inputSchema: {},
      },
      this.call(this.futures.listPositions.bind(this.futures)),
    );

    server.registerTool(
      'get_futures_position',
      {
        title: 'Get Futures Position',
        description: 'Get a specific futures position',
        inputSchema: {
          productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
        },
      },
      this.call(this.futures.getPosition.bind(this.futures)),
    );

    server.registerTool(
      'get_futures_balance_summary',
      {
        title: 'Get Futures Balance Summary',
        description: 'Get futures balance summary',
        inputSchema: {},
      },
      this.call(this.futures.getBalanceSummary.bind(this.futures)),
    );

    server.registerTool(
      'list_futures_sweeps',
      {
        title: 'List Futures Sweeps',
        description: 'Get all futures sweeps',
        inputSchema: {},
      },
      this.call(this.futures.listSweeps.bind(this.futures)),
    );

    // ===== PERPETUALS =====

    server.registerTool(
      'list_perpetuals_positions',
      {
        title: 'List Perpetuals Positions',
        description: 'Get all perpetuals positions',
        inputSchema: {
          portfolioUuid: z.string().describe('Portfolio UUID'),
        },
      },
      this.call(this.perpetuals.listPositions.bind(this.perpetuals)),
    );

    server.registerTool(
      'get_perpetuals_position',
      {
        title: 'Get Perpetuals Position',
        description: 'Get a specific perpetuals position',
        inputSchema: {
          portfolioUuid: z.string().describe('Portfolio UUID'),
          symbol: z.string().describe('Product symbol'),
        },
      },
      this.call(this.perpetuals.getPosition.bind(this.perpetuals)),
    );

    server.registerTool(
      'get_perpetuals_portfolio_summary',
      {
        title: 'Get Perpetuals Portfolio Summary',
        description: 'Get perpetuals portfolio summary',
        inputSchema: {
          portfolioUuid: z.string().describe('Portfolio UUID'),
        },
      },
      this.call(this.perpetuals.getPortfolioSummary.bind(this.perpetuals)),
    );

    server.registerTool(
      'get_perpetuals_portfolio_balance',
      {
        title: 'Get Perpetuals Portfolio Balance',
        description: 'Get perpetuals portfolio balance',
        inputSchema: {
          portfolioUuid: z.string().describe('Portfolio UUID'),
        },
      },
      this.call(this.perpetuals.getPortfolioBalance.bind(this.perpetuals)),
    );

    // ===== DATA API =====

    server.registerTool(
      'get_api_key_permissions',
      {
        title: 'Get API Key Permissions',
        description: 'Get permissions for the current API key',
        inputSchema: {},
      },
      this.call(this.data.getAPIKeyPermissions.bind(this.data)),
    );

    // ===== TECHNICAL INDICATORS =====

    server.registerTool(
      'calculate_rsi',
      {
        title: 'Calculate RSI',
        description:
          'Calculate Relative Strength Index (RSI) from candle data. ' +
          'RSI measures momentum and identifies overbought (>70) or oversold (<30) conditions. ' +
          'Input candles should be in the same format as returned by get_product_candles.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data (minimum 2 candles required)'),
          period: z
            .number()
            .int()
            .min(2)
            .optional()
            .describe(
              'Number of candles to analyze (default: 14). ' +
                'Lower values (7-9) react faster but produce more false signals. ' +
                'Higher values (21-25) are slower but more reliable.',
            ),
        },
      },
      this.call(
        this.technicalIndicators.calculateRsi.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_macd',
      {
        title: 'Calculate MACD',
        description:
          'Calculate Moving Average Convergence Divergence (MACD) from candle data. ' +
          'MACD shows trend direction and momentum. Bullish when MACD crosses above signal line, ' +
          'bearish when it crosses below. Histogram shows the difference between MACD and signal.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          fastPeriod: z
            .number()
            .int()
            .min(2)
            .optional()
            .describe('Fast EMA period (default: 12)'),
          slowPeriod: z
            .number()
            .int()
            .min(2)
            .optional()
            .describe('Slow EMA period (default: 26)'),
          signalPeriod: z
            .number()
            .int()
            .min(2)
            .optional()
            .describe('Signal line period (default: 9)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateMacd.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_ema',
      {
        title: 'Calculate EMA',
        description:
          'Calculate Exponential Moving Average (EMA) from candle data. ' +
          'EMA gives more weight to recent prices, making it more responsive than SMA. ' +
          'Common periods: 9 (short-term), 20 (medium-term), 50/200 (long-term trends).',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(1)
            .describe('Array of candle data'),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Number of candles for EMA calculation (default: 20). ' +
                'Common values: 9, 12, 20, 26, 50, 200.',
            ),
        },
      },
      this.call(
        this.technicalIndicators.calculateEma.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_bollinger_bands',
      {
        title: 'Calculate Bollinger Bands',
        description:
          'Calculate Bollinger Bands from candle data. ' +
          'Returns upper, middle (SMA), and lower bands plus %B (position within bands). ' +
          'Price near upper band suggests overbought, near lower suggests oversold.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          period: z
            .number()
            .int()
            .min(2)
            .optional()
            .describe('SMA period for middle band (default: 20)'),
          stdDev: z
            .number()
            .min(0.1)
            .optional()
            .describe('Standard deviation multiplier (default: 2)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateBollingerBands.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'calculate_atr',
      {
        title: 'Calculate ATR (Average True Range)',
        description:
          'Calculate ATR from candle data. ' +
          'Measures market volatility by decomposing the entire range of an asset price for a period. ' +
          'Higher ATR indicates higher volatility. Useful for setting stop-losses and position sizing.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Number of periods for ATR calculation (default: 14). ' +
                'Shorter periods (e.g., 7) react faster to volatility changes, ' +
                'longer periods (e.g., 21) provide smoother readings.',
            ),
        },
      },
      this.call(
        this.technicalIndicators.calculateAtr.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_stochastic',
      {
        title: 'Calculate Stochastic Oscillator',
        description:
          'Calculate Stochastic oscillator from candle data. ' +
          'Returns %K (fast line) and %D (signal line) values. ' +
          '%K above %D is bullish, below is bearish. ' +
          'Values above 80 indicate overbought, below 20 indicate oversold.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          kPeriod: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Period for %K line calculation (default: 14). ' +
                'Number of periods to use for the raw stochastic calculation.',
            ),
          dPeriod: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Period for %D signal line smoothing (default: 3). ' +
                'Moving average period applied to %K to create %D.',
            ),
          stochPeriod: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Slow stochastic smoothing period (default: 3). ' +
                'Additional smoothing applied to the stochastic values.',
            ),
        },
      },
      this.call(
        this.technicalIndicators.calculateStochastic.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'calculate_adx',
      {
        title: 'Calculate ADX (Average Directional Index)',
        description:
          'Calculate ADX from candle data. ' +
          'Measures trend strength regardless of direction. ' +
          'ADX > 25 indicates strong trend, < 20 indicates weak/no trend. ' +
          'Returns ADX, +DI (bullish pressure), and -DI (bearish pressure).',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              'Period for ADX calculation (default: 14). ' +
                'Shorter periods give faster signals but more noise.',
            ),
        },
      },
      this.call(
        this.technicalIndicators.calculateAdx.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_obv',
      {
        title: 'Calculate OBV (On-Balance Volume)',
        description:
          'Calculate OBV from candle data. ' +
          'Measures buying and selling pressure using volume flow. ' +
          'Rising OBV confirms uptrend, falling OBV confirms downtrend. ' +
          'Divergence between price and OBV can signal reversals.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
        },
      },
      this.call(
        this.technicalIndicators.calculateObv.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_vwap',
      {
        title: 'Calculate VWAP (Volume Weighted Average Price)',
        description:
          'Calculate VWAP from candle data. ' +
          'Represents the average price weighted by volume. ' +
          'Price above VWAP suggests bullish bias, below suggests bearish. ' +
          'Often used as intraday support/resistance level.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(1)
            .describe('Array of candle data'),
        },
      },
      this.call(
        this.technicalIndicators.calculateVwap.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_cci',
      {
        title: 'Calculate CCI (Commodity Channel Index)',
        description:
          'Calculate CCI from candle data. ' +
          'Measures price deviation from statistical mean. ' +
          'Readings above +100 suggest overbought, below -100 suggest oversold. ' +
          'Useful for identifying cyclical trends in commodities and stocks.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Period for CCI calculation (default: 20)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateCci.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_williams_r',
      {
        title: 'Calculate Williams %R',
        description:
          'Calculate Williams %R from candle data. ' +
          'Momentum indicator similar to Stochastic but inverted scale (-100 to 0). ' +
          'Readings above -20 suggest overbought, below -80 suggest oversold. ' +
          'Useful for identifying potential reversal points.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Period for Williams %R calculation (default: 14)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateWilliamsR.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'calculate_roc',
      {
        title: 'Calculate ROC (Rate of Change)',
        description:
          'Calculate ROC (Rate of Change) from candle data. ' +
          'Momentum oscillator measuring percentage change between current price and price n periods ago. ' +
          'Positive values indicate upward momentum, negative values indicate downward momentum. ' +
          'Useful for identifying trend strength and potential reversals.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Period for ROC calculation (default: 12)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateRoc.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_mfi',
      {
        title: 'Calculate MFI (Money Flow Index)',
        description:
          'Calculate MFI (Money Flow Index) from candle data. ' +
          'Volume-weighted RSI that measures buying and selling pressure. ' +
          'Readings above 80 suggest overbought, below 20 suggest oversold. ' +
          'Divergences between MFI and price can signal potential reversals.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          period: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Period for MFI calculation (default: 14)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateMfi.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_psar',
      {
        title: 'Calculate Parabolic SAR',
        description:
          'Calculate Parabolic SAR from candle data. ' +
          'Trend-following indicator that provides potential entry and exit points. ' +
          'SAR below price indicates uptrend, SAR above price indicates downtrend. ' +
          'SAR flips signal trend reversals.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(2)
            .describe('Array of candle data'),
          step: z
            .number()
            .min(0.001)
            .max(1)
            .optional()
            .describe('Acceleration factor step (default: 0.02)'),
          max: z
            .number()
            .min(0.01)
            .max(1)
            .optional()
            .describe('Maximum acceleration factor (default: 0.2)'),
        },
      },
      this.call(
        this.technicalIndicators.calculatePsar.bind(this.technicalIndicators),
      ),
    );

    server.registerTool(
      'calculate_ichimoku_cloud',
      {
        title: 'Calculate Ichimoku Cloud',
        description:
          'Calculate Ichimoku Cloud (Ichimoku Kinko Hyo) from candle data. ' +
          'Comprehensive trend indicator with 5 components. ' +
          'Returns conversion line (Tenkan-sen), base line (Kijun-sen), ' +
          'leading span A (Senkou Span A), and leading span B (Senkou Span B). ' +
          'Price above cloud is bullish, below is bearish. ' +
          'Cloud color (green/red) indicates future trend direction.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(52)
            .describe('Array of candle data (minimum 52 for span period)'),
          conversionPeriod: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Tenkan-sen period (default: 9)'),
          basePeriod: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Kijun-sen period (default: 26)'),
          spanPeriod: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Senkou Span B period (default: 52)'),
          displacement: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Cloud displacement (default: 26)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateIchimokuCloud.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'calculate_keltner_channels',
      {
        title: 'Calculate Keltner Channels',
        description:
          'Calculate Keltner Channels from candle data. ' +
          'Volatility-based envelope indicator similar to Bollinger Bands but uses ATR. ' +
          'Returns middle (EMA), upper, and lower channel values. ' +
          'Price below lower channel suggests oversold, above upper suggests overbought. ' +
          'BB squeeze inside Keltner signals volatility breakout.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(20)
            .describe('Array of candle data'),
          maPeriod: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Moving average period (default: 20)'),
          atrPeriod: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('ATR period (default: 10)'),
          multiplier: z
            .number()
            .min(0.1)
            .optional()
            .describe('ATR multiplier for channel width (default: 2)'),
          useSMA: z
            .boolean()
            .optional()
            .describe('Use SMA instead of EMA (default: false)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateKeltnerChannels.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'calculate_fibonacci_retracement',
      {
        title: 'Calculate Fibonacci Retracement',
        description:
          'Calculate Fibonacci Retracement levels from swing high/low prices. ' +
          'For uptrend: start=low, end=high. For downtrend: start=high, end=low. ' +
          'Returns key retracement levels (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%) ' +
          'plus extension levels (127.2%, 161.8%, 261.8%, 423.6%). ' +
          'Price bouncing at 38.2% or 61.8% suggests support/resistance.',
        inputSchema: {
          start: z
            .number()
            .describe('Start price (low for uptrend, high for downtrend)'),
          end: z
            .number()
            .describe('End price (high for uptrend, low for downtrend)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateFibonacciRetracement.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'detect_candlestick_patterns',
      {
        title: 'Detect Candlestick Patterns',
        description:
          'Detect candlestick patterns from candle data. ' +
          'Identifies 31 patterns including bullish (Hammer, Engulfing, Morning Star, Marubozu, Harami Cross, etc.), ' +
          'bearish (Shooting Star, Evening Star, Three Black Crows, Marubozu, Harami Cross, etc.), and neutral (Doji). ' +
          'Returns overall bullish/bearish bias and list of detected patterns. ' +
          'Useful for identifying potential reversals and continuation signals.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(1)
            .describe('Array of candle data'),
        },
      },
      this.call(
        this.technicalIndicators.detectCandlestickPatterns.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'calculate_volume_profile',
      {
        title: 'Calculate Volume Profile',
        description:
          'Calculate Volume Profile from candle data. ' +
          'Divides price range into zones and shows volume distribution at each level. ' +
          'Returns zones with bullish/bearish volume, Point of Control (highest volume zone), ' +
          'and Value Area (70% of volume). Useful for identifying support/resistance levels.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .min(1)
            .describe('Array of candle data'),
          noOfBars: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('Number of price zones (default: 12)'),
        },
      },
      this.call(
        this.technicalIndicators.calculateVolumeProfile.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'calculate_pivot_points',
      {
        title: 'Calculate Pivot Points',
        description:
          'Calculate Pivot Points from previous period OHLC data. ' +
          'Supports Standard, Fibonacci, Woodie, Camarilla, and DeMark calculation types. ' +
          'Returns pivot point with support (S1-S3) and resistance (R1-R3) levels. ' +
          'Used to identify potential support/resistance levels for the next trading period.',
        inputSchema: {
          high: z.string().describe('Previous period high price'),
          low: z.string().describe('Previous period low price'),
          close: z.string().describe('Previous period closing price'),
          open: z
            .string()
            .optional()
            .describe(
              'Previous period opening price (required for DeMark type)',
            ),
          type: z
            .enum(['standard', 'fibonacci', 'woodie', 'camarilla', 'demark'])
            .optional()
            .describe('Pivot point calculation type (default: standard)'),
        },
      },
      this.call(
        this.technicalIndicators.calculatePivotPoints.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'detect_rsi_divergence',
      {
        title: 'Detect RSI Divergence',
        description:
          'Detect RSI divergences in price data. ' +
          'Identifies bullish divergences (price lower lows, RSI higher lows), ' +
          'bearish divergences (price higher highs, RSI lower highs), ' +
          'hidden bullish (price higher lows, RSI lower lows), and ' +
          'hidden bearish (price lower highs, RSI higher highs). ' +
          'Returns divergences with strength classification (weak/medium/strong).',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .describe('Array of candle data (oldest first)'),
          rsiPeriod: z
            .number()
            .optional()
            .describe('RSI period for calculation (default: 14)'),
          lookbackPeriod: z
            .number()
            .optional()
            .describe(
              'Lookback period for peak/trough detection (default: 14)',
            ),
        },
      },
      this.call(
        this.technicalIndicators.detectRsiDivergence.bind(
          this.technicalIndicators,
        ),
      ),
    );

    server.registerTool(
      'detect_chart_patterns',
      {
        title: 'Detect Chart Patterns',
        description:
          'Detect chart patterns in price data. ' +
          'Identifies reversal patterns (Double Top/Bottom, Head & Shoulders) ' +
          'and continuation patterns (Ascending/Descending Triangles, Bull/Bear Flags). ' +
          'Returns patterns with direction, confidence level, and price targets.',
        inputSchema: {
          candles: z
            .array(
              z.object({
                open: z.string().describe('Opening price'),
                high: z.string().describe('High price'),
                low: z.string().describe('Low price'),
                close: z.string().describe('Closing price'),
                volume: z.string().describe('Volume'),
              }),
            )
            .describe('Array of candle data (oldest first)'),
          lookbackPeriod: z
            .number()
            .optional()
            .describe('Lookback period for pattern detection (default: 50)'),
        },
      },
      this.call(
        this.technicalIndicators.detectChartPatterns.bind(
          this.technicalIndicators,
        ),
      ),
    );
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

TOOL CATEGORIES (68 total):
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
- Technical Indicators (22): calculate_rsi, calculate_macd, calculate_ema, calculate_bollinger_bands, calculate_atr, calculate_stochastic, calculate_adx, calculate_obv, calculate_vwap, calculate_cci, calculate_williams_r, calculate_roc, calculate_mfi, calculate_psar, calculate_ichimoku_cloud, calculate_keltner_channels, calculate_fibonacci_retracement, detect_candlestick_patterns, calculate_volume_profile, calculate_pivot_points, detect_rsi_divergence, detect_chart_patterns

BEST PRACTICES:
1. Always preview_order before create_order
2. Check balances with list_accounts first
3. Use get_transaction_summary to understand fees
4. For candles: timestamps are converted to Unix automatically
5. Provide market context when relevant
6. Use technical indicators with candle data from get_product_candles`,
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

  private call<I, R>(fn: (input: I) => R | Promise<R>) {
    return async (input: I) => {
      const response = await Promise.resolve(fn(input));
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    };
  }
}
