import { z } from 'zod';
import { stringToNumberRequired } from './schema.helpers';

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
    type: z.enum(['snapshot', 'update']).describe('Event type'),
    tickers: z.array(TickerSchema).describe('Array of ticker data'),
  })
  .strict()
  .describe('Ticker event containing one or more ticker updates');

/** Schema for ticker channel message received from Coinbase WebSocket */
const TickerChannelMessageSchema = z
  .object({
    channel: z.literal('ticker').describe('Channel name'),
    client_id: z.string().describe('Client identifier'),
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

/** Schema for subscriptions channel message */
const SubscriptionsChannelMessageSchema = z
  .object({
    channel: z.literal('subscriptions').describe('Channel name'),
    client_id: z.string().describe('Client identifier'),
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

/** Schema for heartbeats channel message */
const HeartbeatsChannelMessageSchema = z
  .object({
    channel: z.literal('heartbeats').describe('Channel name'),
    client_id: z.string().describe('Client identifier'),
    timestamp: z.string().describe('Message timestamp'),
    sequence_num: z.number().describe('Sequence number'),
    events: z
      .array(
        z.object({
          current_time: z.string().describe('Current server time'),
          heartbeat_counter: z.number().describe('Heartbeat counter'),
        }),
      )
      .describe('Heartbeat events'),
  })
  .strict()
  .transform((data) => ({
    channel: data.channel,
    clientId: data.client_id,
    timestamp: data.timestamp,
    sequenceNum: data.sequence_num,
    events: data.events,
  }))
  .describe('Heartbeats channel message');

/** Schema for error message from Coinbase WebSocket */
const ErrorMessageSchema = z
  .object({
    type: z.literal('error').describe('Message type'),
    message: z.string().describe('Error message'),
  })
  .strict()
  .describe('Error message from Coinbase WebSocket');

// =============================================================================
// Message Types
// =============================================================================

type TickerChannelMessage = z.output<typeof TickerChannelMessageSchema>;
type SubscriptionsChannelMessage = z.output<
  typeof SubscriptionsChannelMessageSchema
>;
type HeartbeatsChannelMessage = z.output<typeof HeartbeatsChannelMessageSchema>;
type ErrorMessage = z.output<typeof ErrorMessageSchema>;

/** Union schema for all possible inbound WebSocket messages */
export const WebSocketMessageSchema = z.union([
  TickerChannelMessageSchema,
  SubscriptionsChannelMessageSchema,
  HeartbeatsChannelMessageSchema,
  ErrorMessageSchema,
]);

export type WebSocketMessage = z.output<typeof WebSocketMessageSchema>;

// =============================================================================
// Type Guards
// =============================================================================

/** Type guard for ticker channel messages */
export function isTickerMessage(
  message: WebSocketMessage,
): message is TickerChannelMessage {
  return 'channel' in message && message.channel === 'ticker';
}

/** Type guard for subscriptions channel messages */
export function isSubscriptionsMessage(
  message: WebSocketMessage,
): message is SubscriptionsChannelMessage {
  return 'channel' in message && message.channel === 'subscriptions';
}

/** Type guard for heartbeats channel messages */
export function isHeartbeatsMessage(
  message: WebSocketMessage,
): message is HeartbeatsChannelMessage {
  return 'channel' in message && message.channel === 'heartbeats';
}

/** Type guard for error messages */
export function isErrorMessage(
  message: WebSocketMessage,
): message is ErrorMessage {
  return 'type' in message;
}
