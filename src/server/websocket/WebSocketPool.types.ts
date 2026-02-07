import type {
  Ticker,
  WebSocketCandle,
} from '../services/MarketEventService.message';

/** Ticker callback function type */
export type TickerCallback = (ticker: Ticker) => void;

/** Candle callback function type */
export type CandleCallback = (candle: WebSocketCandle) => void;

/** Reconnect callback function type */
export type ReconnectCallback = () => void;

/** Disconnect callback function type - called when connection permanently fails */
export type DisconnectCallback = (reason: string) => void;

/** WebSocket channel types */
export type Channel = 'ticker' | 'candles';

/** Base subscription properties shared by all subscription types */
interface BaseSubscription {
  readonly productIds: readonly string[];
  readonly onReconnect?: ReconnectCallback;
  readonly onDisconnect?: DisconnectCallback;
}

/** Ticker subscription with channel discriminator */
export interface TickerSubscription extends BaseSubscription {
  readonly channel: 'ticker';
  readonly callback: TickerCallback;
}

/** Candle subscription with channel discriminator */
export interface CandleSubscription extends BaseSubscription {
  readonly channel: 'candles';
  readonly callback: CandleCallback;
}

/** Discriminated union of all subscription types */
export type Subscription = TickerSubscription | CandleSubscription;
