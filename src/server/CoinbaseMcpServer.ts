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

TOOL CATEGORIES (49 total):
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
- Technical Indicators (3): calculate_rsi, calculate_macd, calculate_ema

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
