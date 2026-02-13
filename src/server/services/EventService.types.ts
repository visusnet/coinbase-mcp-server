import type { SubscriptionResult } from './EventService.response';

// =============================================================================
// Shared Condition Enums
// =============================================================================

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

// =============================================================================
// Market Condition Fields
// =============================================================================

/**
 * Ticker-based condition fields.
 */
export enum TickerConditionField {
  Price = 'price',
  Volume24h = 'volume24h',
  PercentChange24h = 'percentChange24h',
  High24h = 'high24h',
  Low24h = 'low24h',
  High52w = 'high52w',
  Low52w = 'low52w',
  BestBid = 'bestBid',
  BestAsk = 'bestAsk',
  BestBidQuantity = 'bestBidQuantity',
  BestAskQuantity = 'bestAskQuantity',
}

/**
 * Indicator-based condition fields.
 */
export enum IndicatorConditionField {
  Rsi = 'rsi',
  Macd = 'macd',
  MacdHistogram = 'macd.histogram',
  MacdSignal = 'macd.signal',
  BollingerBands = 'bollingerBands',
  BollingerBandsUpper = 'bollingerBands.upper',
  BollingerBandsLower = 'bollingerBands.lower',
  BollingerBandsBandwidth = 'bollingerBands.bandwidth',
  BollingerBandsPercentB = 'bollingerBands.percentB',
  Sma = 'sma',
  Ema = 'ema',
  Stochastic = 'stochastic',
  StochasticD = 'stochastic.d',
}

// =============================================================================
// Subscription Types
// =============================================================================

/**
 * Type of subscription for the wait_for_event tool.
 */
export enum SubscriptionType {
  Market = 'market',
  Order = 'order',
}

// =============================================================================
// EventSubscription Interface
// =============================================================================

/**
 * Interface for subscription implementations (market, order).
 * Both MarketDataSubscription and OrderDataSubscription implement this.
 */
export interface EventSubscription {
  /** Resolves when conditions trigger, rejects on disconnect. */
  readonly promise: Promise<void>;
  /** Current evaluation state (always available). */
  readonly result: SubscriptionResult;
  /** Start monitoring (subscribe to data sources). */
  start(): void;
  /** Stop monitoring (unsubscribe from data sources). */
  cleanup(): void;
}

// =============================================================================
// WebSocket Event Types
// =============================================================================

/**
 * Event type in WebSocket messages (snapshot for initial state, update for changes).
 */
export enum UserEventType {
  Snapshot = 'snapshot',
  Update = 'update',
}

// =============================================================================
// Order Condition Fields
// =============================================================================

/**
 * Fields available on order events for condition evaluation.
 * Status uses string matching (IN operator with targetStatus array).
 * Numeric fields (avgPrice, completionPercentage, etc.) use comparison operators.
 */
export enum OrderConditionField {
  Status = 'status',
  AvgPrice = 'avgPrice',
  CompletionPercentage = 'completionPercentage',
  CumulativeQuantity = 'cumulativeQuantity',
  TotalFees = 'totalFees',
  FilledValue = 'filledValue',
  NumberOfFills = 'numberOfFills',
}
