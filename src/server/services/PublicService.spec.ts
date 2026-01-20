import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Granularity } from '../ProductCandles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  getServerTime: jest.fn(),
  getProduct: jest.fn(),
  listProducts: jest.fn(),
  getProductBook: jest.fn(),
  getProductMarketTrades: jest.fn(),
  getProductCandles: jest.fn(),
};

jest.mock(
  '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js',
  () => ({
    PublicService: jest.fn().mockImplementation(() => mockSdkService),
  }),
);

// Import after mock is set up
import { PublicService } from './PublicService';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';

const createService = (): PublicService =>
  new PublicService({} as unknown as CoinbaseAdvTradeClient);

describe('PublicService', () => {
  describe('pass-through methods', () => {
    let service: PublicService;

    beforeEach(() => {
      jest.clearAllMocks();
      service = createService();
    });

    it('getServerTime should delegate to SDK with empty object', async () => {
      const mockResponse = {
        iso: '2025-01-01T00:00:00Z',
        epochSeconds: 1735689600,
      };
      mockSdkService.getServerTime.mockResolvedValue(mockResponse);

      const result = await service.getServerTime();

      expect(mockSdkService.getServerTime).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });

    it('getProduct should delegate to SDK', async () => {
      const mockResponse = { productId: 'BTC-USD' };
      mockSdkService.getProduct.mockResolvedValue(mockResponse);

      const result = await service.getProduct({ productId: 'BTC-USD' });

      expect(mockSdkService.getProduct).toHaveBeenCalledWith({
        productId: 'BTC-USD',
      });
      expect(result).toBe(mockResponse);
    });

    it('listProducts should delegate to SDK with empty object when no request', async () => {
      const mockResponse = { products: [] };
      mockSdkService.listProducts.mockResolvedValue(mockResponse);

      const result = await service.listProducts();

      expect(mockSdkService.listProducts).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });

    it('listProducts should delegate to SDK with request when provided', async () => {
      const mockResponse = { products: [{ productId: 'BTC-USD' }] };
      mockSdkService.listProducts.mockResolvedValue(mockResponse);

      const result = await service.listProducts({ limit: 10 });

      expect(mockSdkService.listProducts).toHaveBeenCalledWith({ limit: 10 });
      expect(result).toBe(mockResponse);
    });

    it('getProductBook should delegate to SDK', async () => {
      const mockResponse = { pricebook: { productId: 'BTC-USD' } };
      mockSdkService.getProductBook.mockResolvedValue(mockResponse);

      const result = await service.getProductBook({ productId: 'BTC-USD' });

      expect(mockSdkService.getProductBook).toHaveBeenCalledWith({
        productId: 'BTC-USD',
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
});
