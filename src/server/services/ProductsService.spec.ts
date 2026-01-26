import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { mockResponse } from '@test/serviceMocks';
import { Granularity } from './ProductsService.types';
import type {
  GetBestBidAskResponse,
  GetProductBookResponse,
} from './ProductsService.response';
import type { Product } from './common.response';
import { ProductsService } from './ProductsService';
import { ProductType } from './FeesService.request';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new ProductsService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('pass-through methods', () => {
    it('listProducts should delegate to SDK with empty object when no request', async () => {
      const mockApiResponse = { products: [] };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listProducts();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'products',
        queryParams: {},
      });
      expect(result).toEqual({ products: [], numProducts: undefined });
    });

    it('listProducts should convert SDK response numbers', async () => {
      const mockApiResponse = {
        products: [
          {
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
            status: 'online',
            cancelOnly: false,
            limitOnly: false,
            postOnly: false,
            tradingDisabled: false,
            auctionMode: false,
            productType: ProductType.Spot,
            quoteCurrencyId: 'USD',
            baseCurrencyId: 'BTC',
            _new: false,
            baseDisplaySymbol: 'BTC',
            quoteDisplaySymbol: 'USD',
          },
        ],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listProducts({ limit: 10 });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'products',
        queryParams: { limit: 10 },
      });
      // Verify number conversion happened
      expect(result.products?.[0].price).toBe(50000);
      expect(result.products?.[0].volume24h).toBe(1000000);
    });

    it('getProduct should convert SDK response numbers', async () => {
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
        status: 'online',
        cancelOnly: false,
        limitOnly: false,
        postOnly: false,
        tradingDisabled: false,
        auctionMode: false,
        productType: ProductType.Spot,
        quoteCurrencyId: 'USD',
        baseCurrencyId: 'BTC',
        _new: false,
        baseDisplaySymbol: 'BTC',
        quoteDisplaySymbol: 'USD',
      };
      mockClient.request.mockResolvedValue(mockResponse(mockProduct));

      const result = await service.getProduct({ productId: 'BTC-USD' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'products/BTC-USD',
        queryParams: {},
      });
      // Verify number conversion happened
      expect(result.product.price).toBe(50000);
      expect(result.product.volume24h).toBe(1000000);
    });

    it('getProduct should pass getTradabilityStatus when provided', async () => {
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
        status: 'online',
        cancelOnly: false,
        limitOnly: false,
        postOnly: false,
        tradingDisabled: false,
        auctionMode: false,
        productType: ProductType.Spot,
        quoteCurrencyId: 'USD',
        baseCurrencyId: 'BTC',
        _new: false,
        baseDisplaySymbol: 'BTC',
        quoteDisplaySymbol: 'USD',
      };
      mockClient.request.mockResolvedValue(mockResponse(mockProduct));

      const result = await service.getProduct({
        productId: 'BTC-USD',
        getTradabilityStatus: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'products/BTC-USD',
        queryParams: { getTradabilityStatus: true },
      });
      // Verify number conversion happened
      expect(result.product.price).toBe(50000);
      expect(result.product.productType).toBe(ProductType.Spot);
    });

    it('getProductBook should delegate to SDK and convert response', async () => {
      const mockApiResponse = {
        pricebook: {
          productId: 'BTC-USD',
          bids: [{ price: '100', size: '1.5' }],
          asks: [{ price: '101', size: '2.0' }],
        },
        last: '100.5',
        midMarket: '100.5',
        spreadBps: '10',
        spreadAbsolute: '1',
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getProductBook({ productId: 'BTC-USD' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'product_book',
        queryParams: { productId: 'BTC-USD' },
      });
      expect(result).toStrictEqual({
        pricebook: {
          productId: 'BTC-USD',
          bids: [{ price: 100, size: 1.5 }],
          asks: [{ price: 101, size: 2.0 }],
        },
        last: 100.5,
        midMarket: 100.5,
        spreadBps: 10,
        spreadAbsolute: 1,
      });
    });

    it('getBestBidAsk should delegate to SDK with empty object when no request', async () => {
      const mockApiResponse = { pricebooks: [] };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getBestBidAsk();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'best_bid_ask',
        queryParams: {},
      });
      expect(result).toStrictEqual({ pricebooks: [] });
    });

    it('getBestBidAsk should convert SDK response to our types', async () => {
      const mockApiResponse = {
        pricebooks: [
          {
            productId: 'BTC-USD',
            bids: [{ price: '100', size: '1.5' }],
            asks: [{ price: '101', size: '2.0' }],
          },
        ],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getBestBidAsk({ productIds: ['BTC-USD'] });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'best_bid_ask',
        queryParams: { productIds: 'BTC-USD' },
      });
      // Strings should be converted to numbers
      expect(result).toStrictEqual({
        pricebooks: [
          {
            productId: 'BTC-USD',
            bids: [{ price: 100, size: 1.5 }],
            asks: [{ price: 101, size: 2.0 }],
          },
        ],
      });
    });

    it('getProductMarketTrades should delegate to SDK and convert response', async () => {
      const mockApiResponse = {
        trades: [
          { tradeId: '123', price: '100.5', size: '1.5' },
          { tradeId: '124', price: '101.0', size: '2.0' },
        ],
        bestBid: '100.0',
        bestAsk: '101.0',
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getProductMarketTrades({
        productId: 'BTC-USD',
        limit: 10,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'products/BTC-USD/ticker',
        queryParams: {
          productId: 'BTC-USD',
          limit: 10,
        },
      });
      expect(result).toStrictEqual({
        trades: [
          { tradeId: '123', price: 100.5, size: 1.5 },
          { tradeId: '124', price: 101.0, size: 2.0 },
        ],
        bestBid: 100.0,
        bestAsk: 101.0,
      });
    });

    it('getProductCandles should delegate pre-transformed request to SDK', async () => {
      const candlesData = { candles: [] };
      mockClient.request.mockResolvedValue(mockResponse(candlesData));

      // Service receives pre-transformed data from MCP layer (timestamps already Unix strings)
      const result = await service.getProductCandles({
        productId: 'BTC-USD',
        start: '1735689600',
        end: '1735776000',
        granularity: Granularity.ONE_HOUR,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'products/BTC-USD/candles',
        queryParams: {
          start: '1735689600',
          end: '1735776000',
          granularity: Granularity.ONE_HOUR,
          limit: 350,
        },
      });
      expect(result).toEqual(candlesData);
    });
  });

  describe('getMarketSnapshot', () => {
    it('returns empty snapshots when no pricebook matches', async () => {
      jest
        .spyOn(service, 'getBestBidAsk')
        .mockResolvedValue({ pricebooks: [] } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-USD',
          volume24h: 0,
          pricePercentageChange24h: 0,
        } as Product,
      });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-USD'],
      });

      expect(Object.keys(result.snapshots)).toHaveLength(0);
      expect(result.summary.assetsQueried).toBe(0);
      expect(result.summary.bestPerformer).toBeNull();
      expect(result.summary.worstPerformer).toBeNull();
    });

    it('skips products when getProduct returns wrong product', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-USD',
            bids: [],
            asks: [],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'ETH-USD', // Wrong product returned
          volume24h: 0,
          pricePercentageChange24h: 0,
        } as Product,
      });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-USD'],
      });

      // Should gracefully skip the product instead of throwing
      expect(result.snapshots).toEqual({});
      expect(result.summary.assetsQueried).toBe(0);
    });

    it('classifies elevated spreads', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-USD',
            bids: [{ price: 100, size: 1 }],
            asks: [{ price: 100.4, size: 1 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-USD',
          volume24h: 0,
          pricePercentageChange24h: 0,
        } as Product,
      });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-USD'],
      });

      const snapshot = result.snapshots['BTC-USD'];
      expect(snapshot.spreadStatus).toBe('elevated');
      expect(snapshot.spreadPercent).toBeGreaterThanOrEqual(0.3);
      expect(snapshot.spreadPercent).toBeLessThan(0.5);
    });

    it('returns aggregated market data for multiple products', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: 94500, size: 0.5 }],
            asks: [{ price: 94550, size: 0.3 }],
          },
          {
            productId: 'ETH-EUR',
            bids: [{ price: 3200, size: 1.0 }],
            asks: [{ price: 3205, size: 0.8 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest
        .spyOn(service, 'getProduct')
        .mockResolvedValueOnce({
          product: {
            productId: 'BTC-EUR',
            volume24h: 1234567.89,
            pricePercentageChange24h: 2.55,
          } as Product,
        })
        .mockResolvedValueOnce({
          product: {
            productId: 'ETH-EUR',
            volume24h: 567890.12,
            pricePercentageChange24h: -1.4,
          } as Product,
        });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR', 'ETH-EUR'],
      });

      expect(result.timestamp).toBeDefined();
      expect(result.snapshots['BTC-EUR']).toBeDefined();
      expect(result.snapshots['ETH-EUR']).toBeDefined();
      expect(result.summary.assetsQueried).toBe(2);
    });

    it('handles empty bid and ask arrays with zero fallback', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [], // Empty array triggers fallback
            asks: [], // Empty array triggers fallback
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-EUR',
          volume24h: 1000000,
          pricePercentageChange24h: 1.5,
        } as Product,
      });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
      });

      // With empty bids/asks, prices should be 0
      expect(result.snapshots['BTC-EUR'].bid).toBe(0);
      expect(result.snapshots['BTC-EUR'].ask).toBe(0);
      expect(result.snapshots['BTC-EUR'].price).toBe(0);
      expect(result.snapshots['BTC-EUR'].spread).toBe(0);
    });

    it('handles levels with undefined price values', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [
              { price: undefined, size: 0.5 }, // Undefined price treated as 0
              { price: 94500, size: 0.5 }, // Valid price
            ],
            asks: [
              { price: undefined, size: 0.3 }, // Undefined price treated as 0
              { price: 94550, size: 0.3 }, // Valid price
            ],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-EUR',
          volume24h: 1000000,
          pricePercentageChange24h: 1.5,
        } as Product,
      });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
      });

      // getMaxPrice returns max of prices (94500 > 0), getMinPrice returns min (0 < 94550)
      // Undefined prices are treated as 0
      expect(result.snapshots['BTC-EUR'].bid).toBe(94500);
      expect(result.snapshots['BTC-EUR'].ask).toBe(0); // 0 is minimum due to undefined
    });

    it('handles empty order book with includeOrderBook true', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: 94500, size: 0.5 }],
            asks: [{ price: 94550, size: 0.3 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-EUR',
          volume24h: 1000000,
          pricePercentageChange24h: 1.5,
        } as Product,
      });
      jest.spyOn(service, 'getProductBook').mockResolvedValue({
        pricebook: {
          productId: 'BTC-EUR',
          bids: [], // Empty triggers imbalance=0 branch
          asks: [], // Empty triggers imbalance=0 branch
        },
      } as GetProductBookResponse);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
        includeOrderBook: true,
      });

      // With empty order book, depths are 0 and imbalance is 0
      expect(result.snapshots['BTC-EUR'].orderBook).toBeDefined();
      expect(result.snapshots['BTC-EUR'].orderBook?.bidDepth).toBe(0);
      expect(result.snapshots['BTC-EUR'].orderBook?.askDepth).toBe(0);
      expect(result.snapshots['BTC-EUR'].orderBook?.imbalance).toBe(0);
    });

    it('handles undefined values in order book gracefully', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: 94500, size: 0.5 }],
            asks: [{ price: 94550, size: 0.3 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-EUR',
          volume24h: 1000000,
          pricePercentageChange24h: 1.5,
        } as Product,
      });
      jest.spyOn(service, 'getProductBook').mockResolvedValue({
        pricebook: {
          productId: 'BTC-EUR',
          bids: [{ price: undefined, size: undefined }], // Undefined values
          asks: [{ price: undefined, size: undefined }], // Undefined values
        },
      } as GetProductBookResponse);

      // Undefined values are treated as 0 in depth calculation
      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
        includeOrderBook: true,
      });

      expect(result.snapshots['BTC-EUR'].orderBook?.bidDepth).toBe(0);
      expect(result.snapshots['BTC-EUR'].orderBook?.askDepth).toBe(0);
    });

    it('calculates spread status correctly', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: 94500, size: 0.5 }],
            asks: [{ price: 94550, size: 0.3 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-EUR',
          volume24h: 1000000,
          pricePercentageChange24h: 1.5,
        } as Product,
      });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
      });

      expect(['tight', 'normal', 'elevated', 'wide']).toContain(
        result.snapshots['BTC-EUR'].spreadStatus,
      );
      expect(result.snapshots['BTC-EUR'].spreadPercent).toBeGreaterThanOrEqual(
        0,
      );
    });

    it('includes order book when requested', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: 94500, size: 0.5 }],
            asks: [{ price: 94550, size: 0.3 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-EUR',
          volume24h: 1000000,
          pricePercentageChange24h: 1.5,
        } as Product,
      });
      jest.spyOn(service, 'getProductBook').mockResolvedValue({
        pricebook: {
          productId: 'BTC-EUR',
          bids: [
            { price: 94500, size: 0.5 },
            { price: 94490, size: 1.2 },
            { price: undefined, size: undefined }, // Undefined values treated as 0
          ],
          asks: [
            { price: 94550, size: 0.3 },
            { price: 94560, size: 0.9 },
          ],
        },
      } as GetProductBookResponse);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
        includeOrderBook: true,
      });

      expect(result.snapshots['BTC-EUR'].orderBook).toBeDefined();
      expect(result.snapshots['BTC-EUR'].orderBook?.bids).toBeInstanceOf(Array);
      expect(result.snapshots['BTC-EUR'].orderBook?.asks).toBeInstanceOf(Array);
      expect(result.snapshots['BTC-EUR'].orderBook?.imbalance).toBeDefined();
    });

    it('does not include order book by default', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: 94500, size: 0.5 }],
            asks: [{ price: 94550, size: 0.3 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        product: {
          productId: 'BTC-EUR',
          volume24h: 1000000,
          pricePercentageChange24h: 1.5,
        } as Product,
      });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
      });

      expect(result.snapshots['BTC-EUR'].orderBook).toBeUndefined();
    });

    it('identifies best and worst performers', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: 94500, size: 0.5 }],
            asks: [{ price: 94550, size: 0.3 }],
          },
          {
            productId: 'ETH-EUR',
            bids: [{ price: 3200, size: 1.0 }],
            asks: [{ price: 3205, size: 0.8 }],
          },
          {
            productId: 'SOL-EUR',
            bids: [{ price: 185, size: 2.0 }],
            asks: [{ price: 186, size: 1.5 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest
        .spyOn(service, 'getProduct')
        .mockResolvedValueOnce({
          product: {
            productId: 'BTC-EUR',
            volume24h: 1000000,
            pricePercentageChange24h: 2.5,
          } as Product,
        })
        .mockResolvedValueOnce({
          product: {
            productId: 'ETH-EUR',
            volume24h: 500000,
            pricePercentageChange24h: -1.5,
          } as Product,
        })
        .mockResolvedValueOnce({
          product: {
            productId: 'SOL-EUR',
            volume24h: 100000,
            pricePercentageChange24h: 5.0,
          } as Product,
        });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR', 'ETH-EUR', 'SOL-EUR'],
      });

      expect(result.summary.bestPerformer).toBe('SOL-EUR');
      expect(result.summary.worstPerformer).toBe('ETH-EUR');
    });

    it('skips products with undefined change24hPercent when finding best/worst performers', async () => {
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: 100, size: 1 }],
            asks: [{ price: 100.1, size: 1 }],
          },
          {
            productId: 'ETH-EUR',
            bids: [{ price: 200, size: 1 }],
            asks: [{ price: 200.1, size: 1 }],
          },
        ],
      } as GetBestBidAskResponse);
      jest
        .spyOn(service, 'getProduct')
        .mockResolvedValueOnce({
          product: {
            productId: 'BTC-EUR',
            // Products without trading activity have undefined 24h metrics
          } as Product,
        })
        .mockResolvedValueOnce({
          product: {
            productId: 'ETH-EUR',
            volume24h: 500000,
            pricePercentageChange24h: 3.5,
          } as Product,
        });

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR', 'ETH-EUR'],
      });

      // BTC-EUR has undefined change, so ETH-EUR is both best and worst
      expect(result.summary.bestPerformer).toBe('ETH-EUR');
      expect(result.summary.worstPerformer).toBe('ETH-EUR');
    });
  });

  describe('getProductCandles', () => {
    // The MCP layer handles ISO 8601 to Unix timestamp conversion via field-level transforms.
    // The service receives pre-transformed data with Unix timestamp strings.
    it('should pass pre-transformed timestamps to API', async () => {
      const candlesData = {
        candles: [
          {
            start: '1735689600',
            low: '49000',
            high: '51000',
            open: '50000',
            close: '50500',
            volume: '1000',
          },
        ],
      };
      mockClient.request.mockResolvedValue(mockResponse(candlesData));

      const result = await service.getProductCandles({
        productId: 'BTC-USD',
        start: '1735689600',
        end: '1735776000',
        granularity: Granularity.ONE_DAY,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'products/BTC-USD/candles',
        queryParams: {
          start: '1735689600',
          end: '1735776000',
          granularity: Granularity.ONE_DAY,
          limit: 350,
        },
      });
      expect(result.candles?.[0].start).toBe(1735689600);
    });
  });

  describe('getProductCandlesBatch', () => {
    it('returns candles for multiple products', async () => {
      const mockCandles = [
        {
          start: 1704067200,
          low: 95000,
          high: 96000,
          open: 95500,
          close: 95800,
          volume: 100,
        },
        {
          start: 1704066300,
          low: 94000,
          high: 95500,
          open: 94500,
          close: 95500,
          volume: 150,
        },
      ];

      jest.spyOn(service, 'getProductCandles').mockResolvedValue({
        candles: mockCandles,
      });

      const result = await service.getProductCandlesBatch({
        productIds: ['BTC-EUR', 'ETH-EUR'],
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        granularity: Granularity.FIFTEEN_MINUTE,
      });

      expect(result.timestamp).toBeDefined();
      expect(result.granularity).toBe(Granularity.FIFTEEN_MINUTE);
      expect(result.candleCount).toBe(2 * 2); // 2 candles per product
      expect(Object.keys(result.productCandlesByProductId)).toHaveLength(2);
      expect(result.productCandlesByProductId['BTC-EUR'].candles).toHaveLength(
        2,
      );
      // Candles are converted from strings to numbers
      expect(result.productCandlesByProductId['BTC-EUR'].latest).toEqual({
        start: 1704067200,
        low: 95000,
        high: 96000,
        open: 95500,
        close: 95800,
        volume: 100,
      });
      expect(result.productCandlesByProductId['BTC-EUR'].oldest).toEqual({
        start: 1704066300,
        low: 94000,
        high: 95500,
        open: 94500,
        close: 95500,
        volume: 150,
      });
    });

    it('handles empty candle arrays', async () => {
      jest.spyOn(service, 'getProductCandles').mockResolvedValue({
        candles: [],
      } as never);

      const result = await service.getProductCandlesBatch({
        productIds: ['BTC-EUR'],
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        granularity: Granularity.ONE_HOUR,
      });

      expect(result.productCandlesByProductId['BTC-EUR'].candles).toHaveLength(
        0,
      );
      expect(result.productCandlesByProductId['BTC-EUR'].latest).toBeNull();
      expect(result.productCandlesByProductId['BTC-EUR'].oldest).toBeNull();
    });

    it('handles missing candle arrays', async () => {
      jest.spyOn(service, 'getProductCandles').mockResolvedValue({} as never);

      const result = await service.getProductCandlesBatch({
        productIds: ['BTC-EUR'],
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        granularity: Granularity.ONE_HOUR,
      });

      expect(result.productCandlesByProductId['BTC-EUR'].candles).toHaveLength(
        0,
      );
      expect(result.productCandlesByProductId['BTC-EUR'].latest).toBeNull();
      expect(result.productCandlesByProductId['BTC-EUR'].oldest).toBeNull();
    });

    it('captures per-product errors without failing the batch', async () => {
      const mockCandles = [
        {
          start: '1704067200',
          low: '95000',
          high: '96000',
          open: '95500',
          close: '95800',
          volume: '100',
        },
      ];

      jest
        .spyOn(service, 'getProductCandles')
        .mockResolvedValueOnce({ candles: mockCandles } as never)
        .mockRejectedValueOnce(new Error('Product not found'))
        .mockResolvedValueOnce({ candles: mockCandles } as never);

      const result = await service.getProductCandlesBatch({
        productIds: ['BTC-EUR', 'INVALID-PRODUCT', 'ETH-EUR'],
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        granularity: Granularity.ONE_HOUR,
      });

      // Successful products are in productCandlesByProductId
      expect(result.productCandlesByProductId['BTC-EUR']).toBeDefined();
      expect(result.productCandlesByProductId['ETH-EUR']).toBeDefined();
      expect(
        result.productCandlesByProductId['INVALID-PRODUCT'],
      ).toBeUndefined();

      // Failed product is in errors
      expect(result.errors['INVALID-PRODUCT']).toBe('Product not found');
      expect(result.errors['BTC-EUR']).toBeUndefined();
      expect(result.errors['ETH-EUR']).toBeUndefined();

      // Candle count only includes successful products
      expect(result.candleCount).toBe(2);
    });

    it('captures non-Error exceptions as string', async () => {
      jest
        .spyOn(service, 'getProductCandles')
        .mockRejectedValueOnce('String error message');

      const result = await service.getProductCandlesBatch({
        productIds: ['BTC-EUR'],
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        granularity: Granularity.ONE_HOUR,
      });

      expect(result.errors['BTC-EUR']).toBe('String error message');
      expect(Object.keys(result.productCandlesByProductId)).toHaveLength(0);
      expect(result.candleCount).toBe(0);
    });
  });
});
