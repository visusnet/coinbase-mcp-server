/**
 * Represents a candle with a unique key for deduplication.
 */
export interface BufferedCandle {
  readonly start: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly productId: string;
}

/**
 * Key for identifying a unique candle buffer (product + granularity combination).
 */
type BufferKey = `${string}:${string}`;

/**
 * Creates a buffer key from product ID and granularity.
 */
function createBufferKey(productId: string, granularity: string): BufferKey {
  return `${productId}:${granularity}`;
}

/**
 * Buffer for storing candles per product/granularity combination.
 * Maintains a rolling window of candles for indicator calculations.
 */
export class CandleBuffer {
  private readonly buffers: Map<BufferKey, BufferedCandle[]> = new Map();
  private readonly maxCandles: number;

  /**
   * Creates a new CandleBuffer.
   * @param maxCandles - Maximum number of candles to store per buffer (default: 100)
   */
  constructor(maxCandles: number = 100) {
    this.maxCandles = maxCandles;
  }

  /**
   * Adds or updates a candle in the buffer.
   * If a candle with the same start time exists, it will be updated.
   * Otherwise, the candle will be added and old candles will be trimmed.
   *
   * @param candle - The candle to add
   * @param granularity - The granularity of the candle (e.g., "FIVE_MINUTE")
   */
  public addCandle(candle: BufferedCandle, granularity: string): void {
    const key = createBufferKey(candle.productId, granularity);
    let buffer = this.buffers.get(key);

    if (!buffer) {
      buffer = [];
      this.buffers.set(key, buffer);
    }

    // Check if we already have a candle with this start time (update scenario)
    const existingIndex = buffer.findIndex((c) => c.start === candle.start);
    if (existingIndex !== -1) {
      buffer[existingIndex] = candle;
    } else {
      // Insert in chronological order (newest at end)
      buffer.push(candle);
      buffer.sort((a, b) => a.start - b.start);

      // Trim old candles if we exceed the max
      while (buffer.length > this.maxCandles) {
        buffer.shift();
      }
    }
  }

  /**
   * Gets candles from the buffer.
   *
   * @param productId - The product ID
   * @param granularity - The granularity
   * @param count - Optional number of candles to return (from most recent)
   * @returns Array of candles sorted chronologically (oldest first)
   */
  public getCandles(
    productId: string,
    granularity: string,
    count?: number,
  ): readonly BufferedCandle[] {
    const key = createBufferKey(productId, granularity);
    const buffer = this.buffers.get(key);

    if (!buffer || buffer.length === 0) {
      return [];
    }

    if (count !== undefined && count < buffer.length) {
      // Return the most recent 'count' candles
      return buffer.slice(-count);
    }

    return buffer;
  }

  /**
   * Gets the latest candle from the buffer.
   *
   * @param productId - The product ID
   * @param granularity - The granularity
   * @returns The latest candle or undefined if buffer is empty
   */
  public getLatestCandle(
    productId: string,
    granularity: string,
  ): BufferedCandle | undefined {
    const key = createBufferKey(productId, granularity);
    const buffer = this.buffers.get(key);

    if (!buffer || buffer.length === 0) {
      return undefined;
    }

    return buffer[buffer.length - 1];
  }

  /**
   * Gets the number of candles in a buffer.
   *
   * @param productId - The product ID
   * @param granularity - The granularity
   * @returns Number of candles in the buffer
   */
  public getCandleCount(productId: string, granularity: string): number {
    const key = createBufferKey(productId, granularity);
    const buffer = this.buffers.get(key);
    return buffer?.length ?? 0;
  }

  /**
   * Clears all candles for a specific product/granularity combination.
   *
   * @param productId - The product ID
   * @param granularity - The granularity
   */
  public clearBuffer(productId: string, granularity: string): void {
    const key = createBufferKey(productId, granularity);
    this.buffers.delete(key);
  }

  /**
   * Clears all buffers.
   */
  public clearAll(): void {
    this.buffers.clear();
  }

  /**
   * Gets all buffer keys (for debugging/testing).
   */
  public getBufferKeys(): BufferKey[] {
    return [...this.buffers.keys()];
  }
}
