import { jest } from '@jest/globals';

import { MarketEventService } from './MarketEventService';
import type { RealTimeData, ConnectionFailedCallback } from './RealTimeData';
import type { TechnicalIndicatorsService } from './TechnicalIndicatorsService';
import {
  isTickerField,
  type WaitForMarketEventRequest,
} from './MarketEventService.request';
import {
  ConditionOperator,
  ConditionLogic,
  TickerConditionField,
} from './MarketEventService.types';

// =============================================================================
// Tests
// =============================================================================

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
  let service: MarketEventService;
  let onConnectionFailed: ConnectionFailedCallback | undefined;

  beforeEach(() => {
    jest.useFakeTimers();

    const mockRealTimeData: Partial<RealTimeData> = {
      subscribeToTicker: jest.fn(
        (
          _productIds: readonly string[],
          _callback: unknown,
          onFail?: ConnectionFailedCallback,
        ) => {
          onConnectionFailed = onFail;
          // Simulate connection failure after a tick
          setTimeout(() => onFail?.('Connection failed'), 0);
          return Promise.resolve('sub-id');
        },
      ),
      subscribeToCandles: jest.fn(() => Promise.resolve('candle-sub-id')),
      unsubscribeFromTicker: jest.fn(),
      unsubscribeFromCandles: jest.fn(),
    };

    const mockIndicatorsService = {} as TechnicalIndicatorsService;

    service = new MarketEventService(
      mockRealTimeData as RealTimeData,
      mockIndicatorsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('waitForEvent', () => {
    it('should create a session and return its result', async () => {
      const request: WaitForMarketEventRequest = {
        timeout: 5,
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 100,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      };

      const resultPromise = service.waitForEvent(request);

      // Advance timer to trigger the connection failure (set in mock)
      await jest.advanceTimersByTimeAsync(10);

      const result = await resultPromise;

      // Session should return error because we simulated connection failure
      expect(result).toEqual(
        expect.objectContaining({
          status: 'error',
          reason: 'Connection failed',
        }),
      );
      // Verify onConnectionFailed was captured
      expect(onConnectionFailed).toBeDefined();
    });
  });
});
