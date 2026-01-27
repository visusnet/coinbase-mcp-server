import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../../logger', () => ({
  logger,
}));

import { WebSocketPool } from './WebSocketPool';
import type { CoinbaseCredentials } from './CoinbaseCredentials';

/**
 * Creates a ticker channel message in the format Coinbase sends.
 */
function createTickerMessage(
  productId: string,
  price: string,
  volume24h: string,
  percentChange24h: string,
  high24h: string,
  low24h: string,
): {
  channel: 'ticker';
  client_id: string;
  timestamp: string;
  sequence_num: number;
  events: {
    type: 'update';
    tickers: {
      type: 'ticker';
      product_id: string;
      price: string;
      volume_24_h: string;
      price_percent_chg_24_h: string;
      high_24_h: string;
      low_24_h: string;
      high_52_w: string;
      low_52_w: string;
      best_bid: string;
      best_ask: string;
      best_bid_quantity: string;
      best_ask_quantity: string;
    }[];
  }[];
} {
  return {
    channel: 'ticker',
    client_id: '',
    timestamp: new Date().toISOString(),
    sequence_num: 0,
    events: [
      {
        type: 'update',
        tickers: [
          {
            type: 'ticker',
            product_id: productId,
            price,
            volume_24_h: volume24h,
            price_percent_chg_24_h: percentChange24h,
            high_24_h: high24h,
            low_24_h: low24h,
            high_52_w: '100000',
            low_52_w: '30000',
            best_bid: price,
            best_ask: price,
            best_bid_quantity: '1.0',
            best_ask_quantity: '1.0',
          },
        ],
      },
    ],
  };
}

// Mock WebSocket class
class MockWebSocket {
  public static readonly CONNECTING = 0;
  public static readonly OPEN = 1;
  public static readonly CLOSING = 2;
  public static readonly CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public send = jest.fn<(data: string) => void>();

  private readonly eventListeners: Map<string, Set<(event: unknown) => void>> =
    new Map();

  constructor(public readonly url: string) {}

  public addEventListener(
    type: string,
    listener: (event: unknown) => void,
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.add(listener);
    }
  }

  public close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent('close', {});
  }

  public dispatchEvent(type: string, event: unknown): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        listener(event);
      }
    }
  }

  public simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.dispatchEvent('open', {});
  }

  public simulateMessage(data: unknown): void {
    this.dispatchEvent('message', { data: JSON.stringify(data) });
  }

  public simulateError(): void {
    this.dispatchEvent('error', new Error('Connection failed'));
  }

  public simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent('close', {});
  }
}

// Track created WebSocket instances for testing
let mockWebSocketInstances: MockWebSocket[] = [];

// Store the original WebSocket
const OriginalWebSocket = globalThis.WebSocket;

// Mock credentials with generateWebSocketJwt method
const mockCredentials = {
  generateWebSocketJwt: jest.fn().mockReturnValue('mock-jwt-token'),
} as unknown as CoinbaseCredentials;

// Setup mock WebSocket
function setupMockWebSocket(): void {
  (globalThis as unknown as { WebSocket: typeof MockWebSocket }).WebSocket =
    class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        mockWebSocketInstances.push(this);
      }
    } as unknown as typeof MockWebSocket;

  (globalThis.WebSocket as unknown as { OPEN: number }).OPEN =
    MockWebSocket.OPEN;
  (globalThis.WebSocket as unknown as { CONNECTING: number }).CONNECTING =
    MockWebSocket.CONNECTING;
  (globalThis.WebSocket as unknown as { CLOSING: number }).CLOSING =
    MockWebSocket.CLOSING;
  (globalThis.WebSocket as unknown as { CLOSED: number }).CLOSED =
    MockWebSocket.CLOSED;
}

describe('WebSocketPool', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockWebSocketInstances = [];
    setupMockWebSocket();
  });

  afterEach(() => {
    globalThis.WebSocket = OriginalWebSocket;
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a new instance with credentials', () => {
      const pool = new WebSocketPool(mockCredentials);
      expect(pool).toBeInstanceOf(WebSocketPool);
    });
  });

  describe('close', () => {
    it('should close the connection and clean up resources', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      pool.close();

      expect(mockWebSocketInstances[0].readyState).toBe(MockWebSocket.CLOSED);
    });
  });

  describe('subscribe', () => {
    it('should return a subscription ID after connection opens', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const subscribePromise = pool.subscribe(['BTC-EUR'], callback);

      // Connection not yet open
      expect(mockWebSocketInstances).toHaveLength(1);

      // Open connection
      mockWebSocketInstances[0].simulateOpen();

      const subId = await subscribePromise;
      expect(subId).toMatch(/^sub-\d+-[a-z0-9]+$/);
    });

    it('should create a WebSocket connection on first subscription', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const subscribePromise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await subscribePromise;

      expect(mockWebSocketInstances).toHaveLength(1);
      expect(mockWebSocketInstances[0].url).toBe(
        'wss://advanced-trade-ws.coinbase.com',
      );
      expect(logger.websocket.debug).toHaveBeenCalledWith(
        'Connecting to wss://advanced-trade-ws.coinbase.com',
      );
      expect(logger.websocket.debug).toHaveBeenCalledWith('Connection opened');
    });

    it('should send subscribe message with JWT after connection opens', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const subscribePromise = pool.subscribe(['BTC-EUR', 'ETH-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await subscribePromise;

      expect(mockWebSocketInstances[0].send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          product_ids: ['BTC-EUR', 'ETH-EUR'],
          channel: 'ticker',
          jwt: 'mock-jwt-token',
        }),
      );
    });

    it('should reuse existing connection for multiple subscriptions', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const promise1 = pool.subscribe(['BTC-EUR'], callback1);
      mockWebSocketInstances[0].simulateOpen();
      await promise1;

      await pool.subscribe(['ETH-EUR'], callback2);

      expect(mockWebSocketInstances).toHaveLength(1);
    });

    it('should only subscribe to new products', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const promise1 = pool.subscribe(['BTC-EUR', 'ETH-EUR'], callback1);
      mockWebSocketInstances[0].simulateOpen();
      await promise1;

      // Clear mock to check subsequent calls
      mockWebSocketInstances[0].send.mockClear();

      // Subscribe with overlap
      await pool.subscribe(['ETH-EUR', 'SOL-EUR'], callback2);

      // Should only subscribe to SOL-EUR
      expect(mockWebSocketInstances[0].send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          product_ids: ['SOL-EUR'],
          channel: 'ticker',
          jwt: 'mock-jwt-token',
        }),
      );
    });

    it('should wait for existing connection promise if one exists', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const promise1 = pool.subscribe(['BTC-EUR'], callback1);
      const promise2 = pool.subscribe(['ETH-EUR'], callback2);

      // Only one WebSocket should be created
      expect(mockWebSocketInstances).toHaveLength(1);

      mockWebSocketInstances[0].simulateOpen();

      await Promise.all([promise1, promise2]);

      // Should still be just one connection
      expect(mockWebSocketInstances).toHaveLength(1);
    });
  });

  describe('unsubscribe', () => {
    it('should remove subscription', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      const subId = await promise;

      pool.unsubscribe(subId);

      // Simulate ticker - should not call callback
      mockWebSocketInstances[0].simulateMessage(
        createTickerMessage(
          'BTC-EUR',
          '50000',
          '1000',
          '-1.5',
          '52000',
          '49000',
        ),
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it('should unsubscribe from products no longer needed', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const promise1 = pool.subscribe(['BTC-EUR'], callback1);
      mockWebSocketInstances[0].simulateOpen();
      const subId1 = await promise1;

      await pool.subscribe(['ETH-EUR'], callback2);

      // Clear mock
      mockWebSocketInstances[0].send.mockClear();

      // Unsubscribe first
      pool.unsubscribe(subId1);

      expect(mockWebSocketInstances[0].send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'unsubscribe',
          product_ids: ['BTC-EUR'],
          channel: 'ticker',
          jwt: 'mock-jwt-token',
        }),
      );
    });

    it('should not unsubscribe if product is still needed by another subscription', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const promise1 = pool.subscribe(['BTC-EUR', 'ETH-EUR'], callback1);
      mockWebSocketInstances[0].simulateOpen();
      const subId1 = await promise1;

      await pool.subscribe(['BTC-EUR'], callback2);

      mockWebSocketInstances[0].send.mockClear();

      pool.unsubscribe(subId1);

      // Should only unsubscribe from ETH-EUR
      expect(mockWebSocketInstances[0].send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'unsubscribe',
          product_ids: ['ETH-EUR'],
          channel: 'ticker',
          jwt: 'mock-jwt-token',
        }),
      );
    });
  });

  describe('ticker delivery', () => {
    it('should deliver tickers to subscribed callbacks', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      mockWebSocketInstances[0].simulateMessage(
        createTickerMessage(
          'BTC-EUR',
          '50000',
          '1000',
          '-1.5',
          '52000',
          '49000',
        ),
      );

      expect(callback).toHaveBeenCalledWith({
        productId: 'BTC-EUR',
        price: 50000,
        volume24h: 1000,
        percentChange24h: -1.5,
        high24h: 52000,
        low24h: 49000,
        high52w: 100000,
        low52w: 30000,
        bestBid: 50000,
        bestAsk: 50000,
        bestBidQuantity: 1,
        bestAskQuantity: 1,
        timestamp: expect.any(String),
      });
    });

    it('should deliver tickers to multiple callbacks', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const promise1 = pool.subscribe(['BTC-EUR'], callback1);
      mockWebSocketInstances[0].simulateOpen();
      await promise1;
      await pool.subscribe(['BTC-EUR'], callback2);

      mockWebSocketInstances[0].simulateMessage(
        createTickerMessage(
          'BTC-EUR',
          '50000',
          '1000',
          '-1.5',
          '52000',
          '49000',
        ),
      );

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should only deliver tickers for subscribed products', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Send ticker for different product
      mockWebSocketInstances[0].simulateMessage(
        createTickerMessage('ETH-EUR', '3000', '500', '2.0', '3100', '2900'),
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle subscriptions message type', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      mockWebSocketInstances[0].simulateMessage({
        channel: 'subscriptions',
        client_id: '',
        timestamp: new Date().toISOString(),
        sequence_num: 0,
        events: [{ subscriptions: { ticker: ['BTC-EUR'] } }],
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle error message type', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      mockWebSocketInstances[0].simulateMessage({
        type: 'error',
        message: 'Some error',
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON messages', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Simulate malformed message by dispatching raw event
      mockWebSocketInstances[0].dispatchEvent('message', {
        data: 'not valid json',
      });

      expect(callback).not.toHaveBeenCalled();
      expect(logger.websocket.error).toHaveBeenCalledWith(
        { err: expect.any(SyntaxError) },
        'Message parse error',
      );
      expect(logger.websocket.error).toHaveBeenCalledWith(
        { data: 'not valid json' },
        'Raw message',
      );
    });
  });

  describe('reconnection', () => {
    it('should attempt to reconnect when connection closes', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      expect(mockWebSocketInstances).toHaveLength(1);

      mockWebSocketInstances[0].simulateClose();

      // Wait for reconnect delay (1 second base)
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      expect(mockWebSocketInstances).toHaveLength(2);
    });

    it('should not reconnect if no subscriptions remain', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      const subId = await promise;

      expect(mockWebSocketInstances).toHaveLength(1);

      pool.unsubscribe(subId);
      mockWebSocketInstances[0].simulateClose();

      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      expect(mockWebSocketInstances).toHaveLength(1);
    });

    it('should call onReconnect callback after reconnect', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();
      const onReconnect = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback, onReconnect);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Trigger reconnect
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      // Open new connection
      mockWebSocketInstances[1].simulateOpen();
      await Promise.resolve();

      expect(onReconnect).toHaveBeenCalledTimes(1);
    });

    it('should call onReconnect for all subscriptions', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const onReconnect1 = jest.fn();
      const onReconnect2 = jest.fn();

      const promise1 = pool.subscribe(['BTC-EUR'], callback1, onReconnect1);
      mockWebSocketInstances[0].simulateOpen();
      await promise1;
      await pool.subscribe(['ETH-EUR'], callback2, onReconnect2);

      // Trigger reconnect
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      // Open new connection
      mockWebSocketInstances[1].simulateOpen();
      await Promise.resolve();

      expect(onReconnect1).toHaveBeenCalledTimes(1);
      expect(onReconnect2).toHaveBeenCalledTimes(1);
    });

    it('should deliver tickers after reconnect', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      mockWebSocketInstances[1].simulateOpen();
      await Promise.resolve();

      mockWebSocketInstances[1].simulateMessage(
        createTickerMessage(
          'BTC-EUR',
          '50000',
          '1000',
          '-1.5',
          '52000',
          '49000',
        ),
      );

      expect(callback).toHaveBeenCalled();
    });

    it('should re-subscribe to all products after reconnect', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR', 'ETH-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      mockWebSocketInstances[1].simulateOpen();
      await Promise.resolve();

      expect(mockWebSocketInstances[1].send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          product_ids: ['BTC-EUR', 'ETH-EUR'],
          channel: 'ticker',
          jwt: 'mock-jwt-token',
        }),
      );
    });

    it('should handle reconnect when already reconnecting', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Close to trigger reconnect
      mockWebSocketInstances[0].simulateClose();

      // Try to trigger another reconnect while already reconnecting
      mockWebSocketInstances[0].simulateClose();

      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      // Should have only 2 instances, not 3
      expect(mockWebSocketInstances).toHaveLength(2);
    });
  });

  describe('heartbeat', () => {
    it('should subscribe to heartbeats channel after connection opens', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // First message should be heartbeats subscription
      const firstCall = mockWebSocketInstances[0].send.mock.calls[0][0];
      const heartbeatSubscription = JSON.parse(firstCall) as {
        type: string;
        channel: string;
      };
      expect(heartbeatSubscription).toEqual({
        type: 'subscribe',
        channel: 'heartbeats',
      });
      expect(logger.websocket.debug).toHaveBeenCalledWith(
        'Subscribing to heartbeats channel',
      );
    });

    it('should skip heartbeats subscription if connection closes during open handler', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);

      // Dispatch 'open' event WITHOUT setting readyState to OPEN
      // This tests the guard in subscribeToHeartbeats
      mockWebSocketInstances[0].dispatchEvent('open', {});

      // The promise resolved but no heartbeats subscription was sent
      // because readyState was still CONNECTING (not OPEN)
      await promise;

      // No messages should have been sent because the guard returned early
      expect(mockWebSocketInstances[0].send).not.toHaveBeenCalled();
    });

    it('should handle heartbeat messages from server', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Simulate heartbeat message from server
      mockWebSocketInstances[0].dispatchEvent('message', {
        data: JSON.stringify({
          channel: 'heartbeats',
          client_id: '',
          timestamp: '2026-01-26T12:00:00.000Z',
          sequence_num: 1,
          events: [
            {
              current_time: '2026-01-26T12:00:00.000Z',
              heartbeat_counter: 1,
            },
          ],
        }),
      });

      // Heartbeat should be processed without errors - callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should reject subscribe promise on connection error', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const subscribePromise = pool.subscribe(['BTC-EUR'], callback);

      // Simulate error before connection opens
      mockWebSocketInstances[0].simulateError();

      await expect(subscribePromise).rejects.toThrow(
        'WebSocket connection failed',
      );
    });

    it('should retry when reconnect createConnection fails', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // First connection is open
      expect(mockWebSocketInstances[0].readyState).toBe(MockWebSocket.OPEN);

      // Close to trigger reconnect
      mockWebSocketInstances[0].simulateClose();

      // Advance past first reconnect delay (1s)
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      // Second WebSocket is created - simulate error to trigger catch block
      mockWebSocketInstances[1].simulateError();
      await Promise.resolve();

      // Advance past second reconnect delay (2s exponential backoff)
      jest.advanceTimersByTime(2100);
      await Promise.resolve();

      // Third connection attempt - open it
      mockWebSocketInstances[2].simulateOpen();
      await Promise.resolve();

      // Should have created 3 connections due to retry after error
      expect(mockWebSocketInstances.length).toBe(3);
    });

    it('should not trigger duplicate reconnect when error fires before close', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Close to trigger reconnect
      mockWebSocketInstances[0].simulateClose();

      // Advance past reconnect delay
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      // Second connection: error fires first, then close follows
      mockWebSocketInstances[1].simulateError();
      mockWebSocketInstances[1].simulateClose();
      await Promise.resolve();

      // Advance past next reconnect delay
      jest.advanceTimersByTime(2100);
      await Promise.resolve();

      // Only one reconnect attempt should have been made (3 total connections),
      // not two (which would be 4)
      expect(mockWebSocketInstances.length).toBe(3);
    });

    it('should stop reconnecting after max attempts', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Set reconnect attempts to max
      (pool as unknown as { reconnectAttempts: number }).reconnectAttempts = 5;

      const countBefore = mockWebSocketInstances.length;
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockWebSocketInstances.length).toBe(countBefore);
    });
  });

  describe('edge cases', () => {
    it('should handle unsubscribe when connection is not open', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      // Start subscription but don't wait for it
      const subscribePromise = pool.subscribe(['BTC-EUR'], callback);

      // Get the subscription ID from the internal map before connection opens
      // Unsubscribe should not crash even though connection is not open
      pool.unsubscribe('any-id');

      expect(logger.websocket.warn).toHaveBeenCalledWith(
        'Cannot send subscribe - connection not open',
      );

      // Now open and complete
      mockWebSocketInstances[0].simulateOpen();
      await subscribePromise;

      expect(mockWebSocketInstances).toHaveLength(1);
    });

    it('should handle sendUnsubscribe when connection is null', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Manually set connection to null
      (pool as unknown as { connection: WebSocket | null }).connection = null;

      pool.unsubscribe('any-id');

      expect(mockWebSocketInstances).toHaveLength(1);
    });

    it('should handle sendUnsubscribe when connection is closed', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const promise1 = pool.subscribe(['BTC-EUR'], callback1);
      mockWebSocketInstances[0].simulateOpen();
      const subId1 = await promise1;
      await pool.subscribe(['ETH-EUR'], callback2);

      // Close connection without triggering reconnect
      mockWebSocketInstances[0].readyState = MockWebSocket.CLOSED;
      mockWebSocketInstances[0].send.mockClear();

      pool.unsubscribe(subId1);

      // sendUnsubscribe should have returned early
      expect(mockWebSocketInstances[0].send).not.toHaveBeenCalled();
    });

    it('should handle subscription without onReconnect callback', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      // Subscribe without onReconnect
      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Trigger reconnect
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      mockWebSocketInstances[1].simulateOpen();
      await Promise.resolve();

      // Should not throw even without onReconnect callback
      expect(mockWebSocketInstances).toHaveLength(2);
    });

    it('should handle subscription without onDisconnect callback', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();

      // Subscribe without onDisconnect
      const promise = pool.subscribe(['BTC-EUR'], callback);
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Set reconnect attempts to max
      (pool as unknown as { reconnectAttempts: number }).reconnectAttempts = 5;

      // Trigger reconnect - should not throw even without onDisconnect
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Should not have created new connections (max reached)
      expect(mockWebSocketInstances).toHaveLength(1);
    });

    it('should call onDisconnect when max reconnect attempts reached', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback = jest.fn();
      const onReconnect = jest.fn();
      const onDisconnect = jest.fn();

      const promise = pool.subscribe(
        ['BTC-EUR'],
        callback,
        onReconnect,
        onDisconnect,
      );
      mockWebSocketInstances[0].simulateOpen();
      await promise;

      // Set reconnect attempts to max
      (pool as unknown as { reconnectAttempts: number }).reconnectAttempts = 5;

      // Trigger reconnect
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(onDisconnect).toHaveBeenCalledWith(
        'Connection failed after 5 reconnect attempts',
      );
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should call onDisconnect for all subscribers when max attempts reached', async () => {
      const pool = new WebSocketPool(mockCredentials);
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const onDisconnect1 = jest.fn();
      const onDisconnect2 = jest.fn();

      const promise1 = pool.subscribe(
        ['BTC-EUR'],
        callback1,
        undefined,
        onDisconnect1,
      );
      mockWebSocketInstances[0].simulateOpen();
      await promise1;

      await pool.subscribe(['ETH-EUR'], callback2, undefined, onDisconnect2);

      // Set reconnect attempts to max
      (pool as unknown as { reconnectAttempts: number }).reconnectAttempts = 5;

      // Trigger reconnect
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(onDisconnect1).toHaveBeenCalledTimes(1);
      expect(onDisconnect2).toHaveBeenCalledTimes(1);
    });
  });
});
