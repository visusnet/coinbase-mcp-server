// =============================================================================
// Market Event Service Enums
// =============================================================================

/**
 * Ticker fields that can be monitored for conditions.
 */
export enum ConditionField {
  PRICE = 'price',
  VOLUME_24H = 'volume24h',
  PERCENT_CHANGE_24H = 'percentChange24h',
  HIGH_24H = 'high24h',
  LOW_24H = 'low24h',
}

/**
 * Comparison operators for condition evaluation.
 *
 * Note: crossAbove/crossBelow require a previous ticker value to detect crossing.
 * They cannot trigger on the first ticker received after subscription or reconnect.
 */
export enum ConditionOperator {
  GT = 'gt', // greater than
  GTE = 'gte', // greater than or equal
  LT = 'lt', // less than
  LTE = 'lte', // less than or equal
  CROSS_ABOVE = 'crossAbove', // crosses threshold upward (previous <= threshold AND current > threshold)
  CROSS_BELOW = 'crossBelow', // crosses threshold downward (previous >= threshold AND current < threshold)
}

/**
 * Logic for combining multiple conditions.
 */
export enum ConditionLogic {
  ANY = 'any', // OR - any condition triggers
  ALL = 'all', // AND - all conditions must be met
}
