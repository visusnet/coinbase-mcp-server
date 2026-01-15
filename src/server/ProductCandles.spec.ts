import { Candle } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Candle';
import { countCandles, Granularity } from './ProductCandles';

describe('Granularity', () => {
  it('should have correct enum values', () => {
    expect(Granularity.ONE_MINUTE).toBe('ONE_MINUTE');
    expect(Granularity.FIVE_MINUTE).toBe('FIVE_MINUTE');
    expect(Granularity.FIFTEEN_MINUTE).toBe('FIFTEEN_MINUTE');
    expect(Granularity.THIRTY_MINUTE).toBe('THIRTY_MINUTE');
    expect(Granularity.ONE_HOUR).toBe('ONE_HOUR');
    expect(Granularity.TWO_HOUR).toBe('TWO_HOUR');
    expect(Granularity.SIX_HOUR).toBe('SIX_HOUR');
    expect(Granularity.ONE_DAY).toBe('ONE_DAY');
  });
});

describe('countCandles', () => {
  it('should return the correct total candle count', () => {
    const candleResults = [
      {
        productId: 'BTC-USD',
        response: { candles: [candle(1), candle(2), candle(3)] },
      },
      { productId: 'ETH-USD', response: { candles: [candle(1), candle(2)] } },
      { productId: 'LTC-USD', response: { candles: [] } },
      { productId: 'XRP-USD', response: { candles: [candle(1)] } },
    ];

    const totalCandles = countCandles(candleResults);
    expect(totalCandles).toBe(6);
  });

  it('should handle empty candle arrays correctly', () => {
    const candleResults = [
      { productId: 'BTC-USD', response: { candles: [] } },
      { productId: 'ETH-USD', response: { candles: [] } },
    ];

    const totalCandles = countCandles(candleResults);
    expect(totalCandles).toBe(0);
  });

  it('should handle missing candles property correctly', () => {
    const candleResults = [
      { productId: 'BTC-USD', response: {} },
      {
        productId: 'ETH-USD',
        response: { candles: [candle(1), candle(2), candle(3), candle(4)] },
      },
    ];

    const totalCandles = countCandles(candleResults);
    expect(totalCandles).toBe(4);
  });

  function candle(value: number): Candle {
    return {
      low: String(value),
      high: String(value),
      open: String(value),
      close: String(value),
      volume: String(value),
    };
  }
});
