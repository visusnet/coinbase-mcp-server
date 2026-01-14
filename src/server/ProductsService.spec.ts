import { describe, expect, it, jest } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { GetBestBidAskResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetBestBidAskResponse';
import type { GetProductBookResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetProductBookResponse';
import type { Product } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';
import { ProductsService } from './ProductsService';

const createService = () =>
  new ProductsService({} as unknown as CoinbaseAdvTradeClient);

describe('ProductsService', () => {
  describe('getProductFixed', () => {
    it('returns Product type from getProduct', async () => {
      const service = createService();
      const mockProduct = {
        productId: 'BTC-USD',
        price: '50000',
        volume24h: '1000',
      };
      const spy = jest
        .spyOn(service, 'getProduct')
        .mockResolvedValue(mockProduct as never);

      const result = await service.getProductFixed({ productId: 'BTC-USD' });

      expect(result).toEqual(mockProduct);
      expect(spy).toHaveBeenCalledWith({ productId: 'BTC-USD' });
    });
  });

  describe('getMarketSnapshot', () => {
    it('returns empty snapshots when no pricebook matches', async () => {
      const service = createService();
      jest
        .spyOn(service, 'getBestBidAsk')
        .mockResolvedValue({ pricebooks: [] } as GetBestBidAskResponse);
      jest.spyOn(service, 'getProductFixed').mockResolvedValue({
        productId: 'BTC-USD',
        volume24h: '0',
        pricePercentageChange24h: '0',
      } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-USD'],
      });

      expect(Object.keys(result.snapshots)).toHaveLength(0);
      expect(result.summary.assetsQueried).toBe(0);
      expect(result.summary.bestPerformer).toBeNull();
      expect(result.summary.worstPerformer).toBeNull();
    });

    it('throws when a product is missing', async () => {
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
      jest.spyOn(service, 'getProductFixed').mockResolvedValue({
        productId: 'ETH-USD',
        volume24h: '0',
        pricePercentageChange24h: '0',
      } as Product);

      await expect(
        service.getMarketSnapshot({ productIds: ['BTC-USD'] }),
      ).rejects.toThrow('Product not found: BTC-USD');
    });

    it('handles invalid book data and zero depth order books', async () => {
      const service = createService();
      jest.spyOn(service, 'getBestBidAsk').mockResolvedValue({
        pricebooks: [
          {
            productId: 'BTC-USD',
            bids: [
              { price: 120, size: '1' },
              { price: 'NaN', size: '1' },
            ],
            asks: [
              { price: undefined, size: '1' },
              { price: 'NaN', size: '1' },
            ],
          },
        ],
      } as unknown as GetBestBidAskResponse);
      jest.spyOn(service, 'getProductFixed').mockResolvedValue({
        productId: 'BTC-USD',
        volume24h: '0',
        pricePercentageChange24h: '0',
      } as Product);
      jest.spyOn(service, 'getProductBook').mockResolvedValue({
        pricebook: {
          productId: 'BTC-USD',
          bids: [
            { price: 120, size: '1' },
            { price: 'NaN', size: 2 },
          ],
          asks: [{ price: undefined, size: '1' }],
        },
      } as unknown as GetProductBookResponse);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-USD'],
        includeOrderBook: true,
      });

      const snapshot = result.snapshots['BTC-USD'];
      expect(snapshot.orderBook).toBeDefined();
      expect(snapshot.orderBook?.imbalance).toBe(0);
      expect(snapshot.spreadPercent).toBe(0);
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
      jest.spyOn(service, 'getProductFixed').mockResolvedValue({
        productId: 'BTC-USD',
        volume24h: '0',
        pricePercentageChange24h: '0',
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
        .spyOn(service, 'getProductFixed')
        .mockResolvedValueOnce({
          productId: 'BTC-EUR',
          volume24h: '1234567.89',
          pricePercentageChange24h: '2.55',
        } as Product)
        .mockResolvedValueOnce({
          productId: 'ETH-EUR',
          volume24h: '567890.12',
          pricePercentageChange24h: '-1.40',
        } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR', 'ETH-EUR'],
      });

      expect(result.timestamp).toBeDefined();
      expect(result.snapshots['BTC-EUR']).toBeDefined();
      expect(result.snapshots['ETH-EUR']).toBeDefined();
      expect(result.summary.assetsQueried).toBe(2);
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
      jest.spyOn(service, 'getProductFixed').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: '1000000',
        pricePercentageChange24h: '1.5',
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
      jest.spyOn(service, 'getProductFixed').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: '1000000',
        pricePercentageChange24h: '1.5',
      } as Product);
      jest.spyOn(service, 'getProductBook').mockResolvedValue({
        pricebook: {
          productId: 'BTC-EUR',
          bids: [
            { price: '94500', size: '0.5' },
            { price: '94490', size: '1.2' },
          ],
          asks: [
            { price: '94550', size: '0.3' },
            { price: '94560', size: '0.9' },
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
      jest.spyOn(service, 'getProductFixed').mockResolvedValue({
        productId: 'BTC-EUR',
        volume24h: '1000000',
        pricePercentageChange24h: '1.5',
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
        .spyOn(service, 'getProductFixed')
        .mockResolvedValueOnce({
          productId: 'BTC-EUR',
          volume24h: '1000000',
          pricePercentageChange24h: '2.5',
        } as Product)
        .mockResolvedValueOnce({
          productId: 'ETH-EUR',
          volume24h: '500000',
          pricePercentageChange24h: '-1.5',
        } as Product)
        .mockResolvedValueOnce({
          productId: 'SOL-EUR',
          volume24h: '100000',
          pricePercentageChange24h: '5.0',
        } as Product);

      const result = await service.getMarketSnapshot({
        productIds: ['BTC-EUR', 'ETH-EUR', 'SOL-EUR'],
      });

      expect(result.summary.bestPerformer).toBe('SOL-EUR');
      expect(result.summary.worstPerformer).toBe('ETH-EUR');
    });
  });
});
