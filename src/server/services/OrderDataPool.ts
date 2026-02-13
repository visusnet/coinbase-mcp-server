import { randomUUID } from 'node:crypto';
import { logger } from '../../logger';
import {
  isUserChannelMessage,
  isSubscriptionsChannelMessage,
  UserWebSocketMessageSchema,
  type UserEventOrder,
} from './UserData.message';
import { isErrorMessage } from './common.message';
import type { CoinbaseCredentials } from '@client/CoinbaseCredentials';
import { WebSocketConnection } from '../websocket/WebSocketConnection';
import { COINBASE_WS_USER_URL } from '../websocket/WebSocketConnection.constants';

// =============================================================================
// Types
// =============================================================================

interface UserPoolSub {
  readonly orderId: string;
  readonly callback: (userEventOrder: UserEventOrder) => void;
  readonly onDisconnect: (reason: string) => void;
}

// =============================================================================
// OrderDataPool
// =============================================================================

/**
 * Unified data access layer for order data.
 * Consumers request order events by orderId; the pool filters and delivers.
 *
 * - User Channel: WebSocket connection to wss://advanced-trade-ws-user.coinbase.com
 * - All orders come in the same channel, filtered by orderId in the pool
 *
 * Reference counting: only sends a WebSocket subscribe/unsubscribe when the
 * first/last subscriber is added/removed (not per orderId — single "user" channel).
 */
export class OrderDataPool {
  private readonly webSocketConnection: WebSocketConnection;
  private readonly subscriptions = new Map<string, UserPoolSub>();

  constructor(credentials: CoinbaseCredentials) {
    this.webSocketConnection = new WebSocketConnection(
      COINBASE_WS_USER_URL,
      credentials,
      this.handleMessage.bind(this),
      this.handlePoolDisconnect.bind(this),
    );
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public subscribeToUser(
    orderId: string,
    callback: (userEventOrder: UserEventOrder) => void,
    onDisconnect: (reason: string) => void,
  ): string {
    const id = randomUUID();
    this.subscriptions.set(id, {
      orderId,
      callback,
      onDisconnect,
    });

    // Subscribe to user channel on first subscription (no product_ids needed)
    if (this.subscriptions.size === 1) {
      this.webSocketConnection.subscribe('user');
    }

    return id;
  }

  public unsubscribe(subscriptionId: string): void {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) {
      return;
    }

    this.subscriptions.delete(subscriptionId);

    // Unsubscribe from user channel when last subscription is removed (no product_ids needed)
    if (this.subscriptions.size === 0) {
      this.webSocketConnection.unsubscribe('user');
    }
  }

  public close(): void {
    this.subscriptions.clear();
    this.webSocketConnection.close();
  }

  // ---------------------------------------------------------------------------
  // Disconnect Propagation
  // ---------------------------------------------------------------------------

  private handlePoolDisconnect(reason: string): void {
    logger.streaming.error({ reason }, 'Order data connection lost');
    for (const sub of this.subscriptions.values()) {
      sub.onDisconnect(reason);
    }
  }

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  private handleMessage(data: unknown): void {
    const parsed = UserWebSocketMessageSchema.safeParse(data);
    if (!parsed.success) {
      logger.streaming.error(
        { err: parsed.error },
        'Unknown User Channel WebSocket message',
      );
      return;
    }

    const message = parsed.data;

    if (isErrorMessage(message)) {
      logger.streaming.error(
        { message: message.message },
        'Coinbase User Channel WebSocket error',
      );
      if (message.message.includes('authentication')) {
        this.handlePoolDisconnect('Authentication error: ' + message.message);
        this.webSocketConnection.close();
      }
      return;
    }

    if (isUserChannelMessage(message)) {
      if (logger.streaming.isLevelEnabled('trace')) {
        logger.streaming.trace(
          {
            eventCount: message.events.length,
            events: message.events.map((e) => ({
              type: e.type,
              orderCount: e.orders.length,
              orders: e.orders.map((o) => ({
                orderId: o.orderId,
                status: o.status,
              })),
            })),
          },
          'User Channel message received',
        );
      }
      for (const event of message.events) {
        for (const userEventOrder of event.orders) {
          this.deliverUserEventOrder(userEventOrder);
        }
      }
    } else if (isSubscriptionsChannelMessage(message)) {
      const subs = message.events[0].subscriptions;
      logger.streaming.debug(
        { user: subs.user ?? [] },
        'User Channel subscriptions updated',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Delivery
  // ---------------------------------------------------------------------------

  private deliverUserEventOrder(userEventOrder: UserEventOrder): void {
    for (const sub of this.subscriptions.values()) {
      if (sub.orderId === userEventOrder.orderId) {
        try {
          sub.callback(userEventOrder);
        } catch (error) {
          logger.streaming.error(
            { err: error, orderId: userEventOrder.orderId },
            'Order event callback error',
          );
        }
      }
    }
  }
}
