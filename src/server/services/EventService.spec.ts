import { jest, beforeEach } from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../../logger', () => ({
  logger,
}));
jest.mock('./MarketDataSubscription');
jest.mock('./OrderDataSubscription');

import { EventService } from './EventService';
import { MarketDataSubscription } from './MarketDataSubscription';
import {
  OrderDataSubscription,
  type OrderDataPool,
} from './OrderDataSubscription';
import type { TechnicalIndicatorsService } from './TechnicalIndicatorsService';
import type { MarketDataPool } from './MarketDataPool';
import type {
  MarketSubscriptionResult,
  OrderSubscriptionResult,
} from './EventService.response';
import type { WaitForEventRequest } from './EventService.request';
import {
  ConditionOperator,
  ConditionLogic,
  TickerConditionField,
} from './EventService.types';
import { OrderConditionField, SubscriptionType } from './EventService.types';
import { OrderExecutionStatus } from './OrdersService.types';

describe('EventService', () => {
  describe('waitForEvent', () => {
    let service: EventService;
    let mockInstances: MockSubscriptionInstance[];
    const mockMarketPool = {} as MarketDataPool;
    const mockOrderPool = {} as OrderDataPool;

    beforeEach(() => {
      jest.useFakeTimers();
      mockInstances = [];

      (MarketDataSubscription as jest.Mock).mockClear();
      (MarketDataSubscription as jest.Mock).mockImplementation(() => {
        let _resolve!: () => void;
        let _reject!: (error: Error) => void;
        const promise = new Promise<void>((resolve, reject) => {
          _resolve = resolve;
          _reject = reject;
        });
        const instance: MockSubscriptionInstance = {
          start: jest.fn<() => void>(),
          cleanup: jest.fn<() => void>(),
          promise,
          result: notTriggeredMarketResult('unknown'),
          _resolve,
          _reject,
        };
        mockInstances.push(instance);
        return instance;
      });

      service = new EventService(
        {} as TechnicalIndicatorsService,
        mockMarketPool,
        mockOrderPool,
      );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('market subscription routing', () => {
      it('should create a MarketDataSubscription for each request subscription', async () => {
        const request = createRequest({
          subscriptions: [
            {
              type: SubscriptionType.Market,
              productId: 'BTC-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Market,
              productId: 'ETH-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.LT,
                  value: 3000,
                },
              ],
              logic: ConditionLogic.ALL,
            },
          ],
        });

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        mockInstances[0].result = triggeredMarketResult('BTC-USD');
        mockInstances[1].result = notTriggeredMarketResult('ETH-USD');
        mockInstances[0]._resolve();

        await resultPromise;

        expect(MarketDataSubscription).toHaveBeenCalledTimes(2);
        expect(MarketDataSubscription).toHaveBeenCalledWith(
          request.subscriptions[0],
          mockMarketPool,
          expect.anything(), // marketConditionEvaluator
        );
        expect(MarketDataSubscription).toHaveBeenCalledWith(
          request.subscriptions[1],
          mockMarketPool,
          expect.anything(),
        );
      });

      it('should start all subscriptions', async () => {
        const request = createRequest({
          subscriptions: [
            {
              type: SubscriptionType.Market,
              productId: 'BTC-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Market,
              productId: 'ETH-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 3000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
        });

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        mockInstances[0].result = triggeredMarketResult('BTC-USD');
        mockInstances[1].result = notTriggeredMarketResult('ETH-USD');
        mockInstances[0]._resolve();

        await resultPromise;

        expect(mockInstances[0].start).toHaveBeenCalledTimes(1);
        expect(mockInstances[1].start).toHaveBeenCalledTimes(1);
      });

      it('should return triggered status when any subscription triggers', async () => {
        const request = createRequest({
          subscriptions: [
            {
              type: SubscriptionType.Market,
              productId: 'BTC-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Market,
              productId: 'ETH-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 3000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
        });

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        // Only ETH triggers
        mockInstances[0].result = notTriggeredMarketResult('BTC-USD');
        mockInstances[1].result = triggeredMarketResult('ETH-USD');
        mockInstances[1]._resolve();

        const result = await resultPromise;

        expect(result).toEqual(
          expect.objectContaining({
            status: 'triggered',
            subscriptions: [
              notTriggeredMarketResult('BTC-USD'),
              triggeredMarketResult('ETH-USD'),
            ],
          }),
        );
      });

      it('should return all subscription results when multiple trigger simultaneously', async () => {
        const request = createRequest({
          subscriptions: [
            {
              type: SubscriptionType.Market,
              productId: 'BTC-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Market,
              productId: 'ETH-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 3000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
        });

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        // Both triggered
        mockInstances[0].result = triggeredMarketResult('BTC-USD');
        mockInstances[1].result = triggeredMarketResult('ETH-USD');
        mockInstances[0]._resolve();

        const result = await resultPromise;

        expect(result).toEqual(
          expect.objectContaining({
            status: 'triggered',
            subscriptions: [
              triggeredMarketResult('BTC-USD'),
              triggeredMarketResult('ETH-USD'),
            ],
          }),
        );
      });
    });

    it('should return timeout when no subscription triggers', async () => {
      const request = createRequest({ timeout: 10 });

      const resultPromise = service.waitForEvent(request, {
        signal: new AbortController().signal,
      });

      jest.advanceTimersByTime(10_000);

      const result = await resultPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'timeout',
          duration: 10,
        }),
      );
    });

    it('should cleanup all subscriptions after trigger', async () => {
      const request = createRequest({
        subscriptions: [
          {
            type: SubscriptionType.Market,
            productId: 'BTC-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 50000,
              },
            ],
            logic: ConditionLogic.ANY,
          },
          {
            type: SubscriptionType.Market,
            productId: 'ETH-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 3000,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const resultPromise = service.waitForEvent(request, {
        signal: new AbortController().signal,
      });

      mockInstances[0].result = triggeredMarketResult('BTC-USD');
      mockInstances[1].result = notTriggeredMarketResult('ETH-USD');
      mockInstances[0]._resolve();

      await resultPromise;

      expect(mockInstances[0].cleanup).toHaveBeenCalledTimes(1);
      expect(mockInstances[1].cleanup).toHaveBeenCalledTimes(1);
    });

    it('should cleanup all subscriptions after timeout', async () => {
      const request = createRequest({ timeout: 5 });

      const resultPromise = service.waitForEvent(request, {
        signal: new AbortController().signal,
      });

      jest.advanceTimersByTime(5_000);

      await resultPromise;

      expect(mockInstances[0].cleanup).toHaveBeenCalledTimes(1);
    });

    it('should validate response through schema', async () => {
      const request = createRequest();

      const resultPromise = service.waitForEvent(request, {
        signal: new AbortController().signal,
      });

      // Return a result with an invalid field to verify schema validation
      mockInstances[0].result = {
        type: SubscriptionType.Market,
        productId: 'BTC-USD',
        triggered: true,
        conditions: [
          {
            field: 'invalidField' as TickerConditionField,
            operator: ConditionOperator.GT,
            threshold: 50000,
            actualValue: 51000,
            triggered: true,
          },
        ],
      };
      mockInstances[0]._resolve();

      await expect(resultPromise).rejects.toThrow();
    });

    it('should handle single subscription', async () => {
      const request = createRequest();

      const resultPromise = service.waitForEvent(request, {
        signal: new AbortController().signal,
      });

      mockInstances[0].result = triggeredMarketResult('BTC-USD');
      mockInstances[0]._resolve();

      const result = await resultPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'triggered',
          subscriptions: [triggeredMarketResult('BTC-USD')],
        }),
      );
    });

    it('should return error and cleanup when signal aborts', async () => {
      const request = createRequest({ timeout: 60 });
      const controller = new AbortController();

      const resultPromise = service.waitForEvent(request, {
        signal: controller.signal,
      });

      controller.abort();

      const result = await resultPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'error',
          reason: 'Request cancelled',
        }),
      );
      expect(mockInstances[0].cleanup).toHaveBeenCalledTimes(1);
    });

    it('should return error when subscription disconnects', async () => {
      const request = createRequest({ timeout: 60 });

      const resultPromise = service.waitForEvent(request, {
        signal: new AbortController().signal,
      });

      mockInstances[0]._reject(new Error('WebSocket connection lost'));

      const result = await resultPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'error',
          reason: 'WebSocket connection lost',
        }),
      );
      expect(mockInstances[0].cleanup).toHaveBeenCalledTimes(1);
    });

    describe('order subscription routing', () => {
      let orderMockInstances: MockOrderSubscriptionInstance[];

      beforeEach(() => {
        orderMockInstances = [];

        (OrderDataSubscription as jest.Mock).mockClear();
        (OrderDataSubscription as jest.Mock).mockImplementation(() => {
          let _resolve!: () => void;
          let _reject!: (error: Error) => void;
          const promise = new Promise<void>((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
          });
          const instance: MockOrderSubscriptionInstance = {
            start: jest.fn<() => void>(),
            cleanup: jest.fn<() => void>(),
            promise,
            result: notTriggeredOrderResult('order-123'),
            _resolve,
            _reject,
          };
          orderMockInstances.push(instance);
          return instance;
        });
      });

      it('should create an OrderDataSubscription for each request subscription', async () => {
        const request: WaitForEventRequest = {
          subscriptions: [
            {
              type: SubscriptionType.Order,
              orderId: 'order-123',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Order,
              orderId: 'order-456',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Cancelled],
                },
              ],
              logic: ConditionLogic.ALL,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        orderMockInstances[0].result = triggeredOrderResult('order-123');
        orderMockInstances[1].result = notTriggeredOrderResult('order-456');
        orderMockInstances[0]._resolve();

        await resultPromise;

        expect(OrderDataSubscription).toHaveBeenCalledTimes(2);
        expect(OrderDataSubscription).toHaveBeenCalledWith(
          request.subscriptions[0],
          mockOrderPool,
          expect.anything(), // orderConditionEvaluator
        );
        expect(OrderDataSubscription).toHaveBeenCalledWith(
          request.subscriptions[1],
          mockOrderPool,
          expect.anything(),
        );
      });

      it('should start all subscriptions', async () => {
        const request: WaitForEventRequest = {
          subscriptions: [
            {
              type: SubscriptionType.Order,
              orderId: 'order-123',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Order,
              orderId: 'order-456',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        orderMockInstances[0].result = triggeredOrderResult('order-123');
        orderMockInstances[1].result = notTriggeredOrderResult('order-456');
        orderMockInstances[0]._resolve();

        await resultPromise;

        expect(orderMockInstances[0].start).toHaveBeenCalledTimes(1);
        expect(orderMockInstances[1].start).toHaveBeenCalledTimes(1);
      });

      it('should return triggered status when any subscription triggers', async () => {
        const request: WaitForEventRequest = {
          subscriptions: [
            {
              type: SubscriptionType.Order,
              orderId: 'order-123',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Order,
              orderId: 'order-456',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        // Only second order triggers
        orderMockInstances[0].result = notTriggeredOrderResult('order-123');
        orderMockInstances[1].result = triggeredOrderResult('order-456');
        orderMockInstances[1]._resolve();

        const result = await resultPromise;

        expect(result).toEqual(
          expect.objectContaining({
            status: 'triggered',
            subscriptions: [
              notTriggeredOrderResult('order-123'),
              triggeredOrderResult('order-456'),
            ],
          }),
        );
      });

      it('should return all subscription results when multiple trigger simultaneously', async () => {
        const request: WaitForEventRequest = {
          subscriptions: [
            {
              type: SubscriptionType.Order,
              orderId: 'order-123',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Order,
              orderId: 'order-456',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        // Both triggered
        orderMockInstances[0].result = triggeredOrderResult('order-123');
        orderMockInstances[1].result = triggeredOrderResult('order-456');
        orderMockInstances[0]._resolve();

        const result = await resultPromise;

        expect(result).toEqual(
          expect.objectContaining({
            status: 'triggered',
            subscriptions: [
              triggeredOrderResult('order-123'),
              triggeredOrderResult('order-456'),
            ],
          }),
        );
      });
    });

    describe('mixed subscription routing', () => {
      let orderMockInstances: MockOrderSubscriptionInstance[];

      beforeEach(() => {
        orderMockInstances = [];

        (OrderDataSubscription as jest.Mock).mockClear();
        (OrderDataSubscription as jest.Mock).mockImplementation(() => {
          let _resolve!: () => void;
          let _reject!: (error: Error) => void;
          const promise = new Promise<void>((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
          });
          const instance: MockOrderSubscriptionInstance = {
            start: jest.fn<() => void>(),
            cleanup: jest.fn<() => void>(),
            promise,
            result: notTriggeredOrderResult('order-123'),
            _resolve,
            _reject,
          };
          orderMockInstances.push(instance);
          return instance;
        });
      });

      it('should route mixed subscriptions to correct classes', async () => {
        const request: WaitForEventRequest = {
          subscriptions: [
            {
              type: SubscriptionType.Market,
              productId: 'BTC-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Order,
              orderId: 'order-456',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        // Market subscription triggers
        mockInstances[0].result = triggeredMarketResult('BTC-USD');
        orderMockInstances[0].result = notTriggeredOrderResult('order-456');
        mockInstances[0]._resolve();

        const result = await resultPromise;

        expect(MarketDataSubscription).toHaveBeenCalledTimes(1);
        expect(OrderDataSubscription).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('triggered');
        expect(result).toHaveProperty('subscriptions');
        const subscriptions = (result as { subscriptions: unknown[] })
          .subscriptions;
        expect(subscriptions).toHaveLength(2);
        expect(subscriptions).toContainEqual(triggeredMarketResult('BTC-USD'));
        expect(subscriptions).toContainEqual(
          notTriggeredOrderResult('order-456'),
        );
      });

      it('should return triggered when order subscription triggers first', async () => {
        const request: WaitForEventRequest = {
          subscriptions: [
            {
              type: SubscriptionType.Market,
              productId: 'BTC-USD',
              conditions: [
                {
                  field: TickerConditionField.Price,
                  operator: ConditionOperator.GT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              type: SubscriptionType.Order,
              orderId: 'order-789',
              conditions: [
                {
                  field: OrderConditionField.Status,
                  targetStatus: [OrderExecutionStatus.Filled],
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request, {
          signal: new AbortController().signal,
        });

        // Order subscription triggers first
        mockInstances[0].result = notTriggeredMarketResult('BTC-USD');
        orderMockInstances[0].result = triggeredOrderResult('order-789');
        orderMockInstances[0]._resolve();

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        expect(result).toHaveProperty('subscriptions');
        const subscriptions = (result as { subscriptions: unknown[] })
          .subscriptions;
        expect(subscriptions).toContainEqual(
          notTriggeredMarketResult('BTC-USD'),
        );
        expect(subscriptions).toContainEqual(triggeredOrderResult('order-789'));
      });
    });
  });
});

// =============================================================================
// Helpers
// =============================================================================

interface MockSubscriptionInstance {
  start: jest.Mock;
  cleanup: jest.Mock;
  promise: Promise<void>;
  result: MarketSubscriptionResult;
  _resolve: () => void;
  _reject: (error: Error) => void;
}

function createRequest(
  overrides: Partial<WaitForEventRequest> = {},
): WaitForEventRequest {
  return {
    subscriptions: [
      {
        type: SubscriptionType.Market,
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      },
    ],
    timeout: 55,
    ...overrides,
  };
}

function triggeredMarketResult(productId: string): MarketSubscriptionResult {
  return {
    type: SubscriptionType.Market,
    productId,
    triggered: true,
    conditions: [
      {
        field: TickerConditionField.Price,
        operator: ConditionOperator.GT,
        threshold: 50000,
        actualValue: 51000,
        triggered: true,
      },
    ],
  };
}

function notTriggeredMarketResult(productId: string): MarketSubscriptionResult {
  return {
    type: SubscriptionType.Market,
    productId,
    triggered: false,
    conditions: [
      {
        field: TickerConditionField.Price,
        operator: ConditionOperator.GT,
        threshold: 50000,
        actualValue: 49000,
        triggered: false,
      },
    ],
  };
}

interface MockOrderSubscriptionInstance {
  start: jest.Mock;
  cleanup: jest.Mock;
  promise: Promise<void>;
  result: OrderSubscriptionResult;
  _resolve: () => void;
  _reject: (error: Error) => void;
}

function triggeredOrderResult(orderId: string): OrderSubscriptionResult {
  return {
    type: SubscriptionType.Order,
    orderId,
    triggered: true,
    conditions: [
      {
        field: OrderConditionField.Status,
        triggered: true,
        targetStatus: [OrderExecutionStatus.Filled],
        actualStatus: OrderExecutionStatus.Filled,
      },
    ],
  };
}

function notTriggeredOrderResult(orderId: string): OrderSubscriptionResult {
  return {
    type: SubscriptionType.Order,
    orderId,
    triggered: false,
    conditions: [
      {
        field: OrderConditionField.Status,
        triggered: false,
        targetStatus: [OrderExecutionStatus.Filled],
        actualStatus: OrderExecutionStatus.Open,
      },
    ],
  };
}
