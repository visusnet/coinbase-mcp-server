/** Coinbase WebSocket endpoint for market data */
export const COINBASE_WS_URL = 'wss://advanced-trade-ws.coinbase.com';

/** Coinbase WebSocket endpoint for user data (order events) */
export const COINBASE_WS_USER_URL = 'wss://advanced-trade-ws-user.coinbase.com';

/** Maximum reconnect attempts before giving up */
export const MAX_RECONNECT_ATTEMPTS = 5;

/** Base delay for exponential backoff in milliseconds */
export const RECONNECT_BASE_DELAY_MS = 1000;
