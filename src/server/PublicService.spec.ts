import { describe, expect, it, jest } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { PublicService } from './PublicService';
import { Granularity } from './ProductCandles';

const createService = () =>
  new PublicService({} as unknown as CoinbaseAdvTradeClient);

describe('PublicService', () => {
  describe('getProductCandlesFixed', () => {
    // The SDK accepts ISO 8601 timestamp strings for candle requests,
    // but the REST API expects Unix timestamps. The toUnixTimestamp method
    // handles conversion while also supporting already-formatted Unix timestamps.
    describe('Timestamp Conversion for REST API Compatibility', () => {
      it('should reject invalid ISO 8601 timestamps with descriptive error', async () => {
        const service = createService();
        jest.spyOn(service, 'getProductCandles').mockResolvedValue({
          candles: [],
        } as unknown as Awaited<ReturnType<typeof service.getProductCandles>>);

        const args = {
          productId: 'BTC-USD',
          start: 'invalid-date-string',
          end: '2025-12-31T23:59:59Z',
          granularity: 'ONE_DAY',
        };

        await expect(() =>
          service.getProductCandlesFixed(args),
        ).rejects.toThrow('Invalid timestamp: invalid-date-string');
      });

      it('should convert ISO 8601 timestamps to Unix timestamps', async () => {
        const service = createService();
        const getProductCandlesMock = jest
          .spyOn(service, 'getProductCandles')
          .mockResolvedValue({
            candles: [],
          } as unknown as Awaited<
            ReturnType<typeof service.getProductCandles>
          >);

        const args = {
          productId: 'BTC-USD',
          start: '2025-12-31T00:00:00Z',
          end: '2026-01-01T00:00:00Z',
          granularity: Granularity.ONE_DAY,
        };

        await service.getProductCandlesFixed(args);

        expect(getProductCandlesMock).toHaveBeenCalled();
        expect(getProductCandlesMock).toHaveBeenCalledWith({
          productId: 'BTC-USD',
          start: '1767139200',
          end: '1767225600',
          granularity: Granularity.ONE_DAY,
        });
      });
    });
  });
});
