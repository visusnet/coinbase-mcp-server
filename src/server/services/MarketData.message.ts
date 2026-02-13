import { z } from 'zod';
import { stringToNumberRequired } from './schema.helpers';
import { UserEventType } from './EventService.types';
import {
  HeartbeatsChannelMessageSchema,
  ErrorMessageSchema,
} from './common.message';

// =============================================================================
// WebSocket Message Schemas (from Coinbase)
// =============================================================================

/** Schema for ticker data from Coinbase WebSocket */
const TickerSchema = z
  .object({
    type: z.literal('ticker').describe('Message type'),
    product_id: z.string().describe('Trading pair identifier'),
    price: stringToNumberRequired.describe('Current price'),
    volume_24_h: stringToNumberRequired.describe('24-hour trading volume'),
    price_percent_chg_24_h: stringToNumberRequired.describe(
      '24-hour price change percentage',
    ),
    high_24_h: stringToNumberRequired.describe('24-hour high price'),
    low_24_h: stringToNumberRequired.describe('24-hour low price'),
    high_52_w: stringToNumberRequired.describe('52-week high price'),
    low_52_w: stringToNumberRequired.describe('52-week low price'),
    best_bid: stringToNumberRequired.describe('Best bid price'),
    best_ask: stringToNumberRequired.describe('Best ask price'),
    best_bid_quantity: stringToNumberRequired.describe('Best bid quantity'),
    best_ask_quantity: stringToNumberRequired.describe('Best ask quantity'),
  })
  .strict()
  .transform((data) => ({
    productId: data.product_id,
    price: data.price,
    volume24h: data.volume_24_h,
    percentChange24h: data.price_percent_chg_24_h,
    high24h: data.high_24_h,
    low24h: data.low_24_h,
    high52w: data.high_52_w,
    low52w: data.low_52_w,
    bestBid: data.best_bid,
    bestAsk: data.best_ask,
    bestBidQuantity: data.best_bid_quantity,
    bestAskQuantity: data.best_ask_quantity,
    timestamp: new Date().toISOString(),
  }))
  .describe('Ticker data from Coinbase WebSocket');

export type Ticker = z.output<typeof TickerSchema>;

/** Schema for ticker event containing one or more ticker updates */
const TickerEventSchema = z
  .object({
    type: z.nativeEnum(UserEventType).describe('Event type'),
    tickers: z.array(TickerSchema).describe('Array of ticker data'),
  })
  .strict()
  .describe('Ticker event containing one or more ticker updates');

/** Schema for ticker channel message received from Coinbase WebSocket */
const TickerChannelMessageSchema = z
  .object({
    channel: z.literal('ticker').describe('Channel name'),
    client_id: z.string().optional().describe('Client identifier (optional)'),
    timestamp: z.string().describe('Message timestamp'),
    sequence_num: z.number().describe('Sequence number'),
    events: z.array(TickerEventSchema).describe('Array of ticker events'),
  })
  .strict()
  .transform((data) => ({
    channel: data.channel,
    clientId: data.client_id,
    timestamp: data.timestamp,
    sequenceNum: data.sequence_num,
    events: data.events,
  }))
  .describe('Ticker channel message received from Coinbase WebSocket');

// =============================================================================
// Candles Channel Schemas
// =============================================================================

/** Schema for a single candle from Coinbase WebSocket */
const WebSocketCandleSchema = z
  .object({
    start: stringToNumberRequired.describe('UNIX timestamp of candle start'),
    high: stringToNumberRequired.describe('Highest price during interval'),
    low: stringToNumberRequired.describe('Lowest price during interval'),
    open: stringToNumberRequired.describe('Opening price'),
    close: stringToNumberRequired.describe('Closing price'),
    volume: stringToNumberRequired.describe('Volume traded during interval'),
    product_id: z.string().describe('Trading pair identifier'),
  })
  .strict()
  .transform((data) => ({
    start: data.start,
    high: data.high,
    low: data.low,
    open: data.open,
    close: data.close,
    volume: data.volume,
    productId: data.product_id,
  }))
  .describe('Single candle data from Coinbase WebSocket');

export type WebSocketCandle = z.output<typeof WebSocketCandleSchema>;

/** Schema for candle event containing one or more candle updates */
const CandleEventSchema = z
  .object({
    type: z.nativeEnum(UserEventType).describe('Event type'),
    candles: z.array(WebSocketCandleSchema).describe('Array of candle data'),
  })
  .strict()
  .describe('Candle event containing one or more candle updates');

/** Schema for candles channel message received from Coinbase WebSocket */
const CandlesChannelMessageSchema = z
  .object({
    channel: z.literal('candles').describe('Channel name'),
    client_id: z.string().optional().describe('Client identifier (optional)'),
    timestamp: z.string().describe('Message timestamp'),
    sequence_num: z.number().describe('Sequence number'),
    events: z.array(CandleEventSchema).describe('Array of candle events'),
  })
  .strict()
  .transform((data) => ({
    channel: data.channel,
    clientId: data.client_id,
    timestamp: data.timestamp,
    sequenceNum: data.sequence_num,
    events: data.events,
  }))
  .describe('Candles channel message received from Coinbase WebSocket');

/** Schema for subscriptions channel message */
const SubscriptionsChannelMessageSchema = z
  .object({
    channel: z.literal('subscriptions').describe('Channel name'),
    client_id: z.string().optional().describe('Client identifier (optional)'),
    timestamp: z.string().describe('Message timestamp'),
    sequence_num: z.number().describe('Sequence number'),
    events: z
      .array(
        z.object({
          subscriptions: z
            .object({
              ticker: z
                .array(z.string())
                .optional()
                .describe('Subscribed ticker products'),
              candles: z
                .array(z.string())
                .optional()
                .describe('Subscribed candles products'),
              heartbeats: z
                .array(z.string())
                .optional()
                .describe('Subscribed heartbeats'),
            })
            .describe('Subscription details'),
        }),
      )
      .describe('Subscription events'),
  })
  .strict()
  .transform((data) => ({
    channel: data.channel,
    clientId: data.client_id,
    timestamp: data.timestamp,
    sequenceNum: data.sequence_num,
    events: data.events,
  }))
  .describe('Subscriptions channel message');

// =============================================================================
// Message Types
// =============================================================================

type TickerChannelMessage = z.output<typeof TickerChannelMessageSchema>;
type CandlesChannelMessage = z.output<typeof CandlesChannelMessageSchema>;
type SubscriptionsChannelMessage = z.output<
  typeof SubscriptionsChannelMessageSchema
>;

/** Union schema for all possible inbound WebSocket messages */
export const WebSocketMessageSchema = z
  .union([
    TickerChannelMessageSchema,
    CandlesChannelMessageSchema,
    SubscriptionsChannelMessageSchema,
    HeartbeatsChannelMessageSchema,
    ErrorMessageSchema,
  ])
  .describe('Union of all possible inbound WebSocket messages');

export type WebSocketMessage = z.output<typeof WebSocketMessageSchema>;

// =============================================================================
// Type Guards
// =============================================================================

/** Type guard for ticker channel messages */
export function isTickerChannelMessage(
  message: WebSocketMessage,
): message is TickerChannelMessage {
  return 'channel' in message && message.channel === 'ticker';
}

/** Type guard for candles channel messages */
export function isCandlesChannelMessage(
  message: WebSocketMessage,
): message is CandlesChannelMessage {
  return 'channel' in message && message.channel === 'candles';
}

/** Type guard for subscriptions channel messages */
export function isSubscriptionsChannelMessage(
  message: WebSocketMessage,
): message is SubscriptionsChannelMessage {
  return 'channel' in message && message.channel === 'subscriptions';
}
