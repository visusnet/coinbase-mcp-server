import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../../logger', () => ({
  logger,
}));

import {
  OrderDataSubscription,
  type OrderDataPool,
} from './OrderDataSubscription';
import type { OrderConditionEvaluator } from './OrderConditionEvaluator';
import type { OrderSubscription } from './EventService.request';
import type { OrderConditionResult } from './EventService.response';
import type { UserEventOrder } from './UserData.message';
import { OrderConditionField, SubscriptionType } from './EventService.types';
import { ConditionLogic, ConditionOperator } from './EventService.types';
import { OrderExecutionStatus } from './OrdersService.types';

// =============================================================================
// Mock Factories
// =============================================================================

type UserEventOrderCallback = (userEventOrder: UserEventOrder) => void;
type DisconnectCallback = (reason: string) => void;

interface MockPool {
  subscribeToUser: jest.Mock<
    (
      orderId: string,
      onUserEventOrder: UserEventOrderCallback,
      onDisconnect: DisconnectCallback,
    ) => string
  >;
  unsubscribe: jest.Mock<(subscriptionId: string) => void>;
  emitUserEventOrder: UserEventOrderCallback;
  emitDisconnect: DisconnectCallback;
}

function createMockPool(): MockPool {
  let subCounter = 0;
  let userEventOrderCb: UserEventOrderCallback | undefined;
  let disconnectCb: DisconnectCallback | undefined;

  const pool: MockPool = {
    subscribeToUser: jest.fn((_, onUserEventOrder, onDisconnect) => {
      userEventOrderCb = onUserEventOrder;
      disconnectCb = onDisconnect;
      return `order-sub-${++subCounter}`;
    }),
    unsubscribe: jest.fn(),
    emitUserEventOrder(userEventOrder: UserEventOrder): void {
      if (!userEventOrderCb) {
        throw new Error('No order event callback captured');
      }
      userEventOrderCb(userEventOrder);
    },
    emitDisconnect(reason: string): void {
      if (!disconnectCb) {
        throw new Error('No disconnect callback captured');
      }
      disconnectCb(reason);
    },
  };
  return pool;
}

// Extract mock as standalone jest.fn() to avoid unbound-method errors
const evaluateConditionsMock =
  jest.fn<OrderConditionEvaluator['evaluateConditions']>();

function createMockEvaluator(): jest.Mocked<OrderConditionEvaluator> {
  evaluateConditionsMock.mockReset();
  return {
    evaluateConditions: evaluateConditionsMock,
  } as unknown as jest.Mocked<OrderConditionEvaluator>;
}

function makeUserEventOrder(
  status: OrderExecutionStatus,
  completionPercentage = 50,
): UserEventOrder {
  return {
    orderId: 'order-123',
    status,
    avgPrice: 95000,
    cumulativeQuantity: 0.5,
    totalFees: 10,
    filledValue: 47500,
    numberOfFills: 3,
    completionPercentage,
  };
}

function triggeredConditionResult(): OrderConditionResult {
  return {
    field: OrderConditionField.Status,
    triggered: true,
    targetStatus: [OrderExecutionStatus.Filled],
    actualStatus: OrderExecutionStatus.Filled,
  };
}

function notTriggeredConditionResult(): OrderConditionResult {
  return {
    field: OrderConditionField.Status,
    triggered: false,
    targetStatus: [OrderExecutionStatus.Filled],
    actualStatus: OrderExecutionStatus.Open,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('OrderDataSubscription', () => {
  let mockPool: MockPool;
  let mockEvaluator: jest.Mocked<OrderConditionEvaluator>;

  beforeEach(() => {
    mockPool = createMockPool();
    mockEvaluator = createMockEvaluator();
  });

  // ---------------------------------------------------------------------------
  // start() — subscribing to data
  // ---------------------------------------------------------------------------

  describe('start', () => {
    it('should subscribeToUser to order events', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      expect(mockPool.subscribeToUser).toHaveBeenCalledWith(
        'order-123',
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // cleanup() — unsubscribing from data
  // ---------------------------------------------------------------------------

  describe('cleanup', () => {
    it('should unsubscribe from order events', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();
      sub.cleanup();

      expect(mockPool.unsubscribe).toHaveBeenCalledWith('order-sub-1');
    });

    it('should not call unsubscribe if start was never called', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.cleanup();

      expect(mockPool.unsubscribe).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Condition evaluation
  // ---------------------------------------------------------------------------

  describe('condition evaluation', () => {
    it('should evaluate conditions when order event received', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([notTriggeredConditionResult()]);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      const userEventOrder = makeUserEventOrder(OrderExecutionStatus.Open);
      mockPool.emitUserEventOrder(userEventOrder);

      expect(evaluateConditionsMock).toHaveBeenCalledWith(
        config.conditions,
        userEventOrder,
        null, // no previous event yet
      );
    });

    it('should pass previous order event on subsequent updates', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.CompletionPercentage,
            operator: ConditionOperator.CROSS_ABOVE,
            value: 75,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([notTriggeredConditionResult()]);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      const firstEvent = makeUserEventOrder(OrderExecutionStatus.Open, 50);
      const secondEvent = makeUserEventOrder(OrderExecutionStatus.Open, 80);

      mockPool.emitUserEventOrder(firstEvent);
      mockPool.emitUserEventOrder(secondEvent);

      expect(evaluateConditionsMock).toHaveBeenCalledWith(
        config.conditions,
        secondEvent,
        firstEvent, // previous event
      );
    });

    it('should update result with evaluated conditions', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const conditionResult = notTriggeredConditionResult();
      evaluateConditionsMock.mockReturnValue([conditionResult]);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Open),
      );

      expect(sub.result).toEqual({
        type: SubscriptionType.Order,
        orderId: 'order-123',
        triggered: false,
        conditions: [conditionResult],
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Triggering
  // ---------------------------------------------------------------------------

  describe('triggering', () => {
    it('should resolve promise when ANY condition triggers (logic: ANY)', async () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([triggeredConditionResult()]);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Filled),
      );

      await expect(sub.promise).resolves.toBeUndefined();
      expect(sub.result.triggered).toBe(true);
    });

    it('should resolve promise when ALL conditions trigger (logic: ALL)', async () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
          {
            field: OrderConditionField.CompletionPercentage,
            operator: ConditionOperator.GTE,
            value: 100,
          },
        ],
        logic: ConditionLogic.ALL,
      };

      evaluateConditionsMock.mockReturnValue([
        triggeredConditionResult(),
        {
          field: OrderConditionField.CompletionPercentage,
          operator: ConditionOperator.GTE,
          threshold: 100,
          actualValue: 100,
          triggered: true,
        },
      ]);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Filled, 100),
      );

      await expect(sub.promise).resolves.toBeUndefined();
      expect(sub.result.triggered).toBe(true);
    });

    it('should not trigger when only some conditions met (logic: ALL)', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
          {
            field: OrderConditionField.CompletionPercentage,
            operator: ConditionOperator.GTE,
            value: 100,
          },
        ],
        logic: ConditionLogic.ALL,
      };

      evaluateConditionsMock.mockReturnValue([
        triggeredConditionResult(),
        {
          field: OrderConditionField.CompletionPercentage,
          operator: ConditionOperator.GTE,
          threshold: 100,
          actualValue: 50,
          triggered: false,
        },
      ]);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Filled, 50),
      );

      expect(sub.result.triggered).toBe(false);
    });

    it('should ignore events after already triggered', async () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([triggeredConditionResult()]);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Filled),
      );

      await sub.promise;

      // Should not call evaluator again
      evaluateConditionsMock.mockClear();
      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Cancelled),
      );

      expect(evaluateConditionsMock).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Disconnect handling
  // ---------------------------------------------------------------------------

  describe('disconnect handling', () => {
    it('should reject promise on disconnect', async () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitDisconnect('WebSocket connection lost');

      await expect(sub.promise).rejects.toThrow('WebSocket connection lost');
    });

    it('should ignore disconnect after already triggered', async () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([triggeredConditionResult()]);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Filled),
      );

      await sub.promise;

      // Disconnect after trigger should not reject
      mockPool.emitDisconnect('Connection lost');

      // Promise should still be resolved (not rejected)
      await expect(sub.promise).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Trace logging
  // ---------------------------------------------------------------------------

  describe('trace logging', () => {
    it('should log evaluated conditions when trace level enabled', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const conditionResult = notTriggeredConditionResult();
      evaluateConditionsMock.mockReturnValue([conditionResult]);
      logger.streaming.isLevelEnabled.mockReturnValue(true);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Open),
      );

      expect(logger.streaming.trace).toHaveBeenCalledWith(
        {
          orderId: 'order-123',
          field: OrderConditionField.Status,
          triggered: false,
        },
        'Order condition evaluated',
      );
    });

    it('should not log when trace level disabled', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([notTriggeredConditionResult()]);
      logger.streaming.isLevelEnabled.mockReturnValue(false);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Open),
      );

      expect(logger.streaming.trace).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Initial result state
  // ---------------------------------------------------------------------------

  describe('initial state', () => {
    it('should have correct initial result', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-456',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );

      expect(sub.result).toEqual({
        type: SubscriptionType.Order,
        orderId: 'order-456',
        triggered: false,
        conditions: [],
      });
    });

    it('should return latest evaluation result', () => {
      const config: OrderSubscription = {
        type: SubscriptionType.Order,
        orderId: 'order-123',
        conditions: [
          {
            field: OrderConditionField.Status,
            targetStatus: [OrderExecutionStatus.Filled],
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const expectedResult: OrderConditionResult[] = [
        {
          field: OrderConditionField.Status,
          triggered: false,
          targetStatus: [OrderExecutionStatus.Filled],
          actualStatus: OrderExecutionStatus.Open,
        },
      ];

      evaluateConditionsMock.mockReturnValue(expectedResult);

      const sub = new OrderDataSubscription(
        config,
        mockPool as unknown as OrderDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitUserEventOrder(
        makeUserEventOrder(OrderExecutionStatus.Open),
      );

      expect(sub.result).toEqual({
        type: SubscriptionType.Order,
        orderId: 'order-123',
        triggered: false,
        conditions: expectedResult,
      });
    });
  });
});
