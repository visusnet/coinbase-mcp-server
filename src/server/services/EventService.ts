import { logger } from '../../logger';
import { MarketConditionEvaluator } from './MarketConditionEvaluator';
import { OrderConditionEvaluator } from './OrderConditionEvaluator';
import { MarketDataSubscription } from './MarketDataSubscription';
import {
  OrderDataSubscription,
  type OrderDataPool,
} from './OrderDataSubscription';
import type { MarketDataPool } from './MarketDataPool';
import type { WaitForEventRequest } from './EventService.request';
import {
  WaitForEventResponseSchema,
  type WaitForEventResponse,
} from './EventService.response';
import type { TechnicalIndicatorsService } from './TechnicalIndicatorsService';
import { SubscriptionType, type EventSubscription } from './EventService.types';
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
 * Service for monitoring market and order events via WebSocket.
 */
export class EventService {
  private readonly marketConditionEvaluator: MarketConditionEvaluator;
  private readonly orderConditionEvaluator: OrderConditionEvaluator;

  constructor(
    indicatorsService: TechnicalIndicatorsService,
    private readonly marketDataPool: MarketDataPool,
    private readonly orderDataPool: OrderDataPool,
  ) {
    this.marketConditionEvaluator = new MarketConditionEvaluator(
      indicatorsService,
    );
    this.orderConditionEvaluator = new OrderConditionEvaluator();
  }

  /**
   * Waits for event conditions to be met or timeout.
   * Creates independent subscriptions that race against a timeout.
   */
  public async waitForEvent(
    request: WaitForEventRequest,
    { signal }: ToolExtra,
  ): Promise<WaitForEventResponse> {
    const subscriptions: EventSubscription[] = [];

    for (const sub of request.subscriptions) {
      if (sub.type === SubscriptionType.Market) {
        subscriptions.push(
          new MarketDataSubscription(
            sub,
            this.marketDataPool,
            this.marketConditionEvaluator,
          ),
        );
      } else {
        subscriptions.push(
          new OrderDataSubscription(
            sub,
            this.orderDataPool,
            this.orderConditionEvaluator,
          ),
        );
      }
    }

    return WaitForEventResponseSchema.parse(
      await this.waitForAnySubscription(subscriptions, request.timeout, signal),
    );
  }

  /**
   * Starts all subscriptions, races them against a timeout, snapshots results,
   * and cleans up.
   */
  private async waitForAnySubscription(
    subscriptions: EventSubscription[],
    timeout: number,
    signal: AbortSignal,
  ): Promise<WaitForEventResponse> {
    for (const sub of subscriptions) {
      sub.start();
    }

    const { promise: timeoutPromise, timeoutId } = createTimeout(timeout);

    const abortPromise = new Promise<'aborted'>((resolve) => {
      signal.addEventListener(
        'abort',
        () => {
          logger.streaming.info(
            { subscriptionCount: subscriptions.length },
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
