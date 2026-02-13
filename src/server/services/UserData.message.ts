import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import { OrderExecutionStatus } from './OrdersService.types';
import { UserEventType } from './EventService.types';
import {
  HeartbeatsChannelMessageSchema,
  ErrorMessageSchema,
} from './common.message';

// =============================================================================
// Order Event Schema (from User Channel WebSocket)
// =============================================================================

/**
 * Schema for order data from Coinbase User Channel WebSocket.
 * Transforms raw WebSocket data (snake_case strings) into our domain model.
 *
 * Only order_id and status are reliably present; all other fields are optional.
 * See: https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-channels#orders-fields
 */
const UserEventOrderSchema = z
  .object({
    order_id: z.string().describe('Order identifier'),
    status: z
      .nativeEnum(OrderExecutionStatus)
      .describe('Order execution status'),
    avg_price: stringToNumber.describe('Average fill price'),
    cumulative_quantity: stringToNumber.describe('Total quantity filled'),
    total_fees: stringToNumber.describe('Total fees paid'),
    filled_value: stringToNumber.describe(
      'Total filled value in quote currency',
    ),
    number_of_fills: stringToNumber.describe('Number of individual fills'),
    completion_percentage: stringToNumber.describe(
      'Order completion percentage (0-100)',
    ),
  })
  .transform((data) => ({
    orderId: data.order_id,
    status: data.status,
    avgPrice: data.avg_price,
    cumulativeQuantity: data.cumulative_quantity,
    totalFees: data.total_fees,
    filledValue: data.filled_value,
    numberOfFills: data.number_of_fills,
    completionPercentage: data.completion_percentage,
  }))
  .describe('Order data from Coinbase User Channel WebSocket');

export type UserEventOrder = z.output<typeof UserEventOrderSchema>;

// =============================================================================
// User Channel Message Schemas
// =============================================================================

/** Schema for user event containing order updates (positions field in beta, stripped) */
const UserEventSchema = z
  .object({
    type: z.nativeEnum(UserEventType).describe('Event type'),
    orders: z.array(UserEventOrderSchema).describe('Array of order data'),
  })
  .describe('User event containing order updates');

/** Schema for user channel message received from Coinbase WebSocket */
const UserChannelMessageSchema = z
  .object({
    channel: z.literal('user').describe('Channel name'),
    timestamp: z.string().describe('Message timestamp'),
    sequence_num: z.number().describe('Sequence number'),
    events: z.array(UserEventSchema).describe('Array of user events'),
  })
  .strict()
  .transform((data) => ({
    channel: data.channel,
    timestamp: data.timestamp,
    sequenceNum: data.sequence_num,
    events: data.events,
  }))
  .describe('User channel message received from Coinbase WebSocket');

/** Schema for subscriptions channel message (user-channel specific) */
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
              user: z
                .array(z.string())
                .optional()
                .describe('Subscribed user channel'),
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

type UserChannelMessage = z.output<typeof UserChannelMessageSchema>;
type SubscriptionsChannelMessage = z.output<
  typeof SubscriptionsChannelMessageSchema
>;

/** Union schema for all possible inbound User Channel WebSocket messages */
export const UserWebSocketMessageSchema = z
  .union([
    UserChannelMessageSchema,
    SubscriptionsChannelMessageSchema,
    HeartbeatsChannelMessageSchema,
    ErrorMessageSchema,
  ])
  .describe('Union of all possible inbound User Channel WebSocket messages');

export type UserWebSocketMessage = z.output<typeof UserWebSocketMessageSchema>;

// =============================================================================
// Type Guards
// =============================================================================

/** Type guard for user channel messages */
export function isUserChannelMessage(
  message: UserWebSocketMessage,
): message is UserChannelMessage {
  return 'channel' in message && message.channel === 'user';
}

/** Type guard for subscriptions channel messages */
export function isSubscriptionsChannelMessage(
  message: UserWebSocketMessage,
): message is SubscriptionsChannelMessage {
  return 'channel' in message && message.channel === 'subscriptions';
}
