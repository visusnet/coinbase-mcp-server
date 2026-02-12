import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../../logger', () => ({ logger }));

import { RestPollingConnection } from './RestPollingConnection';
import { Granularity } from './common.request';
import type { ProductsService } from './ProductsService';
import type { BufferedCandle } from './CandleBuffer';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockProductsService() {
  return {
    getProductCandles: jest.fn<ProductsService['getProductCandles']>(),
  } as unknown as ProductsService & {
    getProductCandles: jest.Mock<ProductsService['getProductCandles']>;
  };
}

function makeCandleResponse(closes: number[]) {
  return {
    candles: closes.map((close, i) => ({
      start: 1707609600 + i * 60,
      open: close - 5,
      high: close + 10,
      low: close - 10,
      close,
      volume: 50,
    })),
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('RestPollingConnection', () => {
  let productsService: ReturnType<typeof createMockProductsService>;
  let candleHandler: jest.Mock<
    (
      productId: string,
      granularity: Granularity,
      candles: readonly BufferedCandle[],
    ) => void
  >;
  let disconnectHandler: jest.Mock<(reason: string) => void>;
  let connection: RestPollingConnection;

  beforeEach(() => {
    jest.useFakeTimers();
    productsService = createMockProductsService();
    candleHandler = jest.fn();
    disconnectHandler = jest.fn();
    connection = new RestPollingConnection(
      productsService,
      candleHandler,
      disconnectHandler,
    );
  });

  afterEach(() => {
    connection.close();
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Subscribe
  // ---------------------------------------------------------------------------

  describe('subscribe', () => {
    it('should fetch candles immediately and deliver to handler', async () => {
      productsService.getProductCandles.mockResolvedValue(
        makeCandleResponse([100, 200]),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      await jest.advanceTimersByTimeAsync(0);

      expect(productsService.getProductCandles).toHaveBeenCalledTimes(1);
      expect(candleHandler).toHaveBeenCalledTimes(1);
      expect(candleHandler).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.ONE_MINUTE,
        expect.arrayContaining([
          expect.objectContaining({ productId: 'BTC-USD', close: 200 }),
        ]),
      );
    });

    it('should set up periodic refresh after initial fetch', async () => {
      productsService.getProductCandles.mockResolvedValue(
        makeCandleResponse([100]),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      await jest.advanceTimersByTimeAsync(0);

      // Initial fetch
      expect(productsService.getProductCandles).toHaveBeenCalledTimes(1);

      // Advance past one refresh interval (ONE_MINUTE = 60s)
      await jest.advanceTimersByTimeAsync(60_000);
      expect(productsService.getProductCandles).toHaveBeenCalledTimes(2);
    });

    it('should update maxCount when subscribing with higher count', async () => {
      productsService.getProductCandles.mockResolvedValue(
        makeCandleResponse([100]),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      await jest.advanceTimersByTimeAsync(0);

      // Subscribe again with higher count — does NOT trigger another fetch
      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 10);

      // Advance to next interval — fetch uses updated count
      await jest.advanceTimersByTimeAsync(60_000);

      expect(productsService.getProductCandles.mock.calls.at(-1)?.[0]).toEqual(
        expect.objectContaining({ limit: 10 }),
      );
    });

    it('should keep existing maxCount when subscribing with lower count', async () => {
      productsService.getProductCandles.mockResolvedValue(
        makeCandleResponse([100]),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 10);
      await jest.advanceTimersByTimeAsync(0);

      // Subscribe again with lower count
      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);

      // Advance to next interval — fetch uses the higher count
      await jest.advanceTimersByTimeAsync(60_000);

      expect(productsService.getProductCandles.mock.calls.at(-1)?.[0]).toEqual(
        expect.objectContaining({ limit: 10 }),
      );
    });

    it('should not create a second timer for the same key', async () => {
      productsService.getProductCandles.mockResolvedValue(
        makeCandleResponse([100]),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 5);
      await jest.advanceTimersByTimeAsync(0);

      // Only 1 initial fetch (second subscribe detected existing timer)
      expect(productsService.getProductCandles).toHaveBeenCalledTimes(1);

      // Advance one interval — only 1 refresh (single timer)
      await jest.advanceTimersByTimeAsync(60_000);
      expect(productsService.getProductCandles).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Unsubscribe
  // ---------------------------------------------------------------------------

  describe('unsubscribe', () => {
    it('should clear timer and stop fetching', async () => {
      productsService.getProductCandles.mockResolvedValue(
        makeCandleResponse([100]),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      await jest.advanceTimersByTimeAsync(0);

      expect(productsService.getProductCandles).toHaveBeenCalledTimes(1);

      connection.unsubscribe('BTC-USD', Granularity.ONE_MINUTE);

      // Advance past interval — no more fetches
      await jest.advanceTimersByTimeAsync(60_000);
      expect(productsService.getProductCandles).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call for non-existent key', () => {
      expect(() =>
        connection.unsubscribe('BTC-USD', Granularity.ONE_MINUTE),
      ).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------

  describe('close', () => {
    it('should clear all timers', async () => {
      productsService.getProductCandles.mockResolvedValue(
        makeCandleResponse([100]),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      connection.subscribe('ETH-USD', Granularity.ONE_HOUR, 5);
      await jest.advanceTimersByTimeAsync(0);

      connection.close();

      // Advance past interval — no more fetches
      await jest.advanceTimersByTimeAsync(3_600_000);
      expect(productsService.getProductCandles).toHaveBeenCalledTimes(2); // only initial fetches
    });
  });

  // ---------------------------------------------------------------------------
  // Retry Behavior
  // ---------------------------------------------------------------------------

  describe('retry behavior', () => {
    it('should retry on failure and deliver candles on success', async () => {
      productsService.getProductCandles
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(makeCandleResponse([100, 200]));

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);

      // Advance past pRetry delay (1000ms base)
      await jest.advanceTimersByTimeAsync(2000);

      expect(productsService.getProductCandles).toHaveBeenCalledTimes(2);
      expect(candleHandler).toHaveBeenCalledTimes(1);
    });

    it('should log retry warning on failed attempt', async () => {
      productsService.getProductCandles
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce(makeCandleResponse([100]));

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      await jest.advanceTimersByTimeAsync(2000);

      expect(logger.streaming.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 1,
          retriesLeft: expect.any(Number),
          productId: 'BTC-USD',
          granularity: Granularity.ONE_MINUTE,
        }),
        'Candle fetch failed, retrying',
      );
    });

    it('should log error after all retries exhausted', async () => {
      productsService.getProductCandles.mockRejectedValue(
        new Error('persistent failure'),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);

      // Advance enough time for all retries (3 retries: 1s + 2s + 4s)
      await jest.advanceTimersByTimeAsync(10_000);

      expect(logger.streaming.error).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'BTC-USD',
          granularity: Granularity.ONE_MINUTE,
        }),
        'Candle fetch failed after retries',
      );
      expect(candleHandler).not.toHaveBeenCalled();
    });

    it('should call disconnectHandler after all retries exhausted', async () => {
      productsService.getProductCandles.mockRejectedValue(
        new Error('persistent failure'),
      );

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);

      // Advance enough time for all retries (3 retries: 1s + 2s + 4s)
      await jest.advanceTimersByTimeAsync(10_000);

      expect(disconnectHandler).toHaveBeenCalledWith('persistent failure');
    });
  });

  // ---------------------------------------------------------------------------
  // Granularity Intervals
  // ---------------------------------------------------------------------------

  describe('granularity refresh intervals', () => {
    it.each([
      [Granularity.ONE_MINUTE, 60_000],
      [Granularity.FIVE_MINUTE, 5 * 60_000],
      [Granularity.FIFTEEN_MINUTE, 15 * 60_000],
      [Granularity.THIRTY_MINUTE, 30 * 60_000],
      [Granularity.ONE_HOUR, 60 * 60_000],
      [Granularity.TWO_HOUR, 2 * 60 * 60_000],
      [Granularity.SIX_HOUR, 6 * 60 * 60_000],
      [Granularity.ONE_DAY, 24 * 60 * 60_000],
    ])(
      'should refresh at correct interval for %s',
      async (granularity, expectedInterval) => {
        productsService.getProductCandles.mockResolvedValue(
          makeCandleResponse([100]),
        );

        connection.subscribe('BTC-USD', granularity, 3);
        await jest.advanceTimersByTimeAsync(0);

        // Initial fetch
        expect(productsService.getProductCandles).toHaveBeenCalledTimes(1);

        // Advance to just before interval — no refresh yet
        await jest.advanceTimersByTimeAsync(expectedInterval - 1);
        expect(productsService.getProductCandles).toHaveBeenCalledTimes(1);

        // Advance past interval — refresh triggered
        await jest.advanceTimersByTimeAsync(1);
        expect(productsService.getProductCandles).toHaveBeenCalledTimes(2);
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle undefined candles array', async () => {
      productsService.getProductCandles.mockResolvedValue({
        candles: undefined,
      });

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      await jest.advanceTimersByTimeAsync(0);

      expect(candleHandler).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.ONE_MINUTE,
        [],
      );
    });

    it('should default undefined candle fields to 0', async () => {
      productsService.getProductCandles.mockResolvedValue({
        candles: [
          {
            start: undefined,
            open: undefined,
            high: undefined,
            low: undefined,
            close: undefined,
            volume: undefined,
          },
        ],
      });

      connection.subscribe('BTC-USD', Granularity.ONE_MINUTE, 3);
      await jest.advanceTimersByTimeAsync(0);

      expect(candleHandler).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.ONE_MINUTE,
        expect.arrayContaining([
          expect.objectContaining({
            productId: 'BTC-USD',
            start: 0,
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            volume: 0,
          }),
        ]),
      );
    });
  });
});
