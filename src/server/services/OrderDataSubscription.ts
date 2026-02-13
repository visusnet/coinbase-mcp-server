import { logger } from '../../logger';
import type { OrderConditionEvaluator } from './OrderConditionEvaluator';
import type { UserEventOrder } from './UserData.message';
import type { OrderSubscription } from './EventService.request';
import type { OrderSubscriptionResult } from './EventService.response';
import { SubscriptionType, type EventSubscription } from './EventService.types';
import { ConditionLogic } from './EventService.types';

/**
 * Interface for OrderDataPool (implemented in Step 6).
 * Provides order event subscriptions via User Channel WebSocket.
 */
export interface OrderDataPool {
  subscribeToUser(
    orderId: string,
    onUserEventOrder: (userEventOrder: UserEventOrder) => void,
    onDisconnect: (reason: string) => void,
  ): string;
  unsubscribe(subscriptionId: string): void;
}

/**
 * Self-contained unit for a single order subscription.
 * Manages its own data subscription, state tracking, and condition evaluation.
 *
 * - `.promise` resolves when this subscription's conditions trigger
 * - `.result` returns the latest OrderSubscriptionResult (always available)
 * - `.start()` subscribes to order events via OrderDataPool
 * - `.cleanup()` unsubscribes from order events
 */
export class OrderDataSubscription implements EventSubscription {
  public readonly promise: Promise<void>;

  private readonly resolve: () => void;
  private readonly reject: (error: Error) => void;
  public result: OrderSubscriptionResult;
  private triggered = false;

  // State tracking
  private currentUserEventOrder: UserEventOrder | null = null;
  private previousUserEventOrder: UserEventOrder | null = null;

  // Subscription ID for cleanup
  private subscriptionId: string | null = null;

  constructor(
    private readonly config: OrderSubscription,
    private readonly orderDataPool: OrderDataPool,
    private readonly conditionEvaluator: OrderConditionEvaluator,
  ) {
    const { promise, resolve, reject }: PromiseWithResolvers<void> =
      Promise.withResolvers();
    this.promise = promise;
    this.resolve = resolve;
    this.reject = reject;
    this.result = {
      type: SubscriptionType.Order,
      orderId: config.orderId,
      triggered: false,
      conditions: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public start(): void {
    this.subscriptionId = this.orderDataPool.subscribeToUser(
      this.config.orderId,
      (userEventOrder) => this.handleUserEventOrder(userEventOrder),
      (reason) => this.handleDisconnect(reason),
    );
  }

  public cleanup(): void {
    if (this.subscriptionId) {
      this.orderDataPool.unsubscribe(this.subscriptionId);
    }
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  private handleDisconnect(reason: string): void {
    if (this.triggered) {
      return;
    }
    this.reject(new Error(reason));
  }

  private handleUserEventOrder(userEventOrder: UserEventOrder): void {
    if (this.triggered) {
      return;
    }

    if (this.currentUserEventOrder) {
      this.previousUserEventOrder = this.currentUserEventOrder;
    }
    this.currentUserEventOrder = userEventOrder;

    this.evaluate();
  }

  // ---------------------------------------------------------------------------
  // Evaluation
  // ---------------------------------------------------------------------------

  private evaluate(): void {
    const evaluatedConditions = this.conditionEvaluator.evaluateConditions(
      this.config.conditions,
      this.currentUserEventOrder,
      this.previousUserEventOrder,
    );

    if (logger.streaming.isLevelEnabled('trace')) {
      for (const result of evaluatedConditions) {
        logger.streaming.trace(
          {
            orderId: this.config.orderId,
            field: result.field,
            triggered: result.triggered,
          },
          'Order condition evaluated',
        );
      }
    }

    const conditionsTriggered =
      this.config.logic === ConditionLogic.ANY
        ? evaluatedConditions.some((r) => r.triggered)
        : evaluatedConditions.every((r) => r.triggered);

    this.result = {
      type: SubscriptionType.Order,
      orderId: this.config.orderId,
      triggered: conditionsTriggered,
      conditions: evaluatedConditions,
    };

    if (conditionsTriggered) {
      this.triggered = true;
      this.resolve();
    }
  }
}
