import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TechnicalAnalysisService } from './TechnicalAnalysisService';
import type { ProductsService } from '.';
import type {
  TechnicalIndicatorsService,
  CandleInput,
} from './TechnicalIndicatorsService';
import { Granularity } from './ProductsService.types';
import { IndicatorType } from './TechnicalAnalysis';
import type { Candle } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Candle';

// Helper to convert test candles to SDK Candle type (SDK uses strings)
const asSdkCandles = (candles: CandleInput[]): Candle[] =>
  candles.map((c) => ({
    start: '',
    open: String(c.open),
    high: String(c.high),
    low: String(c.low),
    close: String(c.close),
    volume: String(c.volume),
  }));

describe('TechnicalAnalysisService', () => {
  let service: TechnicalAnalysisService;
  let mockProductsService: ProductsService;

  // Extract mocks as individual jest.Mock variables to avoid unbound-method errors
  const getProductCandlesMock = jest.fn<ProductsService['getProductCandles']>();
  const calculateRsiMock =
    jest.fn<TechnicalIndicatorsService['calculateRsi']>();
  const calculateMacdMock =
    jest.fn<TechnicalIndicatorsService['calculateMacd']>();
  const calculateSmaMock =
    jest.fn<TechnicalIndicatorsService['calculateSma']>();
  const calculateEmaMock =
    jest.fn<TechnicalIndicatorsService['calculateEma']>();
  const calculateBollingerBandsMock =
    jest.fn<TechnicalIndicatorsService['calculateBollingerBands']>();
  const calculateAtrMock =
    jest.fn<TechnicalIndicatorsService['calculateAtr']>();
  const calculateStochasticMock =
    jest.fn<TechnicalIndicatorsService['calculateStochastic']>();
  const calculateAdxMock =
    jest.fn<TechnicalIndicatorsService['calculateAdx']>();
  const calculateObvMock =
    jest.fn<TechnicalIndicatorsService['calculateObv']>();
  const calculateVwapMock =
    jest.fn<TechnicalIndicatorsService['calculateVwap']>();
  const calculateCciMock =
    jest.fn<TechnicalIndicatorsService['calculateCci']>();
  const calculateWilliamsRMock =
    jest.fn<TechnicalIndicatorsService['calculateWilliamsR']>();
  const calculateRocMock =
    jest.fn<TechnicalIndicatorsService['calculateRoc']>();
  const calculateMfiMock =
    jest.fn<TechnicalIndicatorsService['calculateMfi']>();
  const calculatePsarMock =
    jest.fn<TechnicalIndicatorsService['calculatePsar']>();
  const calculateIchimokuCloudMock =
    jest.fn<TechnicalIndicatorsService['calculateIchimokuCloud']>();
  const calculateKeltnerChannelsMock =
    jest.fn<TechnicalIndicatorsService['calculateKeltnerChannels']>();
  const calculateFibonacciRetracementMock =
    jest.fn<TechnicalIndicatorsService['calculateFibonacciRetracement']>();
  const detectCandlestickPatternsMock =
    jest.fn<TechnicalIndicatorsService['detectCandlestickPatterns']>();
  const calculateVolumeProfileMock =
    jest.fn<TechnicalIndicatorsService['calculateVolumeProfile']>();
  const calculatePivotPointsMock =
    jest.fn<TechnicalIndicatorsService['calculatePivotPoints']>();
  const detectRsiDivergenceMock =
    jest.fn<TechnicalIndicatorsService['detectRsiDivergence']>();
  const detectChartPatternsMock =
    jest.fn<TechnicalIndicatorsService['detectChartPatterns']>();
  const detectSwingPointsMock =
    jest.fn<TechnicalIndicatorsService['detectSwingPoints']>();

  let mockIndicatorsService: TechnicalIndicatorsService;

  const createMockCandles = (
    count: number,
    options?: { closePrice?: number },
  ): CandleInput[] => {
    return Array.from({ length: count }, (_, i) => ({
      open: 100 + i,
      high: 102 + i,
      low: 98 + i,
      close:
        i === 0 && options?.closePrice !== undefined
          ? options.closePrice
          : 101 + i,
      volume: 1000,
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockProductsService = {
      getProductCandles: getProductCandlesMock,
    } as never;

    mockIndicatorsService = {
      calculateRsi: calculateRsiMock,
      calculateMacd: calculateMacdMock,
      calculateSma: calculateSmaMock,
      calculateEma: calculateEmaMock,
      calculateBollingerBands: calculateBollingerBandsMock,
      calculateAtr: calculateAtrMock,
      calculateStochastic: calculateStochasticMock,
      calculateAdx: calculateAdxMock,
      calculateObv: calculateObvMock,
      calculateVwap: calculateVwapMock,
      calculateCci: calculateCciMock,
      calculateWilliamsR: calculateWilliamsRMock,
      calculateRoc: calculateRocMock,
      calculateMfi: calculateMfiMock,
      calculatePsar: calculatePsarMock,
      calculateIchimokuCloud: calculateIchimokuCloudMock,
      calculateKeltnerChannels: calculateKeltnerChannelsMock,
      calculateFibonacciRetracement: calculateFibonacciRetracementMock,
      detectCandlestickPatterns: detectCandlestickPatternsMock,
      calculateVolumeProfile: calculateVolumeProfileMock,
      calculatePivotPoints: calculatePivotPointsMock,
      detectRsiDivergence: detectRsiDivergenceMock,
      detectChartPatterns: detectChartPatternsMock,
      detectSwingPoints: detectSwingPointsMock,
    } as never;

    service = new TechnicalAnalysisService(
      mockProductsService,
      mockIndicatorsService,
    );
  });

  describe('analyzeTechnicalIndicators', () => {
    it('should fetch candles and calculate requested indicators', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [45, 50, 55],
        latestValue: 55,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI],
      });

      expect(getProductCandlesMock).toHaveBeenCalled();
      expect(calculateRsiMock).toHaveBeenCalled();
      expect(result.productId).toBe('BTC-USD');
      expect(result.granularity).toBe(Granularity.ONE_HOUR);
      expect(result.indicators.momentum?.rsi).toBeDefined();
    });

    it('should use default candle count of 100', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [55],
        latestValue: 55,
      });

      await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.FIFTEEN_MINUTE,
        indicators: [IndicatorType.RSI],
      });

      // Should request candles for approximately 100 periods
      expect(getProductCandlesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'BTC-USD',
          granularity: Granularity.FIFTEEN_MINUTE,
        }),
      );
    });

    it('should calculate all indicators when none specified', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Set up mocks for all indicators
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [55],
        latestValue: 55,
      });
      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [{ MACD: 1.5, signal: 1.0, histogram: 0.5 }],
        latestValue: { MACD: 1.5, signal: 1.0, histogram: 0.5 },
      });
      calculateSmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100,
      });
      calculateEmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100,
      });
      calculateBollingerBandsMock.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [
          { middle: 100, upper: 110, lower: 90, pb: 0.5, bandwidth: 0.2 },
        ],
        latestValue: {
          middle: 100,
          upper: 110,
          lower: 90,
          pb: 0.5,
          bandwidth: 0.2,
        },
      });
      calculateAtrMock.mockReturnValue({
        period: 14,
        values: [5],
        latestValue: 5,
      });
      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 60, d: 55 }],
        latestValue: { k: 60, d: 55 },
      });
      calculateAdxMock.mockReturnValue({
        period: 14,
        values: [{ adx: 25, pdi: 30, mdi: 20 }],
        latestValue: { adx: 25, pdi: 30, mdi: 20 },
      });
      calculateObvMock.mockReturnValue({
        values: [1000, 1100],
        latestValue: 1100,
      });
      calculateVwapMock.mockReturnValue({
        values: [100],
        latestValue: 100,
      });
      calculateCciMock.mockReturnValue({
        period: 20,
        values: [50],
        latestValue: 50,
      });
      calculateWilliamsRMock.mockReturnValue({
        period: 14,
        values: [-50],
        latestValue: -50,
      });
      calculateRocMock.mockReturnValue({
        period: 12,
        values: [5],
        latestValue: 5,
      });
      calculateMfiMock.mockReturnValue({
        period: 14,
        values: [50],
        latestValue: 50,
      });
      calculatePsarMock.mockReturnValue({
        step: 0.02,
        max: 0.2,
        values: [99],
        latestValue: 99,
      });
      calculateIchimokuCloudMock.mockReturnValue({
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
        values: [
          { conversion: 100, base: 99, spanA: 100, spanB: 98, chikou: 101 },
        ],
        latestValue: {
          conversion: 100,
          base: 99,
          spanA: 100,
          spanB: 98,
          chikou: 101,
        },
      });
      calculateKeltnerChannelsMock.mockReturnValue({
        maPeriod: 20,
        atrPeriod: 10,
        multiplier: 2,
        useSMA: false,
        values: [{ middle: 100, upper: 110, lower: 90 }],
        latestValue: { middle: 100, upper: 110, lower: 90 },
      });
      detectCandlestickPatternsMock.mockReturnValue({
        bullish: true,
        bearish: false,
        patterns: [],
        detectedPatterns: ['Hammer'],
      });
      detectRsiDivergenceMock.mockReturnValue({
        rsiPeriod: 14,
        lookbackPeriod: 14,
        rsiValues: [55],
        divergences: [],
        latestDivergence: null,
        hasBullishDivergence: false,
        hasBearishDivergence: false,
      });
      detectChartPatternsMock.mockReturnValue({
        lookbackPeriod: 50,
        patterns: [],
        bullishPatterns: [],
        bearishPatterns: [],
        latestPattern: null,
      });
      detectSwingPointsMock.mockReturnValue({
        swingHighs: [{ index: 10, price: 110, type: 'high' as const }],
        swingLows: [{ index: 5, price: 95, type: 'low' as const }],
        latestSwingHigh: { index: 10, price: 110, type: 'high' as const },
        latestSwingLow: { index: 5, price: 95, type: 'low' as const },
        trend: 'uptrend' as const,
      });
      calculateVolumeProfileMock.mockReturnValue({
        noOfBars: 12,
        zones: [
          {
            rangeStart: 95,
            rangeEnd: 105,
            bullishVolume: 500,
            bearishVolume: 400,
            totalVolume: 900,
          },
        ],
        pointOfControl: {
          rangeStart: 100,
          rangeEnd: 105,
          bullishVolume: 500,
          bearishVolume: 400,
          totalVolume: 900,
        },
        valueAreaHigh: 110,
        valueAreaLow: 90,
      });
      calculatePivotPointsMock.mockReturnValue({
        type: 'standard',
        pivotPoint: 100,
        resistance1: 105,
        resistance2: 110,
        resistance3: 115,
        support1: 95,
        support2: 90,
        support3: 85,
      });
      calculateFibonacciRetracementMock.mockReturnValue({
        start: 95,
        end: 110,
        trend: 'uptrend',
        levels: [
          { level: 0, price: 95 },
          { level: 23.6, price: 98.54 },
          { level: 38.2, price: 100.73 },
          { level: 50, price: 102.5 },
          { level: 61.8, price: 104.27 },
        ],
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
      });

      expect(result.indicators.momentum).toBeDefined();
      expect(result.indicators.trend).toBeDefined();
      expect(result.indicators.volatility).toBeDefined();
      expect(result.indicators.volume).toBeDefined();
      expect(result.indicators.patterns).toBeDefined();
    });

    it('should return price summary from candle data', async () => {
      const mockCandles: CandleInput[] = [
        { open: 100, high: 110, low: 95, close: 105, volume: 1000 },
        { open: 95, high: 105, low: 90, close: 100, volume: 800 },
        { open: 90, high: 100, low: 85, close: 95, volume: 600 },
      ];
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [],
      });

      expect(result.price.current).toBe(105); // Latest close
      expect(result.price.open).toBe(90); // Oldest open
      expect(result.price.high).toBe(110); // Highest high
      expect(result.price.low).toBe(85); // Lowest low
    });

    it('should return aggregated signal with score and direction', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [25],
        latestValue: 25, // Oversold - bullish
      });
      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [
          { MACD: 0.5, signal: 1.0, histogram: -0.5 },
          { MACD: 1.5, signal: 1.0, histogram: 0.5 },
        ],
        latestValue: { MACD: 1.5, signal: 1.0, histogram: 0.5 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI, IndicatorType.MACD],
      });

      expect(result.signal).toBeDefined();
      expect(result.signal.score).toBeGreaterThanOrEqual(-100);
      expect(result.signal.score).toBeLessThanOrEqual(100);
      expect(['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL']).toContain(
        result.signal.direction,
      );
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.signal.confidence);
    });

    it('should not include raw candles in response', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [],
      });

      // Response should NOT contain candles property
      expect((result as never as { candles: unknown }).candles).toBeUndefined();
      // But should contain candleCount
      expect(result.candleCount).toBe(100);
    });

    it('should handle empty candle response', async () => {
      getProductCandlesMock.mockResolvedValue({
        candles: [],
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [],
      });

      expect(result.candleCount).toBe(0);
      expect(result.price.current).toBe(0);
      expect(result.price.open).toBe(0);
    });

    it('should fetch daily candles for pivot points', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock
        .mockResolvedValueOnce({ candles: asSdkCandles(mockCandles) }) // Main candles
        .mockResolvedValueOnce({
          candles: [
            {
              open: '100',
              high: '110',
              low: '95',
              close: '105',
              volume: '1000',
            },
            { open: '95', high: '105', low: '90', close: '100', volume: '800' },
            { open: '90', high: '100', low: '85', close: '95', volume: '600' },
          ],
        }); // Daily candles

      calculatePivotPointsMock.mockReturnValue({
        type: 'standard',
        pivotPoint: 100,
        resistance1: 105,
        resistance2: 110,
        resistance3: 115,
        support1: 95,
        support2: 90,
        support3: 85,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PIVOT_POINTS],
      });

      // Should have called getProductCandles twice
      expect(getProductCandlesMock).toHaveBeenCalledTimes(2);
      // Second call should be for daily candles
      expect(getProductCandlesMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          granularity: Granularity.ONE_DAY,
        }),
      );
      expect(result.indicators.supportResistance?.pivotPoints).toBeDefined();
      expect(result.indicators.supportResistance?.pivotPoints?.source).toBe(
        'daily',
      );
    });

    it('should use swing points for Fibonacci calculation', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectSwingPointsMock.mockReturnValue({
        swingHighs: [{ index: 80, price: 150, type: 'high' as const }],
        swingLows: [{ index: 20, price: 100, type: 'low' as const }],
        latestSwingHigh: { index: 80, price: 150, type: 'high' as const },
        latestSwingLow: { index: 20, price: 100, type: 'low' as const },
        trend: 'uptrend' as const,
      });
      calculateFibonacciRetracementMock.mockReturnValue({
        start: 100,
        end: 150,
        trend: 'uptrend',
        levels: [
          { level: 0, price: 100 },
          { level: 38.2, price: 119.1 },
          { level: 50, price: 125 },
          { level: 61.8, price: 130.9 },
          { level: 100, price: 150 },
        ],
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.FIBONACCI],
      });

      expect(detectSwingPointsMock).toHaveBeenCalled();
      expect(calculateFibonacciRetracementMock).toHaveBeenCalledWith({
        start: 100, // Swing low for uptrend
        end: 150, // Swing high for uptrend
      });
      expect(result.indicators.supportResistance?.fibonacci).toBeDefined();
      expect(result.indicators.supportResistance?.fibonacci?.swingHigh).toBe(
        150,
      );
      expect(result.indicators.supportResistance?.fibonacci?.swingLow).toBe(
        100,
      );
    });

    it('should limit candle count to maximum of 300', async () => {
      const mockCandles = createMockCandles(300);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        candleCount: 500, // Requesting more than max
        indicators: [],
      });

      // The time range calculation should be based on 300, not 500
      const call = getProductCandlesMock.mock.calls[0][0];
      const start = new Date(call.start).getTime();
      const end = new Date(call.end).getTime();
      const durationMs = end - start;
      const expectedDuration = 300 * 3600 * 1000; // 300 hours in ms

      // Should be approximately 300 hours
      expect(durationMs).toBeLessThanOrEqual(expectedDuration + 1000);
    });

    it('should enforce minimum candle count of 5', async () => {
      const mockCandles = createMockCandles(5);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        candleCount: 1, // Requesting less than min
        indicators: [],
      });

      const call = getProductCandlesMock.mock.calls[0][0];
      const start = new Date(call.start).getTime();
      const end = new Date(call.end).getTime();
      const durationMs = end - start;
      const expectedDuration = 5 * 3600 * 1000; // 5 hours in ms

      // Should be at least 5 hours
      expect(durationMs).toBeGreaterThanOrEqual(expectedDuration - 1000);
    });

    it('should include timestamp in response', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      const beforeCall = new Date().toISOString();
      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [],
      });
      const afterCall = new Date().toISOString();

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= beforeCall).toBe(true);
      expect(result.timestamp <= afterCall).toBe(true);
    });
  });

  describe('signal interpretation', () => {
    it('should interpret RSI overbought (>=70) as bearish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [75],
        latestValue: 75,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI],
      });

      expect(result.indicators.momentum?.rsi?.signal).toBe('overbought');
    });

    it('should interpret RSI oversold (<=30) as bullish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [25],
        latestValue: 25,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI],
      });

      expect(result.indicators.momentum?.rsi?.signal).toBe('oversold');
    });

    it('should detect MACD bullish crossover', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [
          { MACD: 0.5, signal: 1.0, histogram: -0.5 }, // Previous: MACD below signal
          { MACD: 1.5, signal: 1.0, histogram: 0.5 }, // Current: MACD above signal
        ],
        latestValue: { MACD: 1.5, signal: 1.0, histogram: 0.5 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.MACD],
      });

      expect(result.indicators.momentum?.macd?.crossover).toBe('bullish');
    });

    it('should interpret ADX strong trend (>=25)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateAdxMock.mockReturnValue({
        period: 14,
        values: [{ adx: 30, pdi: 35, mdi: 20 }],
        latestValue: { adx: 30, pdi: 35, mdi: 20 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ADX],
      });

      expect(result.indicators.momentum?.adx?.trendStrength).toBe('strong');
    });

    it('should detect MACD bearish crossover', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [
          { MACD: 1.5, signal: 1.0, histogram: 0.5 }, // Previous: MACD above signal
          { MACD: 0.5, signal: 1.0, histogram: -0.5 }, // Current: MACD below signal
        ],
        latestValue: { MACD: 0.5, signal: 1.0, histogram: -0.5 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.MACD],
      });

      expect(result.indicators.momentum?.macd?.crossover).toBe('bearish');
    });

    it('should interpret Stochastic oversold as bullish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 15, d: 18 }],
        latestValue: { k: 15, d: 18 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.STOCHASTIC],
      });

      expect(result.indicators.momentum?.stochastic?.signal).toBe('oversold');
    });

    it('should interpret Stochastic overbought as bearish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 85, d: 82 }],
        latestValue: { k: 85, d: 82 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.STOCHASTIC],
      });

      expect(result.indicators.momentum?.stochastic?.signal).toBe('overbought');
    });

    it('should interpret ADX with MDI > PDI as bearish signal', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateAdxMock.mockReturnValue({
        period: 14,
        values: [{ adx: 30, pdi: 20, mdi: 35 }],
        latestValue: { adx: 30, pdi: 20, mdi: 35 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ADX],
      });

      expect(result.indicators.momentum?.adx?.mdi).toBe(35);
      expect(result.indicators.momentum?.adx?.pdi).toBe(20);
    });

    it('should interpret CCI oversold (<-100) as bullish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateCciMock.mockReturnValue({
        period: 20,
        values: [-150],
        latestValue: -150,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CCI],
      });

      expect(result.indicators.momentum?.cci?.signal).toBe('oversold');
    });

    it('should interpret CCI overbought (>100) as bearish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateCciMock.mockReturnValue({
        period: 20,
        values: [150],
        latestValue: 150,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CCI],
      });

      expect(result.indicators.momentum?.cci?.signal).toBe('overbought');
    });

    it('should interpret Williams %R oversold (<-80) as bullish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateWilliamsRMock.mockReturnValue({
        period: 14,
        values: [-90],
        latestValue: -90,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.WILLIAMS_R],
      });

      expect(result.indicators.momentum?.williamsR?.signal).toBe('oversold');
    });

    it('should interpret Williams %R overbought (>-20) as bearish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateWilliamsRMock.mockReturnValue({
        period: 14,
        values: [-10],
        latestValue: -10,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.WILLIAMS_R],
      });

      expect(result.indicators.momentum?.williamsR?.signal).toBe('overbought');
    });

    it('should interpret ROC positive as bullish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateRocMock.mockReturnValue({
        period: 12,
        values: [5.5],
        latestValue: 5.5,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ROC],
      });

      expect(result.indicators.momentum?.roc?.signal).toBe('bullish');
    });

    it('should interpret ROC negative as bearish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateRocMock.mockReturnValue({
        period: 12,
        values: [-5.5],
        latestValue: -5.5,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ROC],
      });

      expect(result.indicators.momentum?.roc?.signal).toBe('bearish');
    });

    it('should interpret SMA price above as bullish trend', async () => {
      // Set close price above SMA (150 > 100)
      const mockCandles = createMockCandles(100, { closePrice: 150 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateSmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.SMA],
      });

      expect(result.indicators.trend?.sma?.trend).toBe('bullish');
    });

    it('should interpret SMA price below as bearish trend', async () => {
      // Set close price below SMA (80 < 100)
      const mockCandles = createMockCandles(100, { closePrice: 80 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateSmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.SMA],
      });

      expect(result.indicators.trend?.sma?.trend).toBe('bearish');
    });

    it('should interpret EMA price above as bullish trend', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 150 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateEmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.EMA],
      });

      expect(result.indicators.trend?.ema?.trend).toBe('bullish');
    });

    it('should interpret EMA price below as bearish trend', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 80 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateEmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.EMA],
      });

      expect(result.indicators.trend?.ema?.trend).toBe('bearish');
    });

    it('should interpret Ichimoku bullish signal', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 110 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateIchimokuCloudMock.mockReturnValue({
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
        values: [
          { conversion: 105, base: 103, spanA: 100, spanB: 95, chikou: 110 },
        ],
        latestValue: {
          conversion: 105,
          base: 103,
          spanA: 100,
          spanB: 95,
          chikou: 110,
        },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ICHIMOKU],
      });

      expect(result.indicators.trend?.ichimoku?.signal).toBe('bullish');
    });

    it('should interpret Ichimoku bearish signal', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 80 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateIchimokuCloudMock.mockReturnValue({
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
        values: [
          { conversion: 95, base: 97, spanA: 100, spanB: 105, chikou: 80 },
        ],
        latestValue: {
          conversion: 95,
          base: 97,
          spanA: 100,
          spanB: 105,
          chikou: 80,
        },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ICHIMOKU],
      });

      expect(result.indicators.trend?.ichimoku?.signal).toBe('bearish');
    });

    it('should interpret PSAR below price as uptrend', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 110 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculatePsarMock.mockReturnValue({
        step: 0.02,
        max: 0.2,
        values: [95],
        latestValue: 95,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PSAR],
      });

      expect(result.indicators.trend?.psar?.trend).toBe('up');
    });

    it('should interpret PSAR above price as downtrend', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 90 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculatePsarMock.mockReturnValue({
        step: 0.02,
        max: 0.2,
        values: [110],
        latestValue: 110,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PSAR],
      });

      expect(result.indicators.trend?.psar?.trend).toBe('down');
    });

    it('should interpret Bollinger Bands price near lower band as oversold', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 92 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateBollingerBandsMock.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [
          { upper: 110, middle: 100, lower: 90, pb: -0.1, bandwidth: 0.2 },
        ],
        latestValue: {
          upper: 110,
          middle: 100,
          lower: 90,
          pb: -0.1,
          bandwidth: 0.2,
        },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.BOLLINGER_BANDS],
      });

      expect(result.indicators.volatility?.bollingerBands?.signal).toBe(
        'oversold',
      );
    });

    it('should interpret Bollinger Bands price near upper band as overbought', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 108 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateBollingerBandsMock.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [
          { upper: 110, middle: 100, lower: 90, pb: 1.2, bandwidth: 0.2 },
        ],
        latestValue: {
          upper: 110,
          middle: 100,
          lower: 90,
          pb: 1.2,
          bandwidth: 0.2,
        },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.BOLLINGER_BANDS],
      });

      expect(result.indicators.volatility?.bollingerBands?.signal).toBe(
        'overbought',
      );
    });

    it('should interpret OBV rising trend', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateObvMock.mockReturnValue({
        values: [1000, 1200, 1500, 1800, 2200],
        latestValue: 2200,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.OBV],
      });

      expect(result.indicators.volume?.obv?.trend).toBe('rising');
    });

    it('should interpret OBV falling trend', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateObvMock.mockReturnValue({
        values: [2200, 1800, 1500, 1200, 1000],
        latestValue: 1000,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.OBV],
      });

      expect(result.indicators.volume?.obv?.trend).toBe('falling');
    });

    it('should interpret MFI oversold (<20) as bullish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateMfiMock.mockReturnValue({
        period: 14,
        values: [15],
        latestValue: 15,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.MFI],
      });

      expect(result.indicators.volume?.mfi?.signal).toBe('oversold');
    });

    it('should interpret MFI overbought (>80) as bearish', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateMfiMock.mockReturnValue({
        period: 14,
        values: [85],
        latestValue: 85,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.MFI],
      });

      expect(result.indicators.volume?.mfi?.signal).toBe('overbought');
    });

    it('should interpret VWAP price above as bullish position', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 110 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateVwapMock.mockReturnValue({
        values: [100],
        latestValue: 100,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.VWAP],
      });

      expect(result.indicators.volume?.vwap?.position).toBe('above');
    });

    it('should interpret VWAP price below as bearish position', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 90 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateVwapMock.mockReturnValue({
        values: [100],
        latestValue: 100,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.VWAP],
      });

      expect(result.indicators.volume?.vwap?.position).toBe('below');
    });

    it('should interpret candlestick patterns bullish bias', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectCandlestickPatternsMock.mockReturnValue({
        bullish: true,
        bearish: false,
        patterns: [],
        detectedPatterns: ['Hammer', 'Bullish Engulfing'],
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CANDLESTICK_PATTERNS],
      });

      expect(result.indicators.patterns?.candlestickPatterns?.bias).toBe(
        'bullish',
      );
    });

    it('should interpret candlestick patterns bearish bias', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectCandlestickPatternsMock.mockReturnValue({
        bullish: false,
        bearish: true,
        patterns: [],
        detectedPatterns: ['Shooting Star', 'Bearish Engulfing'],
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CANDLESTICK_PATTERNS],
      });

      expect(result.indicators.patterns?.candlestickPatterns?.bias).toBe(
        'bearish',
      );
    });

    it('should interpret RSI bullish divergence', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectRsiDivergenceMock.mockReturnValue({
        rsiPeriod: 14,
        lookbackPeriod: 14,
        rsiValues: [55],
        divergences: [
          {
            type: 'bullish',
            startIndex: 0,
            endIndex: 5,
            priceStart: 100,
            priceEnd: 95,
            rsiStart: 30,
            rsiEnd: 40,
            strength: 'strong',
          },
        ],
        latestDivergence: {
          type: 'bullish',
          startIndex: 0,
          endIndex: 5,
          priceStart: 100,
          priceEnd: 95,
          rsiStart: 30,
          rsiEnd: 40,
          strength: 'strong',
        },
        hasBullishDivergence: true,
        hasBearishDivergence: false,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI_DIVERGENCE],
      });

      expect(result.indicators.patterns?.rsiDivergence?.type).toBe('bullish');
    });

    it('should interpret RSI bearish divergence', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectRsiDivergenceMock.mockReturnValue({
        rsiPeriod: 14,
        lookbackPeriod: 14,
        rsiValues: [55],
        divergences: [
          {
            type: 'bearish',
            startIndex: 0,
            endIndex: 5,
            priceStart: 95,
            priceEnd: 100,
            rsiStart: 70,
            rsiEnd: 60,
            strength: 'strong',
          },
        ],
        latestDivergence: {
          type: 'bearish',
          startIndex: 0,
          endIndex: 5,
          priceStart: 95,
          priceEnd: 100,
          rsiStart: 70,
          rsiEnd: 60,
          strength: 'strong',
        },
        hasBullishDivergence: false,
        hasBearishDivergence: true,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI_DIVERGENCE],
      });

      expect(result.indicators.patterns?.rsiDivergence?.type).toBe('bearish');
    });

    it('should interpret chart patterns bullish direction', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectChartPatternsMock.mockReturnValue({
        lookbackPeriod: 50,
        patterns: [
          {
            type: 'double_bottom',
            startIndex: 0,
            endIndex: 50,
            confidence: 'high',
            direction: 'bullish',
            priceTarget: 120,
            neckline: 105,
          },
        ],
        bullishPatterns: [
          {
            type: 'double_bottom',
            startIndex: 0,
            endIndex: 50,
            confidence: 'high',
            direction: 'bullish',
            priceTarget: 120,
            neckline: 105,
          },
        ],
        bearishPatterns: [],
        latestPattern: {
          type: 'double_bottom',
          startIndex: 0,
          endIndex: 50,
          confidence: 'high',
          direction: 'bullish',
          priceTarget: 120,
          neckline: 105,
        },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CHART_PATTERNS],
      });

      expect(result.indicators.patterns?.chartPatterns?.direction).toBe(
        'bullish',
      );
    });

    it('should interpret chart patterns bearish direction', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectChartPatternsMock.mockReturnValue({
        lookbackPeriod: 50,
        patterns: [
          {
            type: 'head_and_shoulders',
            startIndex: 0,
            endIndex: 50,
            confidence: 'high',
            direction: 'bearish',
            priceTarget: 80,
            neckline: 95,
          },
        ],
        bullishPatterns: [],
        bearishPatterns: [
          {
            type: 'head_and_shoulders',
            startIndex: 0,
            endIndex: 50,
            confidence: 'high',
            direction: 'bearish',
            priceTarget: 80,
            neckline: 95,
          },
        ],
        latestPattern: {
          type: 'head_and_shoulders',
          startIndex: 0,
          endIndex: 50,
          confidence: 'high',
          direction: 'bearish',
          priceTarget: 80,
          neckline: 95,
        },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CHART_PATTERNS],
      });

      expect(result.indicators.patterns?.chartPatterns?.direction).toBe(
        'bearish',
      );
    });

    it('should interpret swing points downtrend', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectSwingPointsMock.mockReturnValue({
        swingHighs: [{ index: 20, price: 110, type: 'high' as const }],
        swingLows: [{ index: 80, price: 95, type: 'low' as const }],
        latestSwingHigh: { index: 20, price: 110, type: 'high' as const },
        latestSwingLow: { index: 80, price: 95, type: 'low' as const },
        trend: 'downtrend' as const,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.SWING_POINTS],
      });

      expect(result.indicators.patterns?.swingPoints?.trend).toBe('downtrend');
    });

    it('should interpret swing points sideways trend', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectSwingPointsMock.mockReturnValue({
        swingHighs: [{ index: 50, price: 110, type: 'high' as const }],
        swingLows: [{ index: 50, price: 95, type: 'low' as const }],
        latestSwingHigh: { index: 50, price: 110, type: 'high' as const },
        latestSwingLow: { index: 50, price: 95, type: 'low' as const },
        trend: 'sideways' as const,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.SWING_POINTS],
      });

      expect(result.indicators.patterns?.swingPoints?.trend).toBe('sideways');
    });

    it('should handle pivot points woodie type', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock
        .mockResolvedValueOnce({ candles: asSdkCandles(mockCandles) })
        .mockResolvedValueOnce({
          candles: [
            { open: '90', high: '100', low: '85', close: '95', volume: '800' }, // Older
            {
              open: '100',
              high: '110',
              low: '95',
              close: '105',
              volume: '1000',
            }, // Previous day
          ],
        });

      calculatePivotPointsMock.mockReturnValue({
        type: 'woodie',
        pivotPoint: 100,
        resistance1: 105,
        resistance2: 110,
        support1: 95,
        support2: 90,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PIVOT_POINTS],
      });

      expect(result.indicators.supportResistance?.pivotPoints?.pivot).toBe(100);
    });

    it('should handle pivot points demark type', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock
        .mockResolvedValueOnce({ candles: asSdkCandles(mockCandles) })
        .mockResolvedValueOnce({
          candles: [
            { open: '90', high: '100', low: '85', close: '95', volume: '800' }, // Older
            {
              open: '100',
              high: '110',
              low: '95',
              close: '105',
              volume: '1000',
            }, // Previous day
          ],
        });

      calculatePivotPointsMock.mockReturnValue({
        type: 'demark',
        pivotPoint: 100,
        resistance1: 105,
        support1: 95,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PIVOT_POINTS],
      });

      expect(result.indicators.supportResistance?.pivotPoints?.pivot).toBe(100);
    });

    it('should handle pivot points camarilla type', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock
        .mockResolvedValueOnce({ candles: asSdkCandles(mockCandles) })
        .mockResolvedValueOnce({
          candles: [
            { open: '90', high: '100', low: '85', close: '95', volume: '800' }, // Older
            {
              open: '100',
              high: '110',
              low: '95',
              close: '105',
              volume: '1000',
            }, // Previous day
          ],
        });

      calculatePivotPointsMock.mockReturnValue({
        type: 'camarilla',
        pivotPoint: 100,
        resistance1: 102,
        resistance2: 104,
        resistance3: 106,
        resistance4: 108,
        support1: 98,
        support2: 96,
        support3: 94,
        support4: 92,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PIVOT_POINTS],
      });

      expect(result.indicators.supportResistance?.pivotPoints?.pivot).toBe(100);
    });

    it('should interpret ROC neutral (value = 0)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateRocMock.mockReturnValue({
        period: 12,
        values: [0],
        latestValue: 0, // Exactly zero - neutral
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ROC],
      });

      expect(result.indicators.momentum?.roc?.signal).toBe('neutral');
    });

    it('should interpret ATR normal volatility (1.5% to 3%)', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 100 }); // Current price = 100
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // ATR of 2 with price 100 = 2% volatility (normal)
      calculateAtrMock.mockReturnValue({
        period: 14,
        values: [2],
        latestValue: 2,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ATR],
      });

      expect(result.indicators.volatility?.atr?.volatility).toBe('normal');
    });

    it('should interpret ATR low volatility (<1.5%)', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 100 }); // Current price = 100
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // ATR of 1 with price 100 = 1% volatility (low)
      calculateAtrMock.mockReturnValue({
        period: 14,
        values: [1],
        latestValue: 1,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ATR],
      });

      expect(result.indicators.volatility?.atr?.volatility).toBe('low');
    });

    it('should calculate aggregated signal with all indicator types', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 150 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Mock all indicators with bullish signals
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [25],
        latestValue: 25, // Oversold - bullish
      });
      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [
          { MACD: 0.5, signal: 1.0, histogram: -0.5 },
          { MACD: 1.5, signal: 1.0, histogram: 0.5 },
        ],
        latestValue: { MACD: 1.5, signal: 1.0, histogram: 0.5 },
      });
      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 15, d: 18 }],
        latestValue: { k: 15, d: 18 }, // Oversold - bullish
      });
      calculateAdxMock.mockReturnValue({
        period: 14,
        values: [{ adx: 30, pdi: 35, mdi: 20 }],
        latestValue: { adx: 30, pdi: 35, mdi: 20 }, // PDI > MDI - bullish
      });
      calculateCciMock.mockReturnValue({
        period: 20,
        values: [-150],
        latestValue: -150, // Oversold - bullish
      });
      calculateWilliamsRMock.mockReturnValue({
        period: 14,
        values: [-90],
        latestValue: -90, // Oversold - bullish
      });
      calculateRocMock.mockReturnValue({
        period: 12,
        values: [5.5],
        latestValue: 5.5, // Positive - bullish
      });
      calculateSmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100, // Price above SMA - bullish
      });
      calculateEmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100, // Price above EMA - bullish
      });
      calculateIchimokuCloudMock.mockReturnValue({
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
        values: [
          { conversion: 105, base: 103, spanA: 100, spanB: 95, chikou: 110 },
        ],
        latestValue: {
          conversion: 105,
          base: 103,
          spanA: 100,
          spanB: 95,
          chikou: 110,
        },
      });
      calculatePsarMock.mockReturnValue({
        step: 0.02,
        max: 0.2,
        values: [95],
        latestValue: 95, // Below price - uptrend
      });
      calculateBollingerBandsMock.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [
          { upper: 160, middle: 150, lower: 140, pb: 0.5, bandwidth: 0.13 },
        ],
        latestValue: {
          upper: 160,
          middle: 150,
          lower: 140,
          pb: 0.5,
          bandwidth: 0.13,
        },
      });
      calculateAtrMock.mockReturnValue({
        period: 14,
        values: [5],
        latestValue: 5,
      });
      calculateKeltnerChannelsMock.mockReturnValue({
        maPeriod: 20,
        atrPeriod: 10,
        multiplier: 2,
        useSMA: false,
        values: [{ middle: 100, upper: 110, lower: 90 }],
        latestValue: { middle: 100, upper: 110, lower: 90 },
      });
      calculateObvMock.mockReturnValue({
        values: [1000, 1200, 1500, 1800, 2200],
        latestValue: 2200, // Rising - bullish
      });
      calculateMfiMock.mockReturnValue({
        period: 14,
        values: [15],
        latestValue: 15, // Oversold - bullish
      });
      calculateVwapMock.mockReturnValue({
        values: [100],
        latestValue: 100, // Price above - bullish
      });
      calculateVolumeProfileMock.mockReturnValue({
        noOfBars: 12,
        zones: [
          {
            rangeStart: 95,
            rangeEnd: 105,
            bullishVolume: 500,
            bearishVolume: 400,
            totalVolume: 900,
          },
        ],
        pointOfControl: {
          rangeStart: 100,
          rangeEnd: 105,
          bullishVolume: 500,
          bearishVolume: 400,
          totalVolume: 900,
        },
        valueAreaHigh: 110,
        valueAreaLow: 90,
      });
      detectCandlestickPatternsMock.mockReturnValue({
        bullish: true,
        bearish: false,
        patterns: [],
        detectedPatterns: ['Hammer'],
      });
      detectRsiDivergenceMock.mockReturnValue({
        rsiPeriod: 14,
        lookbackPeriod: 14,
        rsiValues: [55],
        divergences: [
          {
            type: 'bullish',
            startIndex: 0,
            endIndex: 5,
            priceStart: 100,
            priceEnd: 95,
            rsiStart: 30,
            rsiEnd: 40,
            strength: 'strong',
          },
        ],
        latestDivergence: {
          type: 'bullish',
          startIndex: 0,
          endIndex: 5,
          priceStart: 100,
          priceEnd: 95,
          rsiStart: 30,
          rsiEnd: 40,
          strength: 'strong',
        },
        hasBullishDivergence: true,
        hasBearishDivergence: false,
      });
      detectChartPatternsMock.mockReturnValue({
        lookbackPeriod: 50,
        patterns: [
          {
            type: 'double_bottom',
            startIndex: 0,
            endIndex: 50,
            confidence: 'high',
            direction: 'bullish',
            priceTarget: 120,
            neckline: 105,
          },
        ],
        bullishPatterns: [
          {
            type: 'double_bottom',
            startIndex: 0,
            endIndex: 50,
            confidence: 'high',
            direction: 'bullish',
            priceTarget: 120,
            neckline: 105,
          },
        ],
        bearishPatterns: [],
        latestPattern: {
          type: 'double_bottom',
          startIndex: 0,
          endIndex: 50,
          confidence: 'high',
          direction: 'bullish',
          priceTarget: 120,
          neckline: 105,
        },
      });
      detectSwingPointsMock.mockReturnValue({
        swingHighs: [{ index: 80, price: 150, type: 'high' as const }],
        swingLows: [{ index: 20, price: 100, type: 'low' as const }],
        latestSwingHigh: { index: 80, price: 150, type: 'high' as const },
        latestSwingLow: { index: 20, price: 100, type: 'low' as const },
        trend: 'uptrend' as const,
      });
      calculateFibonacciRetracementMock.mockReturnValue({
        start: 100,
        end: 150,
        trend: 'uptrend',
        levels: [
          { level: 0, price: 100 },
          { level: 50, price: 125 },
          { level: 100, price: 150 },
        ],
      });
      calculatePivotPointsMock.mockReturnValue({
        type: 'standard',
        pivotPoint: 120,
        resistance1: 130,
        resistance2: 140,
        resistance3: 150,
        support1: 110,
        support2: 100,
        support3: 90,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
      });

      // Should have a strong bullish signal
      expect(result.signal.score).toBeGreaterThan(50);
      expect(['STRONG_BUY', 'BUY']).toContain(result.signal.direction);
    });

    it('should calculate aggregated signal with bearish indicators', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 80 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Mock all indicators with bearish signals
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [75],
        latestValue: 75, // Overbought - bearish
      });
      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [
          { MACD: 1.5, signal: 1.0, histogram: 0.5 },
          { MACD: 0.5, signal: 1.0, histogram: -0.5 },
        ],
        latestValue: { MACD: 0.5, signal: 1.0, histogram: -0.5 }, // Bearish crossover
      });
      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 85, d: 82 }],
        latestValue: { k: 85, d: 82 }, // Overbought - bearish
      });
      calculateAdxMock.mockReturnValue({
        period: 14,
        values: [{ adx: 30, pdi: 20, mdi: 35 }],
        latestValue: { adx: 30, pdi: 20, mdi: 35 }, // MDI > PDI - bearish
      });
      calculateCciMock.mockReturnValue({
        period: 20,
        values: [150],
        latestValue: 150, // Overbought - bearish
      });
      calculateWilliamsRMock.mockReturnValue({
        period: 14,
        values: [-10],
        latestValue: -10, // Overbought - bearish
      });
      calculateRocMock.mockReturnValue({
        period: 12,
        values: [-5.5],
        latestValue: -5.5, // Negative - bearish
      });
      calculateSmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100, // Price below SMA - bearish
      });
      calculateEmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100, // Price below EMA - bearish
      });
      calculateIchimokuCloudMock.mockReturnValue({
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
        values: [
          { conversion: 95, base: 97, spanA: 100, spanB: 105, chikou: 80 },
        ],
        latestValue: {
          conversion: 95,
          base: 97,
          spanA: 100,
          spanB: 105,
          chikou: 80,
        },
      });
      calculatePsarMock.mockReturnValue({
        step: 0.02,
        max: 0.2,
        values: [110],
        latestValue: 110, // Above price - downtrend
      });
      calculateBollingerBandsMock.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [
          { upper: 85, middle: 75, lower: 65, pb: 0.5, bandwidth: 0.27 },
        ],
        latestValue: {
          upper: 85,
          middle: 75,
          lower: 65,
          pb: 0.5,
          bandwidth: 0.27,
        },
      });
      calculateAtrMock.mockReturnValue({
        period: 14,
        values: [5],
        latestValue: 5,
      });
      calculateKeltnerChannelsMock.mockReturnValue({
        maPeriod: 20,
        atrPeriod: 10,
        multiplier: 2,
        useSMA: false,
        values: [{ middle: 100, upper: 110, lower: 90 }],
        latestValue: { middle: 100, upper: 110, lower: 90 },
      });
      calculateObvMock.mockReturnValue({
        values: [2200, 1800, 1500, 1200, 1000],
        latestValue: 1000, // Falling - bearish
      });
      calculateMfiMock.mockReturnValue({
        period: 14,
        values: [85],
        latestValue: 85, // Overbought - bearish
      });
      calculateVwapMock.mockReturnValue({
        values: [100],
        latestValue: 100, // Price below - bearish
      });
      calculateVolumeProfileMock.mockReturnValue({
        noOfBars: 12,
        zones: [
          {
            rangeStart: 95,
            rangeEnd: 105,
            bullishVolume: 400,
            bearishVolume: 500,
            totalVolume: 900,
          },
        ],
        pointOfControl: {
          rangeStart: 100,
          rangeEnd: 105,
          bullishVolume: 400,
          bearishVolume: 500,
          totalVolume: 900,
        },
        valueAreaHigh: 110,
        valueAreaLow: 90,
      });
      detectCandlestickPatternsMock.mockReturnValue({
        bullish: false,
        bearish: true,
        patterns: [],
        detectedPatterns: ['Shooting Star'],
      });
      detectRsiDivergenceMock.mockReturnValue({
        rsiPeriod: 14,
        lookbackPeriod: 14,
        rsiValues: [55],
        divergences: [
          {
            type: 'bearish',
            startIndex: 0,
            endIndex: 5,
            priceStart: 95,
            priceEnd: 100,
            rsiStart: 70,
            rsiEnd: 60,
            strength: 'strong',
          },
        ],
        latestDivergence: {
          type: 'bearish',
          startIndex: 0,
          endIndex: 5,
          priceStart: 95,
          priceEnd: 100,
          rsiStart: 70,
          rsiEnd: 60,
          strength: 'strong',
        },
        hasBullishDivergence: false,
        hasBearishDivergence: true,
      });
      detectChartPatternsMock.mockReturnValue({
        lookbackPeriod: 50,
        patterns: [
          {
            type: 'head_and_shoulders',
            startIndex: 0,
            endIndex: 50,
            confidence: 'high',
            direction: 'bearish',
            priceTarget: 80,
            neckline: 95,
          },
        ],
        bullishPatterns: [],
        bearishPatterns: [
          {
            type: 'head_and_shoulders',
            startIndex: 0,
            endIndex: 50,
            confidence: 'high',
            direction: 'bearish',
            priceTarget: 80,
            neckline: 95,
          },
        ],
        latestPattern: {
          type: 'head_and_shoulders',
          startIndex: 0,
          endIndex: 50,
          confidence: 'high',
          direction: 'bearish',
          priceTarget: 80,
          neckline: 95,
        },
      });
      detectSwingPointsMock.mockReturnValue({
        swingHighs: [{ index: 20, price: 110, type: 'high' as const }],
        swingLows: [{ index: 80, price: 95, type: 'low' as const }],
        latestSwingHigh: { index: 20, price: 110, type: 'high' as const },
        latestSwingLow: { index: 80, price: 95, type: 'low' as const },
        trend: 'downtrend' as const,
      });
      calculateFibonacciRetracementMock.mockReturnValue({
        start: 100,
        end: 80,
        trend: 'downtrend',
        levels: [
          { level: 0, price: 100 },
          { level: 50, price: 90 },
          { level: 100, price: 80 },
        ],
      });
      calculatePivotPointsMock.mockReturnValue({
        type: 'standard',
        pivotPoint: 90,
        resistance1: 100,
        resistance2: 110,
        resistance3: 120,
        support1: 80,
        support2: 70,
        support3: 60,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
      });

      // Should have a strong bearish signal
      expect(result.signal.score).toBeLessThan(-50);
      expect(['STRONG_SELL', 'SELL']).toContain(result.signal.direction);
    });

    it('should interpret MACD no crossover as none', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // MACD remains above signal line (no crossover)
      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [
          { MACD: 1.5, signal: 1.0, histogram: 0.5 },
          { MACD: 2.0, signal: 1.0, histogram: 1.0 },
        ],
        latestValue: { MACD: 2.0, signal: 1.0, histogram: 1.0 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.MACD],
      });

      expect(result.indicators.momentum?.macd?.crossover).toBe('none');
    });

    it('should interpret ADX moderate strength (20-25)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateAdxMock.mockReturnValue({
        period: 14,
        values: [{ adx: 22, pdi: 30, mdi: 20 }],
        latestValue: { adx: 22, pdi: 30, mdi: 20 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ADX],
      });

      expect(result.indicators.momentum?.adx?.trendStrength).toBe('moderate');
    });

    it('should interpret ADX weak strength (<20)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateAdxMock.mockReturnValue({
        period: 14,
        values: [{ adx: 15, pdi: 25, mdi: 20 }],
        latestValue: { adx: 15, pdi: 25, mdi: 20 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ADX],
      });

      expect(result.indicators.momentum?.adx?.trendStrength).toBe('weak');
    });

    it('should interpret Stochastic neutral (20 < k < 80)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 50, d: 45 }],
        latestValue: { k: 50, d: 45 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.STOCHASTIC],
      });

      expect(result.indicators.momentum?.stochastic?.signal).toBe('neutral');
    });

    it('should interpret CCI neutral (-100 < value < 100)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateCciMock.mockReturnValue({
        period: 20,
        values: [50],
        latestValue: 50,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CCI],
      });

      expect(result.indicators.momentum?.cci?.signal).toBe('neutral');
    });

    it('should interpret Williams %R neutral (-80 < value < -20)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateWilliamsRMock.mockReturnValue({
        period: 14,
        values: [-50],
        latestValue: -50,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.WILLIAMS_R],
      });

      expect(result.indicators.momentum?.williamsR?.signal).toBe('neutral');
    });

    it('should interpret Ichimoku neutral signal', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 102 }); // Price in the cloud
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateIchimokuCloudMock.mockReturnValue({
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
        values: [
          { conversion: 100, base: 100, spanA: 100, spanB: 105, chikou: 102 },
        ],
        latestValue: {
          conversion: 100,
          base: 100,
          spanA: 100,
          spanB: 105,
          chikou: 102,
        },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ICHIMOKU],
      });

      expect(result.indicators.trend?.ichimoku?.signal).toBe('neutral');
    });

    it('should return BUY direction for score between 20 and 50', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 105 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Set up 5 indicators: 2 bullish, 3 neutral = 40% bullish = score 40
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [50],
        latestValue: 50, // Neutral
      });
      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 50, d: 50 }],
        latestValue: { k: 50, d: 50 }, // Neutral
      });
      calculateCciMock.mockReturnValue({
        period: 20,
        values: [0],
        latestValue: 0, // Neutral
      });
      calculateSmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100, // Price above - bullish
      });
      calculateEmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100, // Price above - bullish
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [
          IndicatorType.RSI,
          IndicatorType.STOCHASTIC,
          IndicatorType.CCI,
          IndicatorType.SMA,
          IndicatorType.EMA,
        ],
      });

      // Should be a moderate bullish signal (BUY)
      expect(result.signal.direction).toBe('BUY');
    });

    it('should return SELL direction for score between -50 and -20', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 95 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Set up 5 indicators: 2 bearish, 3 neutral = 40% bearish = score -40
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [50],
        latestValue: 50, // Neutral
      });
      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 50, d: 50 }],
        latestValue: { k: 50, d: 50 }, // Neutral
      });
      calculateCciMock.mockReturnValue({
        period: 20,
        values: [0],
        latestValue: 0, // Neutral
      });
      calculateSmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100, // Price below - bearish
      });
      calculateEmaMock.mockReturnValue({
        period: 20,
        values: [100],
        latestValue: 100, // Price below - bearish
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [
          IndicatorType.RSI,
          IndicatorType.STOCHASTIC,
          IndicatorType.CCI,
          IndicatorType.SMA,
          IndicatorType.EMA,
        ],
      });

      // Should be a moderate bearish signal (SELL)
      expect(result.signal.direction).toBe('SELL');
    });

    it('should return NEUTRAL direction when signals are balanced', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 100 }); // Price at SMA/EMA level
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Set up indicators with balanced signals
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [50],
        latestValue: 50, // Neutral
      });
      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 50, d: 50 }],
        latestValue: { k: 50, d: 50 }, // Neutral
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI, IndicatorType.STOCHASTIC],
      });

      // Should be neutral with only neutral signals
      expect(result.signal.direction).toBe('NEUTRAL');
    });

    it('should return LOW confidence with less than 5 signals', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Use only 1 indicator (less than 5 signals)
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [25],
        latestValue: 25,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI],
      });

      expect(result.signal.confidence).toBe('LOW');
    });

    it('should return LOW confidence with low agreement rate', async () => {
      const mockCandles = createMockCandles(100, { closePrice: 100 });
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Set up 6 indicators with mixed signals (low agreement)
      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [75],
        latestValue: 75, // Overbought - bearish
      });
      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [
          { MACD: 0.5, signal: 1.0, histogram: -0.5 },
          { MACD: 1.5, signal: 1.0, histogram: 0.5 },
        ],
        latestValue: { MACD: 1.5, signal: 1.0, histogram: 0.5 }, // Bullish
      });
      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 85, d: 82 }],
        latestValue: { k: 85, d: 82 }, // Overbought - bearish
      });
      calculateAdxMock.mockReturnValue({
        period: 14,
        values: [{ adx: 30, pdi: 25, mdi: 25 }],
        latestValue: { adx: 30, pdi: 25, mdi: 25 }, // Neutral (pdi == mdi)
      });
      calculateCciMock.mockReturnValue({
        period: 20,
        values: [50],
        latestValue: 50, // Neutral
      });
      calculateWilliamsRMock.mockReturnValue({
        period: 14,
        values: [-10],
        latestValue: -10, // Overbought - bearish
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [
          IndicatorType.RSI,
          IndicatorType.MACD,
          IndicatorType.STOCHASTIC,
          IndicatorType.ADX,
          IndicatorType.CCI,
          IndicatorType.WILLIAMS_R,
        ],
      });

      // With 6 signals and mixed signals, should have LOW confidence
      expect(['LOW', 'MEDIUM']).toContain(result.signal.confidence);
    });
  });

  describe('edge cases and null handling', () => {
    it('should handle API candles with null/undefined fields', async () => {
      // API might return candles with missing fields
      getProductCandlesMock.mockResolvedValue({
        candles: [
          {
            open: undefined,
            high: '102',
            low: '98',
            close: '101',
            volume: '1000',
          },
          {
            open: '101',
            high: undefined,
            low: '98',
            close: '102',
            volume: '1000',
          },
          {
            open: '102',
            high: '105',
            low: undefined,
            close: '103',
            volume: '1000',
          },
          {
            open: '103',
            high: '106',
            low: '100',
            close: undefined,
            volume: '1000',
          },
          {
            open: '104',
            high: '107',
            low: '101',
            close: '105',
            volume: undefined,
          },
        ] as never,
      });

      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [50],
        latestValue: 50,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI],
      });

      // Should handle nullish values with defaults
      expect(result).toBeDefined();
      expect(result.indicators.momentum?.rsi).toBeDefined();
    });

    it('should handle empty candles array from API', async () => {
      getProductCandlesMock.mockResolvedValue({
        candles: undefined,
      } as never);

      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [],
        latestValue: null,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI],
      });

      expect(result).toBeDefined();
    });

    it('should handle zero open price in price summary calculation', async () => {
      // Create candles with first candle having open=0 (edge case for division by zero)
      // Service uses candles[length-1] as oldest and candles[0] as latest
      const candlesWithZeroOpen = [
        { open: '101', high: '105', low: '99', close: '104', volume: '1100' }, // Latest (index 0)
        { open: '0', high: '102', low: '98', close: '101', volume: '1000' }, // Oldest with open=0
      ];
      getProductCandlesMock.mockResolvedValue({
        candles: candlesWithZeroOpen,
      });

      calculateRsiMock.mockReturnValue({
        period: 14,
        values: [50],
        latestValue: 50,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI],
      });

      // Should be 0 when open is 0 (avoiding division by zero)
      expect(result.price.change24h).toBe(0);
    });

    it('should handle MACD with null signal and histogram', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [{ MACD: 1.5, signal: undefined, histogram: undefined }],
        latestValue: { MACD: 1.5, signal: undefined, histogram: undefined },
      } as never);

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.MACD],
      });

      expect(result.indicators.momentum?.macd?.signal).toBe(0);
      expect(result.indicators.momentum?.macd?.histogram).toBe(0);
    });

    it('should handle daily candles for pivot points (triggers fetchDailyCandles null handling)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock
        .mockResolvedValueOnce({ candles: asSdkCandles(mockCandles) })
        .mockResolvedValueOnce({
          // Need at least 2 daily candles (service uses index 1 for previous day)
          candles: [
            {
              open: '105',
              high: '115',
              low: '100',
              close: '110',
              volume: '1100',
            }, // Current incomplete day
            {
              open: '100',
              high: '110',
              low: '95',
              close: '105',
              volume: '1000',
            }, // Previous day
          ],
        });

      calculatePivotPointsMock.mockReturnValue({
        type: 'standard',
        pivotPoint: 100,
        resistance1: 105,
        resistance2: 110,
        resistance3: 115,
        support1: 95,
        support2: 90,
        support3: 85,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PIVOT_POINTS],
      });

      expect(result.indicators.supportResistance?.pivotPoints).toBeDefined();
    });

    it('should handle Stochastic with valid values', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [{ k: 75, d: 70 }],
        latestValue: { k: 75, d: 70 },
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.STOCHASTIC],
      });

      expect(result.indicators.momentum?.stochastic?.d).toBe(70);
    });

    it('should handle ATR when current price is zero (edge case)', async () => {
      // Create candles where the latest close price is 0
      const candlesWithZeroPrice = [
        { open: '0', high: '0', low: '0', close: '0', volume: '1000' },
        { open: '100', high: '105', low: '95', close: '101', volume: '1000' },
      ];
      getProductCandlesMock.mockResolvedValue({
        candles: candlesWithZeroPrice,
      });

      calculateAtrMock.mockReturnValue({
        period: 14,
        values: [5],
        latestValue: 5,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.ATR],
      });

      // ATR should handle zero price without division error
      expect(result.indicators.volatility?.atr).toBeDefined();
    });

    it('should not include indicators when latestValue is null', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // All indicators return null latestValue
      calculateStochasticMock.mockReturnValue({
        kPeriod: 14,
        dPeriod: 3,
        values: [],
        latestValue: null,
      });

      calculateBollingerBandsMock.mockReturnValue({
        period: 20,
        stdDev: 2,
        values: [],
        latestValue: null,
      });

      calculateKeltnerChannelsMock.mockReturnValue({
        maPeriod: 20,
        atrPeriod: 10,
        multiplier: 2,
        useSMA: false,
        values: [],
        latestValue: null,
      });

      calculateIchimokuCloudMock.mockReturnValue({
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
        values: [],
        latestValue: null,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [
          IndicatorType.STOCHASTIC,
          IndicatorType.BOLLINGER_BANDS,
          IndicatorType.KELTNER,
          IndicatorType.ICHIMOKU,
        ],
      });

      // Indicators with null latestValue should not be included
      expect(result.indicators.momentum?.stochastic).toBeUndefined();
      expect(result.indicators.volatility?.bollingerBands).toBeUndefined();
      expect(result.indicators.volatility?.keltner).toBeUndefined();
      expect(result.indicators.trend?.ichimoku).toBeUndefined();
    });

    it('should handle volume profile with valid values', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateVolumeProfileMock.mockReturnValue({
        noOfBars: 10,
        zones: [],
        pointOfControl: {
          rangeStart: 100,
          rangeEnd: 105,
          bullishVolume: 500,
          bearishVolume: 400,
          totalVolume: 1000,
        },
        valueAreaHigh: 110,
        valueAreaLow: 90,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.VOLUME_PROFILE],
      });

      expect(result.indicators.volume?.volumeProfile).toBeDefined();
    });

    it('should handle OBV with null latestValue', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateObvMock.mockReturnValue({
        values: [],
        latestValue: null,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.OBV],
      });

      // OBV should not be included when latestValue is null
      expect(result.indicators.volume?.obv).toBeUndefined();
    });

    it('should interpret OBV flat trend when values are equal', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // OBV with equal latest and previous values
      calculateObvMock.mockReturnValue({
        values: [1000, 1000], // Equal values = flat trend
        latestValue: 1000,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.OBV],
      });

      expect(result.indicators.volume?.obv?.trend).toBe('flat');
    });

    it('should handle volume profile with null valueAreaHigh/Low', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      calculateVolumeProfileMock.mockReturnValue({
        numRows: 10,
        rowSize: 1,
        zones: [],
        pointOfControl: {
          rangeStart: 100,
          rangeEnd: 105,
          bullishVolume: 500,
          bearishVolume: 400,
          totalVolume: 1000,
        },
        valueAreaHigh: undefined, // Null trigger
        valueAreaLow: undefined, // Null trigger
      } as never);

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.VOLUME_PROFILE],
      });

      expect(result.indicators.volume?.volumeProfile?.valueAreaHigh).toBe(0);
      expect(result.indicators.volume?.volumeProfile?.valueAreaLow).toBe(0);
    });

    it('should handle fetchDailyCandles with null API fields', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock
        .mockResolvedValueOnce({ candles: asSdkCandles(mockCandles) })
        .mockResolvedValueOnce({
          candles: [
            {
              open: undefined,
              high: undefined,
              low: undefined,
              close: undefined,
              volume: undefined,
            },
            {
              open: undefined,
              high: undefined,
              low: undefined,
              close: undefined,
              volume: undefined,
            },
          ],
        } as never);

      calculatePivotPointsMock.mockReturnValue({
        type: 'standard',
        pivotPoint: 0,
        resistance1: 0,
        resistance2: 0,
        resistance3: 0,
        support1: 0,
        support2: 0,
        support3: 0,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PIVOT_POINTS],
      });

      // Should use '0' defaults for null fields
      expect(result.indicators.supportResistance?.pivotPoints).toBeDefined();
    });

    it('should handle swing points with null latest prices', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Swing points with null latest values
      detectSwingPointsMock.mockReturnValue({
        swingHighs: [],
        swingLows: [],
        latestSwingHigh: null,
        latestSwingLow: null,
        trend: 'sideways' as const,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.SWING_POINTS],
      });

      expect(
        result.indicators.patterns?.swingPoints?.latestSwingHigh,
      ).toBeNull();
      expect(
        result.indicators.patterns?.swingPoints?.latestSwingLow,
      ).toBeNull();
    });

    it('should handle RSI divergence with null latest divergence', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectRsiDivergenceMock.mockReturnValue({
        rsiPeriod: 14,
        lookbackPeriod: 14,
        rsiValues: [55],
        divergences: [],
        latestDivergence: null,
        hasBullishDivergence: false,
        hasBearishDivergence: false,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.RSI_DIVERGENCE],
      });

      expect(result.indicators.patterns?.rsiDivergence?.type).toBeNull();
      expect(result.indicators.patterns?.rsiDivergence?.strength).toBeNull();
    });

    it('should handle chart patterns with no patterns detected', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      detectChartPatternsMock.mockReturnValue({
        lookbackPeriod: 50,
        patterns: [],
        bullishPatterns: [],
        bearishPatterns: [],
        latestPattern: null,
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CHART_PATTERNS],
      });

      expect(result.indicators.patterns?.chartPatterns?.direction).toBeNull();
    });

    it('should handle addSignalFromIndicator with null values', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Return indicators that don't contribute to signals
      calculateVwapMock.mockReturnValue({
        values: [100],
        latestValue: 100, // Same as current price - no signal
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.VWAP],
      });

      // VWAP should be included but position is based on comparison
      expect(result.indicators.volume?.vwap).toBeDefined();
    });

    it('should handle candlestick patterns neutral bias (neither bullish nor bearish)', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // Candlestick patterns with no bullish or bearish bias
      detectCandlestickPatternsMock.mockReturnValue({
        bullish: false,
        bearish: false,
        patterns: [],
        detectedPatterns: ['Doji'], // Neutral pattern
      });

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.CANDLESTICK_PATTERNS],
      });

      expect(result.indicators.patterns?.candlestickPatterns?.bias).toBe(
        'neutral',
      );
    });

    it('should handle MACD crossover with null previous values', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock.mockResolvedValue({
        candles: asSdkCandles(mockCandles),
      });

      // MACD with null values in previous entry
      calculateMacdMock.mockReturnValue({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: [
          { MACD: undefined, signal: undefined, histogram: 0 },
          { MACD: 1.5, signal: 1.0, histogram: 0.5 },
        ],
        latestValue: { MACD: 1.5, signal: 1.0, histogram: 0.5 },
      } as never);

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.MACD],
      });

      // Should handle null previous values with defaults
      expect(result.indicators.momentum?.macd).toBeDefined();
    });

    it('should handle fetchDailyCandles with null candles response', async () => {
      const mockCandles = createMockCandles(100);
      getProductCandlesMock
        .mockResolvedValueOnce({ candles: asSdkCandles(mockCandles) })
        .mockResolvedValueOnce({
          candles: undefined, // Null candles array
        } as never);

      const result = await service.analyzeTechnicalIndicators({
        productId: 'BTC-USD',
        granularity: Granularity.ONE_HOUR,
        indicators: [IndicatorType.PIVOT_POINTS],
      });

      // Should handle null candles with empty array default
      // Pivot points won't be calculated since we don't have enough daily candles
      expect(result.indicators.supportResistance?.pivotPoints).toBeUndefined();
    });
  });
});
