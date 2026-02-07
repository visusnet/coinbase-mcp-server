// =============================================================================
// Market Event Service Enums
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
