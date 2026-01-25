import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { mockResponse } from '@test/serviceMocks';
import { Granularity } from './ProductsService.types';
import { OrderSide } from './OrdersService.types';
import { PublicService } from './PublicService';

describe('PublicService', () => {
  let service: PublicService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new PublicService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('getServerTime', () => {
    it('should delegate to SDK with empty object', async () => {
      const responseData = {
        iso: '2025-01-01T00:00:00Z',
        epochSeconds: '1735689600',
      };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      const result = await service.getServerTime();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'time',
        queryParams: {},
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('getProduct', () => {
    it('should convert SDK response to our types', async () => {
      const mockProduct = {
        productId: 'BTC-USD',
        price: '50000',
        pricePercentageChange24h: '2.5',
        volume24h: '1000000',
        volumePercentageChange24h: '5.0',
        baseIncrement: '0.00000001',
        quoteIncrement: '0.01',
        quoteMinSize: '1',
        quoteMaxSize: '10000000',
        baseMinSize: '0.0001',
        baseMaxSize: '10000',
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
        midMarketPrice: '50001',
        priceIncrement: '0.01',
        approximateQuote24hVolume: '50000000000',
      };
      mockClient.request.mockResolvedValue(mockResponse(mockProduct));

      const result = await service.getProduct({ productId: 'BTC-USD' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'market/products/BTC-USD',
        queryParams: {},
      });
      expect(result.productId).toBe('BTC-USD');
      expect(result.price).toBe(50000);
      expect(result.pricePercentageChange24h).toBe(2.5);
      expect(result.volume24h).toBe(1000000);
      expect(result.volumePercentageChange24h).toBe(5.0);
      expect(result.baseIncrement).toBe(0.00000001);
      expect(result.quoteIncrement).toBe(0.01);
      expect(result.midMarketPrice).toBe(50001);
    });
  });

  describe('listProducts', () => {
    it('should convert SDK response to our types', async () => {
      const mockProduct = {
        productId: 'ETH-USD',
        price: '3000',
        pricePercentageChange24h: '1.5',
        volume24h: '500000',
        volumePercentageChange24h: '3.0',
        baseIncrement: '0.0001',
        quoteIncrement: '0.01',
        quoteMinSize: '1',
        quoteMaxSize: '5000000',
        baseMinSize: '0.001',
        baseMaxSize: '5000',
        baseName: 'Ethereum',
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
        baseCurrencyId: 'ETH',
        baseDisplaySymbol: 'ETH',
        quoteDisplaySymbol: 'USD',
      };
      mockClient.request.mockResolvedValue(
        mockResponse({
          products: [mockProduct],
          numProducts: 1,
        }),
      );

      const result = await service.listProducts({ limit: 10 });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'market/products',
        queryParams: { limit: 10 },
      });
      expect(result.products).toHaveLength(1);
      expect(result.products?.[0].productId).toBe('ETH-USD');
      expect(result.products?.[0].price).toBe(3000);
      expect(result.numProducts).toBe(1);
    });

    it('should handle empty request', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ products: [] }));

      const result = await service.listProducts();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'market/products',
        queryParams: {},
      });
      expect(result.products).toEqual([]);
    });
  });

  describe('getProductBook', () => {
    it('should convert SDK response to our types', async () => {
      const mockBookResponse = {
        pricebook: {
          productId: 'BTC-USD',
          bids: [
            { price: '49999', size: '1.5' },
            { price: '49998', size: '2.0' },
          ],
          asks: [
            { price: '50001', size: '1.0' },
            { price: '50002', size: '1.5' },
          ],
          time: '2025-01-01T00:00:00Z',
        },
        last: '50000',
        midMarket: '50000',
        spreadBps: '4',
        spreadAbsolute: '2',
      };
      mockClient.request.mockResolvedValue(mockResponse(mockBookResponse));

      const result = await service.getProductBook({ productId: 'BTC-USD' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'market/product_book',
        queryParams: { productId: 'BTC-USD' },
      });
      expect(result.pricebook.productId).toBe('BTC-USD');
      expect(result.pricebook.bids).toHaveLength(2);
      expect(result.pricebook.bids[0].price).toBe(49999);
      expect(result.pricebook.bids[0].size).toBe(1.5);
      expect(result.pricebook.asks[0].price).toBe(50001);
      expect(result.pricebook.asks[0].size).toBe(1.0);
      expect(result.last).toBe(50000);
      expect(result.midMarket).toBe(50000);
      expect(result.spreadBps).toBe(4);
      expect(result.spreadAbsolute).toBe(2);
    });
  });

  describe('getProductMarketTrades', () => {
    it('should convert SDK response to our types', async () => {
      const mockTradesResponse = {
        trades: [
          {
            tradeId: 'trade-1',
            productId: 'BTC-USD',
            price: '50000',
            size: '0.5',
            time: '2025-01-01T00:00:00Z',
            side: OrderSide.Buy,
            exchange: 'CBE',
          },
          {
            tradeId: 'trade-2',
            productId: 'BTC-USD',
            price: '49999',
            size: '0.3',
            time: '2025-01-01T00:00:01Z',
            side: OrderSide.Sell,
          },
        ],
        bestBid: '49998',
        bestAsk: '50001',
      };
      mockClient.request.mockResolvedValue(mockResponse(mockTradesResponse));

      const result = await service.getProductMarketTrades({
        productId: 'BTC-USD',
        limit: 10,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'market/products/BTC-USD/ticker',
        queryParams: { productId: 'BTC-USD', limit: 10 },
      });
      expect(result.trades).toHaveLength(2);
      expect(result.trades?.[0].tradeId).toBe('trade-1');
      expect(result.trades?.[0].price).toBe(50000);
      expect(result.trades?.[0].size).toBe(0.5);
      expect(result.trades?.[0].side).toBe(OrderSide.Buy);
      expect(result.trades?.[1].price).toBe(49999);
      expect(result.trades?.[1].size).toBe(0.3);
      expect(result.bestBid).toBe(49998);
      expect(result.bestAsk).toBe(50001);
    });

    it('should handle undefined trades', async () => {
      mockClient.request.mockResolvedValue(mockResponse({}));

      const result = await service.getProductMarketTrades({
        productId: 'BTC-USD',
        limit: 10,
      });

      expect(result.trades).toBeUndefined();
      expect(result.bestBid).toBeUndefined();
      expect(result.bestAsk).toBeUndefined();
    });
  });

  describe('getProductCandles', () => {
    it('should pass pre-transformed request and convert SDK response', async () => {
      const mockCandles = [
        {
          start: '1735689600',
          low: '49500',
          high: '50500',
          open: '50000',
          close: '50250',
          volume: '1000',
        },
        {
          start: '1735693200',
          low: '50000',
          high: '51000',
          open: '50250',
          close: '50750',
          volume: '1500',
        },
      ];
      mockClient.request.mockResolvedValue(
        mockResponse({
          candles: mockCandles,
        }),
      );

      // Service receives pre-transformed data from MCP layer (timestamps already Unix strings)
      const result = await service.getProductCandles({
        productId: 'BTC-USD',
        start: '1735689600',
        end: '1735776000',
        granularity: Granularity.ONE_HOUR,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'market/products/BTC-USD/candles',
        queryParams: {
          productId: 'BTC-USD',
          start: '1735689600',
          end: '1735776000',
          granularity: Granularity.ONE_HOUR,
        },
      });
      expect(result.candles).toHaveLength(2);
      expect(result.candles?.[0].start).toBe(1735689600);
      expect(result.candles?.[0].low).toBe(49500);
      expect(result.candles?.[0].high).toBe(50500);
      expect(result.candles?.[0].open).toBe(50000);
      expect(result.candles?.[0].close).toBe(50250);
      expect(result.candles?.[0].volume).toBe(1000);
      expect(result.candles?.[1].start).toBe(1735693200);
    });

    it('should handle undefined candles', async () => {
      mockClient.request.mockResolvedValue(mockResponse({}));

      const result = await service.getProductCandles({
        productId: 'BTC-USD',
        start: '1735689600',
        end: '1735776000',
        granularity: Granularity.ONE_HOUR,
      });

      expect(result.candles).toBeUndefined();
    });
  });
});
