import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import request from 'supertest';
import {
  CancelOrderFailureReason,
  OrderExecutionStatus,
  OrderSide,
  OrderType,
  TimeInForceType,
} from './services/OrdersService.types';
import {
  ContractExpiryType,
  ProductType,
  ProductVenue,
} from './services/FeesService.request';
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
  mockTechnicalAnalysisService,
  mockServices,
} from '@test/serviceMocks';
import { Granularity } from './services';

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
        };
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
        const result = {
          orderId: 'order-123',
          productId: 'BTC-USD',
          userId: 'user-1',
          orderConfiguration: {},
          side: OrderSide.Buy,
          clientOrderId: 'client-123',
          status: OrderExecutionStatus.Open,
          timeInForce: TimeInForceType.GoodUntilCancelled,
          createdTime: '2025-01-01T00:00:00Z',
          completionPercentage: 0,
          filledSize: 0,
          averageFilledPrice: 0,
          fee: 0,
          numberOfFills: 0,
          filledValue: 0,
          pendingCancel: false,
          sizeInQuote: false,
          totalFees: 0,
          sizeInclusiveOfFees: false,
          totalValueAfterFees: 0,
          triggerStatus: 'INVALID_ORDER_TYPE',
          orderType: OrderType.Limit,
          rejectReason: 'REJECT_REASON_UNSPECIFIED',
          settled: false,
          productType: 'SPOT',
          rejectMessage: '',
          cancelMessage: '',
          orderPlacementSource: 'RETAIL_ADVANCED',
          outstandingHoldAmount: 0,
        };
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
          side: OrderSide.Buy,
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
        const result = {
          results: [
            {
              success: true,
              failureReason:
                CancelOrderFailureReason.UnknownCancelFailureReason,
              orderId: 'order-123',
            },
          ],
        };
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
        const args = { orderId: 'order-123', price: 50000, size: 0.1 };
        const result = { success: true };
        mockOrdersService.editOrder.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'edit_order',
          arguments: args,
        });

        // Schema transforms numbers to strings before passing to service
        expect(mockOrdersService.editOrder).toHaveBeenCalledWith({
          orderId: 'order-123',
          price: '50000',
          size: '0.1',
        });
        expectResponseToContain(response, result);
      });

      it('should call editOrderPreview via MCP tool preview_edit_order', async () => {
        const args = { orderId: 'order-123', price: 50000, size: 0.1 };
        const result = {
          errors: [],
          slippage: 0.01,
        };
        mockOrdersService.editOrderPreview.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'preview_edit_order',
          arguments: args,
        });

        // Schema transforms numbers to strings before passing to service
        expect(mockOrdersService.editOrderPreview).toHaveBeenCalledWith({
          orderId: 'order-123',
          price: '50000',
          size: '0.1',
        });
        expectResponseToContain(response, result);
      });

      it('should call createOrderPreview via MCP tool preview_order', async () => {
        const args = {
          productId: 'BTC-USD',
          side: OrderSide.Buy,
          orderConfiguration: {},
        };
        const result = {
          orderTotal: 50000,
          commissionTotal: 50,
          errs: [],
          warning: [],
          quoteSize: 50000,
          baseSize: 0.01,
          bestBid: 49990,
          bestAsk: 50010,
          isMax: false,
          slippage: 0.01,
        };
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
        const result = {
          product: {
            productId: 'BTC-USD',
            price: 50000,
            pricePercentageChange24h: 2.5,
            volume24h: 1000000,
            volumePercentageChange24h: 5.0,
            baseIncrement: 0.00000001,
            quoteIncrement: 0.01,
            quoteMinSize: 1,
            quoteMaxSize: 10000000,
            baseMinSize: 0.0001,
            baseMaxSize: 10000,
            baseName: 'Bitcoin',
            quoteName: 'US Dollar',
            watched: false,
            isDisabled: false,
            status: 'online',
            cancelOnly: false,
            limitOnly: false,
            postOnly: false,
            tradingDisabled: false,
            auctionMode: false,
            productType: 'SPOT',
            quoteCurrencyId: 'USD',
            baseCurrencyId: 'BTC',
            _new: false,
            baseDisplaySymbol: 'BTC',
            quoteDisplaySymbol: 'USD',
          },
        };
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

      it('should call getProductCandles via MCP tool get_product_candles', async () => {
        const args = {
          productId: 'BTC-USD',
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-02T00:00:00Z',
          granularity: 'ONE_HOUR',
        };
        const result = { candles: [] };
        mockProductsService.getProductCandles.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_product_candles',
          arguments: args,
        });

        // Schema transforms ISO timestamps to Unix timestamps before passing to service
        expect(mockProductsService.getProductCandles).toHaveBeenCalledWith({
          productId: 'BTC-USD',
          start: '1704067200',
          end: '1704153600',
          granularity: 'ONE_HOUR',
        });
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
          errors: {},
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
          productType: ProductType.Spot,
          contractExpiryType: ContractExpiryType.UnknownContractExpiryType,
          productVenue: ProductVenue.UnknownVenueType,
        };
        const result = {
          totalVolume: 0,
          totalFees: 0,
          feeTier: {
            pricingTier: '',
            usdFrom: 0,
            usdTo: 0,
            takerFeeRate: 0,
            makerFeeRate: 0,
            aopFrom: 0,
            aopTo: 0,
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
        const result = { portfolio: { portfolioUuid: 'new-uuid' } };
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
        const result = { portfolio: { portfolioUuid: 'portfolio-123' } };
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
          funds: { value: 100, currency: 'USD' },
          sourcePortfolioUuid: 'source-123',
          targetPortfolioUuid: 'target-456',
        };
        const result = {
          sourcePortfolioUuid: 'source-123',
          targetPortfolioUuid: 'target-456',
        };
        mockPortfoliosService.movePortfolioFunds.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'move_portfolio_funds',
          arguments: args,
        });

        // Schema transforms funds.value to string before passing to service
        expect(mockPortfoliosService.movePortfolioFunds).toHaveBeenCalledWith({
          funds: { value: '100', currency: 'USD' },
          sourcePortfolioUuid: 'source-123',
          targetPortfolioUuid: 'target-456',
        });
        expectResponseToContain(response, result);
      });

      it('should call editPortfolio via MCP tool edit_portfolio', async () => {
        const args = { portfolioUuid: 'portfolio-123', name: 'Updated Name' };
        const result = { portfolio: { portfolioUuid: 'portfolio-123' } };
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
          amount: 100,
        };
        const result = {
          trade: {
            id: 'trade-123',
            userEnteredAmount: { value: 100, currency: 'USD' },
          },
        };
        mockConvertsService.createConvertQuote.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'create_convert_quote',
          arguments: args,
        });

        // Schema transforms amount to string before passing to service
        expect(mockConvertsService.createConvertQuote).toHaveBeenCalledWith({
          fromAccount: 'account-123',
          toAccount: 'account-456',
          amount: '100',
        });
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
            userEnteredAmount: { value: 100, currency: 'USD' },
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

      it('should call getConvertTrade via MCP tool get_convert_trade', async () => {
        const args = {
          tradeId: 'trade-123',
          fromAccount: 'account-123',
          toAccount: 'account-456',
        };
        const result = {
          trade: {
            id: 'trade-123',
            userEnteredAmount: { value: 100, currency: 'USD' },
          },
        };
        mockConvertsService.getConvertTrade.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_convert_trade',
          arguments: args,
        });

        expect(mockConvertsService.getConvertTrade).toHaveBeenCalledWith(args);
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
        const product = {
          productId: 'BTC-USD',
          price: 50000,
          pricePercentageChange24h: 2.5,
          volume24h: 1000000,
          volumePercentageChange24h: 5.0,
          baseIncrement: 0.00000001,
          quoteIncrement: 0.01,
          quoteMinSize: 1,
          quoteMaxSize: 10000000,
          baseMinSize: 0.0001,
          baseMaxSize: 10000,
          baseName: 'Bitcoin',
          quoteName: 'US Dollar',
          watched: false,
          isDisabled: false,
          _new: false,
          status: 'online',
          cancelOnly: false,
          limitOnly: false,
          postOnly: false,
          tradingDisabled: false,
          auctionMode: false,
          productType: 'SPOT',
          quoteCurrencyId: 'USD',
          baseCurrencyId: 'BTC',
          baseDisplaySymbol: 'BTC',
          quoteDisplaySymbol: 'USD',
        };
        const result = { product };
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

      it('should call getProductCandles via MCP tool get_public_product_candles', async () => {
        const args = {
          productId: 'BTC-USD',
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-02T00:00:00Z',
          granularity: 'ONE_HOUR',
        };
        const result = { candles: [] };
        mockPublicService.getProductCandles.mockResolvedValueOnce(result);

        const response = await client.callTool({
          name: 'get_public_product_candles',
          arguments: args,
        });

        // Schema transforms ISO timestamps to Unix timestamps before passing to service
        expect(mockPublicService.getProductCandles).toHaveBeenCalledWith({
          productId: 'BTC-USD',
          start: '1704067200',
          end: '1704153600',
          granularity: 'ONE_HOUR',
        });
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
        const result = {
          paymentMethod: {
            id: 'payment-123',
            type: 'BANK_ACCOUNT',
            name: 'Test Bank',
          },
        };
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
        const result = { portfolios: [] };
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
        const result = { portfolioBalances: [] };
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
              open: 100,
              high: 102,
              low: 99,
              close: 101,
              volume: 1000,
            },
            {
              open: 101,
              high: 103,
              low: 100,
              close: 102,
              volume: 1100,
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
              open: 100,
              high: 102,
              low: 99,
              close: 101,
              volume: 1000,
            },
            {
              open: 101,
              high: 103,
              low: 100,
              close: 102,
              volume: 1100,
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
              open: 100,
              high: 102,
              low: 99,
              close: 101,
              volume: 1000,
            },
            {
              open: 101,
              high: 103,
              low: 100,
              close: 102,
              volume: 1100,
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

      it('should call calculateSma via MCP tool calculate_sma', async () => {
        const args = {
          candles: [
            {
              open: 100,
              high: 102,
              low: 99,
              close: 101,
              volume: 1000,
            },
            {
              open: 101,
              high: 103,
              low: 100,
              close: 102,
              volume: 1100,
            },
          ],
          period: 20,
        };
        const result = {
          period: 20,
          values: [101.5],
          latestValue: 101.5,
        };
        mockTechnicalIndicatorsService.calculateSma.mockReturnValueOnce(result);

        const response = await client.callTool({
          name: 'calculate_sma',
          arguments: args,
        });

        expect(
          mockTechnicalIndicatorsService.calculateSma,
        ).toHaveBeenCalledWith(args);
        expectResponseToContain(response, result);
      });

      it('should call calculateBollingerBands via MCP tool calculate_bollinger_bands', async () => {
        const args = {
          candles: [
            {
              open: 100,
              high: 102,
              low: 99,
              close: 101,
              volume: 1000,
            },
            {
              open: 101,
              high: 103,
              low: 100,
              close: 102,
              volume: 1100,
            },
          ],
          period: 20,
          stdDev: 2,
        };
        const result = {
          period: 20,
          stdDev: 2,
          values: [
            { middle: 101.5, upper: 105, lower: 98, pb: 0.5, bandwidth: 0.069 },
          ],
          latestValue: {
            middle: 101.5,
            upper: 105,
            lower: 98,
            pb: 0.5,
            bandwidth: 0.069,
          },
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

      describe('calculate_atr', () => {
        it('should call calculateAtr via MCP tool calculate_atr', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 110,
                low: 95,
                close: 105,
                volume: 1000,
              },
              {
                open: 105,
                high: 115,
                low: 100,
                close: 110,
                volume: 1100,
              },
            ],
            period: 14,
          };
          const result = {
            period: 14,
            values: [10.5],
            latestValue: 10.5,
          };
          mockTechnicalIndicatorsService.calculateAtr.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_atr',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateAtr,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_stochastic', () => {
        it('should call calculateStochastic via MCP tool calculate_stochastic', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 110,
                low: 95,
                close: 105,
                volume: 1000,
              },
              {
                open: 105,
                high: 115,
                low: 100,
                close: 110,
                volume: 1100,
              },
            ],
            kPeriod: 14,
            dPeriod: 3,
          };
          const result = {
            kPeriod: 14,
            dPeriod: 3,
            values: [{ k: 75, d: 70 }],
            latestValue: { k: 75, d: 70 },
          };
          mockTechnicalIndicatorsService.calculateStochastic.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_stochastic',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateStochastic,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_adx', () => {
        it('should call calculateAdx via MCP tool calculate_adx', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 110,
                low: 95,
                close: 105,
                volume: 1000,
              },
              {
                open: 105,
                high: 115,
                low: 100,
                close: 110,
                volume: 1100,
              },
            ],
            period: 14,
          };
          const result = {
            period: 14,
            values: [{ adx: 25, pdi: 30, mdi: 20 }],
            latestValue: { adx: 25, pdi: 30, mdi: 20 },
          };
          mockTechnicalIndicatorsService.calculateAdx.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_adx',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateAdx,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_obv', () => {
        it('should call calculateObv via MCP tool calculate_obv', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 101,
                low: 99,
                close: 100,
                volume: 1000,
              },
              {
                open: 100,
                high: 102,
                low: 99,
                close: 101,
                volume: 1100,
              },
            ],
          };
          const result = {
            values: [1000, 2100],
            latestValue: 2100,
          };
          mockTechnicalIndicatorsService.calculateObv.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_obv',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateObv,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_vwap', () => {
        it('should call calculateVwap via MCP tool calculate_vwap', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 102,
                low: 98,
                close: 100,
                volume: 1000,
              },
              {
                open: 100,
                high: 103,
                low: 99,
                close: 101,
                volume: 1100,
              },
            ],
          };
          const result = {
            values: [100, 100.52],
            latestValue: 100.52,
          };
          mockTechnicalIndicatorsService.calculateVwap.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_vwap',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateVwap,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_cci', () => {
        it('should call calculateCci via MCP tool calculate_cci', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 110,
                low: 95,
                close: 105,
                volume: 1000,
              },
              {
                open: 105,
                high: 115,
                low: 100,
                close: 110,
                volume: 1100,
              },
            ],
            period: 20,
          };
          const result = {
            period: 20,
            values: [66.67],
            latestValue: 66.67,
          };
          mockTechnicalIndicatorsService.calculateCci.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_cci',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateCci,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_williams_r', () => {
        it('should call calculateWilliamsR via MCP tool calculate_williams_r', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 110,
                low: 95,
                close: 105,
                volume: 1000,
              },
              {
                open: 105,
                high: 115,
                low: 100,
                close: 110,
                volume: 1100,
              },
            ],
            period: 14,
          };
          const result = {
            period: 14,
            values: [-20],
            latestValue: -20,
          };
          mockTechnicalIndicatorsService.calculateWilliamsR.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_williams_r',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateWilliamsR,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_roc', () => {
        it('should call calculateRoc via MCP tool calculate_roc', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 110,
                low: 95,
                close: 105,
                volume: 1000,
              },
              {
                open: 105,
                high: 115,
                low: 100,
                close: 110,
                volume: 1100,
              },
            ],
            period: 12,
          };
          const result = {
            period: 12,
            values: [4.76],
            latestValue: 4.76,
          };
          mockTechnicalIndicatorsService.calculateRoc.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_roc',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateRoc,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_mfi', () => {
        it('should call calculateMfi via MCP tool calculate_mfi', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 110,
                low: 95,
                close: 105,
                volume: 1000,
              },
              {
                open: 105,
                high: 115,
                low: 100,
                close: 110,
                volume: 1100,
              },
            ],
            period: 14,
          };
          const result = {
            period: 14,
            values: [55.5],
            latestValue: 55.5,
          };
          mockTechnicalIndicatorsService.calculateMfi.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_mfi',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateMfi,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_psar', () => {
        it('should call calculatePsar via MCP tool calculate_psar', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 110,
                low: 95,
                close: 105,
                volume: 1000,
              },
              {
                open: 105,
                high: 115,
                low: 100,
                close: 110,
                volume: 1100,
              },
            ],
            step: 0.02,
            max: 0.2,
          };
          const result = {
            step: 0.02,
            max: 0.2,
            values: [94.5],
            latestValue: 94.5,
          };
          mockTechnicalIndicatorsService.calculatePsar.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_psar',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculatePsar,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_ichimoku_cloud', () => {
        it('should call calculateIchimokuCloud via MCP tool calculate_ichimoku_cloud', async () => {
          const candles = Array.from({ length: 52 }, (_, i) => ({
            open: 100 + i,
            high: 105 + i,
            low: 95 + i,
            close: 102 + i,
            volume: 1000 + i * 10,
          }));
          const args = {
            candles,
            conversionPeriod: 9,
            basePeriod: 26,
            spanPeriod: 52,
            displacement: 26,
          };
          const result = {
            conversionPeriod: 9,
            basePeriod: 26,
            spanPeriod: 52,
            displacement: 26,
            values: [
              {
                conversion: 120,
                base: 115,
                spanA: 117.5,
                spanB: 110,
                chikou: 102,
              },
            ],
            latestValue: {
              conversion: 120,
              base: 115,
              spanA: 117.5,
              spanB: 110,
              chikou: 102,
            },
          };
          mockTechnicalIndicatorsService.calculateIchimokuCloud.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_ichimoku_cloud',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateIchimokuCloud,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_keltner_channels', () => {
        it('should call calculateKeltnerChannels via MCP tool calculate_keltner_channels', async () => {
          const candles = Array.from({ length: 30 }, (_, i) => ({
            open: 100 + i,
            high: 105 + i,
            low: 95 + i,
            close: 102 + i,
            volume: 1000 + i * 10,
          }));
          const args = {
            candles,
            maPeriod: 20,
            atrPeriod: 10,
            multiplier: 2,
            useSMA: false,
          };
          const result = {
            maPeriod: 20,
            atrPeriod: 10,
            multiplier: 2,
            useSMA: false,
            values: [{ middle: 115, upper: 125, lower: 105 }],
            latestValue: { middle: 115, upper: 125, lower: 105 },
          };
          mockTechnicalIndicatorsService.calculateKeltnerChannels.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_keltner_channels',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateKeltnerChannels,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('calculate_fibonacci_retracement', () => {
        it('should call calculateFibonacciRetracement via MCP tool calculate_fibonacci_retracement', async () => {
          const args = {
            start: 100,
            end: 200,
          };
          const result = {
            start: 100,
            end: 200,
            trend: 'uptrend' as const,
            levels: [
              { level: 0, price: 100 },
              { level: 38.2, price: 138.2 },
              { level: 50, price: 150 },
              { level: 61.8, price: 161.8 },
              { level: 100, price: 200 },
            ],
          };
          mockTechnicalIndicatorsService.calculateFibonacciRetracement.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'calculate_fibonacci_retracement',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.calculateFibonacciRetracement,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('detect_swing_points', () => {
        it('should call detectSwingPoints via MCP tool detect_swing_points', async () => {
          const args = {
            candles: [
              {
                open: 100,
                high: 105,
                low: 95,
                close: 102,
                volume: 1000,
              },
              {
                open: 102,
                high: 108,
                low: 100,
                close: 105,
                volume: 1100,
              },
              {
                open: 105,
                high: 112,
                low: 103,
                close: 110,
                volume: 1200,
              },
              {
                open: 110,
                high: 115,
                low: 108,
                close: 107,
                volume: 1300,
              },
              {
                open: 107,
                high: 110,
                low: 104,
                close: 105,
                volume: 1400,
              },
            ],
            lookback: 2,
          };
          const result = {
            swingHighs: [{ index: 2, price: 112, type: 'high' as const }],
            swingLows: [],
            latestSwingHigh: { index: 2, price: 112, type: 'high' as const },
            latestSwingLow: null,
            trend: 'sideways' as const,
          };
          mockTechnicalIndicatorsService.detectSwingPoints.mockReturnValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'detect_swing_points',
            arguments: args,
          });

          expect(
            mockTechnicalIndicatorsService.detectSwingPoints,
          ).toHaveBeenCalledWith(args);
          expectResponseToContain(response, result);
        });
      });

      describe('analyze_technical_indicators', () => {
        it('should call analyzeTechnicalIndicators via MCP tool analyze_technical_indicators', async () => {
          const args = {
            productId: 'BTC-USD',
            granularity: 'ONE_HOUR',
            candleCount: 100,
            indicators: ['rsi', 'macd'],
          };
          const result = {
            productId: 'BTC-USD',
            granularity: 'ONE_HOUR',
            candleCount: 100,
            timestamp: '2024-01-15T12:00:00Z',
            price: {
              current: 105,
              open: 100,
              high: 110,
              low: 95,
              change24h: 5,
            },
            indicators: {
              momentum: {
                rsi: {
                  value: 55,
                  signal: 'neutral',
                },
                macd: {
                  macd: 1.5,
                  signal: 1.2,
                  histogram: 0.3,
                  crossover: 'bullish',
                },
              },
            },
            signal: {
              score: 25,
              direction: 'BUY' as const,
              confidence: 'MEDIUM' as const,
            },
          };
          mockTechnicalAnalysisService.analyzeTechnicalIndicators.mockResolvedValueOnce(
            result,
          );

          const response = await client.callTool({
            name: 'analyze_technical_indicators',
            arguments: args,
          });

          expect(
            mockTechnicalAnalysisService.analyzeTechnicalIndicators,
          ).toHaveBeenCalledWith({
            productId: 'BTC-USD',
            granularity: 'ONE_HOUR',
            candleCount: 100,
            indicators: ['rsi', 'macd'],
          });
          expectResponseToContain(response, result);
        });
      });
    });

    describe('Error Handling', () => {
      it('should throw error for unknown tool', async () => {
        expect(
          await client.callTool({
            name: 'unknown_tool',
            arguments: {},
          }),
        ).toEqual({
          content: [
            {
              text: 'MCP error -32602: Tool unknown_tool not found',
              type: 'text',
            },
          ],
          isError: true,
        });
      });

      it('should handle tool method errors gracefully', async () => {
        const args = { productId: 'BTC-USD' };
        mockPublicService.getProduct.mockRejectedValueOnce(
          new Error('API error'),
        );

        const response = await client.callTool({
          name: 'get_public_product',
          arguments: args,
        });

        expect(mockPublicService.getProduct).toHaveBeenCalledWith(args);
        expect(response).toEqual({
          content: [
            {
              text: 'API error',
              type: 'text',
            },
          ],
          isError: true,
        });
      });

      it('should handle tool method (non-Error) errors gracefully', async () => {
        const args = { productId: 'BTC-USD' };
        mockPublicService.getProduct.mockRejectedValueOnce(
          'Unexpected error format',
        );

        const response = await client.callTool({
          name: 'get_public_product',
          arguments: args,
        });

        expect(mockPublicService.getProduct).toHaveBeenCalledWith(args);
        expect(response).toEqual({
          content: [
            {
              text: 'Unexpected error format',
              type: 'text',
            },
          ],
          isError: true,
        });
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
      const mockServer = { on: jest.fn() };
      const mockListen = jest.fn((_port: number, callback: () => void) => {
        callback();
        return mockServer;
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
      expect(mockServer.on).toHaveBeenCalledWith('error', expect.any(Function));

      consoleSpy.mockRestore();
    });

    it('should handle EADDRINUSE error with helpful message', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const mockServer = { on: jest.fn() };
      const mockListen = jest.fn(() => mockServer);
      const app = coinbaseMcpServer.getExpressApp();
      Object.defineProperty(app, 'listen', {
        value: mockListen,
        writable: true,
      });

      coinbaseMcpServer.listen(3000);

      const errorHandler = mockServer.on.mock.calls.find(
        (call) => call[0] === 'error',
      )?.[1] as (error: NodeJS.ErrnoException) => void;
      const error: NodeJS.ErrnoException = new Error('address in use');
      error.code = 'EADDRINUSE';
      errorHandler(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: Port 3000 is already in use',
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Try a different port with: PORT=<port> npm start',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle other server errors', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const mockServer = { on: jest.fn() };
      const mockListen = jest.fn(() => mockServer);
      const app = coinbaseMcpServer.getExpressApp();
      Object.defineProperty(app, 'listen', {
        value: mockListen,
        writable: true,
      });

      coinbaseMcpServer.listen(3000);

      const errorHandler = mockServer.on.mock.calls.find(
        (call) => call[0] === 'error',
      )?.[1] as (error: NodeJS.ErrnoException) => void;
      const error: NodeJS.ErrnoException = new Error('permission denied');
      error.code = 'EACCES';
      errorHandler(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error starting server: permission denied',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
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
