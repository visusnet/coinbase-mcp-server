import type { Ticker } from './MarketEventService.message';
import type { WebSocketPool } from '../websocket/WebSocketPool';

import type {
  Condition,
  WaitForMarketEventRequest,
} from './MarketEventService.request';
import type {
  TriggeredCondition,
  WaitForMarketEventResponse,
} from './MarketEventService.response';
import {
  ConditionField,
  ConditionLogic,
  ConditionOperator,
} from './MarketEventService.types';

/**
 * Gets the value of a specific field from a ticker.
 */
function getFieldValue(ticker: Ticker, field: ConditionField): number {
  switch (field) {
    case ConditionField.PRICE:
      return ticker.price;
    case ConditionField.VOLUME_24H:
      return ticker.volume24h;
    case ConditionField.PERCENT_CHANGE_24H:
      return ticker.percentChange24h;
    case ConditionField.HIGH_24H:
      return ticker.high24h;
    case ConditionField.LOW_24H:
      return ticker.low24h;
  }
}

/**
 * Evaluates a single operator against actual and threshold values.
 */
function evaluateOperator(
  actual: number,
  operator: ConditionOperator,
  threshold: number,
  previous?: number,
): boolean {
  switch (operator) {
    case ConditionOperator.GT:
      return actual > threshold;
    case ConditionOperator.GTE:
      return actual >= threshold;
    case ConditionOperator.LT:
      return actual < threshold;
    case ConditionOperator.LTE:
      return actual <= threshold;
    case ConditionOperator.CROSS_ABOVE:
      return (
        previous !== undefined && previous <= threshold && actual > threshold
      );
    case ConditionOperator.CROSS_BELOW:
      return (
        previous !== undefined && previous >= threshold && actual < threshold
      );
  }
}

/**
 * Service for monitoring market events via WebSocket.
 */
export class MarketEventService {
  constructor(private readonly pool: WebSocketPool) {}

  /**
   * Waits for market conditions to be met or timeout.
   * The timeout only starts after the WebSocket connection is established.
   */
  public async waitForEvent(
    request: WaitForMarketEventRequest,
  ): Promise<WaitForMarketEventResponse> {
    const lastTickers = new Map<string, Ticker>();
    const previousValues = new Map<string, Map<ConditionField, number>>();
    const productIds = request.subscriptions.map((s) => s.productId);

    // Context object for cleanup - properties set after async operations
    const ctx = {
      resolved: false,
      timeoutId: undefined as ReturnType<typeof setTimeout> | undefined,
      subId: undefined as string | undefined,
    };

    const { promise, resolve } =
      Promise.withResolvers<WaitForMarketEventResponse>();

    // Single cleanup function that handles nullable state
    const cleanup = (): void => {
      if (ctx.timeoutId !== undefined) {
        clearTimeout(ctx.timeoutId);
      }
      if (ctx.subId !== undefined) {
        this.pool.unsubscribe(ctx.subId);
      }
    };

    const handleTicker = (ticker: Ticker): void => {
      if (ctx.resolved) {
        return;
      }

      const { productId } = ticker;
      lastTickers.set(productId, ticker);

      const subscription = request.subscriptions.find(
        (s) => s.productId === productId,
      );
      if (!subscription) {
        return;
      }

      const triggered = this.evaluateConditions(
        ticker,
        subscription.conditions,
        subscription.logic,
        previousValues.get(productId),
      );

      if (triggered.length > 0) {
        ctx.resolved = true;
        cleanup();
        resolve({
          status: 'triggered',
          productId,
          triggeredConditions: triggered,
          ticker,
          timestamp: new Date().toISOString(),
        });
      }

      this.storePreviousValues(previousValues, productId, ticker);
    };

    const handleReconnect = (): void => {
      // Clear previous values on reconnect to prevent false crossAbove/crossBelow triggers
      previousValues.clear();
    };

    const handleDisconnect = (reason: string): void => {
      if (ctx.resolved) {
        return;
      }
      ctx.resolved = true;
      cleanup();
      resolve({
        status: 'error',
        reason,
        lastTickers: Object.fromEntries(lastTickers),
        timestamp: new Date().toISOString(),
      });
    };

    // Subscribe and wait for connection to be ready
    ctx.subId = await this.pool.subscribe(
      productIds,
      handleTicker,
      handleReconnect,
      handleDisconnect,
    );

    // Start timeout AFTER connection is established
    // Note: No need for ctx.resolved check here - clearTimeout in cleanup() ensures
    // this callback never fires after a condition triggers
    ctx.timeoutId = setTimeout(() => {
      ctx.resolved = true;
      cleanup();
      resolve({
        status: 'timeout',
        lastTickers: Object.fromEntries(lastTickers),
        duration: request.timeout,
        timestamp: new Date().toISOString(),
      });
    }, request.timeout * 1000);

    return promise;
  }

  /**
   * Evaluates conditions against a ticker.
   */
  private evaluateConditions(
    ticker: Ticker,
    conditions: readonly Condition[],
    logic: ConditionLogic,
    previousValues?: Map<ConditionField, number>,
  ): TriggeredCondition[] {
    const triggered: TriggeredCondition[] = [];

    for (const condition of conditions) {
      const actual = getFieldValue(ticker, condition.field);
      const previous = previousValues?.get(condition.field);

      if (
        evaluateOperator(actual, condition.operator, condition.value, previous)
      ) {
        triggered.push({
          field: condition.field,
          operator: condition.operator,
          threshold: condition.value,
          actualValue: actual,
        });

        if (logic === ConditionLogic.ANY) {
          return triggered; // Early return for OR
        }
      }
    }

    // For ALL logic, only return if all conditions matched
    if (
      logic === ConditionLogic.ALL &&
      triggered.length === conditions.length
    ) {
      return triggered;
    }

    return logic === ConditionLogic.ANY ? triggered : [];
  }

  /**
   * Stores current ticker values as previous values for next evaluation.
   */
  private storePreviousValues(
    previousValues: Map<string, Map<ConditionField, number>>,
    productId: string,
    ticker: Ticker,
  ): void {
    const values = new Map<ConditionField, number>();
    values.set(ConditionField.PRICE, ticker.price);
    values.set(ConditionField.VOLUME_24H, ticker.volume24h);
    values.set(ConditionField.PERCENT_CHANGE_24H, ticker.percentChange24h);
    values.set(ConditionField.HIGH_24H, ticker.high24h);
    values.set(ConditionField.LOW_24H, ticker.low24h);
    previousValues.set(productId, values);
  }
}
