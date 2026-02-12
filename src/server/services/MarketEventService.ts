import { logger } from '../../logger';
import { ConditionEvaluator } from './ConditionEvaluator';
import { MarketDataSubscription } from './MarketDataSubscription';
import type { MarketDataPool } from './MarketDataPool';
import type { WaitForMarketEventRequest } from './MarketEventService.request';
import {
  WaitForMarketEventResponseSchema,
  type WaitForMarketEventResponse,
} from './MarketEventService.response';
import type { TechnicalIndicatorsService } from './TechnicalIndicatorsService';
import type { ToolExtra } from '@server/tools/ToolRegistry';

function createTimeout(seconds: number): {
  promise: Promise<'timeout'>;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const { promise, resolve } = Promise.withResolvers<'timeout'>();
  const timeoutId = setTimeout(() => resolve('timeout'), seconds * 1000);
  return { promise, timeoutId };
}

/**
 * Service for monitoring market events via WebSocket.
 */
export class MarketEventService {
  private readonly conditionEvaluator: ConditionEvaluator;

  constructor(
    indicatorsService: TechnicalIndicatorsService,
    private readonly marketDataPool: MarketDataPool,
  ) {
    this.conditionEvaluator = new ConditionEvaluator(indicatorsService);
  }

  /**
   * Waits for market conditions to be met or timeout.
   * Creates independent subscriptions per product that race against a timeout.
   */
  public async waitForMarketEvent(
    request: WaitForMarketEventRequest,
    { signal }: ToolExtra,
  ): Promise<WaitForMarketEventResponse> {
    const subscriptions = request.subscriptions.map(
      (sub) =>
        new MarketDataSubscription(
          sub,
          this.marketDataPool,
          this.conditionEvaluator,
        ),
    );

    return WaitForMarketEventResponseSchema.parse(
      await this.waitForAnySubscription(subscriptions, request.timeout, signal),
    );
  }

  /**
   * Starts all subscriptions, races them against a timeout, snapshots results,
   * and cleans up.
   */
  private async waitForAnySubscription(
    subscriptions: MarketDataSubscription[],
    timeout: number,
    signal: AbortSignal,
  ): Promise<WaitForMarketEventResponse> {
    for (const sub of subscriptions) {
      sub.start();
    }

    const { promise: timeoutPromise, timeoutId } = createTimeout(timeout);

    const abortPromise = new Promise<'aborted'>((resolve) => {
      signal.addEventListener(
        'abort',
        () => {
          logger.streaming.info(
            { productIds: subscriptions.map((s) => s.result.productId) },
            'AbortSignal fired — cancelling waitForAnySubscription',
          );
          resolve('aborted');
        },
        { once: true },
      );
    });

    try {
      const outcome = await Promise.race([
        ...subscriptions.map((s) =>
          s.promise.then(
            () => 'triggered' as const,
            (error: unknown) => ({
              disconnected: (error as Error).message,
            }),
          ),
        ),
        timeoutPromise,
        abortPromise,
      ]);

      if (outcome === 'timeout') {
        return {
          status: 'timeout',
          duration: timeout,
          timestamp: new Date().toISOString(),
        };
      }

      if (outcome === 'aborted') {
        return {
          status: 'error',
          reason: 'Request cancelled',
          timestamp: new Date().toISOString(),
        };
      }

      if (typeof outcome === 'object') {
        return {
          status: 'error',
          reason: outcome.disconnected,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'triggered',
        subscriptions: subscriptions.map((s) => s.result),
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeoutId);
      for (const sub of subscriptions) {
        sub.cleanup();
      }
    }
  }
}
