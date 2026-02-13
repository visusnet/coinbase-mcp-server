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

import { WebSocketConnection } from './WebSocketConnection';
import type { CoinbaseCredentials } from '@client/CoinbaseCredentials';

// =============================================================================
// MockWebSocket
// =============================================================================

class MockWebSocket {
  public static readonly OPEN = 1;
  public static readonly CLOSED = 3;

  public readyState = 0; // CONNECTING
  public send = jest.fn<(data: string) => void>();

  private readonly listeners = new Map<string, Set<(event: unknown) => void>>();

  constructor(public readonly url: string) {}

  public addEventListener(
    type: string,
    listener: (event: unknown) => void,
  ): void {
    const handlers =
      this.listeners.get(type) ?? new Set<(event: unknown) => void>();
    this.listeners.set(type, handlers);
    handlers.add(listener);
  }

  public close(): void {
    this.readyState = MockWebSocket.CLOSED;
  }

  // Test helpers
  public simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.dispatch('open', {});
  }

  public simulateMessage(data: unknown): void {
    this.dispatch('message', { data: JSON.stringify(data) });
  }

  public simulateError(): void {
    this.dispatch('error', new Error('Connection failed'));
  }

  public simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatch('close', {});
  }

  private dispatch(type: string, event: unknown): void {
    for (const l of this.listeners.get(type) ?? []) {
      l(event);
    }
  }
}

// =============================================================================
// Test Setup
// =============================================================================

let mockWebSocketInstances: MockWebSocket[] = [];
const OriginalWebSocket = globalThis.WebSocket;

const mockCredentials = {
  generateWebSocketJwt: jest.fn().mockReturnValue('mock-jwt-token'),
} as unknown as CoinbaseCredentials;

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
}

const TEST_URL = 'wss://test.example.com';
const noop = jest.fn();

function createConnection(
  messageHandler = noop as (data: unknown) => void,
  disconnectHandler = noop as (reason: string) => void,
): WebSocketConnection {
  return new WebSocketConnection(
    TEST_URL,
    mockCredentials,
    messageHandler,
    disconnectHandler,
  );
}

function flush(): Promise<void> {
  return Promise.resolve()
    .then(() => undefined)
    .then(() => undefined)
    .then(() => undefined)
    .then(() => undefined);
}

// =============================================================================
// Tests
// =============================================================================

describe('WebSocketConnection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockWebSocketInstances = [];
    setupMockWebSocket();
  });

  afterEach(() => {
    globalThis.WebSocket = OriginalWebSocket;
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Subscribe
  // ---------------------------------------------------------------------------

  describe('subscribe', () => {
    it('should create WebSocket connection on first subscribe', () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);

      expect(mockWebSocketInstances).toHaveLength(1);
      expect(mockWebSocketInstances[0].url).toBe(TEST_URL);

      connection.close();
    });

    it('should subscribe to heartbeats on connection open', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      const calls = mockWebSocketInstances[0].send.mock.calls.map(
        (c) => JSON.parse(c[0]) as Record<string, unknown>,
      );
      expect(calls[0]).toEqual({
        type: 'subscribe',
        channel: 'heartbeats',
      });

      connection.close();
    });

    it('should send subscribe message with JWT after connection opens', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      const calls = mockWebSocketInstances[0].send.mock.calls.map(
        (c) => JSON.parse(c[0]) as Record<string, unknown>,
      );
      expect(calls[1]).toEqual({
        type: 'subscribe',
        product_ids: ['BTC-USD'],
        channel: 'ticker',
        jwt: 'mock-jwt-token',
      });

      connection.close();
    });

    it('should deduplicate connections for multiple subscribes', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      connection.subscribe('candles', ['ETH-USD']);

      expect(mockWebSocketInstances).toHaveLength(1);

      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // heartbeats + ticker + candles = 3 send calls
      expect(mockWebSocketInstances[0].send).toHaveBeenCalledTimes(3);

      connection.close();
    });

    it('should send immediately if already connected', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();
      mockWebSocketInstances[0].send.mockClear();

      // Subscribe again — already connected
      connection.subscribe('candles', ['ETH-USD']);
      await flush();

      expect(mockWebSocketInstances).toHaveLength(1);
      expect(mockWebSocketInstances[0].send).toHaveBeenCalledTimes(1);

      connection.close();
    });

    it('should handle channels without product_ids (e.g., user channel)', async () => {
      const connection = createConnection();

      connection.subscribe('user');
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      const calls = mockWebSocketInstances[0].send.mock.calls.map(
        (c) => JSON.parse(c[0]) as Record<string, unknown>,
      );
      expect(calls[1]).toEqual({
        type: 'subscribe',
        channel: 'user',
        jwt: 'mock-jwt-token',
      });

      connection.close();
    });
  });

  // ---------------------------------------------------------------------------
  // Unsubscribe
  // ---------------------------------------------------------------------------

  describe('unsubscribe', () => {
    it('should send unsubscribe message with JWT', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();
      mockWebSocketInstances[0].send.mockClear();

      connection.unsubscribe('ticker', ['BTC-USD']);

      expect(mockWebSocketInstances[0].send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'unsubscribe',
          channel: 'ticker',
          jwt: 'mock-jwt-token',
          product_ids: ['BTC-USD'],
        }),
      );

      connection.close();
    });

    it('should not send if not connected', () => {
      const connection = createConnection();

      // Unsubscribe before any connection
      connection.unsubscribe('ticker', ['BTC-USD']);

      expect(mockWebSocketInstances).toHaveLength(0);

      connection.close();
    });

    it('should remove products from tracking', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      connection.unsubscribe('ticker', ['BTC-USD']);

      // Trigger reconnect — should NOT re-subscribe to ticker
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await flush();

      // No new connection because no tracked subscriptions
      expect(mockWebSocketInstances).toHaveLength(1);

      connection.close();
    });

    it('should handle unsubscribe for channels without product_ids', async () => {
      const connection = createConnection();

      connection.subscribe('user');
      mockWebSocketInstances[0].simulateOpen();
      await flush();
      mockWebSocketInstances[0].send.mockClear();

      connection.unsubscribe('user');

      expect(mockWebSocketInstances[0].send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'unsubscribe',
          channel: 'user',
          jwt: 'mock-jwt-token',
        }),
      );

      connection.close();
    });
  });

  // ---------------------------------------------------------------------------
  // messageHandler
  // ---------------------------------------------------------------------------

  describe('messageHandler', () => {
    it('should deliver parsed messages to handler', async () => {
      const handler = jest.fn();
      const connection = createConnection(handler);

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      const testMessage = { channel: 'ticker', data: 'test' };
      mockWebSocketInstances[0].simulateMessage(testMessage);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(testMessage);

      connection.close();
    });

    it('should handle JSON parse errors gracefully', async () => {
      const handler = jest.fn();
      const connection = createConnection(handler);

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // Send malformed data directly
      const ws = mockWebSocketInstances[0];
      const listeners = (
        ws as unknown as {
          listeners: Map<string, Set<(event: unknown) => void>>;
        }
      ).listeners;
      for (const l of listeners.get('message') ?? []) {
        l({ data: 'not-valid-json{{{' });
      }

      expect(handler).not.toHaveBeenCalled();
      expect(logger.streaming.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.anything() }),
        'WebSocket message parse error',
      );
      expect(logger.streaming.error).toHaveBeenCalledWith(
        { data: 'not-valid-json{{{' },
        'Raw message',
      );

      connection.close();
    });
  });

  // ---------------------------------------------------------------------------
  // Reconnect
  // ---------------------------------------------------------------------------

  describe('reconnect', () => {
    it('should reconnect on unexpected close', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      expect(mockWebSocketInstances).toHaveLength(1);

      mockWebSocketInstances[0].simulateClose();

      jest.advanceTimersByTime(1100);
      await flush();

      expect(mockWebSocketInstances).toHaveLength(2);

      connection.close();
    });

    it('should use exponential backoff', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // First close → reconnect after 1s
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(900);
      await flush();
      expect(mockWebSocketInstances).toHaveLength(1);

      jest.advanceTimersByTime(200);
      await flush();
      expect(mockWebSocketInstances).toHaveLength(2);

      // Second reconnect: error triggers catch → new reconnect with 2s delay
      mockWebSocketInstances[1].simulateError();
      await flush();

      jest.advanceTimersByTime(1900);
      await flush();
      expect(mockWebSocketInstances).toHaveLength(2);

      jest.advanceTimersByTime(200);
      await flush();
      expect(mockWebSocketInstances).toHaveLength(3);

      connection.close();
    });

    it('should re-subscribe after reconnect', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      connection.subscribe('candles', ['ETH-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // Trigger reconnect
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await flush();

      mockWebSocketInstances[1].simulateOpen();
      await flush();

      const calls = mockWebSocketInstances[1].send.mock.calls.map(
        (c) => JSON.parse(c[0]) as Record<string, unknown>,
      );

      // heartbeats + ticker re-subscribe + candles re-subscribe
      expect(calls).toHaveLength(3);
      expect(calls[0]).toEqual({ type: 'subscribe', channel: 'heartbeats' });
      expect(calls[1]).toEqual(
        expect.objectContaining({
          type: 'subscribe',
          channel: 'ticker',
          product_ids: ['BTC-USD'],
        }),
      );
      expect(calls[2]).toEqual(
        expect.objectContaining({
          type: 'subscribe',
          channel: 'candles',
          product_ids: ['ETH-USD'],
        }),
      );

      connection.close();
    });

    it('should stop after max reconnect attempts and notify disconnect handler', async () => {
      const disconnectHandler = jest.fn();
      const connection = createConnection(jest.fn(), disconnectHandler);

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // Close the good connection to start reconnect chain
      mockWebSocketInstances[0].simulateClose();

      // Simulate 5 reconnect failures
      for (let i = 0; i < 5; i++) {
        const delay = 1000 * Math.pow(2, i);
        jest.advanceTimersByTime(delay + 100);
        await flush();

        // Each reconnect creates a new instance that immediately errors
        mockWebSocketInstances[
          mockWebSocketInstances.length - 1
        ].simulateError();
        await flush();
      }

      // After 5 failures, the next reconnect() call hits the max check
      const reason = 'Connection failed after 5 reconnect attempts';
      expect(logger.streaming.error).toHaveBeenCalledWith(reason);
      expect(disconnectHandler).toHaveBeenCalledWith(reason);

      const countBefore = mockWebSocketInstances.length;

      // No more reconnects even after waiting
      jest.advanceTimersByTime(100000);
      await flush();

      expect(mockWebSocketInstances).toHaveLength(countBefore);

      connection.close();
    });

    it('should not start duplicate reconnect while already reconnecting', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // Close triggers reconnect → isReconnecting = true
      mockWebSocketInstances[0].simulateClose();

      // Advance past delay → reconnect creates instance 1 (pending connection)
      jest.advanceTimersByTime(1100);
      await flush();

      expect(mockWebSocketInstances).toHaveLength(2);

      // Close instance 1 while reconnect is still in progress
      // The close handler calls reconnect(), but isReconnecting guard blocks it
      mockWebSocketInstances[1].simulateClose();

      jest.advanceTimersByTime(100000);
      await flush();

      // No additional instances created — guard prevented duplicate
      expect(mockWebSocketInstances).toHaveLength(2);

      connection.close();
    });

    it('should not reconnect after close()', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      connection.close();

      mockWebSocketInstances[0].simulateClose();

      jest.advanceTimersByTime(2000);
      await flush();

      expect(mockWebSocketInstances).toHaveLength(1);
    });

    it('should not reconnect when no subscriptions exist', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // Remove all subscriptions
      connection.unsubscribe('ticker', ['BTC-USD']);

      mockWebSocketInstances[0].simulateClose();

      jest.advanceTimersByTime(2000);
      await flush();

      expect(mockWebSocketInstances).toHaveLength(1);

      connection.close();
    });

    it('should ignore stale close from replaced socket', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // Close → reconnect creates socket 1
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await flush();

      mockWebSocketInstances[1].simulateOpen();
      await flush();
      expect(mockWebSocketInstances).toHaveLength(2);

      // Fire stale close on old socket — should be ignored (this.ws !== ws)
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(100000);
      await flush();

      expect(mockWebSocketInstances).toHaveLength(2);

      connection.close();
    });

    it('should coalesce subscribe with in-flight reconnect', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // Close → reconnect starts
      mockWebSocketInstances[0].simulateClose();
      jest.advanceTimersByTime(1100);
      await flush();
      expect(mockWebSocketInstances).toHaveLength(2);

      // Subscribe during reconnect — should await same connectionPromise
      connection.subscribe('candles', ['ETH-USD']);
      expect(mockWebSocketInstances).toHaveLength(2);

      // Open socket 1 → both reconnect resubscribeAll and pending subscribe resolve
      mockWebSocketInstances[1].simulateOpen();
      await flush();

      // No extra connection created
      expect(mockWebSocketInstances).toHaveLength(2);

      connection.close();
    });
  });

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------

  describe('close', () => {
    it('should close the WebSocket connection', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      connection.close();

      expect(mockWebSocketInstances[0].readyState).toBe(MockWebSocket.CLOSED);
    });

    it('should prevent new connections after close()', async () => {
      const connection = createConnection();

      connection.close();

      // Subscribe after close — ensureConnection guard prevents connection
      connection.subscribe('ticker', ['BTC-USD']);
      await flush();

      expect(mockWebSocketInstances).toHaveLength(0);
    });

    it('should not reconnect if close() triggers synchronous close event', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);
      mockWebSocketInstances[0].simulateOpen();
      await flush();

      // Override MockWebSocket.close() to dispatch event synchronously
      // (simulates real browser behavior where close event may fire during ws.close())
      const ws = mockWebSocketInstances[0];
      const originalClose = ws.close.bind(ws);
      ws.close = () => {
        originalClose();
        ws.simulateClose();
      };

      connection.close();

      jest.advanceTimersByTime(100000);
      await flush();

      // No reconnect attempt
      expect(mockWebSocketInstances).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // sendRaw guard
  // ---------------------------------------------------------------------------

  describe('sendRaw guard', () => {
    it('should log warning when WebSocket closes between connect and send', async () => {
      const connection = createConnection();

      connection.subscribe('ticker', ['BTC-USD']);

      const ws = mockWebSocketInstances[0];
      ws.simulateOpen();
      // Close socket between heartbeat send (synchronous) and channel subscribe (microtask)
      ws.readyState = MockWebSocket.CLOSED;
      await flush();

      expect(logger.streaming.warn).toHaveBeenCalledWith(
        { messageType: 'subscribe' },
        'Cannot send - WebSocket not open',
      );

      connection.close();
    });
  });
});
