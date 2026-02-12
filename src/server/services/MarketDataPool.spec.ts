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
jest.mock('../../logger', () => ({
  logger,
}));

// =============================================================================
// Mock WebSocketConnection — capture handlers passed to the constructor
// =============================================================================

let capturedMessageHandler: (data: unknown) => void;
let capturedDisconnectHandler: (reason: string) => void;
const mockConnectionInstance = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  close: jest.fn(),
};

jest.mock('../websocket/WebSocketConnection', () => ({
  WebSocketConnection: jest.fn().mockImplementation((...args: unknown[]) => {
    capturedMessageHandler = args[2] as (data: unknown) => void;
    capturedDisconnectHandler = args[3] as (reason: string) => void;
    return mockConnectionInstance;
  }),
}));

// =============================================================================
// Mock RestPollingConnection — capture candle handler
// =============================================================================

let capturedRestCandleHandler: (
  productId: string,
  granularity: string,
  candles: readonly unknown[],
) => void;
let capturedRestDisconnectHandler: (reason: string) => void;
const mockRestPollingInstance = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  close: jest.fn(),
};

jest.mock('./RestPollingConnection', () => ({
  RestPollingConnection: jest.fn().mockImplementation((...args: unknown[]) => {
    capturedRestCandleHandler = args[1] as typeof capturedRestCandleHandler;
    capturedRestDisconnectHandler = args[2] as (reason: string) => void;
    return mockRestPollingInstance;
  }),
}));

import { Granularity } from './common.request';
import { MarketDataPool } from './MarketDataPool';
import type { ProductsService } from './ProductsService';
import type { Ticker } from './MarketEventService.message';
import type { BufferedCandle } from './CandleBuffer';
import type { CoinbaseCredentials } from '@client/CoinbaseCredentials';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockProductsService(): jest.Mocked<
  Pick<ProductsService, 'getProductCandles'>
> {
  return {
    getProductCandles: jest.fn(),
  };
}

/**
 * Creates a raw Coinbase ticker WebSocket message (pre-Zod, snake_case, string numbers).
 */
function makeRawTickerMessage(productId: string, price: string) {
  return {
    channel: 'ticker',
    timestamp: '2026-02-11T00:00:00Z',
    sequence_num: 1,
    events: [
      {
        type: 'update',
        tickers: [
          {
            type: 'ticker',
            product_id: productId,
            price,
            volume_24_h: '1000',
            price_percent_chg_24_h: '1.5',
            high_24_h: '100',
            low_24_h: '90',
            high_52_w: '150',
            low_52_w: '50',
            best_bid: '99',
            best_ask: '101',
            best_bid_quantity: '10',
            best_ask_quantity: '10',
          },
        ],
      },
    ],
  };
}

/**
 * Creates a raw Coinbase candle WebSocket message (pre-Zod, snake_case, string numbers).
 */
function makeRawCandleMessage(productId: string, start: string, close: string) {
  return {
    channel: 'candles',
    timestamp: '2026-02-11T00:00:00Z',
    sequence_num: 1,
    events: [
      {
        type: 'update',
        candles: [
          {
            product_id: productId,
            start,
            open: '100',
            high: '105',
            low: '95',
            close,
            volume: '500',
          },
        ],
      },
    ],
  };
}

const mockCredentials = {} as CoinbaseCredentials;

// =============================================================================
// Tests
// =============================================================================

describe('MarketDataPool', () => {
  let productsService: ReturnType<typeof createMockProductsService>;
  let disconnectHandler: jest.Mock;
  let pool: MarketDataPool;

  beforeEach(() => {
    mockConnectionInstance.subscribe.mockClear();
    mockConnectionInstance.unsubscribe.mockClear();
    mockConnectionInstance.close.mockClear();
    mockRestPollingInstance.subscribe.mockClear();
    mockRestPollingInstance.unsubscribe.mockClear();
    mockRestPollingInstance.close.mockClear();

    productsService = createMockProductsService();
    disconnectHandler = jest.fn();
    pool = new MarketDataPool(
      mockCredentials,
      productsService as unknown as ProductsService,
      disconnectHandler,
    );
  });

  afterEach(() => {
    pool.close();
  });

  // ---------------------------------------------------------------------------
  // Ticker Subscriptions
  // ---------------------------------------------------------------------------

  describe('subscribeToTicker', () => {
    it('should subscribe to ticker channel via WebSocket', () => {
      pool.subscribeToTicker('BTC-USD', jest.fn());

      expect(mockConnectionInstance.subscribe).toHaveBeenCalledWith('ticker', [
        'BTC-USD',
      ]);
    });

    it('should deliver ticker updates to callback', () => {
      const callback = jest.fn<(ticker: Ticker) => void>();
      pool.subscribeToTicker('BTC-USD', callback);

      capturedMessageHandler(makeRawTickerMessage('BTC-USD', '95000'));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'BTC-USD', price: 95000 }),
      );
    });

    it('should not deliver ticker for a different product', () => {
      const callback = jest.fn<(ticker: Ticker) => void>();
      pool.subscribeToTicker('BTC-USD', callback);

      capturedMessageHandler(makeRawTickerMessage('ETH-USD', '3000'));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should deliver to multiple subscribers for the same product', () => {
      const callback1 = jest.fn<(ticker: Ticker) => void>();
      const callback2 = jest.fn<(ticker: Ticker) => void>();
      pool.subscribeToTicker('BTC-USD', callback1);
      pool.subscribeToTicker('BTC-USD', callback2);

      capturedMessageHandler(makeRawTickerMessage('BTC-USD', '95000'));

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should only send one WebSocket subscribe for multiple subscribers on same product', () => {
      pool.subscribeToTicker('BTC-USD', jest.fn());
      pool.subscribeToTicker('BTC-USD', jest.fn());

      expect(mockConnectionInstance.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should not send WebSocket unsubscribe until last subscriber is removed', () => {
      const id1 = pool.subscribeToTicker('BTC-USD', jest.fn());
      pool.subscribeToTicker('BTC-USD', jest.fn());

      pool.unsubscribe(id1);

      expect(mockConnectionInstance.unsubscribe).not.toHaveBeenCalled();
    });

    it('should send WebSocket unsubscribe when last subscriber is removed', () => {
      const id1 = pool.subscribeToTicker('BTC-USD', jest.fn());
      const id2 = pool.subscribeToTicker('BTC-USD', jest.fn());

      pool.unsubscribe(id1);
      pool.unsubscribe(id2);

      expect(mockConnectionInstance.unsubscribe).toHaveBeenCalledWith(
        'ticker',
        ['BTC-USD'],
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5-Minute Candle Subscriptions (WebSocket)
  // ---------------------------------------------------------------------------

  describe('subscribeToCandles (5m WebSocket)', () => {
    it('should subscribe to candles channel via WebSocket', () => {
      pool.subscribeToCandles(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        20,
        jest.fn(),
      );

      expect(mockConnectionInstance.subscribe).toHaveBeenCalledWith('candles', [
        'BTC-USD',
      ]);
    });

    it('should store candle in buffer and deliver to callback', () => {
      const callback = jest.fn<(candles: readonly BufferedCandle[]) => void>();
      pool.subscribeToCandles('BTC-USD', Granularity.FIVE_MINUTE, 20, callback);

      capturedMessageHandler(makeRawCandleMessage('BTC-USD', '1000', '102'));

      expect(callback).toHaveBeenCalledTimes(1);
      const candles = callback.mock.calls[0][0];
      expect(candles).toHaveLength(1);
      expect(candles[0]).toEqual(
        expect.objectContaining({
          productId: 'BTC-USD',
          start: 1000,
          close: 102,
        }),
      );
    });

    it('should not deliver candles for a different product', () => {
      const callback = jest.fn<(candles: readonly BufferedCandle[]) => void>();
      pool.subscribeToCandles('BTC-USD', Granularity.FIVE_MINUTE, 20, callback);

      capturedMessageHandler(makeRawCandleMessage('ETH-USD', '1000', '3000'));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should reference count 5m candle subscriptions', () => {
      const id1 = pool.subscribeToCandles(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        20,
        jest.fn(),
      );
      pool.subscribeToCandles(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        20,
        jest.fn(),
      );

      // Only one WebSocket subscribe
      expect(mockConnectionInstance.subscribe).toHaveBeenCalledTimes(1);

      // First unsubscribe doesn't send WebSocket unsubscribe
      pool.unsubscribe(id1);
      expect(mockConnectionInstance.unsubscribe).not.toHaveBeenCalled();
    });

    it('should send WebSocket unsubscribe when last 5m subscriber is removed', () => {
      const id1 = pool.subscribeToCandles(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        20,
        jest.fn(),
      );
      const id2 = pool.subscribeToCandles(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        20,
        jest.fn(),
      );

      pool.unsubscribe(id1);
      pool.unsubscribe(id2);

      expect(mockConnectionInstance.unsubscribe).toHaveBeenCalledWith(
        'candles',
        ['BTC-USD'],
      );
    });
  });

  // ---------------------------------------------------------------------------
  // REST Candle Subscriptions (non-5m)
  // ---------------------------------------------------------------------------

  describe('subscribeToCandles (REST)', () => {
    it('should delegate to RestPollingConnection', () => {
      pool.subscribeToCandles('BTC-USD', Granularity.ONE_HOUR, 20, jest.fn());

      expect(mockRestPollingInstance.subscribe).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.ONE_HOUR,
        20,
      );
    });

    it('should deliver REST candles to subscriber callback', () => {
      const callback = jest.fn<(candles: readonly BufferedCandle[]) => void>();
      pool.subscribeToCandles('BTC-USD', Granularity.ONE_HOUR, 20, callback);

      const testCandles = [
        {
          productId: 'BTC-USD',
          start: 1000,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 500,
        },
      ] as readonly BufferedCandle[];

      capturedRestCandleHandler('BTC-USD', Granularity.ONE_HOUR, testCandles);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(testCandles);
    });

    it('should not deliver REST candles for a different product', () => {
      const callback = jest.fn<(candles: readonly BufferedCandle[]) => void>();
      pool.subscribeToCandles('BTC-USD', Granularity.ONE_HOUR, 20, callback);

      capturedRestCandleHandler('ETH-USD', Granularity.ONE_HOUR, []);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should delegate unsubscribe to RestPollingConnection when last subscriber removed', () => {
      const id1 = pool.subscribeToCandles(
        'BTC-USD',
        Granularity.ONE_HOUR,
        20,
        jest.fn(),
      );
      const id2 = pool.subscribeToCandles(
        'BTC-USD',
        Granularity.ONE_HOUR,
        30,
        jest.fn(),
      );

      // First unsubscribe — don't stop polling yet
      pool.unsubscribe(id1);
      expect(mockRestPollingInstance.unsubscribe).not.toHaveBeenCalled();

      // Last unsubscribe — stop polling
      pool.unsubscribe(id2);
      expect(mockRestPollingInstance.unsubscribe).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.ONE_HOUR,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Unsubscribe
  // ---------------------------------------------------------------------------

  describe('unsubscribe', () => {
    it('should ignore unknown subscription IDs', () => {
      expect(() => pool.unsubscribe('non-existent-id')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  describe('message handling', () => {
    it('should ignore unparseable messages', () => {
      pool.subscribeToTicker('BTC-USD', jest.fn());

      // Send an invalid message
      capturedMessageHandler({ invalid: 'message' });

      expect(logger.streaming.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.anything() }),
        'Unknown WebSocket message',
      );
    });

    it('should ignore heartbeat messages', () => {
      const callback = jest.fn<(ticker: Ticker) => void>();
      pool.subscribeToTicker('BTC-USD', callback);

      capturedMessageHandler({
        channel: 'heartbeats',
        timestamp: '2026-02-11T00:00:00Z',
        sequence_num: 1,
        events: [
          { current_time: '2026-02-11T00:00:00Z', heartbeat_counter: 1 },
        ],
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should log Coinbase error messages', () => {
      capturedMessageHandler({
        type: 'error',
        message: 'rate limit exceeded',
      });

      expect(logger.streaming.error).toHaveBeenCalledWith(
        { message: 'rate limit exceeded' },
        'Coinbase WebSocket error',
      );
    });

    it('should close connection and notify on authentication error', () => {
      capturedMessageHandler({
        type: 'error',
        message: 'not authenticated - invalid authentication credentials',
      });

      expect(disconnectHandler).toHaveBeenCalledWith(
        'Authentication error: not authenticated - invalid authentication credentials',
      );
      expect(mockConnectionInstance.close).toHaveBeenCalled();
    });

    it('should not close connection on non-auth error', () => {
      capturedMessageHandler({
        type: 'error',
        message: 'rate limit exceeded',
      });

      expect(disconnectHandler).not.toHaveBeenCalled();
      expect(mockConnectionInstance.close).not.toHaveBeenCalled();
    });

    it('should log subscriptions messages at debug level', () => {
      capturedMessageHandler({
        channel: 'subscriptions',
        timestamp: '2026-02-11T00:00:00Z',
        sequence_num: 1,
        events: [
          { subscriptions: { ticker: ['BTC-USD'], candles: ['ETH-USD'] } },
        ],
      });

      expect(logger.streaming.debug).toHaveBeenCalledWith(
        { ticker: ['BTC-USD'], candles: ['ETH-USD'] },
        'Subscriptions updated',
      );
    });

    it('should default undefined ticker/candles to empty arrays in log', () => {
      capturedMessageHandler({
        channel: 'subscriptions',
        timestamp: '2026-02-11T00:00:00Z',
        sequence_num: 1,
        events: [{ subscriptions: {} }],
      });

      expect(logger.streaming.debug).toHaveBeenCalledWith(
        { ticker: [], candles: [] },
        'Subscriptions updated',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Disconnect Propagation
  // ---------------------------------------------------------------------------

  describe('disconnect propagation', () => {
    it('should propagate WebSocket disconnect to handler', () => {
      capturedDisconnectHandler('Connection failed after 5 reconnect attempts');

      expect(disconnectHandler).toHaveBeenCalledWith(
        'Connection failed after 5 reconnect attempts',
      );
    });

    it('should propagate REST disconnect to handler', () => {
      capturedRestDisconnectHandler('persistent failure');

      expect(disconnectHandler).toHaveBeenCalledWith('persistent failure');
    });

    it('should notify subscriber onDisconnect on REST disconnect', () => {
      const onDisconnect = jest.fn();
      pool.subscribeToCandles(
        'BTC-USD',
        Granularity.ONE_HOUR,
        20,
        jest.fn(),
        onDisconnect,
      );

      capturedRestDisconnectHandler('fetch failed');

      expect(onDisconnect).toHaveBeenCalledWith('fetch failed');
    });
  });

  // ---------------------------------------------------------------------------
  // Callback Error Isolation
  // ---------------------------------------------------------------------------

  describe('callback error isolation', () => {
    it('should catch ticker callback errors and continue delivery', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('callback error');
      });
      const okCallback = jest.fn<(ticker: Ticker) => void>();

      pool.subscribeToTicker('BTC-USD', errorCallback);
      pool.subscribeToTicker('BTC-USD', okCallback);

      capturedMessageHandler(makeRawTickerMessage('BTC-USD', '95000'));

      expect(okCallback).toHaveBeenCalled();
      expect(logger.streaming.error).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'BTC-USD' }),
        'Ticker callback error',
      );
    });

    it('should catch candle callback errors and continue delivery', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('callback error');
      });
      const okCallback =
        jest.fn<(candles: readonly BufferedCandle[]) => void>();

      pool.subscribeToCandles(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        20,
        errorCallback,
      );
      pool.subscribeToCandles(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        20,
        okCallback,
      );

      capturedMessageHandler(makeRawCandleMessage('BTC-USD', '1000', '102'));

      expect(okCallback).toHaveBeenCalled();
      expect(logger.streaming.error).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'BTC-USD' }),
        'Candle callback error',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------

  describe('close', () => {
    it('should close RestPollingConnection and WebSocketConnection', () => {
      pool.close();

      expect(mockRestPollingInstance.close).toHaveBeenCalled();
      expect(mockConnectionInstance.close).toHaveBeenCalled();
    });
  });
});
