import pRetry from 'p-retry';
import { logger } from '../../logger';
import { CandleBuffer, type BufferedCandle } from './CandleBuffer';
import { Granularity } from './common.request';
import type { ProductsService } from './ProductsService';
import { GetProductCandlesRequestSchema } from './ProductsService.request';

const CANDLE_FETCH_RETRIES = 3;

/**
 * Maps granularity to refresh interval in milliseconds.
 */
function getRefreshIntervalMs(granularity: Granularity): number {
  switch (granularity) {
    case Granularity.ONE_MINUTE:
      return 60 * 1000;
    case Granularity.FIVE_MINUTE:
      return 5 * 60 * 1000;
    case Granularity.FIFTEEN_MINUTE:
      return 15 * 60 * 1000;
    case Granularity.THIRTY_MINUTE:
      return 30 * 60 * 1000;
    case Granularity.ONE_HOUR:
      return 60 * 60 * 1000;
    case Granularity.TWO_HOUR:
      return 2 * 60 * 60 * 1000;
    case Granularity.SIX_HOUR:
      return 6 * 60 * 60 * 1000;
    case Granularity.ONE_DAY:
      return 24 * 60 * 60 * 1000;
  }
}

type CandleRefKey = `${string}:${Granularity}`;

interface PollingEntry {
  readonly timer: ReturnType<typeof setInterval>;
  maxCount: number;
}

function candleRefKey(
  productId: string,
  granularity: Granularity,
): CandleRefKey {
  return `${productId}:${granularity}`;
}

/**
 * REST polling connection for non-5m candle data.
 * Similar interface to WebSocketConnection: subscribe/unsubscribe/close.
 *
 * Handles fetch + retry + timer lifecycle. Ref counting is the caller's concern.
 */
export class RestPollingConnection {
  private readonly candleBuffer = new CandleBuffer();
  private readonly entries = new Map<CandleRefKey, PollingEntry>();

  constructor(
    private readonly productsService: ProductsService,
    private readonly candleHandler: (
      productId: string,
      granularity: Granularity,
      candles: readonly BufferedCandle[],
    ) => void,
    private readonly disconnectHandler: (reason: string) => void,
  ) {}

  public subscribe(
    productId: string,
    granularity: Granularity,
    count: number,
  ): void {
    const key = candleRefKey(productId, granularity);
    const existing = this.entries.get(key);

    if (existing) {
      if (count > existing.maxCount) {
        existing.maxCount = count;
      }
      return;
    }

    void this.fetchAndDeliver(productId, granularity, count);

    const entry: PollingEntry = {
      maxCount: count,
      timer: setInterval(
        () => void this.fetchAndDeliver(productId, granularity, entry.maxCount),
        getRefreshIntervalMs(granularity),
      ),
    };
    this.entries.set(key, entry);
  }

  public unsubscribe(productId: string, granularity: Granularity): void {
    const key = candleRefKey(productId, granularity);
    const entry = this.entries.get(key);
    if (entry) {
      clearInterval(entry.timer);
      this.entries.delete(key);
    }
  }

  public close(): void {
    for (const { timer } of this.entries.values()) {
      clearInterval(timer);
    }
  }

  private async fetchAndDeliver(
    productId: string,
    granularity: Granularity,
    count: number,
  ): Promise<void> {
    try {
      await pRetry(
        async () => {
          const intervalMs = getRefreshIntervalMs(granularity);
          const end = new Date();
          const start = new Date(end.getTime() - count * intervalMs);

          const request = GetProductCandlesRequestSchema.parse({
            productId,
            granularity,
            start: start.toISOString(),
            end: end.toISOString(),
            limit: count,
          });

          const response =
            await this.productsService.getProductCandles(request);

          for (const candle of response.candles ?? []) {
            this.candleBuffer.addCandle(
              {
                productId,
                start: candle.start ?? 0,
                open: candle.open ?? 0,
                high: candle.high ?? 0,
                low: candle.low ?? 0,
                close: candle.close ?? 0,
                volume: candle.volume ?? 0,
              },
              granularity,
            );
          }
        },
        {
          retries: CANDLE_FETCH_RETRIES,
          onFailedAttempt: (error) => {
            logger.streaming.warn(
              {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                productId,
                granularity,
              },
              'Candle fetch failed, retrying',
            );
          },
        },
      );

      const candles = this.candleBuffer.getCandles(productId, granularity);
      this.candleHandler(productId, granularity, candles);
    } catch (error) {
      logger.streaming.error(
        { err: error, productId, granularity },
        'Candle fetch failed after retries',
      );
      this.disconnectHandler((error as Error).message);
    }
  }
}
