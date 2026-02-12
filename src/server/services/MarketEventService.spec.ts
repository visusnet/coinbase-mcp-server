import { jest, beforeEach } from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../../logger', () => ({
  logger,
}));
jest.mock('./MarketDataSubscription');

import { MarketEventService } from './MarketEventService';
import { MarketDataSubscription } from './MarketDataSubscription';
import type { TechnicalIndicatorsService } from './TechnicalIndicatorsService';
import type { MarketDataPool } from './MarketDataPool';
import type { SubscriptionResult } from './MarketEventService.response';
import {
  isTickerField,
  type WaitForMarketEventRequest,
} from './MarketEventService.request';
import {
  ConditionOperator,
  ConditionLogic,
  TickerConditionField,
} from './MarketEventService.types';

describe('isTickerField', () => {
  it('should return true for valid ticker fields', () => {
    expect(isTickerField('price')).toBe(true);
    expect(isTickerField('volume24h')).toBe(true);
    expect(isTickerField('high52w')).toBe(true);
    expect(isTickerField('bestBid')).toBe(true);
  });

  it('should return false for indicator fields', () => {
    expect(isTickerField('rsi')).toBe(false);
    expect(isTickerField('macd')).toBe(false);
    expect(isTickerField('sma')).toBe(false);
  });

  it('should return false for invalid fields', () => {
    expect(isTickerField('invalid')).toBe(false);
    expect(isTickerField('')).toBe(false);
  });
});

describe('MarketEventService', () => {
  describe('waitForMarketEvent', () => {
    let service: MarketEventService;
    let mockInstances: MockSubscriptionInstance[];
    const mockPool = {} as MarketDataPool;

    beforeEach(() => {
      jest.useFakeTimers();
      mockInstances = [];

      (MarketDataSubscription as jest.Mock).mockClear();
      (MarketDataSubscription as jest.Mock).mockImplementation(() => {
        let _resolve!: () => void;
        const promise = new Promise<void>((resolve) => {
          _resolve = resolve;
        });
        const instance: MockSubscriptionInstance = {
          start: jest.fn<() => void>(),
          cleanup: jest.fn<() => void>(),
          promise,
          result: notTriggeredResult('unknown'),
          _resolve,
        };
        mockInstances.push(instance);
        return instance;
      });

      service = new MarketEventService(
        {} as TechnicalIndicatorsService,
        mockPool,
      );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create a MarketDataSubscription for each request subscription', async () => {
      const request = createRequest({
        subscriptions: [
          {
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

      const resultPromise = service.waitForMarketEvent(request, {
        signal: new AbortController().signal,
      });

      mockInstances[0].result = triggeredResult('BTC-USD');
      mockInstances[1].result = notTriggeredResult('ETH-USD');
      mockInstances[0]._resolve();

      await resultPromise;

      expect(MarketDataSubscription).toHaveBeenCalledTimes(2);
      expect(MarketDataSubscription).toHaveBeenCalledWith(
        request.subscriptions[0],
        mockPool,
        expect.anything(), // conditionEvaluator (internally created)
      );
      expect(MarketDataSubscription).toHaveBeenCalledWith(
        request.subscriptions[1],
        mockPool,
        expect.anything(),
      );
    });

    it('should start all subscriptions', async () => {
      const request = createRequest({
        subscriptions: [
          {
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

      const resultPromise = service.waitForMarketEvent(request, {
        signal: new AbortController().signal,
      });

      mockInstances[0].result = triggeredResult('BTC-USD');
      mockInstances[1].result = notTriggeredResult('ETH-USD');
      mockInstances[0]._resolve();

      await resultPromise;

      expect(mockInstances[0].start).toHaveBeenCalledTimes(1);
      expect(mockInstances[1].start).toHaveBeenCalledTimes(1);
    });

    it('should return triggered status when any subscription triggers', async () => {
      const request = createRequest({
        subscriptions: [
          {
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

      const resultPromise = service.waitForMarketEvent(request, {
        signal: new AbortController().signal,
      });

      // Only ETH triggers
      mockInstances[0].result = notTriggeredResult('BTC-USD');
      mockInstances[1].result = triggeredResult('ETH-USD');
      mockInstances[1]._resolve();

      const result = await resultPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'triggered',
          subscriptions: [
            notTriggeredResult('BTC-USD'),
            triggeredResult('ETH-USD'),
          ],
        }),
      );
    });

    it('should return all subscription results when multiple trigger simultaneously', async () => {
      const request = createRequest({
        subscriptions: [
          {
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

      const resultPromise = service.waitForMarketEvent(request, {
        signal: new AbortController().signal,
      });

      // Both triggered
      mockInstances[0].result = triggeredResult('BTC-USD');
      mockInstances[1].result = triggeredResult('ETH-USD');
      mockInstances[0]._resolve();

      const result = await resultPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'triggered',
          subscriptions: [
            triggeredResult('BTC-USD'),
            triggeredResult('ETH-USD'),
          ],
        }),
      );
    });

    it('should return timeout when no subscription triggers', async () => {
      const request = createRequest({ timeout: 10 });

      const resultPromise = service.waitForMarketEvent(request, {
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

      const resultPromise = service.waitForMarketEvent(request, {
        signal: new AbortController().signal,
      });

      mockInstances[0].result = triggeredResult('BTC-USD');
      mockInstances[1].result = notTriggeredResult('ETH-USD');
      mockInstances[0]._resolve();

      await resultPromise;

      expect(mockInstances[0].cleanup).toHaveBeenCalledTimes(1);
      expect(mockInstances[1].cleanup).toHaveBeenCalledTimes(1);
    });

    it('should cleanup all subscriptions after timeout', async () => {
      const request = createRequest({ timeout: 5 });

      const resultPromise = service.waitForMarketEvent(request, {
        signal: new AbortController().signal,
      });

      jest.advanceTimersByTime(5_000);

      await resultPromise;

      expect(mockInstances[0].cleanup).toHaveBeenCalledTimes(1);
    });

    it('should validate response through schema', async () => {
      const request = createRequest();

      const resultPromise = service.waitForMarketEvent(request, {
        signal: new AbortController().signal,
      });

      // Return a result with an invalid field to verify schema validation
      mockInstances[0].result = {
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

      const resultPromise = service.waitForMarketEvent(request, {
        signal: new AbortController().signal,
      });

      mockInstances[0].result = triggeredResult('BTC-USD');
      mockInstances[0]._resolve();

      const result = await resultPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'triggered',
          subscriptions: [triggeredResult('BTC-USD')],
        }),
      );
    });

    it('should return error and cleanup when signal aborts', async () => {
      const request = createRequest({ timeout: 60 });
      const controller = new AbortController();

      const resultPromise = service.waitForMarketEvent(request, {
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
  });
});

// =============================================================================
// Helpers
// =============================================================================

interface MockSubscriptionInstance {
  start: jest.Mock;
  cleanup: jest.Mock;
  promise: Promise<void>;
  result: SubscriptionResult;
  _resolve: () => void;
}

function createRequest(
  overrides: Partial<WaitForMarketEventRequest> = {},
): WaitForMarketEventRequest {
  return {
    subscriptions: [
      {
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

function triggeredResult(productId: string): SubscriptionResult {
  return {
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

function notTriggeredResult(productId: string): SubscriptionResult {
  return {
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
