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

import { OrderDataPool } from './OrderDataPool';
import type { UserEventOrder } from './UserData.message';
import type { CoinbaseCredentials } from '@client/CoinbaseCredentials';
import { OrderExecutionStatus } from './OrdersService.types';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates a raw Coinbase user channel WebSocket message (pre-Zod, snake_case, string numbers).
 */
function makeRawUserMessage(
  orderId: string,
  status: OrderExecutionStatus,
  completionPercentage = '50',
) {
  return {
    channel: 'user',
    timestamp: '2026-02-12T00:00:00Z',
    sequence_num: 1,
    events: [
      {
        type: 'update',
        orders: [
          {
            order_id: orderId,
            status,
            average_filled_price: '95000',
            cumulative_quantity: '0.5',
            total_fees: '10',
            filled_value: '47500',
            number_of_fills: '3',
            completion_percentage: completionPercentage,
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

describe('OrderDataPool', () => {
  let pool: OrderDataPool;

  beforeEach(() => {
    mockConnectionInstance.subscribe.mockClear();
    mockConnectionInstance.unsubscribe.mockClear();
    mockConnectionInstance.close.mockClear();

    pool = new OrderDataPool(mockCredentials);
  });

  afterEach(() => {
    pool.close();
  });

  // ---------------------------------------------------------------------------
  // User Subscriptions
  // ---------------------------------------------------------------------------

  describe('subscribeToUser', () => {
    it('should subscribe to user channel via WebSocket on first subscription', () => {
      pool.subscribeToUser('order-123', jest.fn(), jest.fn());

      expect(mockConnectionInstance.subscribe).toHaveBeenCalledWith('user');
    });

    it('should not send duplicate WebSocket subscribe for additional subscriptions', () => {
      pool.subscribeToUser('order-123', jest.fn(), jest.fn());
      pool.subscribeToUser('order-456', jest.fn(), jest.fn());

      expect(mockConnectionInstance.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should deliver order event to matching callback', () => {
      const callback = jest.fn<(userEventOrder: UserEventOrder) => void>();
      pool.subscribeToUser('order-123', callback, jest.fn());

      capturedMessageHandler(
        makeRawUserMessage('order-123', OrderExecutionStatus.Filled),
      );

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-123',
          status: OrderExecutionStatus.Filled,
        }),
      );
    });

    it('should log trace when trace logging is enabled', () => {
      logger.streaming.isLevelEnabled.mockReturnValue(true);
      const callback = jest.fn<(userEventOrder: UserEventOrder) => void>();
      pool.subscribeToUser('order-123', callback, jest.fn());

      capturedMessageHandler(
        makeRawUserMessage('order-123', OrderExecutionStatus.Filled),
      );

      expect(logger.streaming.trace).toHaveBeenCalledWith(
        expect.objectContaining({
          eventCount: 1,
          events: expect.arrayContaining([
            expect.objectContaining({
              type: 'update',
              orderCount: 1,
            }),
          ]),
        }),
        'User Channel message received',
      );
    });

    it('should not deliver order event for a different orderId', () => {
      const callback = jest.fn<(userEventOrder: UserEventOrder) => void>();
      pool.subscribeToUser('order-123', callback, jest.fn());

      capturedMessageHandler(
        makeRawUserMessage('order-456', OrderExecutionStatus.Filled),
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it('should deliver to multiple subscribers for the same orderId', () => {
      const callback1 = jest.fn<(userEventOrder: UserEventOrder) => void>();
      const callback2 = jest.fn<(userEventOrder: UserEventOrder) => void>();
      pool.subscribeToUser('order-123', callback1, jest.fn());
      pool.subscribeToUser('order-123', callback2, jest.fn());

      capturedMessageHandler(
        makeRawUserMessage('order-123', OrderExecutionStatus.Filled),
      );

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Unsubscribe
  // ---------------------------------------------------------------------------

  describe('unsubscribe', () => {
    it('should not send WebSocket unsubscribe until last subscriber is removed', () => {
      const id1 = pool.subscribeToUser('order-123', jest.fn(), jest.fn());
      pool.subscribeToUser('order-456', jest.fn(), jest.fn());

      pool.unsubscribe(id1);

      expect(mockConnectionInstance.unsubscribe).not.toHaveBeenCalled();
    });

    it('should send WebSocket unsubscribe when last subscriber is removed', () => {
      const id1 = pool.subscribeToUser('order-123', jest.fn(), jest.fn());
      const id2 = pool.subscribeToUser('order-456', jest.fn(), jest.fn());

      pool.unsubscribe(id1);
      pool.unsubscribe(id2);

      expect(mockConnectionInstance.unsubscribe).toHaveBeenCalledWith('user');
    });

    it('should ignore unknown subscription IDs', () => {
      expect(() => pool.unsubscribe('non-existent-id')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  describe('message handling', () => {
    it('should ignore unparseable messages', () => {
      pool.subscribeToUser('order-123', jest.fn(), jest.fn());

      capturedMessageHandler({ invalid: 'message' });

      expect(logger.streaming.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.anything() }),
        'Unknown User Channel WebSocket message',
      );
    });

    it('should ignore heartbeat messages', () => {
      const callback = jest.fn<(userEventOrder: UserEventOrder) => void>();
      pool.subscribeToUser('order-123', callback, jest.fn());

      capturedMessageHandler({
        channel: 'heartbeats',
        timestamp: '2026-02-12T00:00:00Z',
        sequence_num: 1,
        events: [
          { current_time: '2026-02-12T00:00:00Z', heartbeat_counter: 1 },
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
        'Coinbase User Channel WebSocket error',
      );
    });

    it('should close connection and log on authentication error', () => {
      capturedMessageHandler({
        type: 'error',
        message: 'not authenticated - invalid authentication credentials',
      });

      expect(logger.streaming.error).toHaveBeenCalledWith(
        {
          reason:
            'Authentication error: not authenticated - invalid authentication credentials',
        },
        'Order data connection lost',
      );
      expect(mockConnectionInstance.close).toHaveBeenCalled();
    });

    it('should not close connection on non-auth error', () => {
      capturedMessageHandler({
        type: 'error',
        message: 'rate limit exceeded',
      });

      // Only logs the error message, no disconnect
      expect(mockConnectionInstance.close).not.toHaveBeenCalled();
    });

    it('should log subscriptions messages at debug level', () => {
      capturedMessageHandler({
        channel: 'subscriptions',
        timestamp: '2026-02-12T00:00:00Z',
        sequence_num: 1,
        events: [{ subscriptions: { user: [''] } }],
      });

      expect(logger.streaming.debug).toHaveBeenCalledWith(
        { user: [''] },
        'User Channel subscriptions updated',
      );
    });

    it('should default undefined user to empty array in log', () => {
      capturedMessageHandler({
        channel: 'subscriptions',
        timestamp: '2026-02-12T00:00:00Z',
        sequence_num: 1,
        events: [{ subscriptions: {} }],
      });

      expect(logger.streaming.debug).toHaveBeenCalledWith(
        { user: [] },
        'User Channel subscriptions updated',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Disconnect Propagation
  // ---------------------------------------------------------------------------

  describe('disconnect propagation', () => {
    it('should log WebSocket disconnect', () => {
      capturedDisconnectHandler('Connection failed after 5 reconnect attempts');

      expect(logger.streaming.error).toHaveBeenCalledWith(
        { reason: 'Connection failed after 5 reconnect attempts' },
        'Order data connection lost',
      );
    });

    it('should notify subscriber onDisconnect on WebSocket disconnect', () => {
      const onDisconnect = jest.fn();
      pool.subscribeToUser('order-123', jest.fn(), onDisconnect);

      capturedDisconnectHandler('Connection lost');

      expect(onDisconnect).toHaveBeenCalledWith('Connection lost');
    });

    it('should notify all subscribers on disconnect', () => {
      const onDisconnect1 = jest.fn();
      const onDisconnect2 = jest.fn();
      pool.subscribeToUser('order-123', jest.fn(), onDisconnect1);
      pool.subscribeToUser('order-456', jest.fn(), onDisconnect2);

      capturedDisconnectHandler('Connection lost');

      expect(onDisconnect1).toHaveBeenCalledWith('Connection lost');
      expect(onDisconnect2).toHaveBeenCalledWith('Connection lost');
    });
  });

  // ---------------------------------------------------------------------------
  // Callback Error Isolation
  // ---------------------------------------------------------------------------

  describe('callback error isolation', () => {
    it('should catch callback errors and continue delivery', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('callback error');
      });
      const okCallback = jest.fn<(userEventOrder: UserEventOrder) => void>();

      pool.subscribeToUser('order-123', errorCallback, jest.fn());
      pool.subscribeToUser('order-123', okCallback, jest.fn());

      capturedMessageHandler(
        makeRawUserMessage('order-123', OrderExecutionStatus.Filled),
      );

      expect(okCallback).toHaveBeenCalled();
      expect(logger.streaming.error).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order-123' }),
        'Order event callback error',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------

  describe('close', () => {
    it('should close WebSocketConnection', () => {
      pool.close();

      expect(mockConnectionInstance.close).toHaveBeenCalled();
    });
  });
});
