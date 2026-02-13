import { ConditionOperator } from './EventService.types';

/**
 * Evaluates a single operator against actual and threshold values.
 * Shared by both MarketConditionEvaluator and OrderConditionEvaluator.
 */
export function evaluateOperator(
  actual: number,
  operator: ConditionOperator,
  threshold: number,
  previous: number | null,
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
      return previous !== null && previous <= threshold && actual > threshold;
    case ConditionOperator.CROSS_BELOW:
      return previous !== null && previous >= threshold && actual < threshold;
  }
}
