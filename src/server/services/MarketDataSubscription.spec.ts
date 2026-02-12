import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../../logger', () => ({
  logger,
}));

import { MarketDataSubscription } from './MarketDataSubscription';
import type { MarketDataPool } from './MarketDataPool';
import type { ConditionEvaluator } from './ConditionEvaluator';
import type { Subscription as SubscriptionConfig } from './MarketEventService.request';
import type { ConditionResult } from './MarketEventService.response';
import type { Ticker } from './MarketEventService.message';
import type { BufferedCandle } from './CandleBuffer';
import { Granularity } from './common.request';
import {
  ConditionLogic,
  ConditionOperator,
  IndicatorConditionField,
  TickerConditionField,
} from './MarketEventService.types';

// =============================================================================
// Mock Factories
// =============================================================================

type TickerCallback = (ticker: Ticker) => void;
type CandleCallback = (candles: readonly BufferedCandle[]) => void;
type DisconnectCallback = (reason: string) => void;

interface MockPool {
  subscribeToTicker: jest.Mock<
    (
      productId: string,
      cb: TickerCallback,
      onDisconnect?: DisconnectCallback,
    ) => string
  >;
  subscribeToCandles: jest.Mock<
    (
      productId: string,
      gran: Granularity,
      count: number,
      cb: CandleCallback,
      onDisconnect?: DisconnectCallback,
    ) => string
  >;
  unsubscribe: jest.Mock<(id: string) => void>;
  emitTicker: TickerCallback;
  emitCandles: (
    granularity: Granularity,
    candles: readonly BufferedCandle[],
  ) => void;
  emitDisconnect: DisconnectCallback;
}

function createMockPool(): MockPool {
  let subCounter = 0;
  let tickerCb: TickerCallback | undefined;
  let disconnectCb: DisconnectCallback | undefined;
  const candleCbs = new Map<Granularity, CandleCallback>();

  const pool: MockPool = {
    subscribeToTicker: jest.fn((_, cb, onDisconnect) => {
      tickerCb = cb;
      disconnectCb = onDisconnect;
      return `ticker-sub-${++subCounter}`;
    }),
    subscribeToCandles: jest.fn((_, granularity, _count, cb, onDisconnect) => {
      candleCbs.set(granularity, cb);
      disconnectCb = onDisconnect;
      return `candle-sub-${++subCounter}`;
    }),
    unsubscribe: jest.fn(),
    emitTicker(ticker: Ticker): void {
      if (!tickerCb) {
        throw new Error('No ticker callback captured');
      }
      tickerCb(ticker);
    },
    emitCandles(
      granularity: Granularity,
      candles: readonly BufferedCandle[],
    ): void {
      const cb = candleCbs.get(granularity);
      if (!cb) {
        throw new Error(`No candle callback for ${granularity}`);
      }
      cb(candles);
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
  jest.fn<ConditionEvaluator['evaluateConditions']>();

function createMockEvaluator(): jest.Mocked<ConditionEvaluator> {
  evaluateConditionsMock.mockReset();
  return {
    evaluateConditions: evaluateConditionsMock,
  } as unknown as jest.Mocked<ConditionEvaluator>;
}

function makeTicker(price: number): Ticker {
  return {
    productId: 'BTC-USD',
    price,
    volume24h: 1000,
    percentChange24h: 2.5,
    high24h: 52000,
    low24h: 48000,
    high52w: 70000,
    low52w: 15000,
    bestBid: price - 1,
    bestAsk: price + 1,
    bestBidQuantity: 10,
    bestAskQuantity: 10,
    timestamp: '2026-02-11T12:00:00Z',
  };
}

function makeCandles(count: number): BufferedCandle[] {
  return Array.from({ length: count }, (_, i) => ({
    start: 1000 + i * 300,
    open: 50000 + i,
    high: 50100 + i,
    low: 49900 + i,
    close: 50050 + i,
    volume: 100 + i,
    productId: 'BTC-USD',
  }));
}

function triggeredConditionResult(
  field:
    | TickerConditionField
    | IndicatorConditionField = TickerConditionField.Price,
): ConditionResult {
  return {
    field,
    operator: ConditionOperator.GT,
    threshold: 50000,
    actualValue: 51000,
    triggered: true,
  };
}

function notTriggeredConditionResult(
  field:
    | TickerConditionField
    | IndicatorConditionField = TickerConditionField.Price,
): ConditionResult {
  return {
    field,
    operator: ConditionOperator.GT,
    threshold: 50000,
    actualValue: 49000,
    triggered: false,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('MarketDataSubscription', () => {
  let mockPool: MockPool;
  let mockEvaluator: jest.Mocked<ConditionEvaluator>;

  beforeEach(() => {
    mockPool = createMockPool();
    mockEvaluator = createMockEvaluator();
  });

  // ---------------------------------------------------------------------------
  // start() — subscribing to data
  // ---------------------------------------------------------------------------

  describe('start', () => {
    it('should subscribe to ticker when conditions include ticker fields', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      expect(mockPool.subscribeToTicker).toHaveBeenCalledWith(
        'BTC-USD',
        expect.any(Function),
        expect.any(Function),
      );
      expect(mockPool.subscribeToCandles).not.toHaveBeenCalled();
    });

    it('should not subscribe to ticker when only indicator conditions', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14,
            operator: ConditionOperator.LT,
            value: 30,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      expect(mockPool.subscribeToTicker).not.toHaveBeenCalled();
      expect(mockPool.subscribeToCandles).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to candles per granularity for indicator conditions', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14,
            operator: ConditionOperator.LT,
            value: 30,
          },
          {
            field: IndicatorConditionField.Sma,
            granularity: Granularity.ONE_HOUR,
            period: 20,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      expect(mockPool.subscribeToCandles).toHaveBeenCalledTimes(2);
      expect(mockPool.subscribeToCandles).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        expect.any(Number),
        expect.any(Function),
        expect.any(Function),
      );
      expect(mockPool.subscribeToCandles).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.ONE_HOUR,
        expect.any(Number),
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should subscribe to both ticker and candles when mixed conditions', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14,
            operator: ConditionOperator.LT,
            value: 30,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      expect(mockPool.subscribeToTicker).toHaveBeenCalledTimes(1);
      expect(mockPool.subscribeToCandles).toHaveBeenCalledTimes(1);
    });

    it('should calculate candle count with 20% buffer', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14, // needs 15 candles → 18 with 20% buffer
            operator: ConditionOperator.LT,
            value: 30,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      expect(mockPool.subscribeToCandles).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        18, // ceil(15 * 1.2)
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should use maximum candle count when multiple indicators share granularity', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14, // needs 15 candles
            operator: ConditionOperator.LT,
            value: 30,
          },
          {
            field: IndicatorConditionField.Sma,
            granularity: Granularity.FIVE_MINUTE,
            period: 50, // needs 51 candles → 62 with 20% buffer
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      // Should use the larger requirement (51 * 1.2 = 61.2 → 62)
      expect(mockPool.subscribeToCandles).toHaveBeenCalledTimes(1);
      expect(mockPool.subscribeToCandles).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        62,
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should calculate candle count for MACD conditions', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Macd,
            granularity: Granularity.FIVE_MINUTE,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            operator: ConditionOperator.GT,
            value: 0,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      // MACD: slowPeriod + signalPeriod = 26 + 9 = 35, ceil(35 * 1.2) = 42
      expect(mockPool.subscribeToCandles).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        42,
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should calculate candle count for Bollinger Bands conditions', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.BollingerBands,
            granularity: Granularity.FIVE_MINUTE,
            period: 20,
            stdDev: 2,
            operator: ConditionOperator.LT,
            value: 55000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      // Bollinger: period + 1 = 21, ceil(21 * 1.2) = 26 (25.2 → 26)
      expect(mockPool.subscribeToCandles).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        26,
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should calculate candle count for Stochastic conditions', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Stochastic,
            granularity: Granularity.FIVE_MINUTE,
            kPeriod: 14,
            dPeriod: 3,
            operator: ConditionOperator.LT,
            value: 20,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      // Stochastic: kPeriod + dPeriod = 14 + 3 = 17, ceil(17 * 1.2) = 21 (20.4 → 21)
      expect(mockPool.subscribeToCandles).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        21,
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should calculate candle count for EMA conditions', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Ema,
            granularity: Granularity.FIVE_MINUTE,
            period: 30,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      // EMA: period + 1 = 31, ceil(31 * 1.2) = 38 (37.2 → 38)
      expect(mockPool.subscribeToCandles).toHaveBeenCalledWith(
        'BTC-USD',
        Granularity.FIVE_MINUTE,
        38,
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Condition evaluation
  // ---------------------------------------------------------------------------

  describe('condition evaluation', () => {
    it('should evaluate conditions on ticker update', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([notTriggeredConditionResult()]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      // Simulate ticker data
      mockPool.emitTicker(makeTicker(49000));

      expect(evaluateConditionsMock).toHaveBeenCalledWith(
        config.conditions,
        makeTicker(49000),
        null, // no previous ticker yet
        null, // no candles
        null, // no previous candles
      );
    });

    it('should track previous ticker for crossAbove/crossBelow', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.CROSS_ABOVE,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([notTriggeredConditionResult()]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      const firstTicker = makeTicker(49000);
      const secondTicker = makeTicker(51000);

      mockPool.emitTicker(firstTicker);
      mockPool.emitTicker(secondTicker);

      // Second call should have the first ticker as previousTicker
      expect(evaluateConditionsMock).toHaveBeenLastCalledWith(
        config.conditions,
        secondTicker,
        firstTicker,
        null,
        null,
      );
    });

    it('should evaluate conditions on candle update', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14,
            operator: ConditionOperator.LT,
            value: 30,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([
        notTriggeredConditionResult(IndicatorConditionField.Rsi),
      ]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      const candles = makeCandles(18);
      mockPool.emitCandles(Granularity.FIVE_MINUTE, candles);

      expect(evaluateConditionsMock).toHaveBeenCalledWith(
        config.conditions,
        null, // no ticker
        null, // no previous ticker
        new Map([[Granularity.FIVE_MINUTE, candles]]),
        null, // no previous candles
      );
    });

    it('should track previous candles for crossAbove/crossBelow', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14,
            operator: ConditionOperator.CROSS_BELOW,
            value: 30,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([
        notTriggeredConditionResult(IndicatorConditionField.Rsi),
      ]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      const firstCandles = makeCandles(18);
      const secondCandles = makeCandles(18);
      mockPool.emitCandles(Granularity.FIVE_MINUTE, firstCandles);
      mockPool.emitCandles(Granularity.FIVE_MINUTE, secondCandles);

      expect(evaluateConditionsMock).toHaveBeenLastCalledWith(
        config.conditions,
        null,
        null,
        new Map([[Granularity.FIVE_MINUTE, secondCandles]]),
        new Map([[Granularity.FIVE_MINUTE, firstCandles]]),
      );
    });

    it('should resolve promise when conditions trigger with ANY logic', async () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
          {
            field: TickerConditionField.Volume24h,
            operator: ConditionOperator.GT,
            value: 5000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      // First tick: nothing triggers
      evaluateConditionsMock.mockReturnValueOnce([
        notTriggeredConditionResult(TickerConditionField.Price),
        notTriggeredConditionResult(TickerConditionField.Volume24h),
      ]);

      // Second tick: price triggers (but not volume)
      evaluateConditionsMock.mockReturnValueOnce([
        triggeredConditionResult(TickerConditionField.Price),
        notTriggeredConditionResult(TickerConditionField.Volume24h),
      ]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitTicker(makeTicker(49000));
      mockPool.emitTicker(makeTicker(51000));

      // Promise should resolve (not hang)
      await sub.promise;

      expect(sub.result.triggered).toBe(true);
    });

    it('should resolve promise when all conditions trigger with ALL logic', async () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
          {
            field: TickerConditionField.Volume24h,
            operator: ConditionOperator.GT,
            value: 5000,
          },
        ],
        logic: ConditionLogic.ALL,
      };

      // Only price triggers — not enough for ALL
      evaluateConditionsMock.mockReturnValueOnce([
        triggeredConditionResult(TickerConditionField.Price),
        notTriggeredConditionResult(TickerConditionField.Volume24h),
      ]);

      // Both trigger
      evaluateConditionsMock.mockReturnValueOnce([
        triggeredConditionResult(TickerConditionField.Price),
        triggeredConditionResult(TickerConditionField.Volume24h),
      ]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitTicker(makeTicker(51000));

      // After first tick, should NOT be triggered
      expect(sub.result.triggered).toBe(false);

      mockPool.emitTicker(makeTicker(52000));

      await sub.promise;
      expect(sub.result.triggered).toBe(true);
    });

    it('should not resolve when only some conditions trigger with ALL logic', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
          {
            field: TickerConditionField.Volume24h,
            operator: ConditionOperator.GT,
            value: 5000,
          },
        ],
        logic: ConditionLogic.ALL,
      };

      evaluateConditionsMock.mockReturnValue([
        triggeredConditionResult(TickerConditionField.Price),
        notTriggeredConditionResult(TickerConditionField.Volume24h),
      ]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitTicker(makeTicker(51000));

      expect(sub.result.triggered).toBe(false);
    });

    it('should ignore data after triggered', async () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([triggeredConditionResult()]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitTicker(makeTicker(51000));
      await sub.promise;

      // Send more data — should be ignored
      mockPool.emitTicker(makeTicker(52000));

      expect(evaluateConditionsMock).toHaveBeenCalledTimes(1);
    });

    it('should ignore candle data after triggered', async () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14,
            operator: ConditionOperator.LT,
            value: 30,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([
        triggeredConditionResult(IndicatorConditionField.Rsi),
      ]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitCandles(Granularity.FIVE_MINUTE, makeCandles(18));
      await sub.promise;

      // Send more candle data — should be ignored
      mockPool.emitCandles(Granularity.FIVE_MINUTE, makeCandles(18));

      expect(evaluateConditionsMock).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // result
  // ---------------------------------------------------------------------------

  describe('result', () => {
    it('should return initial not-triggered result before any data', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );

      expect(sub.result).toEqual({
        productId: 'BTC-USD',
        triggered: false,
        conditions: [],
      });
    });

    it('should return latest evaluation result', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const expectedResult: ConditionResult[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 50000,
          actualValue: 49500,
          triggered: false,
        },
      ];

      evaluateConditionsMock.mockReturnValue(expectedResult);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitTicker(makeTicker(49500));

      expect(sub.result).toEqual({
        productId: 'BTC-USD',
        triggered: false,
        conditions: expectedResult,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // cleanup
  // ---------------------------------------------------------------------------

  describe('cleanup', () => {
    it('should unsubscribe all subscriptions', () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
          {
            field: IndicatorConditionField.Rsi,
            granularity: Granularity.FIVE_MINUTE,
            period: 14,
            operator: ConditionOperator.LT,
            value: 30,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();
      sub.cleanup();

      expect(mockPool.unsubscribe).toHaveBeenCalledTimes(2);
      expect(mockPool.unsubscribe).toHaveBeenCalledWith('ticker-sub-1');
      expect(mockPool.unsubscribe).toHaveBeenCalledWith('candle-sub-2');
    });
  });

  // ---------------------------------------------------------------------------
  // Disconnect handling
  // ---------------------------------------------------------------------------

  describe('disconnect', () => {
    it('should resolve with disconnected and set reason', async () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitDisconnect('Authentication failed');

      await expect(sub.promise).rejects.toThrow('Authentication failed');
    });

    it('should ignore disconnect after triggered', async () => {
      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([triggeredConditionResult()]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitTicker(makeTicker(51000));
      await sub.promise;

      // Disconnect after trigger — should be ignored (promise already resolved)
      mockPool.emitDisconnect('Connection lost');

      // Promise resolved (not rejected) — trigger wins
      await expect(sub.promise).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Trace logging
  // ---------------------------------------------------------------------------

  describe('trace logging', () => {
    it('should log condition evaluation when trace enabled', () => {
      logger.streaming.isLevelEnabled.mockReturnValue(true);

      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      const condResult = notTriggeredConditionResult();
      evaluateConditionsMock.mockReturnValue([condResult]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitTicker(makeTicker(49000));

      expect(logger.streaming.trace).toHaveBeenCalledWith(
        {
          productId: 'BTC-USD',
          field: condResult.field,
          operator: condResult.operator,
          threshold: condResult.threshold,
          actualValue: condResult.actualValue,
          triggered: condResult.triggered,
        },
        'Condition evaluated',
      );
    });

    it('should not log when trace disabled', () => {
      logger.streaming.isLevelEnabled.mockReturnValue(false);

      const config: SubscriptionConfig = {
        productId: 'BTC-USD',
        conditions: [
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            value: 50000,
          },
        ],
        logic: ConditionLogic.ANY,
      };

      evaluateConditionsMock.mockReturnValue([notTriggeredConditionResult()]);

      const sub = new MarketDataSubscription(
        config,
        mockPool as unknown as MarketDataPool,
        mockEvaluator,
      );
      sub.start();

      mockPool.emitTicker(makeTicker(49000));

      expect(logger.streaming.trace).not.toHaveBeenCalled();
    });
  });
});
