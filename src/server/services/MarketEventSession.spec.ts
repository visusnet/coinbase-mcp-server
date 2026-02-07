import { jest } from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../../logger', () => ({
  logger,
}));

import { MarketEventSession } from './MarketEventSession';
import type { RealTimeData } from './RealTimeData';
import type { ConditionEvaluator } from './ConditionEvaluator';
import type { Ticker } from './MarketEventService.message';
import type { BufferedCandle } from './CandleBuffer';
import type { WaitForMarketEventRequest } from './MarketEventService.request';
import { Granularity } from './common.request';
import {
  ConditionOperator,
  ConditionLogic,
  TickerConditionField,
  IndicatorConditionField,
} from './MarketEventService.types';
import { MockedService } from '@test/serviceMocks';

// =============================================================================
// Test Helpers
// =============================================================================

type TickerCallback = (productId: string, ticker: Ticker) => void;
type CandleCallback = (
  productId: string,
  candles: readonly BufferedCandle[],
) => void;
type ConnectionFailedCallback = (reason: string) => void;

function createTicker(overrides: Partial<Ticker> = {}): Ticker {
  return {
    productId: 'BTC-USD',
    price: 100,
    volume24h: 1000000,
    percentChange24h: 2.5,
    high24h: 105,
    low24h: 95,
    high52w: 150,
    low52w: 50,
    bestBid: 99.9,
    bestAsk: 100.1,
    bestBidQuantity: 10,
    bestAskQuantity: 10,
    timestamp: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createRequest(
  overrides: Partial<WaitForMarketEventRequest> = {},
): WaitForMarketEventRequest {
  return {
    timeout: 60,
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
    ...overrides,
  };
}

interface MockRealTimeData {
  subscribeToTicker: jest.Mock<
    (
      productIds: readonly string[],
      callback: TickerCallback,
      onConnectionFailed?: ConnectionFailedCallback,
    ) => Promise<string>
  >;
  subscribeToCandles: jest.Mock<
    (
      productIds: readonly string[],
      granularity: Granularity,
      candleCount: number,
      callback: CandleCallback,
      onConnectionFailed?: ConnectionFailedCallback,
    ) => Promise<string>
  >;
  unsubscribeFromTicker: jest.Mock<(subscriptionId: string) => void>;
  unsubscribeFromCandles: jest.Mock<(subscriptionId: string) => void>;
  tickerCallback?: TickerCallback;
  tickerConnectionFailed?: ConnectionFailedCallback;
  candleCallbacks: Map<Granularity, CandleCallback>;
  candleConnectionFailed?: ConnectionFailedCallback;
}

function createMockRealTimeData(): MockRealTimeData {
  const candleCallbacks = new Map<Granularity, CandleCallback>();

  const mock: MockRealTimeData = {
    candleCallbacks,
    subscribeToTicker: jest.fn(
      (
        _productIds: readonly string[],
        callback: TickerCallback,
        onConnectionFailed?: ConnectionFailedCallback,
      ) => {
        mock.tickerCallback = callback;
        mock.tickerConnectionFailed = onConnectionFailed;
        return Promise.resolve('ticker-sub-id');
      },
    ),
    subscribeToCandles: jest.fn(
      (
        _productIds: readonly string[],
        granularity: Granularity,
        _candleCount: number,
        callback: CandleCallback,
        onConnectionFailed?: ConnectionFailedCallback,
      ) => {
        candleCallbacks.set(granularity, callback);
        mock.candleConnectionFailed = onConnectionFailed;
        return Promise.resolve(`candle-sub-id-${granularity}`);
      },
    ),
    unsubscribeFromTicker: jest.fn(),
    unsubscribeFromCandles: jest.fn(),
  };

  return mock;
}

function createMockConditionEvaluator(
  evaluateResults: Array<{ triggered: boolean; actualValue: number | null }> = [
    { triggered: true, actualValue: 105 },
  ],
): jest.Mocked<ConditionEvaluator> {
  return {
    evaluateConditions: jest.fn().mockReturnValue(
      evaluateResults.map((r) => ({
        field: TickerConditionField.Price,
        operator: ConditionOperator.GT,
        threshold: 100,
        actualValue: r.actualValue,
        triggered: r.triggered,
      })),
    ),
  } as unknown as jest.Mocked<ConditionEvaluator>;
}

// =============================================================================
// Tests
// =============================================================================

describe('MarketEventSession', () => {
  let mockRealTimeData: MockRealTimeData;
  let mockConditionEvaluator: MockedService<ConditionEvaluator>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockRealTimeData = createMockRealTimeData();
    mockConditionEvaluator = createMockConditionEvaluator();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('start()', () => {
    it('should subscribe to ticker for all products', async () => {
      const request = createRequest({
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
          {
            productId: 'ETH-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 50,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      // Start the session in background (don't await)
      const startPromise = session.start();

      // Simulate ticker update that triggers the condition
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      const result = await startPromise;

      expect(mockRealTimeData.subscribeToTicker).toHaveBeenCalledWith(
        ['BTC-USD', 'ETH-USD'],
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should subscribe to candles for indicator conditions', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Rsi,
                operator: ConditionOperator.LT,
                value: 30,
                granularity: Granularity.FIVE_MINUTE,
                period: 14,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      // Start the session in background
      const startPromise = session.start();

      // Wait for async subscriptions to complete
      await Promise.resolve();

      // Simulate candle update that triggers the condition
      const candles: BufferedCandle[] = [
        {
          productId: 'BTC-USD',
          start: 1704067200,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        },
      ];
      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        candles,
      );

      const result = await startPromise;

      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.FIVE_MINUTE,
        expect.any(Number),
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should not subscribe to candles when only ticker conditions exist', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 100,
              },
              {
                field: TickerConditionField.Volume24h,
                operator: ConditionOperator.GT,
                value: 500,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 105,
          triggered: true,
        },
        {
          field: TickerConditionField.Volume24h,
          operator: ConditionOperator.GT,
          threshold: 500,
          actualValue: 1000000,
          triggered: true,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      const result = await startPromise;

      // Should not subscribe to candles when no indicator conditions
      expect(mockRealTimeData.subscribeToCandles).not.toHaveBeenCalled();
      expect(result.status).toBe('triggered');
    });

    it('should not subscribe to ticker when only indicator conditions exist', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Rsi,
                operator: ConditionOperator.LT,
                value: 30,
                granularity: Granularity.FIVE_MINUTE,
                period: 14,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.LT,
          threshold: 30,
          actualValue: 25,
          triggered: true,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      // Trigger with candle data
      const candles: BufferedCandle[] = [
        {
          productId: 'BTC-USD',
          start: 1704067200,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        },
      ];
      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        candles,
      );

      const result = await startPromise;

      // Should not subscribe to ticker when no ticker conditions
      expect(mockRealTimeData.subscribeToTicker).not.toHaveBeenCalled();
      expect(result.status).toBe('triggered');
    });

    it('should calculate candle count for MACD conditions', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.MacdHistogram,
                operator: ConditionOperator.GT,
                value: 0,
                granularity: Granularity.FIVE_MINUTE,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        [],
      );

      const result = await startPromise;

      // MACD requires slowPeriod + signalPeriod = 26 + 9 = 35 candles
      // With 20% buffer: ceil(35 * 1.2) = 42
      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.FIVE_MINUTE,
        42,
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should calculate candle count for Bollinger Bands conditions', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.BollingerBands,
                operator: ConditionOperator.LT,
                value: 110,
                granularity: Granularity.ONE_HOUR,
                period: 20,
                stdDev: 2,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      mockRealTimeData.candleCallbacks.get(Granularity.ONE_HOUR)?.(
        'BTC-USD',
        [],
      );

      const result = await startPromise;

      // Bollinger requires period + 1 = 21 candles
      // With 20% buffer: ceil(21 * 1.2) = 26
      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.ONE_HOUR,
        26,
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should calculate candle count for SMA/EMA conditions', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Sma,
                operator: ConditionOperator.GT,
                value: 100,
                granularity: Granularity.ONE_DAY,
                period: 50,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      mockRealTimeData.candleCallbacks.get(Granularity.ONE_DAY)?.(
        'BTC-USD',
        [],
      );

      const result = await startPromise;

      // SMA requires period + 1 = 51 candles
      // With 20% buffer: ceil(51 * 1.2) = 62
      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.ONE_DAY,
        62,
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should calculate candle count for Stochastic conditions', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.StochasticD,
                operator: ConditionOperator.LT,
                value: 20,
                granularity: Granularity.FIFTEEN_MINUTE,
                kPeriod: 14,
                dPeriod: 3,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      mockRealTimeData.candleCallbacks.get(Granularity.FIFTEEN_MINUTE)?.(
        'BTC-USD',
        [],
      );

      const result = await startPromise;

      // Stochastic requires kPeriod + dPeriod = 14 + 3 = 17 candles
      // With 20% buffer: ceil(17 * 1.2) = 21
      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.FIFTEEN_MINUTE,
        21,
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should calculate candle count for EMA conditions', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Ema,
                operator: ConditionOperator.GT,
                value: 100,
                granularity: Granularity.ONE_HOUR,
                period: 50,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      mockRealTimeData.candleCallbacks.get(Granularity.ONE_HOUR)?.(
        'BTC-USD',
        [],
      );

      const result = await startPromise;

      // EMA requires period + 1 = 50 + 1 = 51 candles
      // With 20% buffer: ceil(51 * 1.2) = 62
      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.ONE_HOUR,
        62,
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should calculate candle count for MACD line condition', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Macd,
                operator: ConditionOperator.GT,
                value: 0,
                granularity: Granularity.FIVE_MINUTE,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        [],
      );

      const result = await startPromise;

      // MACD requires slowPeriod + signalPeriod = 26 + 9 = 35 candles
      // With 20% buffer: ceil(35 * 1.2) = 42
      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.FIVE_MINUTE,
        42,
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should calculate candle count for MACD signal condition', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.MacdSignal,
                operator: ConditionOperator.GT,
                value: 0,
                granularity: Granularity.FIVE_MINUTE,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        [],
      );

      const result = await startPromise;

      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.FIVE_MINUTE,
        42,
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });

    it('should calculate candle count for Stochastic %K condition', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Stochastic,
                operator: ConditionOperator.GT,
                value: 80,
                granularity: Granularity.FIFTEEN_MINUTE,
                kPeriod: 14,
                dPeriod: 3,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      mockRealTimeData.candleCallbacks.get(Granularity.FIFTEEN_MINUTE)?.(
        'BTC-USD',
        [],
      );

      const result = await startPromise;

      // Stochastic requires kPeriod + dPeriod = 14 + 3 = 17 candles
      // With 20% buffer: ceil(17 * 1.2) = 21
      expect(mockRealTimeData.subscribeToCandles).toHaveBeenCalledWith(
        ['BTC-USD'],
        Granularity.FIFTEEN_MINUTE,
        21,
        expect.any(Function),
        expect.any(Function),
      );
      expect(result.status).toBe('triggered');
    });
  });

  describe('trace logging', () => {
    it('should log condition evaluations when trace level is enabled', async () => {
      logger.streaming.isLevelEnabled.mockReturnValue(true);

      const request = createRequest();
      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 105,
          triggered: true,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      await startPromise;

      expect(logger.streaming.trace).toHaveBeenCalledWith(
        {
          productId: 'BTC-USD',
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 105,
          triggered: true,
        },
        'Condition evaluated',
      );
    });
  });

  describe('triggered response', () => {
    it('should return triggered status when condition is met', async () => {
      const request = createRequest();
      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 105,
          triggered: true,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      const result = await startPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'triggered',
          productId: 'BTC-USD',
          conditions: [
            {
              field: TickerConditionField.Price,
              operator: ConditionOperator.GT,
              threshold: 100,
              actualValue: 105,
              triggered: true,
            },
          ],
        }),
      );
    });

    it('should evaluate with ANY logic (some conditions must trigger)', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 100,
              },
              {
                field: TickerConditionField.Volume24h,
                operator: ConditionOperator.GT,
                value: 2000000,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 105,
          triggered: true,
        },
        {
          field: TickerConditionField.Volume24h,
          operator: ConditionOperator.GT,
          threshold: 2000000,
          actualValue: 1000000,
          triggered: false,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      const result = await startPromise;

      expect(result.status).toBe('triggered');
    });

    it('should evaluate with ALL logic (all conditions must trigger)', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 100,
              },
              {
                field: TickerConditionField.Volume24h,
                operator: ConditionOperator.GT,
                value: 500000,
              },
            ],
            logic: ConditionLogic.ALL,
          },
        ],
      });

      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 105,
          triggered: true,
        },
        {
          field: TickerConditionField.Volume24h,
          operator: ConditionOperator.GT,
          threshold: 500000,
          actualValue: 1000000,
          triggered: true,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      const result = await startPromise;

      expect(result.status).toBe('triggered');
    });

    it('should not trigger with ALL logic when only some conditions match', async () => {
      const request = createRequest({
        timeout: 1, // Short timeout for test
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 100,
              },
              {
                field: TickerConditionField.Volume24h,
                operator: ConditionOperator.GT,
                value: 2000000,
              },
            ],
            logic: ConditionLogic.ALL,
          },
        ],
      });

      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 105,
          triggered: true,
        },
        {
          field: TickerConditionField.Volume24h,
          operator: ConditionOperator.GT,
          threshold: 2000000,
          actualValue: 1000000,
          triggered: false, // This one doesn't trigger
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      // Advance timer to trigger timeout
      await jest.advanceTimersByTimeAsync(1100);

      const result = await startPromise;

      expect(result.status).toBe('timeout');
    });
  });

  describe('timeout response', () => {
    it('should return timeout status when timeout is reached', async () => {
      const request = createRequest({ timeout: 5 });

      // No conditions trigger
      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 95,
          triggered: false,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // Simulate a ticker update that doesn't trigger
      mockRealTimeData.tickerCallback?.('BTC-USD', createTicker({ price: 95 }));

      // Advance timer past timeout
      await jest.advanceTimersByTimeAsync(6000);

      const result = await startPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'timeout',
          duration: 5,
        }),
      );
    });
  });

  describe('error response', () => {
    it('should return error status when connection fails', async () => {
      const request = createRequest();

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // Simulate connection failure
      mockRealTimeData.tickerConnectionFailed?.('WebSocket disconnected');

      const result = await startPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'error',
          reason: 'WebSocket disconnected',
        }),
      );
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from ticker on completion', async () => {
      const request = createRequest();

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      await startPromise;

      expect(mockRealTimeData.unsubscribeFromTicker).toHaveBeenCalledWith(
        'ticker-sub-id',
      );
    });

    it('should unsubscribe from candles on completion', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Rsi,
                operator: ConditionOperator.LT,
                value: 30,
                granularity: Granularity.FIVE_MINUTE,
                period: 14,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // Wait for async subscriptions to complete
      await Promise.resolve();

      const candles: BufferedCandle[] = [
        {
          productId: 'BTC-USD',
          start: 1704067200,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        },
      ];
      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        candles,
      );

      await startPromise;

      expect(mockRealTimeData.unsubscribeFromCandles).toHaveBeenCalledWith(
        `candle-sub-id-${Granularity.FIVE_MINUTE}`,
      );
    });

    it('should clear timeout on completion', async () => {
      const request = createRequest({ timeout: 60 });

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      await startPromise;

      // Verify no pending timers (timeout should be cleared)
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('state tracking', () => {
    it('should track previous ticker for cross conditions', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.CROSS_ABOVE,
                value: 100,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      // First call: no trigger (first update, no previous)
      // Second call: trigger (crossing threshold)
      mockConditionEvaluator.evaluateConditions
        .mockReturnValueOnce([
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.CROSS_ABOVE,
            threshold: 100,
            actualValue: 95,
            triggered: false,
          },
        ])
        .mockReturnValueOnce([
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.CROSS_ABOVE,
            threshold: 100,
            actualValue: 105,
            triggered: true,
          },
        ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // First ticker update (below threshold)
      mockRealTimeData.tickerCallback?.('BTC-USD', createTicker({ price: 95 }));

      // Second ticker update (above threshold) - should trigger CROSS_ABOVE
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      const result = await startPromise;

      expect(result.status).toBe('triggered');
      // Verify evaluator was called twice
      expect(mockConditionEvaluator.evaluateConditions).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should track previous candles for indicator cross conditions', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Rsi,
                operator: ConditionOperator.CROSS_ABOVE,
                value: 30,
                granularity: Granularity.FIVE_MINUTE,
                period: 14,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      // First call: no trigger (RSI = 25, below threshold)
      // Second call: trigger (RSI = 35, crossing threshold)
      mockConditionEvaluator.evaluateConditions
        .mockReturnValueOnce([
          {
            field: IndicatorConditionField.Rsi,
            operator: ConditionOperator.CROSS_ABOVE,
            threshold: 30,
            actualValue: 25,
            triggered: false,
          },
        ])
        .mockReturnValueOnce([
          {
            field: IndicatorConditionField.Rsi,
            operator: ConditionOperator.CROSS_ABOVE,
            threshold: 30,
            actualValue: 35,
            triggered: true,
          },
        ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // Wait for async subscriptions to complete
      await Promise.resolve();

      const createCandles = (): BufferedCandle[] => [
        {
          productId: 'BTC-USD',
          start: 1704067200,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        },
      ];

      // First candle update
      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        createCandles(),
      );

      // Second candle update - should trigger CROSS_ABOVE
      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        createCandles(),
      );

      const result = await startPromise;

      expect(result.status).toBe('triggered');
      expect(mockConditionEvaluator.evaluateConditions).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe('multiple subscriptions', () => {
    it('should evaluate all subscriptions and trigger on first match', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 200,
              }, // Won't match
            ],
            logic: ConditionLogic.ANY,
          },
          {
            productId: 'ETH-USD',
            conditions: [
              {
                field: TickerConditionField.Price,
                operator: ConditionOperator.GT,
                value: 50,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      // First subscription doesn't trigger, second does
      mockConditionEvaluator.evaluateConditions
        .mockReturnValueOnce([
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            threshold: 200,
            actualValue: 100,
            triggered: false,
          },
        ])
        .mockReturnValueOnce([
          {
            field: TickerConditionField.Price,
            operator: ConditionOperator.GT,
            threshold: 50,
            actualValue: 75,
            triggered: true,
          },
        ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 100 }),
      );

      const result = await startPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'triggered',
          productId: 'ETH-USD',
          conditions: [
            {
              field: TickerConditionField.Price,
              operator: ConditionOperator.GT,
              threshold: 50,
              actualValue: 75,
              triggered: true,
            },
          ],
        }),
      );
    });
  });

  describe('idempotency', () => {
    it('should ignore updates after session is resolved', async () => {
      const request = createRequest();

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // First update triggers
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      // This should be ignored (session already resolved)
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 110 }),
      );
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 115 }),
      );

      await startPromise;

      // Evaluator should only be called once (first update that triggered)
      expect(mockConditionEvaluator.evaluateConditions).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should ignore candle callbacks after session is resolved', async () => {
      const request = createRequest({
        subscriptions: [
          {
            productId: 'BTC-USD',
            conditions: [
              {
                field: IndicatorConditionField.Rsi,
                operator: ConditionOperator.LT,
                value: 30,
                granularity: Granularity.FIVE_MINUTE,
                period: 14,
              },
            ],
            logic: ConditionLogic.ANY,
          },
        ],
      });

      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.LT,
          threshold: 30,
          actualValue: 25,
          triggered: true,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();
      await Promise.resolve();

      // First candle callback triggers the condition
      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        [],
      );

      // These should be ignored (session already resolved)
      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        [],
      );
      mockRealTimeData.candleCallbacks.get(Granularity.FIVE_MINUTE)?.(
        'BTC-USD',
        [],
      );

      await startPromise;

      // Evaluator should only be called once
      expect(mockConditionEvaluator.evaluateConditions).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should complete only once when called multiple times', async () => {
      const request = createRequest();

      mockConditionEvaluator.evaluateConditions.mockReturnValue([
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          threshold: 100,
          actualValue: 105,
          triggered: true,
        },
      ]);

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // Multiple ticker updates that all trigger
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 110 }),
      );
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 115 }),
      );

      const result = await startPromise;

      // Should still return triggered status (first trigger)
      expect(result).toEqual(
        expect.objectContaining({
          status: 'triggered',
          productId: 'BTC-USD',
          conditions: [
            {
              field: TickerConditionField.Price,
              operator: ConditionOperator.GT,
              threshold: 100,
              actualValue: 105,
              triggered: true,
            },
          ],
        }),
      );
    });

    it('should return error if subscribe() throws with Error', async () => {
      const request = createRequest();

      // Make subscribeToTicker reject with an Error
      mockRealTimeData.subscribeToTicker.mockRejectedValueOnce(
        new Error('Connection refused'),
      );

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // Let the rejection propagate
      await Promise.resolve();
      await Promise.resolve();

      const result = await startPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'error',
          reason: 'Connection refused',
        }),
      );
    });

    it('should return error if subscribe() throws with non-Error value', async () => {
      const request = createRequest();

      // Make subscribeToTicker reject with a string (non-Error)
      mockRealTimeData.subscribeToTicker.mockRejectedValueOnce(
        'Network failure',
      );

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // Let the rejection propagate
      await Promise.resolve();
      await Promise.resolve();

      const result = await startPromise;

      expect(result).toEqual(
        expect.objectContaining({
          status: 'error',
          reason: 'Network failure',
        }),
      );
    });

    it('should ignore duplicate complete() calls after already resolved', async () => {
      const request = createRequest();

      const session = new MarketEventSession(
        request,
        mockRealTimeData as unknown as RealTimeData,
        mockConditionEvaluator as unknown as ConditionEvaluator,
      );

      const startPromise = session.start();

      // First trigger
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 105 }),
      );

      // Second trigger (should be ignored)
      mockRealTimeData.tickerCallback?.(
        'BTC-USD',
        createTicker({ price: 110 }),
      );

      // Connection failure after already triggered (should also be ignored)
      mockRealTimeData.tickerConnectionFailed?.('Network error');

      const result = await startPromise;

      // Should still return the first triggered result with price 105
      expect(result).toEqual(
        expect.objectContaining({
          status: 'triggered',
          productId: 'BTC-USD',
          conditions: [
            expect.objectContaining({
              actualValue: 105,
            }),
          ],
        }),
      );
    });
  });
});
