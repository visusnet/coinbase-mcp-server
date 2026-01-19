import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GetAccountsResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetAccountsResponse';
import request from 'supertest';
import * as StreamableHttpModule from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  mockAccountsService,
  mockOrdersService,
  mockProductsService,
  mockConvertsService,
  mockFeesService,
  mockPaymentMethodsService,
  mockPortfoliosService,
  mockFuturesService,
  mockPerpetualsService,
  mockPublicService,
  mockDataService,
  mockTechnicalIndicatorsService,
  mockServices,
} from '@test/serviceMocks';
import { Granularity } from './ProductCandles';

mockServices();

import { CoinbaseMcpServer } from './CoinbaseMcpServer';

describe('CoinbaseMcpServer Integration Tests', () => {
  let coinbaseMcpServer: CoinbaseMcpServer;
  let client: Client;
  const apiKey = 'organizations/test-org/apiKeys/test-key';
  const privateKey =
    '-----BEGIN EC PRIVATE KEY-----\ntest\n-----END EC PRIVATE KEY-----';

  beforeEach(async () => {
    // Create server instance
    coinbaseMcpServer = new CoinbaseMcpServer(apiKey, privateKey);
    const mcpServer = coinbaseMcpServer.getMcpServer();

    // Create MCP client
    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      },
    );

    // Create linked transports for in-memory communication
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    // Connect both client and server
    await Promise.all([
      client.connect(clientTransport),
      mcpServer.connect(serverTransport),
    ]);
  });

  describe('Tools', () => {
    describe('Accounts', () => {
      it('should call listAccounts via MCP tool list_accounts', async () => {
        const args = {};
        const result = {
          accounts: [],
          hasNext: false,
        } satisfies GetAccountsResponse;
        mockAccountsService.listAccounts.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_accounts',
          arguments: args,
        });

        expect(mockAccountsService.listAccounts).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getAccount via MCP tool get_account', async () => {
        const args = { accountUuid: 'test-uuid-123' };
        const result = {
          account: {
            uuid: 'test-uuid-123',
            name: 'Test Account',
            currency: 'USD',
          },
        };
        mockAccountsService.getAccount.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_account',
          arguments: args,
        });

        expect(mockAccountsService.getAccount).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });
    });

    describe('Orders', () => {
      it('should call listOrders via MCP tool list_orders', async () => {
        const args = { limit: 10 };
        const result = { orders: [], hasNext: false };
        mockOrdersService.listOrders.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_orders',
          arguments: args,
        });

        expect(mockOrdersService.listOrders).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getOrder via MCP tool get_order', async () => {
        const args = { orderId: 'order-123' };
        const result = { orders: [], hasNext: false };
        mockOrdersService.getOrder.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_order',
          arguments: args,
        });

        expect(mockOrdersService.getOrder).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call createOrder via MCP tool create_order', async () => {
        const args = {
          clientOrderId: 'client-order-123',
          productId: 'BTC-USD',
          side: 'BUY',
          orderConfiguration: {},
        };
        const result = { success: true, orderId: 'order-123' };
        mockOrdersService.createOrder.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'create_order',
          arguments: args,
        });

        expect(mockOrdersService.createOrder).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call cancelOrders via MCP tool cancel_orders', async () => {
        const args = { orderIds: ['order-123', 'order-456'] };
        const result = { orders: [], hasNext: false };
        mockOrdersService.cancelOrders.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'cancel_orders',
          arguments: args,
        });

        expect(mockOrdersService.cancelOrders).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call listFills via MCP tool list_fills', async () => {
        const args = { limit: 20 };
        const result = { fills: [], cursor: '' };
        mockOrdersService.listFills.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_fills',
          arguments: args,
        });

        expect(mockOrdersService.listFills).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call editOrder via MCP tool edit_order', async () => {
        const args = { orderId: 'order-123', price: '50000', size: '0.1' };
        const result = { success: true };
        mockOrdersService.editOrder.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'edit_order',
          arguments: args,
        });

        expect(mockOrdersService.editOrder).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call editOrderPreview via MCP tool preview_edit_order', async () => {
        const args = { orderId: 'order-123', price: '50000', size: '0.1' };
        const result = { orders: [], hasNext: false };
        mockOrdersService.editOrderPreview.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'preview_edit_order',
          arguments: args,
        });

        expect(mockOrdersService.editOrderPreview).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call createOrderPreview via MCP tool preview_order', async () => {
        const args = {
          productId: 'BTC-USD',
          side: 'BUY',
          orderConfiguration: {},
        };
        const result = { orders: [], hasNext: false };
        mockOrdersService.createOrderPreview.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'preview_order',
          arguments: args,
        });

        expect(mockOrdersService.createOrderPreview).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call closePosition via MCP tool close_position', async () => {
        const args = { clientOrderId: 'client-123', productId: 'BTC-PERP' };
        const result = { success: true };
        mockOrdersService.closePosition.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'close_position',
          arguments: args,
        });

        expect(mockOrdersService.closePosition).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });
    });

    describe('Products', () => {
      it('should call listProducts via MCP tool list_products', async () => {
        const args = { limit: 50 };
        const result = { products: [], numProducts: 0 };
        mockProductsService.listProducts.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_products',
          arguments: args,
        });

        expect(mockProductsService.listProducts).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getProduct via MCP tool get_product', async () => {
        const args = { productId: 'BTC-USD' };
        const result = { products: [] };
        mockProductsService.getProduct.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_product',
          arguments: args,
        });

        expect(mockProductsService.getProduct).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getProductBook via MCP tool get_product_book', async () => {
        const args = { productId: 'BTC-USD', limit: 10 };
        const result = {
          pricebook: { productId: 'BTC-USD', bids: [], asks: [], time: '' },
        };
        mockProductsService.getProductBook.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_product_book',
          arguments: args,
        });

        expect(mockProductsService.getProductBook).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getProductCandlesFixed via MCP tool get_product_candles', async () => {
        const args = {
          productId: 'BTC-USD',
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-02T00:00:00Z',
          granularity: 'ONE_HOUR',
        };
        const result = { candles: [] };
        mockProductsService.getProductCandlesFixed.mockResolvedValueOnce(
          result,
        );

        const response = await client.callTool({
          name: 'get_product_candles',
          arguments: args,
        });

        expect(mockProductsService.getProductCandlesFixed).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call getProductCandlesBatch via MCP tool get_product_candles_batch', async () => {
        const args = {
          productIds: ['BTC-EUR', 'ETH-EUR'],
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          granularity: Granularity.FIFTEEN_MINUTE,
        };
        const result = {
          timestamp: new Date().toISOString(),
          granularity: Granularity.FIFTEEN_MINUTE,
          candleCount: 100,
          productCandlesByProductId: {
            'BTC-EUR': { candles: [], latest: null, oldest: null },
            'ETH-EUR': { candles: [], latest: null, oldest: null },
          },
        };
        mockProductsService.getProductCandlesBatch.mockResolvedValueOnce(
          result,
        );

        const response = await client.callTool({
          name: 'get_product_candles_batch',
          arguments: args,
        });

        expect(mockProductsService.getProductCandlesBatch).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call getProductMarketTrades via MCP tool get_market_trades', async () => {
        const args = { productId: 'BTC-USD', limit: 100 };
        const result = { trades: [] };
        mockProductsService.getProductMarketTrades.mockResolvedValueOnce(
          result,
        );

        const response = await client.callTool({
          name: 'get_market_trades',
          arguments: args,
        });

        expect(mockProductsService.getProductMarketTrades).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call getBestBidAsk via MCP tool get_best_bid_ask', async () => {
        const args = { productIds: ['BTC-USD', 'ETH-USD'] };
        const result = { pricebooks: [] };
        mockProductsService.getBestBidAsk.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_best_bid_ask',
          arguments: args,
        });

        expect(mockProductsService.getBestBidAsk).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getMarketSnapshot via MCP tool get_market_snapshot', async () => {
        const args = { productIds: ['BTC-EUR', 'ETH-EUR'] };
        const result = {
          timestamp: '2024-01-01T00:00:00Z',
          snapshots: {},
          summary: {
            assetsQueried: 0,
            bestPerformer: null,
            worstPerformer: null,
          },
        };
        mockProductsService.getMarketSnapshot.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_market_snapshot',
          arguments: args,
        });

        expect(mockProductsService.getMarketSnapshot).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });
    });

    describe('Fees', () => {
      it('should call getTransactionSummary via MCP tool get_transaction_summary', async () => {
        const args = {
          productType: 'SPOT',
          contractExpiryType: 'UNKNOWN_CONTRACT_EXPIRY_TYPE',
          productVenue: 'UNKNOWN_VENUE_TYPE',
        };
        const result = {
          totalVolume: 0,
          totalFees: 0,
          feeTier: {
            pricingTier: '',
            usdFrom: '',
            usdTo: '',
            takerFeeRate: '',
            makerFeeRate: '',
            aopFrom: '',
            aopTo: '',
          },
        };
        mockFeesService.getTransactionSummary.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_transaction_summary',
          arguments: args,
        });

        expect(mockFeesService.getTransactionSummary).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });
    });

    describe('Portfolios', () => {
      it('should call listPortfolios via MCP tool list_portfolios', async () => {
        const args = {};
        const result = { portfolios: [] };
        mockPortfoliosService.listPortfolios.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_portfolios',
          arguments: args,
        });

        expect(mockPortfoliosService.listPortfolios).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call createPortfolio via MCP tool create_portfolio', async () => {
        const args = { name: 'My Portfolio' };
        const result = { portfolios: [] };
        mockPortfoliosService.createPortfolio.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'create_portfolio',
          arguments: args,
        });

        expect(mockPortfoliosService.createPortfolio).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call getPortfolio via MCP tool get_portfolio', async () => {
        const args = { portfolioUuid: 'portfolio-123' };
        const result = { portfolios: [] };
        mockPortfoliosService.getPortfolio.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_portfolio',
          arguments: args,
        });

        expect(mockPortfoliosService.getPortfolio).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call movePortfolioFunds via MCP tool move_portfolio_funds', async () => {
        const args = {
          funds: { value: '100', currency: 'USD' },
          sourcePortfolioUuid: 'source-123',
          targetPortfolioUuid: 'target-456',
        };
        const result = { portfolios: [] };
        mockPortfoliosService.movePortfolioFunds.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'move_portfolio_funds',
          arguments: args,
        });

        expect(mockPortfoliosService.movePortfolioFunds).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call editPortfolio via MCP tool edit_portfolio', async () => {
        const args = { portfolioUuid: 'portfolio-123', name: 'Updated Name' };
        const result = { portfolios: [] };
        mockPortfoliosService.editPortfolio.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'edit_portfolio',
          arguments: args,
        });

        expect(mockPortfoliosService.editPortfolio).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call deletePortfolio via MCP tool delete_portfolio', async () => {
        const args = { portfolioUuid: 'portfolio-123' };
        const result = {};
        mockPortfoliosService.deletePortfolio.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'delete_portfolio',
          arguments: args,
        });

        expect(mockPortfoliosService.deletePortfolio).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });
    });

    describe('Converts', () => {
      it('should call createConvertQuote via MCP tool create_convert_quote', async () => {
        const args = {
          fromAccount: 'account-123',
          toAccount: 'account-456',
          amount: '100',
        };
        const result = {
          trade: {
            id: 'trade-123',
            userEnteredAmount: { value: '100', currency: 'USD' },
          },
        };
        mockConvertsService.createConvertQuote.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'create_convert_quote',
          arguments: args,
        });

        expect(mockConvertsService.createConvertQuote).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call commitConvertTrade via MCP tool commit_convert_trade', async () => {
        const args = {
          tradeId: 'trade-123',
          fromAccount: 'account-123',
          toAccount: 'account-456',
        };
        const result = {
          trade: {
            id: 'trade-123',
            userEnteredAmount: { value: '100', currency: 'USD' },
          },
        };
        mockConvertsService.commitConvertTrade.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'commit_convert_trade',
          arguments: args,
        });

        expect(mockConvertsService.commitConvertTrade).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call GetConvertTrade via MCP tool get_convert_trade', async () => {
        const args = {
          tradeId: 'trade-123',
          fromAccount: 'account-123',
          toAccount: 'account-456',
        };
        const result = {
          trade: {
            id: 'trade-123',
            userEnteredAmount: { value: '100', currency: 'USD' },
          },
        };
        mockConvertsService.GetConvertTrade.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_convert_trade',
          arguments: args,
        });

        expect(mockConvertsService.GetConvertTrade).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });
    });

    describe('Public', () => {
      it('should call getServerTime via MCP tool get_server_time', async () => {
        const args = {};
        const result = {
          iso: '2024-01-01T00:00:00Z',
          epochSeconds: '1704067200',
        };
        mockPublicService.getServerTime.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_server_time',
          arguments: args,
        });

        expect(mockPublicService.getServerTime).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getProduct via MCP tool get_public_product', async () => {
        const args = { productId: 'BTC-USD' };
        const result = { products: [] };
        mockPublicService.getProduct.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_public_product',
          arguments: args,
        });

        expect(mockPublicService.getProduct).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call listProducts via MCP tool list_public_products', async () => {
        const args = { limit: 100 };
        const result = { products: [], numProducts: 0 };
        mockPublicService.listProducts.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_public_products',
          arguments: args,
        });

        expect(mockPublicService.listProducts).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getProductBook via MCP tool get_public_product_book', async () => {
        const args = { productId: 'BTC-USD', limit: 10 };
        const result = {
          pricebook: { productId: 'BTC-USD', bids: [], asks: [], time: '' },
        };
        mockPublicService.getProductBook.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_public_product_book',
          arguments: args,
        });

        expect(mockPublicService.getProductBook).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getProductCandlesFixed via MCP tool get_public_product_candles', async () => {
        const args = {
          productId: 'BTC-USD',
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-02T00:00:00Z',
          granularity: 'ONE_HOUR',
        };
        const result = { candles: [] };
        mockPublicService.getProductCandlesFixed.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_public_product_candles',
          arguments: args,
        });

        expect(mockPublicService.getProductCandlesFixed).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call getProductMarketTrades via MCP tool get_public_market_trades', async () => {
        const args = { productId: 'BTC-USD', limit: 100 };
        const result = { trades: [] };
        mockPublicService.getProductMarketTrades.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_public_market_trades',
          arguments: args,
        });

        expect(mockPublicService.getProductMarketTrades).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });
    });

    describe('Payment Methods', () => {
      it('should call listPaymentMethods via MCP tool list_payment_methods', async () => {
        const args = {};
        const result = { paymentMethods: [] };
        mockPaymentMethodsService.listPaymentMethods.mockResolvedValueOnce(
          result,
        );

        const response = await client.callTool({
          name: 'list_payment_methods',
          arguments: args,
        });

        expect(
          mockPaymentMethodsService.listPaymentMethods,
        ).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getPaymentMethod via MCP tool get_payment_method', async () => {
        const args = { paymentMethodId: 'payment-123' };
        const result = { paymentMethods: [] };
        mockPaymentMethodsService.getPaymentMethod.mockResolvedValueOnce(
          result,
        );

        const response = await client.callTool({
          name: 'get_payment_method',
          arguments: args,
        });

        expect(mockPaymentMethodsService.getPaymentMethod).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });
    });

    describe('Futures', () => {
      it('should call listPositions via MCP tool list_futures_positions', async () => {
        const args = {};
        const result = { positions: [] };
        mockFuturesService.listPositions.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_futures_positions',
          arguments: args,
        });

        expect(mockFuturesService.listPositions).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getPosition via MCP tool get_futures_position', async () => {
        const args = { productId: 'BTC-FUTURE' };
        const result = { position: { productId: 'BTC-FUTURE' } };
        mockFuturesService.getPosition.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_futures_position',
          arguments: args,
        });

        expect(mockFuturesService.getPosition).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getBalanceSummary via MCP tool get_futures_balance_summary', async () => {
        const args = {};
        const result = { balanceSummary: {} };
        mockFuturesService.getBalanceSummary.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_futures_balance_summary',
          arguments: args,
        });

        expect(mockFuturesService.getBalanceSummary).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call listSweeps via MCP tool list_futures_sweeps', async () => {
        const args = {};
        const result = { sweeps: [] };
        mockFuturesService.listSweeps.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_futures_sweeps',
          arguments: args,
        });

        expect(mockFuturesService.listSweeps).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });
    });

    describe('Perpetuals', () => {
      it('should call listPositions via MCP tool list_perpetuals_positions', async () => {
        const args = { portfolioUuid: 'portfolio-123' };
        const result = { positions: [] };
        mockPerpetualsService.listPositions.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'list_perpetuals_positions',
          arguments: args,
        });

        expect(mockPerpetualsService.listPositions).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getPosition via MCP tool get_perpetuals_position', async () => {
        const args = { portfolioUuid: 'portfolio-123', symbol: 'BTC-PERP' };
        const result = { position: { symbol: 'BTC-PERP' } };
        mockPerpetualsService.getPosition.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_perpetuals_position',
          arguments: args,
        });

        expect(mockPerpetualsService.getPosition).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call getPortfolioSummary via MCP tool get_perpetuals_portfolio_summary', async () => {
        const args = { portfolioUuid: 'portfolio-123' };
        const result = { positions: [] };
        mockPerpetualsService.getPortfolioSummary.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_perpetuals_portfolio_summary',
          arguments: args,
        });

        expect(mockPerpetualsService.getPortfolioSummary).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });

      it('should call getPortfolioBalance via MCP tool get_perpetuals_portfolio_balance', async () => {
        const args = { portfolioUuid: 'portfolio-123' };
        const result = { positions: [] };
        mockPerpetualsService.getPortfolioBalance.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_perpetuals_portfolio_balance',
          arguments: args,
        });

        expect(mockPerpetualsService.getPortfolioBalance).toHaveBeenCalledWith(
          args,
        );
        expectResponseToContain(response, result);
      });
    });

    describe('Data', () => {
      it('should call getAPIKeyPermissions via MCP tool get_api_key_permissions', async () => {
        const args = {};
        const result = { canView: true, canTrade: true };
        mockDataService.getAPIKeyPermissions.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_api_key_permissions',
          arguments: args,
        });

        expect(mockDataService.getAPIKeyPermissions).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });
    });

    describe('Technical Indicators', () => {
      it('should call calculateRsi via MCP tool calculate_rsi', async () => {
        const args = {
          candles: [
            {
              open: '100',
              high: '102',
              low: '99',
              close: '101',
              volume: '1000',
            },
            {
              open: '101',
              high: '103',
              low: '100',
              close: '102',
              volume: '1100',
            },
          ],
          period: 14,
        };
        const result = {
          period: 14,
          values: [65.5],
          latestValue: 65.5,
        };
        mockTechnicalIndicatorsService.calculateRsi.mockReturnValueOnce(result);

        const response = await client.callTool({
          name: 'calculate_rsi',
          arguments: args,
        });

        expect(
          mockTechnicalIndicatorsService.calculateRsi,
        ).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call calculateMacd via MCP tool calculate_macd', async () => {
        const args = {
          candles: [
            {
              open: '100',
              high: '102',
              low: '99',
              close: '101',
              volume: '1000',
            },
            {
              open: '101',
              high: '103',
              low: '100',
              close: '102',
              volume: '1100',
            },
          ],
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        };
        const result = {
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          values: [{ MACD: 0.5, signal: 0.3, histogram: 0.2 }],
          latestValue: { MACD: 0.5, signal: 0.3, histogram: 0.2 },
        };
        mockTechnicalIndicatorsService.calculateMacd.mockReturnValueOnce(
          result,
        );

        const response = await client.callTool({
          name: 'calculate_macd',
          arguments: args,
        });

        expect(
          mockTechnicalIndicatorsService.calculateMacd,
        ).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call calculateEma via MCP tool calculate_ema', async () => {
        const args = {
          candles: [
            {
              open: '100',
              high: '102',
              low: '99',
              close: '101',
              volume: '1000',
            },
            {
              open: '101',
              high: '103',
              low: '100',
              close: '102',
              volume: '1100',
            },
          ],
          period: 20,
        };
        const result = {
          period: 20,
          values: [101.5],
          latestValue: 101.5,
        };
        mockTechnicalIndicatorsService.calculateEma.mockReturnValueOnce(result);

        const response = await client.callTool({
          name: 'calculate_ema',
          arguments: args,
        });

        expect(
          mockTechnicalIndicatorsService.calculateEma,
        ).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call calculateBollingerBands via MCP tool calculate_bollinger_bands', async () => {
        const args = {
          candles: [
            {
              open: '100',
              high: '102',
              low: '99',
              close: '101',
              volume: '1000',
            },
            {
              open: '101',
              high: '103',
              low: '100',
              close: '102',
              volume: '1100',
            },
          ],
          period: 20,
          stdDev: 2,
        };
        const result = {
          period: 20,
          stdDev: 2,
          values: [{ middle: 101.5, upper: 105, lower: 98, pb: 0.5 }],
          latestValue: { middle: 101.5, upper: 105, lower: 98, pb: 0.5 },
        };
        mockTechnicalIndicatorsService.calculateBollingerBands.mockReturnValueOnce(
          result,
        );

        const response = await client.callTool({
          name: 'calculate_bollinger_bands',
          arguments: args,
        });

        expect(
          mockTechnicalIndicatorsService.calculateBollingerBands,
        ).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });
    });
  });

  describe('Prompts', () => {
    it('should register assist prompt', async () => {
      const prompts = await client.listPrompts({});

      expect(prompts.prompts).toHaveLength(1);
      expect(prompts.prompts[0].name).toBe('assist');
      expect(prompts.prompts[0].description).toContain('trading on Coinbase');
    });

    it('should return trading assistant prompt content', async () => {
      const result = await client.getPrompt({
        name: 'assist',
        arguments: {},
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      const content = result.messages[0].content;
      expect(content).toBeDefined();
      expect(typeof content).toBe('object');
      expect(content).toHaveProperty('text');
      const contentStr = JSON.stringify(content);
      expect(contentStr).toContain('Coinbase Advanced Trade assistant');
      expect(contentStr).toContain('list_accounts');
      expect(contentStr).toContain('create_order');
      expect(contentStr).toContain('calculate_rsi');
    });
  });

  describe('Server Methods', () => {
    it('should return express app', () => {
      const app = coinbaseMcpServer.getExpressApp();
      expect(app).toBeDefined();
    });

    it('should start listening on specified port', () => {
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});
      const mockListen = jest.fn((_port: number, callback: () => void) => {
        callback();
        return {};
      });
      const app = coinbaseMcpServer.getExpressApp();
      // Override listen method for testing
      Object.defineProperty(app, 'listen', {
        value: mockListen,
        writable: true,
      });

      coinbaseMcpServer.listen(3000);

      expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith(
        'Coinbase MCP Server listening on port 3000',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Streamable HTTP Routes', () => {
    it('should respond with 405 for GET /mcp requests', async () => {
      const app = coinbaseMcpServer.getExpressApp();

      const response = await request(app).get('/mcp');

      expect(response.status).toBe(405);
      expect(response.body).toEqual({
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: 'Method not allowed. Use POST for MCP requests.',
        },
        id: null,
      });
    });

    it('should accept POST /mcp requests', async () => {
      const app = coinbaseMcpServer.getExpressApp();

      // Just verify the route exists and doesn't crash
      // Full integration testing would require a complete MCP request
      const response = await request(app)
        .post('/mcp')
        .send({ jsonrpc: '2.0', method: 'ping', id: 1 })
        .set('Content-Type', 'application/json');

      // Should get some kind of response (not 404)
      expect(response.status).not.toBe(404);
    });

    it('should handle errors in POST /mcp with 500 response', async () => {
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Spy on StreamableHTTPServerTransport to make it throw an error
      const spy = jest
        .spyOn(StreamableHttpModule, 'StreamableHTTPServerTransport')
        .mockImplementationOnce(() => {
          throw new Error('Transport initialization failed');
        });

      // Create a new server instance for this test after setting up the spy
      const testServer = new CoinbaseMcpServer(apiKey, privateKey);
      const app = testServer.getExpressApp();

      const response = await request(app)
        .post('/mcp')
        .send({ jsonrpc: '2.0', method: 'initialize', id: 1, params: {} })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
      expect(errorSpy).toHaveBeenCalledWith(
        'Error handling MCP request:',
        expect.any(Error),
      );

      errorSpy.mockRestore();
      spy.mockRestore();
    });
  });
});

// Helper function to validate tool response contains expected data
function expectResponseToContain(
  response: unknown,
  expectedData: unknown,
): void {
  const result = response as CallToolResult;
  // Type guard to ensure response has content
  if (!('content' in result)) {
    throw new Error('Response does not have content property');
  }
  expect(result.content).toBeDefined();
  expect(Array.isArray(result.content)).toBe(true);
  const content = result.content as unknown[];
  expect(content.length).toBeGreaterThan(0);
  const firstContent = content[0] as Record<string, unknown>;
  expect(firstContent).toHaveProperty('text');
  const textContent = String(firstContent.text);
  // Parse and compare the JSON data
  const parsedContent = JSON.parse(textContent) as unknown;
  expect(parsedContent).toEqual(expectedData);
}
