import type { Ticker } from '../services/MarketEventService.message';

/** Subscription callback function type */
export type TickerCallback = (ticker: Ticker) => void;

/** Reconnect callback function type */
export type ReconnectCallback = () => void;

/** Disconnect callback function type - called when connection permanently fails */
export type DisconnectCallback = (reason: string) => void;

/** Internal subscription record */
export interface Subscription {
  readonly productIds: readonly string[];
  readonly callback: TickerCallback;
  readonly onReconnect?: ReconnectCallback;
  readonly onDisconnect?: DisconnectCallback;
}
