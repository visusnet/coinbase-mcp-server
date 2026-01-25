// =============================================================================
// Locally Defined Enums (avoid SDK dependency for these common enums)
// =============================================================================

/** Order side for buy/sell orders */
export enum OrderSide {
  Buy = 'BUY',
  Sell = 'SELL',
}

/** Stop price direction for stop-limit orders */
export enum StopPriceDirection {
  Up = 'STOP_DIRECTION_STOP_UP',
  Down = 'STOP_DIRECTION_STOP_DOWN',
}

// All response types now defined in OrdersService.schema.ts
