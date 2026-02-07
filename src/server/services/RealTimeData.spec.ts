import { jest } from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../../logger', () => ({
  logger,
}));

import { MockedService, mockProductsService } from '@test/serviceMocks';

import { CandleBuffer } from './CandleBuffer';
import { Granularity } from './common.request';
import type { Ticker, WebSocketCandle } from './MarketEventService.message';
import {
  getRefreshIntervalMs,
  RealTimeData,
  type ConnectionFailedCallback,
  type RealTimeCandleCallback,
  type RealTimeTickerCallback,
} from './RealTimeData';
import type { WebSocketPool } from '../websocket/WebSocketPool';
import type {
  CandleCallback,
  DisconnectCallback,
  TickerCallback,
} from '../websocket/WebSocketPool.types';
import { ProductsService } from './ProductsService';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockPool(): jest.Mocked<WebSocketPool> {
  return {
    subscribeToTicker: jest.fn(),
    unsubscribeFromTicker: jest.fn(),
    subscribeToCandles: jest.fn(),
    unsubscribeFromCandles: jest.fn(),
  } as unknown as jest.Mocked<WebSocketPool>;
}

function createTicker(productId: string, price: number): Ticker {
  return {
    productId,
    price,
    volume24h: 1000,
    low24h: price - 100,
    high24h: price + 100,
    low52w: price - 1000,
    high52w: price + 1000,
    percentChange24h: 1.5,
    bestBid: price - 1,
    bestAsk: price + 1,
    bestBidQuantity: 10,
    bestAskQuantity: 10,
    timestamp: new Date().toISOString(),
  };
}

function createCandle(
  productId: string,
  start: number,
  close: number,
): WebSocketCandle {
  return {
    productId,
    start,
    open: close - 10,
    high: close + 20,
    low: close - 20,
    close,
    volume: 100,
  };
}

// =============================================================================
// getRefreshIntervalMs Tests
// =============================================================================

describe('getRefreshIntervalMs', () => {
  it.each([
    [Granularity.ONE_MINUTE, 60 * 1000],
    [Granularity.FIVE_MINUTE, 5 * 60 * 1000],
    [Granularity.FIFTEEN_MINUTE, 15 * 60 * 1000],
    [Granularity.THIRTY_MINUTE, 30 * 60 * 1000],
    [Granularity.ONE_HOUR, 60 * 60 * 1000],
    [Granularity.TWO_HOUR, 2 * 60 * 60 * 1000],
    [Granularity.SIX_HOUR, 6 * 60 * 60 * 1000],
    [Granularity.ONE_DAY, 24 * 60 * 60 * 1000],
  ])('returns correct interval for %s', (granularity, expectedMs) => {
    expect(getRefreshIntervalMs(granularity)).toBe(expectedMs);
  });
});

// =============================================================================
// RealTimeData Ticker Tests
// =============================================================================

describe('RealTimeData - Ticker', () => {
  let pool: MockedService<WebSocketPool>;
  let candleBuffer: CandleBuffer;
  let realTimeData: RealTimeData;

  let capturedTickerCallback: TickerCallback;
  let capturedDisconnectCallback: DisconnectCallback | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = createMockPool();
    candleBuffer = new CandleBuffer();
    realTimeData = new RealTimeData(
      pool as unknown as WebSocketPool,
      mockProductsService as unknown as ProductsService,
      candleBuffer,
    );

    pool.subscribeToTicker.mockImplementation(
      (_productIds, callback, _onReconnect, onDisconnect) => {
        capturedTickerCallback = callback;
        capturedDisconnectCallback = onDisconnect;
        return Promise.resolve('ws-ticker-sub-id');
      },
    );
  });

  it('subscribes to WebSocket ticker channel', async () => {
    const callback: RealTimeTickerCallback = jest.fn();

    await realTimeData.subscribeToTicker(['BTC-EUR'], callback);

    expect(pool.subscribeToTicker).toHaveBeenCalledWith(
      ['BTC-EUR'],
      expect.any(Function),
      undefined,
      undefined,
    );
  });

  it('delivers ticker with productId as first argument', async () => {
    const callback: RealTimeTickerCallback = jest.fn();

    await realTimeData.subscribeToTicker(['BTC-EUR'], callback);
    capturedTickerCallback(createTicker('BTC-EUR', 50000));

    expect(callback).toHaveBeenCalledWith(
      'BTC-EUR',
      expect.objectContaining({ productId: 'BTC-EUR', price: 50000 }),
    );
  });

  it('forwards onConnectionFailed to WebSocket', async () => {
    const callback: RealTimeTickerCallback = jest.fn();
    const onConnectionFailed: ConnectionFailedCallback = jest.fn();

    await realTimeData.subscribeToTicker(
      ['BTC-EUR'],
      callback,
      onConnectionFailed,
    );

    expect(pool.subscribeToTicker).toHaveBeenCalledWith(
      ['BTC-EUR'],
      expect.any(Function),
      undefined,
      onConnectionFailed,
    );

    capturedDisconnectCallback?.('Max retries exceeded');
    expect(onConnectionFailed).toHaveBeenCalledWith('Max retries exceeded');
  });

  it('unsubscribes from WebSocket', async () => {
    const callback: RealTimeTickerCallback = jest.fn();

    const subscriptionId = await realTimeData.subscribeToTicker(
      ['BTC-EUR'],
      callback,
    );

    realTimeData.unsubscribeFromTicker(subscriptionId);

    expect(pool.unsubscribeFromTicker).toHaveBeenCalledWith('ws-ticker-sub-id');
  });

  it('handles unsubscribe for unknown subscription ID gracefully', () => {
    expect(() =>
      realTimeData.unsubscribeFromTicker('unknown-id'),
    ).not.toThrow();
    expect(pool.unsubscribeFromTicker).not.toHaveBeenCalled();
  });

  it('returns unique subscription IDs', async () => {
    const callback: RealTimeTickerCallback = jest.fn();

    const id1 = await realTimeData.subscribeToTicker(['BTC-EUR'], callback);
    const id2 = await realTimeData.subscribeToTicker(['ETH-EUR'], callback);

    expect(id1).not.toBe(id2);
  });
});

// =============================================================================
// RealTimeData Candle Tests - 5-minute (WebSocket)
// =============================================================================

describe('RealTimeData - Candles (5m WebSocket)', () => {
  let pool: MockedService<WebSocketPool>;
  let candleBuffer: CandleBuffer;
  let realTimeData: RealTimeData;

  let capturedCandleCallback: CandleCallback;
  let capturedDisconnectCallback: DisconnectCallback | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = createMockPool();
    candleBuffer = new CandleBuffer();
    realTimeData = new RealTimeData(
      pool as unknown as WebSocketPool,
      mockProductsService as unknown as ProductsService,
      candleBuffer,
    );

    pool.subscribeToCandles.mockImplementation(
      (_productIds, callback, _onReconnect, onDisconnect) => {
        capturedCandleCallback = callback;
        capturedDisconnectCallback = onDisconnect;
        return Promise.resolve('ws-candle-sub-id');
      },
    );
  });

  it('subscribes to WebSocket candle channel for 5m granularity', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.FIVE_MINUTE,
      20,
      callback,
    );

    expect(pool.subscribeToCandles).toHaveBeenCalledWith(
      ['BTC-EUR'],
      expect.any(Function),
      undefined,
      undefined,
    );
  });

  it('delivers candles with productId as first argument', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.FIVE_MINUTE,
      20,
      callback,
    );

    capturedCandleCallback(createCandle('BTC-EUR', 1000, 50000));

    expect(callback).toHaveBeenCalledWith(
      'BTC-EUR',
      expect.arrayContaining([
        expect.objectContaining({ productId: 'BTC-EUR', close: 50000 }),
      ]),
    );
  });

  it('accumulates candles in buffer', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.FIVE_MINUTE,
      20,
      callback,
    );

    capturedCandleCallback(createCandle('BTC-EUR', 1000, 50000));
    capturedCandleCallback(createCandle('BTC-EUR', 1300, 51000));

    expect(callback).toHaveBeenLastCalledWith('BTC-EUR', expect.any(Array));

    const lastCall = (callback as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[1]).toHaveLength(2);
  });

  it('forwards onConnectionFailed to WebSocket', async () => {
    const callback: RealTimeCandleCallback = jest.fn();
    const onConnectionFailed: ConnectionFailedCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.FIVE_MINUTE,
      20,
      callback,
      onConnectionFailed,
    );

    expect(pool.subscribeToCandles).toHaveBeenCalledWith(
      ['BTC-EUR'],
      expect.any(Function),
      undefined,
      onConnectionFailed,
    );

    capturedDisconnectCallback?.('Connection lost');
    expect(onConnectionFailed).toHaveBeenCalledWith('Connection lost');
  });

  it('unsubscribes from WebSocket', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    const subscriptionId = await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.FIVE_MINUTE,
      20,
      callback,
    );

    realTimeData.unsubscribeFromCandles(subscriptionId);

    expect(pool.unsubscribeFromCandles).toHaveBeenCalledWith(
      'ws-candle-sub-id',
    );
  });
});

// =============================================================================
// RealTimeData Candle Tests - Non-5m (REST Polling)
// =============================================================================

describe('RealTimeData - Candles (REST Polling)', () => {
  let pool: MockedService<WebSocketPool>;
  let candleBuffer: CandleBuffer;
  let realTimeData: RealTimeData;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    pool = createMockPool();
    candleBuffer = new CandleBuffer();
    realTimeData = new RealTimeData(
      pool as unknown as WebSocketPool,
      mockProductsService as unknown as ProductsService,
      candleBuffer,
    );

    mockProductsService.getProductCandles.mockResolvedValue({
      candles: [
        {
          start: 1000,
          open: 49000,
          high: 51000,
          low: 48000,
          close: 50000,
          volume: 100,
        },
        {
          start: 2000,
          open: 50000,
          high: 52000,
          low: 49000,
          close: 51000,
          volume: 150,
        },
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches candles via REST for non-5m granularity', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    expect(mockProductsService.getProductCandles).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'BTC-EUR',
        granularity: Granularity.ONE_HOUR,
        limit: 20,
      }),
    );
  });

  it('does not subscribe to WebSocket for non-5m granularity', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    expect(pool.subscribeToCandles).not.toHaveBeenCalled();
  });

  it('delivers initial candles immediately', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    expect(callback).toHaveBeenCalledWith(
      'BTC-EUR',
      expect.arrayContaining([
        expect.objectContaining({ close: 50000 }),
        expect.objectContaining({ close: 51000 }),
      ]),
    );
  });

  it('refreshes candles at granularity interval', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    // Initial fetch
    expect(mockProductsService.getProductCandles).toHaveBeenCalledTimes(1);

    // Advance timer by 1 hour
    jest.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve(); // Flush pending promises

    expect(mockProductsService.getProductCandles).toHaveBeenCalledTimes(2);
  });

  it('stops refresh timer on unsubscribe', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    const subscriptionId = await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    realTimeData.unsubscribeFromCandles(subscriptionId);

    // Advance timer - should not trigger refresh
    jest.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve();

    // Still just the initial fetch
    expect(mockProductsService.getProductCandles).toHaveBeenCalledTimes(1);
  });

  it('handles unsubscribe for unknown subscription ID gracefully', () => {
    expect(() =>
      realTimeData.unsubscribeFromCandles('unknown-id'),
    ).not.toThrow();
  });

  it('fetches candles for multiple products', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR', 'ETH-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    expect(mockProductsService.getProductCandles).toHaveBeenCalledTimes(2);
    expect(mockProductsService.getProductCandles).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'BTC-EUR' }),
    );
    expect(mockProductsService.getProductCandles).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'ETH-EUR' }),
    );
  });

  it('delivers initial candles for each product', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    await realTimeData.subscribeToCandles(
      ['BTC-EUR', 'ETH-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('BTC-EUR', expect.any(Array));
    expect(callback).toHaveBeenCalledWith('ETH-EUR', expect.any(Array));
  });

  it('does not refresh after unsubscribe during refresh', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    const subscriptionId = await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    // Reset mock to track only refresh calls
    mockProductsService.getProductCandles.mockClear();
    (callback as jest.Mock).mockClear();

    // Unsubscribe
    realTimeData.unsubscribeFromCandles(subscriptionId);

    // Advance timer - should not trigger anything
    jest.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve();

    expect(mockProductsService.getProductCandles).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  it('skips refresh if subscription was removed before timer fires', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    const subscriptionId = await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    // Reset to track only refresh calls
    mockProductsService.getProductCandles.mockClear();
    (callback as jest.Mock).mockClear();

    // Manually delete the subscription from internal map to simulate race condition
    // This tests the guard in refreshCandles() at line 321-322
    // We access internals via a trick: unsubscribe clears the timer but we want to
    // test what happens if the timer fires after subscription is gone
    // So we need to manually trigger the refresh with a missing subscription

    // First, get the timer running by NOT unsubscribing
    // Then manually remove from map while timer is pending
    // Use Object.defineProperty to access private field for testing
    const subscriptions = (
      realTimeData as unknown as { candleSubscriptions: Map<string, unknown> }
    ).candleSubscriptions;
    subscriptions.delete(subscriptionId);

    // Now advance timer - refreshCandles will be called but subscription is gone
    jest.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve();

    // The guard should have prevented any fetch or callback
    expect(mockProductsService.getProductCandles).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  it('handles candles with undefined values', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    mockProductsService.getProductCandles.mockResolvedValue({
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

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    expect(callback).toHaveBeenCalledWith(
      'BTC-EUR',
      expect.arrayContaining([
        expect.objectContaining({
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

  it('handles empty candles response', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    mockProductsService.getProductCandles.mockResolvedValue({
      candles: undefined,
    });

    await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    // Should still call callback with empty array
    expect(callback).toHaveBeenCalledWith('BTC-EUR', []);
  });
});

// =============================================================================
// RealTimeData Candle Tests - Retry Logic
// =============================================================================

describe('RealTimeData - Candles (REST Retry)', () => {
  let pool: MockedService<WebSocketPool>;
  let candleBuffer: CandleBuffer;
  let realTimeData: RealTimeData;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    pool = createMockPool();
    candleBuffer = new CandleBuffer();
    realTimeData = new RealTimeData(
      pool as unknown as WebSocketPool,
      mockProductsService as unknown as ProductsService,
      candleBuffer,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries on fetch failure and succeeds', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    mockProductsService.getProductCandles
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        candles: [{ start: 1000, close: 50000 }],
      });

    const subscribePromise = realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    // Advance timers for p-retry backoff
    await jest.advanceTimersByTimeAsync(10000);
    await subscribePromise;

    // First call failed, second succeeded
    expect(mockProductsService.getProductCandles).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('BTC-EUR', expect.any(Array));
  });

  it('calls onConnectionFailed after all retries exhausted', async () => {
    const callback: RealTimeCandleCallback = jest.fn();
    const onConnectionFailed: ConnectionFailedCallback = jest.fn();

    mockProductsService.getProductCandles.mockRejectedValue(
      new Error('Persistent error'),
    );

    const subscribePromise = realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
      onConnectionFailed,
    );

    // Advance timers for all p-retry attempts (1s + 2s + 4s = 7s minimum)
    await jest.advanceTimersByTimeAsync(20000);
    await subscribePromise;

    // Initial fetch: 1 + 3 retries = 4 calls
    expect(mockProductsService.getProductCandles).toHaveBeenCalledTimes(4);
    expect(onConnectionFailed).toHaveBeenCalledWith('Persistent error');
    expect(callback).not.toHaveBeenCalled();
  });

  it('aborts old refresh when new one starts', async () => {
    const callback: RealTimeCandleCallback = jest.fn();

    // Initial fetch succeeds
    mockProductsService.getProductCandles.mockResolvedValueOnce({
      candles: [{ start: 1000, close: 50000 }],
    });

    const subscriptionId = await realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
    );

    // Initial callback delivered
    expect(callback).toHaveBeenCalledTimes(1);
    (callback as jest.Mock).mockClear();

    // Access refreshAbortControllers to verify abort behavior
    const abortControllers = (
      realTimeData as unknown as {
        refreshAbortControllers: Map<string, AbortController>;
      }
    ).refreshAbortControllers;

    // Manually create an abort controller as if a refresh was in progress
    const oldController = new AbortController();
    abortControllers.set(subscriptionId, oldController);

    // Set up mock for next refresh
    mockProductsService.getProductCandles.mockResolvedValueOnce({
      candles: [{ start: 2000, close: 51000 }],
    });

    // Trigger a new refresh - should abort old controller
    const refreshCandles = (
      realTimeData as unknown as {
        refreshCandles: (id: string) => Promise<void>;
      }
    ).refreshCandles.bind(realTimeData);

    await refreshCandles(subscriptionId);

    // Old controller should be aborted
    expect(oldController.signal.aborted).toBe(true);

    // New data should be delivered
    expect(callback).toHaveBeenCalledWith('BTC-EUR', expect.any(Array));
  });

  it('does not call onConnectionFailed if aborted during retry', async () => {
    const callback: RealTimeCandleCallback = jest.fn();
    const onConnectionFailed: ConnectionFailedCallback = jest.fn();

    // First fetch will abort during retry
    let abortDuringRetry = false;
    mockProductsService.getProductCandles.mockImplementation(() => {
      if (!abortDuringRetry) {
        abortDuringRetry = true;
        throw new Error('First attempt fails');
      }
      // Second attempt - abort before it completes
      const abortControllers = (
        realTimeData as unknown as {
          refreshAbortControllers: Map<string, AbortController>;
        }
      ).refreshAbortControllers;
      for (const controller of abortControllers.values()) {
        controller.abort();
      }
      throw new Error('Aborted');
    });

    const subscribePromise = realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
      onConnectionFailed,
    );

    await jest.advanceTimersByTimeAsync(20000);
    await subscribePromise;

    // onConnectionFailed should NOT have been called because we aborted
    expect(onConnectionFailed).not.toHaveBeenCalled();
  });

  it('handles Error from p-retry wrapper', async () => {
    const callback: RealTimeCandleCallback = jest.fn();
    const onConnectionFailed: ConnectionFailedCallback = jest.fn();

    // p-retry wraps non-Error throws, so we get an Error with the message
    mockProductsService.getProductCandles.mockRejectedValue('String error');

    const subscribePromise = realTimeData.subscribeToCandles(
      ['BTC-EUR'],
      Granularity.ONE_HOUR,
      20,
      callback,
      onConnectionFailed,
    );

    await jest.advanceTimersByTimeAsync(20000);
    await subscribePromise;

    // p-retry converts string throws to Error, so we get the message
    expect(onConnectionFailed).toHaveBeenCalledWith(
      expect.stringContaining('String error'),
    );
  });
});
