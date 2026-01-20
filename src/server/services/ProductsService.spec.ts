import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType';
import { createSdkProductsServiceMock } from '@test/serviceMocks';
import { Granularity } from './ProductsService.types';

const mockSdkService = createSdkProductsServiceMock();

jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  ProductsService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// Import after mock is set up
import type { GetBestBidAskResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetBestBidAskResponse';
import type { GetProductBookResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetProductBookResponse';
import type { Product as SdkProduct } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';
import type { Product } from './ProductsService.types';
import { toProduct, toListProductsResponse } from './ProductsService.convert';
import { ProductsService } from './ProductsService';

const createService = (): ProductsService => new ProductsService({} as never);

describe('ProductsService', () => {
  describe('pass-through methods', () => {
    let service: ProductsService;

    beforeEach(() => {
      jest.clearAllMocks();
      service = createService();
    });

    it('listProducts should delegate to SDK with empty object when no request', async () => {
      const mockSdkResponse = { products: [] };
      mockSdkService.listProducts.mockResolvedValue(mockSdkResponse);

      const result = await service.listProducts();

      expect(mockSdkService.listProducts).toHaveBeenCalledWith({});
      expect(result).toEqual(toListProductsResponse(mockSdkResponse));
    });

    it('listProducts should convert SDK response numbers', async () => {
      const mockSdkResponse = {
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
          } as SdkProduct,
        ],
      };
      mockSdkService.listProducts.mockResolvedValue(mockSdkResponse);

      const result = await service.listProducts({ limit: 10 });

      expect(mockSdkService.listProducts).toHaveBeenCalledWith({ limit: 10 });
      expect(result).toEqual(toListProductsResponse(mockSdkResponse));
    });

    it('getProduct should convert SDK response numbers', async () => {
      const mockSdkProduct: SdkProduct = {
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
      // SDK types incorrectly declare GetProductResponse as { body?: Product }
      // but SDK actually returns Product directly (SDK bug)
      mockSdkService.getProduct.mockResolvedValue(
        mockSdkProduct as unknown as Awaited<
          ReturnType<typeof mockSdkService.getProduct>
        >,
      );

      const result = await service.getProduct({ productId: 'BTC-USD' });

      expect(mockSdkService.getProduct).toHaveBeenCalledWith({
        productId: 'BTC-USD',
      });
      expect(result).toEqual(toProduct(mockSdkProduct));
    });

    it('getProductBook should delegate to SDK', async () => {
      const mockResponse = {
        pricebook: { productId: 'BTC-USD', bids: [], asks: [] },
      };
      mockSdkService.getProductBook.mockResolvedValue(mockResponse);

      const result = await service.getProductBook({ productId: 'BTC-USD' });

      expect(mockSdkService.getProductBook).toHaveBeenCalledWith({
        productId: 'BTC-USD',
      });
      expect(result).toBe(mockResponse);
    });

    it('getBestBidAsk should delegate to SDK with empty object when no request', async () => {
      const mockResponse = { pricebooks: [] };
      mockSdkService.getBestBidAsk.mockResolvedValue(mockResponse);

      const result = await service.getBestBidAsk();

      expect(mockSdkService.getBestBidAsk).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });

    it('getBestBidAsk should delegate to SDK with request when provided', async () => {
      const mockResponse = {
        pricebooks: [{ productId: 'BTC-USD', bids: [], asks: [] }],
      };
      mockSdkService.getBestBidAsk.mockResolvedValue(mockResponse);

      const result = await service.getBestBidAsk({ productIds: ['BTC-USD'] });

      expect(mockSdkService.getBestBidAsk).toHaveBeenCalledWith({
        productIds: ['BTC-USD'],
      });
      expect(result).toBe(mockResponse);
    });

    it('getProductMarketTrades should delegate to SDK', async () => {
      const mockResponse = { trades: [] };
      mockSdkService.getProductMarketTrades.mockResolvedValue(mockResponse);

      const result = await service.getProductMarketTrades({
        productId: 'BTC-USD',
        limit: 10,
      });

      expect(mockSdkService.getProductMarketTrades).toHaveBeenCalledWith({
        productId: 'BTC-USD',
        limit: 10,
      });
      expect(result).toBe(mockResponse);
    });

    it('getProductCandles should convert timestamps and delegate to SDK', async () => {
      const mockResponse = { candles: [] };
      mockSdkService.getProductCandles.mockResolvedValue(mockResponse);

      const result = await service.getProductCandles({
        productId: 'BTC-USD',
        start: '2025-01-01T00:00:00Z',
        end: '2025-01-02T00:00:00Z',
        granularity: Granularity.ONE_HOUR,
      });

      expect(mockSdkService.getProductCandles).toHaveBeenCalledWith({
        productId: 'BTC-USD',
        start: '1735689600',
        end: '1735776000',
        granularity: Granularity.ONE_HOUR,
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getMarketSnapshot', () => {
    it('returns empty snapshots when no pricebook matches', async () => {
      const service = createService();
      jest
        .spyOn(service, 'getBestBidAsk')
        .mockResolvedValue({ pricebooks: [] } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        productId: 'BTC-USD',
        volume24h: 0,
        pricePercentageChange24h: 0,
      } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-USD'],
      });

      expect(Object.keys(result.snapshots)).toHaveLength(0);
      expect(result.summary.assetsQueried).toBe(0);
      expect(result.summary.bestPerformer).toBeNull();
      expect(result.summary.worstPerformer).toBeNull();
    });

    it('skips products when getProduct returns wrong product', async () => {
      const service = createService();
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
        productId: 'ETH-USD', // Wrong product returned
        volume24h: 0,
        pricePercentageChange24h: 0,
      } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-USD'],
      });

      // Should gracefully skip the product instead of throwing
      expect(result.snapshots).toEqual({});
      expect(result.summary.assetsQueried).toBe(0);
    });

    it('classifies elevated spreads', async () => {
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-USD',
            bids: [{ price: '100', size: '1' }],
            asks: [{ price: '100.4', size: '1' }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        productId: 'BTC-USD',
        volume24h: 0,
        pricePercentageChange24h: 0,
      } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-USD'],
      });

      const snapshot = result.snapshots['BTC-USD'];
      expect(snapshot.spreadStatus).toBe('elevated');
      expect(snapshot.spreadPercent).toBeGreaterThanOrEqual(0.3);
      expect(snapshot.spreadPercent).toBeLessThan(0.5);
    });

    it('returns aggregated market data for multiple products', async () => {
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: '94500', size: '0.5' }],
            asks: [{ price: '94550', size: '0.3' }],
          },
          {
            productId: 'ETH-EUR',
            bids: [{ price: '3200', size: '1.0' }],
            asks: [{ price: '3205', size: '0.8' }],
          },
        ],
      } as GetBestBidAskResponse);
      jest
        .spyOn(service, 'getProduct')
        .mockResolvedValueOnce({
          productId: 'BTC-EUR',
          volume24h: 1234567.89,
          pricePercentageChange24h: 2.55,
        } as Product)
        .mockResolvedValueOnce({
          productId: 'ETH-EUR',
          volume24h: 567890.12,
          pricePercentageChange24h: -1.4,
        } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR', 'ETH-EUR'],
      });

      expect(result.timestamp).toBeDefined();
      expect(result.snapshots['BTC-EUR']).toBeDefined();
      expect(result.snapshots['ETH-EUR']).toBeDefined();
      expect(result.summary.assetsQueried).toBe(2);
    });

    it('handles empty bid and ask arrays with zero fallback', async () => {
      const service = createService();
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
        productId: 'BTC-EUR',
        volume24h: 1000000,
        pricePercentageChange24h: 1.5,
      } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
      });

      // With empty bids/asks, prices should be 0
      expect(result.snapshots['BTC-EUR'].bid).toBe(0);
      expect(result.snapshots['BTC-EUR'].ask).toBe(0);
      expect(result.snapshots['BTC-EUR'].price).toBe(0);
      expect(result.snapshots['BTC-EUR'].spread).toBe(0);
    });

    it('handles levels with non-string price values', async () => {
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [
              { price: undefined, size: '0.5' }, // Non-string price triggers continue
              { price: 'invalid', size: '0.5' }, // Invalid string triggers parseNumber NaN branch (returns 0)
              { price: '94500', size: '0.5' }, // Valid price
            ],
            asks: [
              { price: undefined, size: '0.3' }, // Non-string price triggers continue
              { price: 'NaN', size: '0.3' }, // Invalid string triggers parseNumber NaN branch (returns 0)
              { price: '94550', size: '0.3' }, // Valid price
            ],
          },
        ],
      } as unknown as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: 1000000,
        pricePercentageChange24h: 1.5,
      } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
      });

      // getMaxPrice returns max of valid prices (94500 > 0), getMinPrice returns min (0 < 94550)
      // Invalid strings are parsed to 0 by parseNumber
      expect(result.snapshots['BTC-EUR'].bid).toBe(94500);
      expect(result.snapshots['BTC-EUR'].ask).toBe(0); // 0 is minimum due to invalid 'NaN' string
    });

    it('handles empty order book with includeOrderBook true', async () => {
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: '94500', size: '0.5' }],
            asks: [{ price: '94550', size: '0.3' }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: 1000000,
        pricePercentageChange24h: 1.5,
      } as Product);
      jest.spyOn(service, 'getProductBook').mockResolvedValue({
        pricebook: {
          productId: 'BTC-EUR',
          bids: [], // Empty triggers imbalance=0 branch
          asks: [], // Empty triggers imbalance=0 branch
        },
      } as unknown as GetProductBookResponse);

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

    it('throws error for invalid number strings in order book', async () => {
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: '94500', size: '0.5' }],
            asks: [{ price: '94550', size: '0.3' }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: 1000000,
        pricePercentageChange24h: 1.5,
      } as Product);
      jest.spyOn(service, 'getProductBook').mockResolvedValue({
        pricebook: {
          productId: 'BTC-EUR',
          bids: [{ price: 'invalid', size: 'NaN' }], // Invalid number strings
          asks: [{ price: 'Infinity', size: '-Infinity' }], // Invalid number strings
        },
      } as unknown as GetProductBookResponse);

      // toL2Levels uses toNumber which throws for invalid strings
      await expect(
        service.getMarketSnapshot({
          productIds: ['BTC-EUR'],
          includeOrderBook: true,
        }),
      ).rejects.toThrow('Invalid number: "invalid"');
    });

    it('calculates spread status correctly', async () => {
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: '94500', size: '0.5' }],
            asks: [{ price: '94550', size: '0.3' }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: 1000000,
        pricePercentageChange24h: 1.5,
      } as Product);

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
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: '94500', size: '0.5' }],
            asks: [{ price: '94550', size: '0.3' }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: 1000000,
        pricePercentageChange24h: 1.5,
      } as Product);
      jest.spyOn(service, 'getProductBook').mockResolvedValue({
        pricebook: {
          productId: 'BTC-EUR',
          bids: [
            { price: '94500', size: '0.5' },
            { price: '94490', size: '1.2' },
            { price: undefined, size: undefined }, // Non-string values trigger parseNumber fallback
          ],
          asks: [
            { price: '94550', size: '0.3' },
            { price: '94560', size: '0.9' },
          ],
        },
      } as unknown as GetProductBookResponse);

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
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: '94500', size: '0.5' }],
            asks: [{ price: '94550', size: '0.3' }],
          },
        ],
      } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProduct').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: 1000000,
        pricePercentageChange24h: 1.5,
      } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR'],
      });

      expect(result.snapshots['BTC-EUR'].orderBook).toBeUndefined();
    });

    it('identifies best and worst performers', async () => {
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-EUR',
            bids: [{ price: '94500', size: '0.5' }],
            asks: [{ price: '94550', size: '0.3' }],
          },
          {
            productId: 'ETH-EUR',
            bids: [{ price: '3200', size: '1.0' }],
            asks: [{ price: '3205', size: '0.8' }],
          },
          {
            productId: 'SOL-EUR',
            bids: [{ price: '185', size: '2.0' }],
            asks: [{ price: '186', size: '1.5' }],
          },
        ],
      } as GetBestBidAskResponse);
      jest
        .spyOn(service, 'getProduct')
        .mockResolvedValueOnce({
          productId: 'BTC-EUR',
          volume24h: 1000000,
          pricePercentageChange24h: 2.5,
        } as Product)
        .mockResolvedValueOnce({
          productId: 'ETH-EUR',
          volume24h: 500000,
          pricePercentageChange24h: -1.5,
        } as Product)
        .mockResolvedValueOnce({
          productId: 'SOL-EUR',
          volume24h: 100000,
          pricePercentageChange24h: 5.0,
        } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR', 'ETH-EUR', 'SOL-EUR'],
      });

      expect(result.summary.bestPerformer).toBe('SOL-EUR');
      expect(result.summary.worstPerformer).toBe('ETH-EUR');
    });
  });

  describe('getProductCandles', () => {
    // The SDK accepts ISO 8601 timestamp strings for candle requests,
    // but the REST API expects Unix timestamps. The toUnixTimestamp method
    // handles conversion while also supporting already-formatted Unix timestamps.
    describe('Timestamp Conversion for REST API Compatibility', () => {
      it('should reject invalid ISO 8601 timestamps with descriptive error', () => {
        const service = createService();

        const args = {
          productId: 'BTC-USD',
          start: 'invalid-date-string',
          end: '2025-12-31T23:59:59Z',
          granularity: Granularity.ONE_DAY,
        };

        expect(() => service.getProductCandles(args)).toThrow(
          'Invalid timestamp: invalid-date-string',
        );
      });
    });
  });

  describe('getProductCandlesBatch', () => {
    it('returns candles for multiple products', async () => {
      const service = createService();
      const mockCandles = [
        {
          start: '1704067200',
          low: '95000',
          high: '96000',
          open: '95500',
          close: '95800',
          volume: '100',
        },
        {
          start: '1704066300',
          low: '94000',
          high: '95500',
          open: '94500',
          close: '95500',
          volume: '150',
        },
      ];

      jest.spyOn(service, 'getProductCandles').mockResolvedValue({
        candles: mockCandles,
      } as never);

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
      const service = createService();
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
      const service = createService();
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
  });
});
