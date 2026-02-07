import type { WebSocketCandle } from './MarketEventService.message';
import { CandleBuffer } from './CandleBuffer';

function createCandle(
  productId: string,
  start: number,
  overrides: Partial<WebSocketCandle> = {},
): WebSocketCandle {
  return {
    productId,
    start,
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 1000,
    ...overrides,
  };
}

describe('CandleBuffer', () => {
  describe('addCandle', () => {
    it('should add a candle to the buffer', () => {
      const buffer = new CandleBuffer();
      const candle = createCandle('BTC-EUR', 1000);

      buffer.addCandle(candle, 'FIVE_MINUTE');

      expect(buffer.getCandleCount('BTC-EUR', 'FIVE_MINUTE')).toBe(1);
    });

    it('should maintain chronological order', () => {
      const buffer = new CandleBuffer();

      // Add candles out of order
      buffer.addCandle(createCandle('BTC-EUR', 3000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 2000), 'FIVE_MINUTE');

      const candles = buffer.getCandles('BTC-EUR', 'FIVE_MINUTE');
      expect(candles.map((c) => c.start)).toEqual([1000, 2000, 3000]);
    });

    it('should update existing candle with same start time', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(
        createCandle('BTC-EUR', 1000, { close: 100 }),
        'FIVE_MINUTE',
      );
      buffer.addCandle(
        createCandle('BTC-EUR', 1000, { close: 150 }),
        'FIVE_MINUTE',
      );

      const candles = buffer.getCandles('BTC-EUR', 'FIVE_MINUTE');
      expect(candles).toHaveLength(1);
      expect(candles[0].close).toBe(150);
    });

    it('should trim old candles when exceeding max', () => {
      const buffer = new CandleBuffer(3); // Max 3 candles

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 2000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 3000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 4000), 'FIVE_MINUTE');

      const candles = buffer.getCandles('BTC-EUR', 'FIVE_MINUTE');
      expect(candles).toHaveLength(3);
      expect(candles.map((c) => c.start)).toEqual([2000, 3000, 4000]);
    });

    it('should keep buffers separate per product', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('ETH-EUR', 1000), 'FIVE_MINUTE');

      expect(buffer.getCandleCount('BTC-EUR', 'FIVE_MINUTE')).toBe(1);
      expect(buffer.getCandleCount('ETH-EUR', 'FIVE_MINUTE')).toBe(1);
    });

    it('should keep buffers separate per granularity', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 1000), 'ONE_HOUR');

      expect(buffer.getCandleCount('BTC-EUR', 'FIVE_MINUTE')).toBe(1);
      expect(buffer.getCandleCount('BTC-EUR', 'ONE_HOUR')).toBe(1);
    });
  });

  describe('getCandles', () => {
    it('should return empty array for non-existent buffer', () => {
      const buffer = new CandleBuffer();

      expect(buffer.getCandles('BTC-EUR', 'FIVE_MINUTE')).toEqual([]);
    });

    it('should return all candles when count not specified', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 2000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 3000), 'FIVE_MINUTE');

      const candles = buffer.getCandles('BTC-EUR', 'FIVE_MINUTE');
      expect(candles).toHaveLength(3);
    });

    it('should return most recent candles when count specified', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 2000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 3000), 'FIVE_MINUTE');

      const candles = buffer.getCandles('BTC-EUR', 'FIVE_MINUTE', 2);
      expect(candles).toHaveLength(2);
      expect(candles.map((c) => c.start)).toEqual([2000, 3000]);
    });

    it('should return all candles when count exceeds buffer size', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 2000), 'FIVE_MINUTE');

      const candles = buffer.getCandles('BTC-EUR', 'FIVE_MINUTE', 10);
      expect(candles).toHaveLength(2);
    });
  });

  describe('getLatestCandle', () => {
    it('should return undefined for non-existent buffer', () => {
      const buffer = new CandleBuffer();

      expect(buffer.getLatestCandle('BTC-EUR', 'FIVE_MINUTE')).toBeUndefined();
    });

    it('should return the most recent candle', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 3000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 2000), 'FIVE_MINUTE');

      const latest = buffer.getLatestCandle('BTC-EUR', 'FIVE_MINUTE');
      expect(latest?.start).toBe(3000);
    });
  });

  describe('getCandleCount', () => {
    it('should return 0 for non-existent buffer', () => {
      const buffer = new CandleBuffer();

      expect(buffer.getCandleCount('BTC-EUR', 'FIVE_MINUTE')).toBe(0);
    });

    it('should return correct count', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('BTC-EUR', 2000), 'FIVE_MINUTE');

      expect(buffer.getCandleCount('BTC-EUR', 'FIVE_MINUTE')).toBe(2);
    });
  });

  describe('clearBuffer', () => {
    it('should clear a specific buffer', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('ETH-EUR', 1000), 'FIVE_MINUTE');

      buffer.clearBuffer('BTC-EUR', 'FIVE_MINUTE');

      expect(buffer.getCandleCount('BTC-EUR', 'FIVE_MINUTE')).toBe(0);
      expect(buffer.getCandleCount('ETH-EUR', 'FIVE_MINUTE')).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should clear all buffers', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('ETH-EUR', 1000), 'ONE_HOUR');

      buffer.clearAll();

      expect(buffer.getCandleCount('BTC-EUR', 'FIVE_MINUTE')).toBe(0);
      expect(buffer.getCandleCount('ETH-EUR', 'ONE_HOUR')).toBe(0);
    });
  });

  describe('getBufferKeys', () => {
    it('should return all buffer keys', () => {
      const buffer = new CandleBuffer();

      buffer.addCandle(createCandle('BTC-EUR', 1000), 'FIVE_MINUTE');
      buffer.addCandle(createCandle('ETH-EUR', 1000), 'ONE_HOUR');

      const keys = buffer.getBufferKeys();
      expect(keys).toContain('BTC-EUR:FIVE_MINUTE');
      expect(keys).toContain('ETH-EUR:ONE_HOUR');
    });

    it('should return empty array for empty buffer', () => {
      const buffer = new CandleBuffer();

      expect(buffer.getBufferKeys()).toEqual([]);
    });
  });
});
