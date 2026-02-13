import { evaluateOperator } from './ConditionEvaluator';
import { OrderConditionField } from './EventService.types';
import {
  isOrderStatusCondition,
  type OrderCondition,
  type OrderNumericCondition,
  type OrderStatusCondition,
} from './EventService.request';
import type { UserEventOrder } from './UserData.message';
import type {
  OrderConditionResult,
  OrderNumericConditionResult,
  OrderStatusConditionResult,
} from './EventService.response';

// =============================================================================
// Order Condition Evaluator
// =============================================================================

/**
 * Evaluates order conditions against order event data.
 * Supports status conditions (is status in target list?) and numeric conditions
 * (uses same operators as market conditions).
 */
export class OrderConditionEvaluator {
  /**
   * Evaluates all conditions against provided order event data.
   * Returns results for ALL conditions (with triggered boolean).
   */
  public evaluateConditions(
    conditions: readonly OrderCondition[],
    userEventOrder: UserEventOrder | null,
    previousUserEventOrder: UserEventOrder | null,
  ): OrderConditionResult[] {
    return conditions.map((condition) =>
      this.evaluateCondition(condition, userEventOrder, previousUserEventOrder),
    );
  }

  private evaluateCondition(
    condition: OrderCondition,
    userEventOrder: UserEventOrder | null,
    previousUserEventOrder: UserEventOrder | null,
  ): OrderConditionResult {
    if (isOrderStatusCondition(condition)) {
      return this.evaluateStatusCondition(condition, userEventOrder);
    }

    return this.evaluateNumericCondition(
      condition,
      userEventOrder,
      previousUserEventOrder,
    );
  }

  private evaluateStatusCondition(
    condition: OrderStatusCondition,
    userEventOrder: UserEventOrder | null,
  ): OrderStatusConditionResult {
    if (!userEventOrder) {
      return {
        field: condition.field,
        triggered: false,
        targetStatus: condition.targetStatus,
        actualStatus: undefined,
      };
    }

    const triggered = condition.targetStatus.includes(userEventOrder.status);

    return {
      field: condition.field,
      triggered,
      targetStatus: condition.targetStatus,
      actualStatus: userEventOrder.status,
    };
  }

  private evaluateNumericCondition(
    condition: OrderNumericCondition,
    userEventOrder: UserEventOrder | null,
    previousUserEventOrder: UserEventOrder | null,
  ): OrderNumericConditionResult {
    const base = {
      field: condition.field,
      operator: condition.operator,
      threshold: condition.value,
    };

    const actualValue = this.getNumericValue(userEventOrder, condition.field);
    const previousValue = this.getNumericValue(
      previousUserEventOrder,
      condition.field,
    );

    if (actualValue === null) {
      return { ...base, actualValue: null, triggered: false };
    }

    const triggered = evaluateOperator(
      actualValue,
      condition.operator,
      condition.value,
      previousValue,
    );

    return { ...base, actualValue, triggered };
  }

  private getNumericValue(
    userEventOrder: UserEventOrder | null,
    field: Exclude<OrderConditionField, OrderConditionField.Status>,
  ): number | null {
    if (!userEventOrder) {
      return null;
    }

    switch (field) {
      case OrderConditionField.AvgPrice:
        return userEventOrder.avgPrice ?? null;
      case OrderConditionField.CompletionPercentage:
        return userEventOrder.completionPercentage ?? null;
      case OrderConditionField.CumulativeQuantity:
        return userEventOrder.cumulativeQuantity ?? null;
      case OrderConditionField.TotalFees:
        return userEventOrder.totalFees ?? null;
      case OrderConditionField.FilledValue:
        return userEventOrder.filledValue ?? null;
      case OrderConditionField.NumberOfFills:
        return userEventOrder.numberOfFills ?? null;
    }
  }
}
