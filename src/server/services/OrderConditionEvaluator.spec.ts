import { describe, it, expect, beforeEach } from '@jest/globals';
import { OrderConditionEvaluator } from './OrderConditionEvaluator';
import type { UserEventOrder } from './UserData.message';
import type { OrderCondition } from './EventService.request';
import type {
  OrderConditionResult,
  OrderNumericConditionResult,
  OrderStatusConditionResult,
} from './EventService.response';
import { OrderConditionField } from './EventService.types';
import { ConditionOperator } from './EventService.types';
import { OrderExecutionStatus } from './OrdersService.types';

// =============================================================================
// Test Helpers
// =============================================================================

function isOrderStatusConditionResult(
  result: OrderConditionResult,
): result is OrderStatusConditionResult {
  return result.field === OrderConditionField.Status;
}

function isOrderNumericConditionResult(
  result: OrderConditionResult,
): result is OrderNumericConditionResult {
  return result.field !== OrderConditionField.Status;
}

function createUserEventOrder(
  overrides: Partial<UserEventOrder> = {},
): UserEventOrder {
  return {
    orderId: 'order-123',
    status: OrderExecutionStatus.Open,
    avgPrice: 95000,
    cumulativeQuantity: 0.5,
    totalFees: 10,
    filledValue: 47500,
    numberOfFills: 3,
    completionPercentage: 50,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('OrderConditionEvaluator', () => {
  let evaluator: OrderConditionEvaluator;

  beforeEach(() => {
    evaluator = new OrderConditionEvaluator();
  });

  describe('status conditions', () => {
    it('should trigger when status is in target list', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.Status,
          targetStatus: [
            OrderExecutionStatus.Filled,
            OrderExecutionStatus.Cancelled,
          ],
        },
      ];
      const userEventOrder = createUserEventOrder({
        status: OrderExecutionStatus.Filled,
      });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        field: OrderConditionField.Status,
        triggered: true,
        targetStatus: [
          OrderExecutionStatus.Filled,
          OrderExecutionStatus.Cancelled,
        ],
        actualStatus: OrderExecutionStatus.Filled,
      });
    });

    it('should not trigger when status is not in target list', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.Status,
          targetStatus: [OrderExecutionStatus.Filled],
        },
      ];
      const userEventOrder = createUserEventOrder({
        status: OrderExecutionStatus.Open,
      });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
      expect(isOrderStatusConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderStatusConditionResult).actualStatus).toBe(
        OrderExecutionStatus.Open,
      );
    });

    it('should not trigger when order event is null', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.Status,
          targetStatus: [OrderExecutionStatus.Filled],
        },
      ];

      const result = evaluator.evaluateConditions(conditions, null, null);

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
      expect(isOrderStatusConditionResult(result[0])).toBe(true);
      expect(
        (result[0] as OrderStatusConditionResult).actualStatus,
      ).toBeUndefined();
    });
  });

  describe('numeric conditions', () => {
    it('should evaluate avgPrice GT condition as triggered', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.AvgPrice,
          operator: ConditionOperator.GT,
          value: 90000,
        },
      ];
      const userEventOrder = createUserEventOrder({
        avgPrice: 95000,
      });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        field: OrderConditionField.AvgPrice,
        operator: ConditionOperator.GT,
        threshold: 90000,
        actualValue: 95000,
        triggered: true,
      });
    });

    it('should evaluate avgPrice LT condition as not triggered', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.AvgPrice,
          operator: ConditionOperator.LT,
          value: 90000,
        },
      ];
      const userEventOrder = createUserEventOrder({
        avgPrice: 95000,
      });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
    });

    it('should evaluate completionPercentage GTE condition', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.CompletionPercentage,
          operator: ConditionOperator.GTE,
          value: 50,
        },
      ];
      const userEventOrder = createUserEventOrder({ completionPercentage: 50 });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(isOrderNumericConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderNumericConditionResult).actualValue).toBe(50);
    });

    it('should evaluate cumulativeQuantity condition', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.CumulativeQuantity,
          operator: ConditionOperator.GT,
          value: 0.1,
        },
      ];
      const userEventOrder = createUserEventOrder({ cumulativeQuantity: 0.5 });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(isOrderNumericConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderNumericConditionResult).actualValue).toBe(0.5);
    });

    it('should evaluate totalFees condition', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.TotalFees,
          operator: ConditionOperator.LTE,
          value: 20,
        },
      ];
      const userEventOrder = createUserEventOrder({ totalFees: 10 });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(isOrderNumericConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderNumericConditionResult).actualValue).toBe(10);
    });

    it('should evaluate filledValue condition', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.FilledValue,
          operator: ConditionOperator.GT,
          value: 40000,
        },
      ];
      const userEventOrder = createUserEventOrder({ filledValue: 47500 });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(isOrderNumericConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderNumericConditionResult).actualValue).toBe(
        47500,
      );
    });

    it('should evaluate numberOfFills condition', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.NumberOfFills,
          operator: ConditionOperator.GTE,
          value: 3,
        },
      ];
      const userEventOrder = createUserEventOrder({ numberOfFills: 3 });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(isOrderNumericConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderNumericConditionResult).actualValue).toBe(3);
    });

    it('should return null actualValue when order event is null', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.AvgPrice,
          operator: ConditionOperator.GT,
          value: 90000,
        },
      ];

      const result = evaluator.evaluateConditions(conditions, null, null);

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
      expect(isOrderNumericConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderNumericConditionResult).actualValue).toBeNull();
    });

    it('should return null actualValue when filledValue is undefined', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.FilledValue,
          operator: ConditionOperator.GT,
          value: 40000,
        },
      ];
      const userEventOrder = createUserEventOrder({ filledValue: undefined });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
      expect(isOrderNumericConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderNumericConditionResult).actualValue).toBeNull();
    });

    it('should return null actualValue when cumulativeQuantity is undefined', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.CumulativeQuantity,
          operator: ConditionOperator.GT,
          value: 0.1,
        },
      ];
      const userEventOrder = createUserEventOrder({
        cumulativeQuantity: undefined,
      });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
      expect(isOrderNumericConditionResult(result[0])).toBe(true);
      expect((result[0] as OrderNumericConditionResult).actualValue).toBeNull();
    });
  });

  describe('cross conditions', () => {
    it('should evaluate CROSS_ABOVE when value crosses threshold', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.CompletionPercentage,
          operator: ConditionOperator.CROSS_ABOVE,
          value: 75,
        },
      ];
      const userEventOrder = createUserEventOrder({ completionPercentage: 80 });
      const previousUserEventOrder = createUserEventOrder({
        completionPercentage: 50,
      });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        previousUserEventOrder,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
    });

    it('should not trigger CROSS_ABOVE without previous event', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.CompletionPercentage,
          operator: ConditionOperator.CROSS_ABOVE,
          value: 75,
        },
      ];
      const userEventOrder = createUserEventOrder({ completionPercentage: 80 });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
    });

    it('should not trigger CROSS_ABOVE when already above', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.CompletionPercentage,
          operator: ConditionOperator.CROSS_ABOVE,
          value: 75,
        },
      ];
      const userEventOrder = createUserEventOrder({ completionPercentage: 90 });
      const previousUserEventOrder = createUserEventOrder({
        completionPercentage: 80,
      }); // Already above

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        previousUserEventOrder,
      );

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(false);
    });
  });

  describe('multiple conditions', () => {
    it('should return all conditions with their triggered status', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.Status,
          targetStatus: [OrderExecutionStatus.Filled],
        },
        {
          field: OrderConditionField.AvgPrice,
          operator: ConditionOperator.LT,
          value: 100000,
        },
      ];
      const userEventOrder = createUserEventOrder({
        status: OrderExecutionStatus.Open,
        avgPrice: 95000,
      });

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('status');
      expect(result[0].triggered).toBe(false);
      expect(result[1].field).toBe(OrderConditionField.AvgPrice);
      expect(result[1].triggered).toBe(true);
    });

    it('should handle undefined numeric fields gracefully', () => {
      const conditions: OrderCondition[] = [
        {
          field: OrderConditionField.AvgPrice,
          operator: ConditionOperator.GT,
          value: 0,
        },
        {
          field: OrderConditionField.CompletionPercentage,
          operator: ConditionOperator.GT,
          value: 0,
        },
        {
          field: OrderConditionField.TotalFees,
          operator: ConditionOperator.GT,
          value: 0,
        },
        {
          field: OrderConditionField.NumberOfFills,
          operator: ConditionOperator.GT,
          value: 0,
        },
      ];
      const userEventOrder: UserEventOrder = {
        orderId: 'order-123',
        status: OrderExecutionStatus.Pending,
        avgPrice: undefined,
        cumulativeQuantity: undefined,
        totalFees: undefined,
        filledValue: undefined,
        numberOfFills: undefined,
        completionPercentage: undefined,
      };

      const result = evaluator.evaluateConditions(
        conditions,
        userEventOrder,
        null,
      );

      expect(result).toHaveLength(4);
      for (const r of result) {
        expect(r.triggered).toBe(false);
        const numericResult = r as OrderNumericConditionResult;
        expect(numericResult.actualValue).toBeNull();
      }
    });
  });
});
