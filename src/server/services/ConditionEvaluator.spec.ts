import { jest } from '@jest/globals';
import { mockTechnicalIndicatorsService } from '@test/serviceMocks';
import { ConditionEvaluator } from './ConditionEvaluator';
import type { Ticker } from './MarketEventService.message';
import type { CandleInput } from './common.response';
import { Granularity } from './common.request';
import type { Condition } from './MarketEventService.request';
import {
  ConditionOperator,
  IndicatorConditionField,
  TickerConditionField,
} from './MarketEventService.types';
import type { TechnicalIndicatorsService } from './TechnicalIndicatorsService';

// =============================================================================
// Test Helpers
// =============================================================================

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

function createCandles(count: number): CandleInput[] {
  return Array.from({ length: count }, (_, i) => ({
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
    volume: 1000,
  }));
}

function createCandlesByGranularity(
  granularity: Granularity,
  count: number,
): Map<Granularity, readonly CandleInput[]> {
  return new Map([[granularity, createCandles(count)]]);
}

// =============================================================================
// Tests
// =============================================================================

describe('ConditionEvaluator', () => {
  let evaluator: ConditionEvaluator;

  beforeEach(() => {
    jest.clearAllMocks();
    evaluator = new ConditionEvaluator(
      null as unknown as TechnicalIndicatorsService,
    );
  });

  describe('ticker conditions', () => {
    it('should evaluate price GT condition as triggered', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          value: 99,
        },
      ];
      const ticker = createTicker({ price: 100 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        field: TickerConditionField.Price,
        operator: ConditionOperator.GT,
        threshold: 99,
        actualValue: 100,
        triggered: true,
      });
    });

    it('should evaluate price GTE condition as triggered', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GTE,
          value: 100,
        },
      ];
      const ticker = createTicker({ price: 100 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
    });

    it('should evaluate price LT condition as triggered', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.LT,
          value: 101,
        },
      ];
      const ticker = createTicker({ price: 100 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
    });

    it('should evaluate price LTE condition as triggered', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.LTE,
          value: 100,
        },
      ];
      const ticker = createTicker({ price: 100 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
    });

    it('should evaluate condition as not triggered when condition not met', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          value: 200,
        },
      ];
      const ticker = createTicker({ price: 100 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
      expect(result[0].actualValue).toBe(100);
    });

    it('should return null actualValue when ticker is null', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          value: 99,
        },
      ];

      const result = evaluator.evaluateConditions(
        conditions,
        null,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
      expect(result[0].actualValue).toBeNull();
    });

    it('should evaluate volume24h condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Volume24h,
          operator: ConditionOperator.GT,
          value: 500000,
        },
      ];
      const ticker = createTicker({ volume24h: 1000000 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(1000000);
    });

    it('should evaluate percentChange24h condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.PercentChange24h,
          operator: ConditionOperator.GT,
          value: 2,
        },
      ];
      const ticker = createTicker({ percentChange24h: 2.5 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(2.5);
    });

    it('should evaluate high24h condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.High24h,
          operator: ConditionOperator.GT,
          value: 100,
        },
      ];
      const ticker = createTicker({ high24h: 105 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(105);
    });

    it('should evaluate low24h condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Low24h,
          operator: ConditionOperator.LT,
          value: 100,
        },
      ];
      const ticker = createTicker({ low24h: 95 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(95);
    });

    it('should evaluate high52w condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.High52w,
          operator: ConditionOperator.GT,
          value: 100,
        },
      ];
      const ticker = createTicker({ high52w: 150 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(150);
    });

    it('should evaluate low52w condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Low52w,
          operator: ConditionOperator.LT,
          value: 100,
        },
      ];
      const ticker = createTicker({ low52w: 50 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(50);
    });

    it('should evaluate bestBid condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.BestBid,
          operator: ConditionOperator.GT,
          value: 99,
        },
      ];
      const ticker = createTicker({ bestBid: 99.9 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(99.9);
    });

    it('should evaluate bestAsk condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.BestAsk,
          operator: ConditionOperator.LT,
          value: 101,
        },
      ];
      const ticker = createTicker({ bestAsk: 100.1 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(100.1);
    });

    it('should evaluate bestBidQuantity condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.BestBidQuantity,
          operator: ConditionOperator.GT,
          value: 5,
        },
      ];
      const ticker = createTicker({ bestBidQuantity: 10 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(10);
    });

    it('should evaluate bestAskQuantity condition', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.BestAskQuantity,
          operator: ConditionOperator.GT,
          value: 5,
        },
      ];
      const ticker = createTicker({ bestAskQuantity: 10 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(10);
    });
  });

  describe('cross conditions', () => {
    it('should evaluate CROSS_ABOVE as triggered when crossing threshold', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.CROSS_ABOVE,
          value: 100,
        },
      ];
      const ticker = createTicker({ price: 105 });
      const previousTicker = createTicker({ price: 95 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        previousTicker,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].operator).toBe(ConditionOperator.CROSS_ABOVE);
    });

    it('should not trigger CROSS_ABOVE without previous ticker', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.CROSS_ABOVE,
          value: 100,
        },
      ];
      const ticker = createTicker({ price: 105 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
    });

    it('should not trigger CROSS_ABOVE when already above', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.CROSS_ABOVE,
          value: 100,
        },
      ];
      const ticker = createTicker({ price: 110 });
      const previousTicker = createTicker({ price: 105 }); // Already above

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        previousTicker,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
    });

    it('should evaluate CROSS_BELOW as triggered when crossing threshold', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.CROSS_BELOW,
          value: 100,
        },
      ];
      const ticker = createTicker({ price: 95 });
      const previousTicker = createTicker({ price: 105 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        previousTicker,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].operator).toBe(ConditionOperator.CROSS_BELOW);
    });

    it('should not trigger CROSS_BELOW when already below', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.CROSS_BELOW,
          value: 100,
        },
      ];
      const ticker = createTicker({ price: 90 });
      const previousTicker = createTicker({ price: 95 }); // Already below

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        previousTicker,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
    });
  });

  describe('indicator conditions', () => {
    let evaluatorWithMock: ConditionEvaluator;

    beforeEach(() => {
      evaluatorWithMock = new ConditionEvaluator(
        mockTechnicalIndicatorsService as unknown as TechnicalIndicatorsService,
      );
    });

    it('should evaluate indicator condition with candles', () => {
      mockTechnicalIndicatorsService.calculateRsi.mockReturnValue({
        period: 14,
        values: [25],
        latestValue: 25,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.LT,
          value: 30,
          granularity: Granularity.FIVE_MINUTE,
          period: 14,
        },
      ];
      const candlesByGranularity = createCandlesByGranularity(
        Granularity.FIVE_MINUTE,
        20,
      );
      // Need previous candles for evaluation to work
      const previousCandlesByGranularity = createCandlesByGranularity(
        Granularity.FIVE_MINUTE,
        20,
      );

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        candlesByGranularity,
        previousCandlesByGranularity,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(25);
    });

    it('should return null actualValue when candles not provided', () => {
      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.LT,
          value: 30,
          granularity: Granularity.FIVE_MINUTE,
          period: 14,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
      expect(result[0].actualValue).toBeNull();
    });

    it('should trigger simple operator without previousCandles (regression test)', () => {
      // This test verifies the fix for: simple operators (LT, GT, etc.)
      // should work with only current candles, without requiring previousCandles.
      // The bug was: evaluateIndicatorCondition required previousCandles for ALL operators,
      // but only crossAbove/crossBelow actually need previous values.
      mockTechnicalIndicatorsService.calculateRsi.mockReturnValue({
        period: 14,
        values: [25],
        latestValue: 25,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.LT,
          value: 30,
          granularity: Granularity.FIVE_MINUTE,
          period: 14,
        },
      ];
      const candlesByGranularity = createCandlesByGranularity(
        Granularity.FIVE_MINUTE,
        20,
      );
      // Explicitly pass null for previousCandles to simulate first update
      const previousCandlesByGranularity = null;

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        candlesByGranularity,
        previousCandlesByGranularity,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(result[0].actualValue).toBe(25);
    });

    it('should evaluate indicator CROSS_ABOVE with previous candles', () => {
      // Current: RSI = 35 (above threshold 30)
      mockTechnicalIndicatorsService.calculateRsi
        .mockReturnValueOnce({
          period: 14,
          values: [35],
          latestValue: 35,
        })
        // Previous: RSI = 25 (below threshold 30)
        .mockReturnValueOnce({
          period: 14,
          values: [25],
          latestValue: 25,
        });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.CROSS_ABOVE,
          value: 30,
          granularity: Granularity.FIVE_MINUTE,
          period: 14,
        },
      ];
      const candlesByGranularity = createCandlesByGranularity(
        Granularity.FIVE_MINUTE,
        20,
      );
      const previousCandlesByGranularity = createCandlesByGranularity(
        Granularity.FIVE_MINUTE,
        19, // Slightly different to show these are "previous"
      );

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        candlesByGranularity,
        previousCandlesByGranularity,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
    });
  });

  describe('multiple conditions', () => {
    it('should return all conditions with their triggered status', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          value: 99,
        },
        {
          field: TickerConditionField.Volume24h,
          operator: ConditionOperator.GT,
          value: 500000,
        },
      ];
      const ticker = createTicker({ price: 100, volume24h: 1000000 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('price');
      expect(result[0].triggered).toBe(true);
      expect(result[1].field).toBe('volume24h');
      expect(result[1].triggered).toBe(true);
    });

    it('should return mixed triggered status when some conditions fail', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          value: 200,
        }, // Won't match
        {
          field: TickerConditionField.Volume24h,
          operator: ConditionOperator.GT,
          value: 500000,
        },
      ];
      const ticker = createTicker({ price: 100, volume24h: 1000000 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('price');
      expect(result[0].triggered).toBe(false);
      expect(result[1].field).toBe('volume24h');
      expect(result[1].triggered).toBe(true);
    });

    it('should return all conditions not triggered when none match', () => {
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          value: 200,
        },
        {
          field: TickerConditionField.Volume24h,
          operator: ConditionOperator.GT,
          value: 2000000,
        },
      ];
      const ticker = createTicker({ price: 100, volume24h: 1000000 });

      const result = evaluator.evaluateConditions(
        conditions,
        ticker,
        null,
        null,
        null,
      );

      expect(result).toHaveLength(2);
      expect(result.every((r) => !r.triggered)).toBe(true);
    });
  });

  describe('mixed ticker and indicator conditions', () => {
    it('should evaluate both ticker and indicator conditions', () => {
      mockTechnicalIndicatorsService.calculateRsi.mockReturnValue({
        period: 14,
        values: [25],
        latestValue: 25,
      });

      const evaluatorWithMock = new ConditionEvaluator(
        mockTechnicalIndicatorsService as unknown as TechnicalIndicatorsService,
      );
      const conditions: Condition[] = [
        {
          field: TickerConditionField.Price,
          operator: ConditionOperator.GT,
          value: 99,
        },
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.LT,
          value: 30,
          granularity: Granularity.FIVE_MINUTE,
          period: 14,
        },
      ];
      const ticker = createTicker({ price: 100 });
      const candlesByGranularity = createCandlesByGranularity(
        Granularity.FIVE_MINUTE,
        20,
      );
      const previousCandlesByGranularity = createCandlesByGranularity(
        Granularity.FIVE_MINUTE,
        20,
      );

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        ticker,
        null,
        candlesByGranularity,
        previousCandlesByGranularity,
      );

      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('price');
      expect(result[0].triggered).toBe(true);
      expect(result[1].field).toBe('rsi');
      expect(result[1].triggered).toBe(true);
    });
  });

  describe('indicator calculation', () => {
    let evaluatorWithMock: ConditionEvaluator;

    beforeEach(() => {
      evaluatorWithMock = new ConditionEvaluator(
        mockTechnicalIndicatorsService as unknown as TechnicalIndicatorsService,
      );
    });

    it('should calculate RSI using indicator service', () => {
      mockTechnicalIndicatorsService.calculateRsi.mockReturnValue({
        period: 14,
        values: [55],
        latestValue: 55,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.GT,
          value: 50,
          granularity: Granularity.FIVE_MINUTE,
          period: 14,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 20),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 20),
      );

      expect(result[0].actualValue).toBe(55);
      expect(result[0].triggered).toBe(true);
      expect(mockTechnicalIndicatorsService.calculateRsi).toHaveBeenCalledWith({
        candles: expect.any(Array) as CandleInput[],
        period: 14,
      });
    });

    it('should return null when RSI has no value', () => {
      mockTechnicalIndicatorsService.calculateRsi.mockReturnValue({
        period: 14,
        values: [],
        latestValue: null,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Rsi,
          operator: ConditionOperator.GT,
          value: 50,
          granularity: Granularity.FIVE_MINUTE,
          period: 14,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 5),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 5),
      );

      expect(result[0].actualValue).toBeNull();
      expect(result[0].triggered).toBe(false);
    });

    it('should calculate MACD value', () => {
      mockTechnicalIndicatorsService.calculateMacd.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [],
        latestValue: { MACD: 1.5, signal: 1.2, histogram: 0.3 },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Macd,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
      );

      expect(result[0].actualValue).toBe(1.5);
      expect(result[0].triggered).toBe(true);
    });

    it('should calculate MACD histogram', () => {
      mockTechnicalIndicatorsService.calculateMacd.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [],
        latestValue: { MACD: 1.5, signal: 1.2, histogram: 0.3 },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.MacdHistogram,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
      );

      expect(result[0].actualValue).toBe(0.3);
    });

    it('should calculate MACD signal', () => {
      mockTechnicalIndicatorsService.calculateMacd.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [],
        latestValue: { MACD: 1.5, signal: 1.2, histogram: 0.3 },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.MacdSignal,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
      );

      expect(result[0].actualValue).toBe(1.2);
    });

    it('should return null when MACD.MACD is undefined', () => {
      mockTechnicalIndicatorsService.calculateMacd.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [],
        latestValue: { MACD: undefined, signal: 1.2, histogram: 0.3 },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Macd,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
      );

      expect(result[0].actualValue).toBeNull();
      expect(result[0].triggered).toBe(false);
    });

    it('should return null when MACD.histogram is undefined', () => {
      mockTechnicalIndicatorsService.calculateMacd.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [],
        latestValue: { MACD: 1.5, signal: 1.2, histogram: undefined },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.MacdHistogram,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
      );

      expect(result[0].actualValue).toBeNull();
      expect(result[0].triggered).toBe(false);
    });

    it('should return null when MACD.signal is undefined', () => {
      mockTechnicalIndicatorsService.calculateMacd.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [],
        latestValue: { MACD: 1.5, signal: undefined, histogram: 0.3 },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.MacdSignal,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 40),
      );

      expect(result[0].actualValue).toBeNull();
      expect(result[0].triggered).toBe(false);
    });

    it('should calculate Bollinger Bands middle', () => {
      mockTechnicalIndicatorsService.calculateBollingerBands.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [],
        latestValue: {
          middle: 100,
          upper: 110,
          lower: 90,
          bandwidth: 20,
          pb: 0.5,
        },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.BollingerBands,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          period: 20,
          stdDev: 2,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
      );

      expect(result[0].actualValue).toBe(100);
    });

    it('should calculate Bollinger Bands upper', () => {
      mockTechnicalIndicatorsService.calculateBollingerBands.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [],
        latestValue: {
          middle: 100,
          upper: 110,
          lower: 90,
          bandwidth: 20,
          pb: 0.5,
        },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.BollingerBandsUpper,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          period: 20,
          stdDev: 2,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
      );

      expect(result[0].actualValue).toBe(110);
    });

    it('should calculate Bollinger Bands lower', () => {
      mockTechnicalIndicatorsService.calculateBollingerBands.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [],
        latestValue: {
          middle: 100,
          upper: 110,
          lower: 90,
          bandwidth: 20,
          pb: 0.5,
        },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.BollingerBandsLower,
          operator: ConditionOperator.LT,
          value: 100,
          granularity: Granularity.FIVE_MINUTE,
          period: 20,
          stdDev: 2,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
      );

      expect(result[0].actualValue).toBe(90);
    });

    it('should calculate Bollinger Bands bandwidth', () => {
      mockTechnicalIndicatorsService.calculateBollingerBands.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [],
        latestValue: {
          middle: 100,
          upper: 110,
          lower: 90,
          bandwidth: 20,
          pb: 0.5,
        },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.BollingerBandsBandwidth,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          period: 20,
          stdDev: 2,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
      );

      expect(result[0].actualValue).toBe(20);
    });

    it('should calculate Bollinger Bands percentB', () => {
      mockTechnicalIndicatorsService.calculateBollingerBands.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [],
        latestValue: {
          middle: 100,
          upper: 110,
          lower: 90,
          bandwidth: 20,
          pb: 0.5,
        },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.BollingerBandsPercentB,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          period: 20,
          stdDev: 2,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
      );

      expect(result[0].actualValue).toBe(0.5);
    });

    it('should calculate SMA', () => {
      mockTechnicalIndicatorsService.calculateSma.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Sma,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          period: 20,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 25),
      );

      expect(result[0].actualValue).toBe(100);
      expect(mockTechnicalIndicatorsService.calculateSma).toHaveBeenCalledWith({
        candles: expect.any(Array) as CandleInput[],
        period: 20,
      });
    });

    it('should calculate EMA', () => {
      mockTechnicalIndicatorsService.calculateEma.mockReturnValue({
        period: 12,
        values: [101],
        latestValue: 101,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Ema,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          period: 12,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 15),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 15),
      );

      expect(result[0].actualValue).toBe(101);
      expect(mockTechnicalIndicatorsService.calculateEma).toHaveBeenCalledWith({
        candles: expect.any(Array) as CandleInput[],
        period: 12,
      });
    });

    it('should calculate Stochastic %K', () => {
      mockTechnicalIndicatorsService.calculateStochastic.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [],
        latestValue: { k: 75, d: 70 },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Stochastic,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          kPeriod: 14,
          dPeriod: 3,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 20),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 20),
      );

      expect(result[0].actualValue).toBe(75);
    });

    it('should calculate Stochastic %D', () => {
      mockTechnicalIndicatorsService.calculateStochastic.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [],
        latestValue: { k: 75, d: 70 },
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.StochasticD,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          kPeriod: 14,
          dPeriod: 3,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 20),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 20),
      );

      expect(result[0].actualValue).toBe(70);
    });

    it('should return null when MACD has no value', () => {
      mockTechnicalIndicatorsService.calculateMacd.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [],
        latestValue: null,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Macd,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 5),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 5),
      );

      expect(result[0].actualValue).toBeNull();
      expect(result[0].triggered).toBe(false);
    });

    it('should return null when Bollinger Bands has no value', () => {
      mockTechnicalIndicatorsService.calculateBollingerBands.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [],
        latestValue: null,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.BollingerBands,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          period: 20,
          stdDev: 2,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 5),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 5),
      );

      expect(result[0].actualValue).toBeNull();
      expect(result[0].triggered).toBe(false);
    });

    it('should return null when Stochastic has no value', () => {
      mockTechnicalIndicatorsService.calculateStochastic.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [],
        latestValue: null,
      });

      const conditions: Condition[] = [
        {
          field: IndicatorConditionField.Stochastic,
          operator: ConditionOperator.GT,
          value: 0,
          granularity: Granularity.FIVE_MINUTE,
          kPeriod: 14,
          dPeriod: 3,
        },
      ];

      const result = evaluatorWithMock.evaluateConditions(
        conditions,
        null,
        null,
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 5),
        createCandlesByGranularity(Granularity.FIVE_MINUTE, 5),
      );

      expect(result[0].actualValue).toBeNull();
      expect(result[0].triggered).toBe(false);
    });
  });
});
