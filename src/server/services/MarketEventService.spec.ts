import { jest } from '@jest/globals';

import type { Ticker } from './MarketEventService.message';
import type {
  DisconnectCallback,
  ReconnectCallback,
  TickerCallback,
} from '../websocket/WebSocketPool.types';
import type { WebSocketPool } from '../websocket/WebSocketPool';

import {
  ConditionSchema,
  SubscriptionSchema,
  WaitForMarketEventRequestSchema,
} from './MarketEventService.request';
import type { WaitForMarketEventRequest } from './MarketEventService.request';
import {
  MarketEventErrorResponseSchema,
  MarketEventTimeoutResponseSchema,
  MarketEventTriggeredResponseSchema,
  TickerResponseSchema,
  TriggeredConditionSchema,
  WaitForMarketEventResponseSchema,
} from './MarketEventService.response';
import type {
  MarketEventErrorResponse,
  MarketEventTimeoutResponse,
  MarketEventTriggeredResponse,
} from './MarketEventService.response';
import { MarketEventService } from './MarketEventService';
import {
  ConditionField,
  ConditionLogic,
  ConditionOperator,
} from './MarketEventService.types';

// Type helper for mocked WebSocketPool
type MockedPool = {
  subscribe: jest.MockedFunction<WebSocketPool['subscribe']>;
  unsubscribe: jest.MockedFunction<WebSocketPool['unsubscribe']>;
};

function createMockPool(): MockedPool {
  return {
    subscribe: jest.fn<WebSocketPool['subscribe']>(),
    unsubscribe: jest.fn<WebSocketPool['unsubscribe']>(),
  };
}

function createTicker(
  productId: string,
  overrides: Partial<Ticker> = {},
): Ticker {
  return {
    productId,
    price: 60000,
    volume24h: 1000000,
    percentChange24h: 2.5,
    high24h: 62000,
    low24h: 58000,
    high52w: 100000,
    low52w: 30000,
    bestBid: 59900,
    bestAsk: 60100,
    bestBidQuantity: 1.5,
    bestAskQuantity: 2.0,
    timestamp: '2025-01-25T12:00:00.000Z',
    ...overrides,
  };
}

describe('MarketEventService', () => {
  let mockPool: MockedPool;
  let service: MarketEventService;
  let capturedCallback: TickerCallback | null;
  let capturedOnReconnect: ReconnectCallback | undefined;
  let capturedOnDisconnect: DisconnectCallback | undefined;

  // Helper to send a ticker - throws if callback not captured
  function sendTicker(ticker: Ticker): void {
    if (capturedCallback === null) {
      throw new Error('Callback not captured - subscribe was not called');
    }
    capturedCallback(ticker);
  }

  // Helper to trigger reconnect - throws if onReconnect not captured
  function triggerReconnect(): void {
    if (capturedOnReconnect === undefined) {
      throw new Error('onReconnect not captured - subscribe was not called');
    }
    capturedOnReconnect();
  }

  // Helper to trigger disconnect - throws if onDisconnect not captured
  function triggerDisconnect(reason: string): void {
    if (capturedOnDisconnect === undefined) {
      throw new Error('onDisconnect not captured - subscribe was not called');
    }
    capturedOnDisconnect(reason);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    mockPool = createMockPool();
    service = new MarketEventService(mockPool as unknown as WebSocketPool);
    capturedCallback = null;
    capturedOnReconnect = undefined;
    capturedOnDisconnect = undefined;

    // Capture the callback, onReconnect, and onDisconnect when subscribe is called
    // subscribe() is now async, so return a resolved Promise
    mockPool.subscribe.mockImplementation(
      (_productIds, callback, onReconnect, onDisconnect) => {
        capturedCallback = callback;
        capturedOnReconnect = onReconnect;
        capturedOnDisconnect = onDisconnect;
        return Promise.resolve('mock-subscription-id');
      },
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('waitForEvent', () => {
    describe('timeout behavior', () => {
      it('should return timeout response when no conditions are triggered', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.LT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 5,
        };

        const resultPromise = service.waitForEvent(request);

        // Wait for subscribe to complete
        await Promise.resolve();

        // Simulate a ticker that doesn't trigger
        sendTicker(createTicker('BTC-EUR', { price: 60000 }));

        // Advance past timeout
        jest.advanceTimersByTime(5000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
        const timeout = result as MarketEventTimeoutResponse;
        expect(timeout.duration).toBe(5);
        expect(timeout.lastTickers['BTC-EUR']).toBeDefined();
        expect(timeout.lastTickers['BTC-EUR'].price).toBe(60000);
        expect(mockPool.unsubscribe).toHaveBeenCalledWith(
          'mock-subscription-id',
        );
      });

      it('should use default timeout of 55 seconds', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.LT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);

        // Wait for subscribe to complete
        await Promise.resolve();

        // Advance past timeout
        jest.advanceTimersByTime(55000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
        const timeout = result as MarketEventTimeoutResponse;
        expect(timeout.duration).toBe(55);
      });

      it('should not trigger twice if already resolved', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 5,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Trigger condition
        sendTicker(createTicker('BTC-EUR', { price: 66000 }));

        const result = await resultPromise;
        expect(result.status).toBe('triggered');

        // Additional tickers after resolution should not cause issues
        sendTicker(createTicker('BTC-EUR', { price: 67000 }));

        // Timeout should not override result
        jest.advanceTimersByTime(5000);

        // Result should still be triggered, not timeout
        expect(result.status).toBe('triggered');
      });

      it('should ignore timeout callback if already triggered', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Trigger just before timeout
        jest.advanceTimersByTime(900);
        sendTicker(createTicker('BTC-EUR', { price: 66000 }));

        // Let timeout fire (should be ignored)
        jest.advanceTimersByTime(200);

        const result = await resultPromise;
        expect(result.status).toBe('triggered');
      });
    });

    describe('triggered conditions', () => {
      it('should trigger on GT condition', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Simulate ticker that triggers
        sendTicker(createTicker('BTC-EUR', { price: 66000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.productId).toBe('BTC-EUR');
        expect(triggered.triggeredConditions).toHaveLength(1);
        expect(triggered.triggeredConditions[0].field).toBe('price');
        expect(triggered.triggeredConditions[0].operator).toBe('gt');
        expect(triggered.triggeredConditions[0].threshold).toBe(65000);
        expect(triggered.triggeredConditions[0].actualValue).toBe(66000);
        expect(triggered.ticker.price).toBe(66000);
        expect(mockPool.unsubscribe).toHaveBeenCalledWith(
          'mock-subscription-id',
        );
      });

      it('should trigger on GTE condition', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GTE,
                  value: 60000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        sendTicker(createTicker('BTC-EUR', { price: 60000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].actualValue).toBe(60000);
      });

      it('should trigger on LT condition', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.LT,
                  value: 55000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        sendTicker(createTicker('BTC-EUR', { price: 54000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].actualValue).toBe(54000);
      });

      it('should trigger on LTE condition', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.LTE,
                  value: 60000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        sendTicker(createTicker('BTC-EUR', { price: 60000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
      });
    });

    describe('crossAbove and crossBelow', () => {
      it('should trigger on CROSS_ABOVE when price crosses threshold upward', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_ABOVE,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // First ticker below threshold - should not trigger but store previous value
        sendTicker(createTicker('BTC-EUR', { price: 64000 }));

        // Verify not triggered yet
        jest.advanceTimersByTime(100);

        // Second ticker above threshold - should trigger
        sendTicker(createTicker('BTC-EUR', { price: 66000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].operator).toBe('crossAbove');
        expect(triggered.triggeredConditions[0].actualValue).toBe(66000);
      });

      it('should trigger on CROSS_BELOW when price crosses threshold downward', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_BELOW,
                  value: 60000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // First ticker above threshold
        sendTicker(createTicker('BTC-EUR', { price: 61000 }));

        jest.advanceTimersByTime(100);

        // Second ticker below threshold - should trigger
        sendTicker(createTicker('BTC-EUR', { price: 59000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].operator).toBe('crossBelow');
      });

      it('should not trigger CROSS_ABOVE without previous value', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_ABOVE,
                  value: 60000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // First ticker above threshold - but no previous value
        sendTicker(createTicker('BTC-EUR', { price: 65000 }));

        jest.advanceTimersByTime(1000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
      });

      it('should not trigger CROSS_BELOW without previous value', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_BELOW,
                  value: 60000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // First ticker below threshold - but no previous value
        sendTicker(createTicker('BTC-EUR', { price: 55000 }));

        jest.advanceTimersByTime(1000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
      });

      it('should not trigger CROSS_ABOVE when price stays above threshold', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_ABOVE,
                  value: 60000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Both tickers above threshold - no crossing
        sendTicker(createTicker('BTC-EUR', { price: 62000 }));
        jest.advanceTimersByTime(100);
        sendTicker(createTicker('BTC-EUR', { price: 63000 }));

        jest.advanceTimersByTime(1000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
      });

      it('should not trigger CROSS_BELOW when price stays below threshold', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_BELOW,
                  value: 60000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Both tickers below threshold - no crossing
        sendTicker(createTicker('BTC-EUR', { price: 58000 }));
        jest.advanceTimersByTime(100);
        sendTicker(createTicker('BTC-EUR', { price: 57000 }));

        jest.advanceTimersByTime(1000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
      });

      it('should clear previousValues on reconnect to prevent false crossAbove triggers', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_ABOVE,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 5,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // First ticker below threshold - stores previous value
        sendTicker(createTicker('BTC-EUR', { price: 64000 }));
        jest.advanceTimersByTime(100);

        // Simulate reconnect - should clear previousValues
        triggerReconnect();

        // Now price jumps above threshold - but should NOT trigger because previousValues was cleared
        sendTicker(createTicker('BTC-EUR', { price: 66000 }));
        jest.advanceTimersByTime(100);

        // Need another ticker to establish new previous value, then cross
        sendTicker(createTicker('BTC-EUR', { price: 64500 })); // below
        jest.advanceTimersByTime(100);
        sendTicker(createTicker('BTC-EUR', { price: 65500 })); // crosses above

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].actualValue).toBe(65500);
      });

      it('should clear previousValues on reconnect to prevent false crossBelow triggers', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_BELOW,
                  value: 60000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 5,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // First ticker above threshold - stores previous value
        sendTicker(createTicker('BTC-EUR', { price: 61000 }));
        jest.advanceTimersByTime(100);

        // Simulate reconnect - should clear previousValues
        triggerReconnect();

        // Price drops below - but should NOT trigger because previousValues was cleared
        sendTicker(createTicker('BTC-EUR', { price: 59000 }));
        jest.advanceTimersByTime(100);

        // Need another ticker to establish new previous value, then cross
        sendTicker(createTicker('BTC-EUR', { price: 60500 })); // above
        jest.advanceTimersByTime(100);
        sendTicker(createTicker('BTC-EUR', { price: 59500 })); // crosses below

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].actualValue).toBe(59500);
      });
    });

    describe('connection disconnect', () => {
      it('should return error response when connection permanently fails', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Receive some tickers before disconnect
        sendTicker(createTicker('BTC-EUR', { price: 60000 }));
        jest.advanceTimersByTime(100);

        // Simulate permanent disconnect
        triggerDisconnect('Connection failed after 5 reconnect attempts');

        const result = await resultPromise;

        expect(result.status).toBe('error');
        const error = result as MarketEventErrorResponse;
        expect(error.reason).toBe(
          'Connection failed after 5 reconnect attempts',
        );
        expect(error.lastTickers['BTC-EUR']).toBeDefined();
        expect(error.lastTickers['BTC-EUR'].price).toBe(60000);
        expect(mockPool.unsubscribe).toHaveBeenCalledWith(
          'mock-subscription-id',
        );
      });

      it('should return empty lastTickers if disconnect before any ticker', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Disconnect immediately without receiving any tickers
        triggerDisconnect('Network error');

        const result = await resultPromise;

        expect(result.status).toBe('error');
        const error = result as MarketEventErrorResponse;
        expect(error.reason).toBe('Network error');
        expect(Object.keys(error.lastTickers)).toHaveLength(0);
      });

      it('should ignore disconnect if already triggered', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Trigger condition first
        sendTicker(createTicker('BTC-EUR', { price: 66000 }));

        const result = await resultPromise;
        expect(result.status).toBe('triggered');

        // Disconnect after already triggered - should be ignored
        triggerDisconnect('Connection failed');

        // Result should still be triggered
        expect(result.status).toBe('triggered');
      });

      it('should ignore disconnect if already timed out', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Let timeout fire
        jest.advanceTimersByTime(1000);

        const result = await resultPromise;
        expect(result.status).toBe('timeout');

        // Disconnect after already timed out - should be ignored
        triggerDisconnect('Connection failed');

        // Result should still be timeout
        expect(result.status).toBe('timeout');
      });
    });

    describe('condition logic', () => {
      it('should trigger immediately on ANY logic when first condition matches', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
                {
                  field: ConditionField.VOLUME_24H,
                  operator: ConditionOperator.GT,
                  value: 2000000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Only price condition matches, volume doesn't
        sendTicker(
          createTicker('BTC-EUR', { price: 66000, volume24h: 1000000 }),
        );

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions).toHaveLength(1);
        expect(triggered.triggeredConditions[0].field).toBe('price');
      });

      it('should only trigger on ALL logic when all conditions match', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
                {
                  field: ConditionField.VOLUME_24H,
                  operator: ConditionOperator.GT,
                  value: 2000000,
                },
              ],
              logic: ConditionLogic.ALL,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Only price matches - should not trigger
        sendTicker(
          createTicker('BTC-EUR', { price: 66000, volume24h: 1000000 }),
        );

        jest.advanceTimersByTime(100);

        // Both conditions match - should trigger
        sendTicker(
          createTicker('BTC-EUR', { price: 66000, volume24h: 3000000 }),
        );

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions).toHaveLength(2);
      });

      it('should not trigger on ALL logic when only some conditions match', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 65000,
                },
                {
                  field: ConditionField.VOLUME_24H,
                  operator: ConditionOperator.GT,
                  value: 2000000,
                },
              ],
              logic: ConditionLogic.ALL,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Only price matches
        sendTicker(
          createTicker('BTC-EUR', { price: 66000, volume24h: 1000000 }),
        );

        jest.advanceTimersByTime(1000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
      });
    });

    describe('multiple subscriptions', () => {
      it('should trigger when any subscription matches', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 70000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              productId: 'ETH-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 4000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // BTC doesn't trigger
        sendTicker(createTicker('BTC-EUR', { price: 65000 }));

        jest.advanceTimersByTime(100);

        // ETH triggers
        sendTicker(createTicker('ETH-EUR', { price: 4500 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.productId).toBe('ETH-EUR');
      });

      it('should subscribe to all product IDs with onReconnect callback', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 70000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              productId: 'ETH-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.GT,
                  value: 4000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        jest.advanceTimersByTime(1000);

        await resultPromise;

        expect(mockPool.subscribe).toHaveBeenCalledWith(
          ['BTC-EUR', 'ETH-EUR'],
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
        );
      });

      it('should ignore tickers for unknown products', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.LT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // Ticker for unknown product - should be ignored
        sendTicker(createTicker('ETH-EUR', { price: 100 }));

        jest.advanceTimersByTime(1000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
      });

      it('should track previousValues separately per product for crossAbove', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_ABOVE,
                  value: 65000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              productId: 'ETH-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.CROSS_ABOVE,
                  value: 4000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 5,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // BTC below threshold - stores previous value for BTC only
        sendTicker(createTicker('BTC-EUR', { price: 64000 }));
        jest.advanceTimersByTime(100);

        // ETH above threshold - no previous value for ETH, should not trigger
        sendTicker(createTicker('ETH-EUR', { price: 4500 }));
        jest.advanceTimersByTime(100);

        // BTC crosses above - should trigger because BTC has previous value
        sendTicker(createTicker('BTC-EUR', { price: 66000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.productId).toBe('BTC-EUR');
        expect(triggered.triggeredConditions[0].operator).toBe('crossAbove');
      });
    });

    describe('different fields', () => {
      it('should evaluate VOLUME_24H field', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.VOLUME_24H,
                  operator: ConditionOperator.GT,
                  value: 2000000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        sendTicker(createTicker('BTC-EUR', { volume24h: 3000000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].field).toBe('volume24h');
        expect(triggered.triggeredConditions[0].actualValue).toBe(3000000);
      });

      it('should evaluate PERCENT_CHANGE_24H field', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PERCENT_CHANGE_24H,
                  operator: ConditionOperator.LT,
                  value: -5,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        sendTicker(createTicker('BTC-EUR', { percentChange24h: -7 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].field).toBe('percentChange24h');
      });

      it('should evaluate HIGH_24H field', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.HIGH_24H,
                  operator: ConditionOperator.GT,
                  value: 70000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        sendTicker(createTicker('BTC-EUR', { high24h: 72000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].field).toBe('high24h');
      });

      it('should evaluate LOW_24H field', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.LOW_24H,
                  operator: ConditionOperator.LT,
                  value: 55000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 55,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        sendTicker(createTicker('BTC-EUR', { low24h: 54000 }));

        const result = await resultPromise;

        expect(result.status).toBe('triggered');
        const triggered = result as MarketEventTriggeredResponse;
        expect(triggered.triggeredConditions[0].field).toBe('low24h');
      });
    });

    describe('timeout with last tickers', () => {
      it('should include last tickers for all products in timeout response', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.LT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
            {
              productId: 'ETH-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.LT,
                  value: 3000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        sendTicker(createTicker('BTC-EUR', { price: 60000 }));
        sendTicker(createTicker('ETH-EUR', { price: 4000 }));

        jest.advanceTimersByTime(1000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
        const timeout = result as MarketEventTimeoutResponse;
        expect(timeout.lastTickers['BTC-EUR'].price).toBe(60000);
        expect(timeout.lastTickers['ETH-EUR'].price).toBe(4000);
      });

      it('should return empty lastTickers if no tickers received', async () => {
        const request: WaitForMarketEventRequest = {
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [
                {
                  field: ConditionField.PRICE,
                  operator: ConditionOperator.LT,
                  value: 50000,
                },
              ],
              logic: ConditionLogic.ANY,
            },
          ],
          timeout: 1,
        };

        const resultPromise = service.waitForEvent(request);
        await Promise.resolve();

        // No tickers received

        jest.advanceTimersByTime(1000);

        const result = await resultPromise;

        expect(result.status).toBe('timeout');
        const timeout = result as MarketEventTimeoutResponse;
        expect(Object.keys(timeout.lastTickers)).toHaveLength(0);
      });
    });
  });

  describe('request schemas', () => {
    describe('ConditionSchema', () => {
      it('should validate valid condition', () => {
        const result = ConditionSchema.safeParse({
          field: 'price',
          operator: 'gt',
          value: 65000,
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid field', () => {
        const result = ConditionSchema.safeParse({
          field: 'invalid',
          operator: 'gt',
          value: 65000,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('SubscriptionSchema', () => {
      it('should validate valid subscription', () => {
        const result = SubscriptionSchema.safeParse({
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
        });
        expect(result.success).toBe(true);
      });

      it('should default logic to any', () => {
        const result = SubscriptionSchema.parse({
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
        });
        expect(result.logic).toBe('any');
      });

      it('should reject empty conditions array', () => {
        const result = SubscriptionSchema.safeParse({
          productId: 'BTC-EUR',
          conditions: [],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('WaitForMarketEventRequestSchema', () => {
      it('should validate valid request', () => {
        const result = WaitForMarketEventRequestSchema.safeParse({
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
            },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('should default timeout to 55', () => {
        const result = WaitForMarketEventRequestSchema.parse({
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
            },
          ],
        });
        expect(result.timeout).toBe(55);
      });

      it('should accept timeout greater than 55 (no upper limit)', () => {
        const result = WaitForMarketEventRequestSchema.safeParse({
          subscriptions: [
            {
              productId: 'BTC-EUR',
              conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
            },
          ],
          timeout: 300,
        });
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('timeout', 300);
      });
    });
  });

  describe('response schemas', () => {
    describe('TickerResponseSchema', () => {
      it('should validate valid ticker', () => {
        const result = TickerResponseSchema.safeParse({
          price: 60000,
          volume24h: 1000000,
          percentChange24h: 2.5,
          high24h: 62000,
          low24h: 58000,
          high52w: 100000,
          low52w: 30000,
          bestBid: 59900,
          bestAsk: 60100,
          bestBidQuantity: 1.5,
          bestAskQuantity: 2.0,
          timestamp: '2025-01-25T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('TriggeredConditionSchema', () => {
      it('should validate valid triggered condition', () => {
        const result = TriggeredConditionSchema.safeParse({
          field: 'price',
          operator: 'gt',
          threshold: 65000,
          actualValue: 66000,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('MarketEventTriggeredResponseSchema', () => {
      it('should validate valid triggered response', () => {
        const result = MarketEventTriggeredResponseSchema.safeParse({
          status: 'triggered',
          productId: 'BTC-EUR',
          triggeredConditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
            },
          ],
          ticker: {
            price: 66000,
            volume24h: 1000000,
            percentChange24h: 2.5,
            high24h: 67000,
            low24h: 65000,
            high52w: 100000,
            low52w: 30000,
            bestBid: 65900,
            bestAsk: 66100,
            bestBidQuantity: 1.5,
            bestAskQuantity: 2.0,
            timestamp: '2025-01-25T12:00:00.000Z',
          },
          timestamp: '2025-01-25T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('MarketEventTimeoutResponseSchema', () => {
      it('should validate valid timeout response', () => {
        const result = MarketEventTimeoutResponseSchema.safeParse({
          status: 'timeout',
          lastTickers: {
            'BTC-EUR': {
              price: 60000,
              volume24h: 1000000,
              percentChange24h: 2.5,
              high24h: 62000,
              low24h: 58000,
              high52w: 100000,
              low52w: 30000,
              bestBid: 59900,
              bestAsk: 60100,
              bestBidQuantity: 1.5,
              bestAskQuantity: 2.0,
              timestamp: '2025-01-25T12:00:00.000Z',
            },
          },
          duration: 55,
          timestamp: '2025-01-25T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('MarketEventErrorResponseSchema', () => {
      it('should validate valid error response', () => {
        const result = MarketEventErrorResponseSchema.safeParse({
          status: 'error',
          reason: 'Connection failed after 5 reconnect attempts',
          lastTickers: {
            'BTC-EUR': {
              price: 60000,
              volume24h: 1000000,
              percentChange24h: 2.5,
              high24h: 62000,
              low24h: 58000,
              high52w: 100000,
              low52w: 30000,
              bestBid: 59900,
              bestAsk: 60100,
              bestBidQuantity: 1.5,
              bestAskQuantity: 2.0,
              timestamp: '2025-01-25T12:00:00.000Z',
            },
          },
          timestamp: '2025-01-25T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
      });

      it('should validate error response with empty lastTickers', () => {
        const result = MarketEventErrorResponseSchema.safeParse({
          status: 'error',
          reason: 'Network error',
          lastTickers: {},
          timestamp: '2025-01-25T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('WaitForMarketEventResponseSchema', () => {
      it('should discriminate triggered response', () => {
        const result = WaitForMarketEventResponseSchema.safeParse({
          status: 'triggered',
          productId: 'BTC-EUR',
          triggeredConditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
            },
          ],
          ticker: {
            price: 66000,
            volume24h: 1000000,
            percentChange24h: 2.5,
            high24h: 67000,
            low24h: 65000,
            high52w: 100000,
            low52w: 30000,
            bestBid: 65900,
            bestAsk: 66100,
            bestBidQuantity: 1.5,
            bestAskQuantity: 2.0,
            timestamp: '2025-01-25T12:00:00.000Z',
          },
          timestamp: '2025-01-25T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
      });

      it('should discriminate timeout response', () => {
        const result = WaitForMarketEventResponseSchema.safeParse({
          status: 'timeout',
          lastTickers: {},
          duration: 55,
          timestamp: '2025-01-25T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
      });

      it('should discriminate error response', () => {
        const result = WaitForMarketEventResponseSchema.safeParse({
          status: 'error',
          reason: 'Connection failed',
          lastTickers: {},
          timestamp: '2025-01-25T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
      });
    });
  });
});
