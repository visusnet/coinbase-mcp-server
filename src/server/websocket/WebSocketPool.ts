import { logger } from '../../logger';
import {
  isErrorMessage,
  isHeartbeatsMessage,
  isSubscriptionsMessage,
  isTickerMessage,
  WebSocketMessageSchema,
  type WebSocketMessage,
} from '../services/MarketEventService.message';
import {
  COINBASE_WS_URL,
  MAX_RECONNECT_ATTEMPTS,
  RECONNECT_BASE_DELAY_MS,
} from './WebSocketPool.constants';
import type {
  DisconnectCallback,
  ReconnectCallback,
  Subscription,
  TickerCallback,
} from './WebSocketPool.types';
import type { CoinbaseCredentials } from './CoinbaseCredentials';

/**
 * Generates a unique subscription ID.
 */
function generateSubscriptionId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * WebSocket connection pool for Coinbase Advanced Trade WebSocket.
 * Manages authenticated connections and subscriptions to ticker data.
 */
export class WebSocketPool {
  private connection: WebSocket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private readonly subscribedProducts: Set<string> = new Set();
  private reconnectAttempts = 0;
  private readonly subscriptions: Map<string, Subscription> = new Map();
  private isReconnecting = false;
  private isClosed = false;

  /**
   * Creates a new WebSocketPool instance.
   * @param credentials - API credentials for authenticated WebSocket connections
   */
  public constructor(private readonly credentials: CoinbaseCredentials) {}

  /**
   * Closes the WebSocket connection and cleans up resources.
   */
  public close(): void {
    this.isClosed = true;
    this.cleanup();
  }

  /**
   * Subscribes to ticker updates for the given product IDs.
   * Returns a Promise that resolves with the subscription ID when the connection
   * is established and subscription is active.
   *
   * @param productIds - Array of product IDs to subscribe to (e.g., ["BTC-EUR", "ETH-EUR"])
   * @param callback - Function called when ticker updates are received
   * @param onReconnect - Optional callback invoked when connection is re-established after disconnect
   * @param onDisconnect - Optional callback invoked when connection permanently fails after max retries
   * @returns Promise that resolves with subscription ID when ready to receive tickers
   */
  public async subscribe(
    productIds: string[],
    callback: TickerCallback,
    onReconnect?: ReconnectCallback,
    onDisconnect?: DisconnectCallback,
  ): Promise<string> {
    const subscriptionId = generateSubscriptionId();

    this.subscriptions.set(subscriptionId, {
      productIds,
      callback,
      onReconnect,
      onDisconnect,
    });

    await this.ensureConnection();
    this.updateSubscribedProducts();

    return subscriptionId;
  }

  /**
   * Unsubscribes from ticker updates.
   * @param subscriptionId - The subscription ID returned by subscribe()
   */
  public unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
    this.updateSubscribedProducts();
  }

  /**
   * Ensures a WebSocket connection exists and is open.
   */
  private async ensureConnection(): Promise<void> {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.createConnection();
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Creates a new WebSocket connection.
   */
  private createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.websocket.debug(`Connecting to ${COINBASE_WS_URL}`);
      this.connection = new WebSocket(COINBASE_WS_URL);
      let errorOccurred = false;

      this.connection.addEventListener('open', () => {
        logger.websocket.debug('Connection opened');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        // Subscribe to heartbeats immediately (must be within 5 seconds per Coinbase docs)
        this.subscribeToHeartbeats();
        resolve();
      });

      this.connection.addEventListener('message', (event) => {
        let message: WebSocketMessage;
        try {
          message = WebSocketMessageSchema.parse(
            JSON.parse(event.data as string),
          );
        } catch (error) {
          logger.websocket.error({ err: error }, 'Message parse error');
          logger.websocket.error({ data: event.data }, 'Raw message');
          return;
        }
        try {
          this.handleMessage(message);
        } catch (error) {
          logger.websocket.error({ err: error }, 'Message handler error');
        }
      });

      this.connection.addEventListener('close', (event) => {
        logger.websocket.debug({ event }, 'Connection closed');
        // Skip reconnect if the error handler already rejected the promise.
        // When called from reconnect(), the rejection triggers a retry via its catch block.
        // When called from ensureConnection(), the error propagates to the caller.
        if (!errorOccurred) {
          void this.reconnect();
        }
      });

      this.connection.addEventListener('error', (event) => {
        logger.websocket.error({ event }, 'Connection error');
        errorOccurred = true;
        reject(new Error('WebSocket connection failed'));
      });
    });
  }

  /**
   * Updates the set of subscribed products based on all active subscriptions.
   */
  private updateSubscribedProducts(): void {
    const newProducts = new Set<string>();

    for (const subscription of this.subscriptions.values()) {
      for (const productId of subscription.productIds) {
        newProducts.add(productId);
      }
    }

    // Find products to subscribe to
    const toSubscribe: string[] = [];
    for (const productId of newProducts) {
      if (!this.subscribedProducts.has(productId)) {
        toSubscribe.push(productId);
        this.subscribedProducts.add(productId);
      }
    }

    // Find products to unsubscribe from
    const toUnsubscribe: string[] = [];
    for (const productId of this.subscribedProducts) {
      if (!newProducts.has(productId)) {
        toUnsubscribe.push(productId);
        this.subscribedProducts.delete(productId);
      }
    }

    if (toSubscribe.length > 0) {
      this.sendSubscribe(toSubscribe);
    }

    if (toUnsubscribe.length > 0) {
      this.sendUnsubscribe(toUnsubscribe);
    }
  }

  /**
   * Sends a subscribe message to Coinbase WebSocket.
   */
  private sendSubscribe(productIds: string[]): void {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      logger.websocket.warn('Cannot send subscribe - connection not open');
      return;
    }

    const message = {
      type: 'subscribe',
      product_ids: productIds,
      channel: 'ticker',
      jwt: this.credentials.generateWebSocketJwt(),
    };
    logger.websocket.debug({ productIds }, 'Subscribing to ticker channel');
    this.connection.send(JSON.stringify(message));
  }

  /**
   * Sends an unsubscribe message to Coinbase WebSocket.
   */
  private sendUnsubscribe(productIds: string[]): void {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      return;
    }

    this.connection.send(
      JSON.stringify({
        type: 'unsubscribe',
        product_ids: productIds,
        channel: 'ticker',
        jwt: this.credentials.generateWebSocketJwt(),
      }),
    );
  }

  /**
   * Handles incoming WebSocket messages.
   */
  private handleMessage(message: WebSocketMessage): void {
    if (isTickerMessage(message)) {
      for (const event of message.events) {
        for (const ticker of event.tickers) {
          // Notify all subscriptions that include this product
          for (const subscription of this.subscriptions.values()) {
            if (subscription.productIds.includes(ticker.productId)) {
              subscription.callback(ticker);
            }
          }
        }
      }
    } else if (isHeartbeatsMessage(message)) {
      // Heartbeats keep the connection alive - no action needed
    } else if (isSubscriptionsMessage(message)) {
      logger.websocket.debug('Subscriptions updated');
    } else if (isErrorMessage(message)) {
      logger.websocket.error(
        { message: message.message },
        'Error from Coinbase',
      );
    }
  }

  /**
   * Subscribes to the heartbeats channel to keep the connection alive.
   * Per Coinbase docs: subscription must be sent within 5 seconds of connection.
   */
  private subscribeToHeartbeats(): void {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'subscribe',
      channel: 'heartbeats',
    };
    logger.websocket.debug('Subscribing to heartbeats channel');
    this.connection.send(JSON.stringify(message));
  }

  /**
   * Attempts to reconnect with exponential backoff.
   */
  private async reconnect(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    if (this.isReconnecting) {
      return;
    }

    if (this.subscriptions.size === 0) {
      // No active subscriptions, no need to reconnect
      return;
    }

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      // Max retries reached, notify subscribers and give up
      for (const subscription of this.subscriptions.values()) {
        subscription.onDisconnect?.(
          `Connection failed after ${MAX_RECONNECT_ATTEMPTS} reconnect attempts`,
        );
      }
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay =
      RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.createConnection();

      // Notify all subscriptions about reconnect BEFORE re-subscribing
      // This allows subscribers to reset state (e.g., previousValues for crossAbove/crossBelow)
      for (const subscription of this.subscriptions.values()) {
        subscription.onReconnect?.();
      }

      // Re-subscribe to all products after reconnect
      if (this.subscribedProducts.size > 0) {
        this.sendSubscribe([...this.subscribedProducts]);
      }
    } catch (error) {
      logger.websocket.error({ err: error }, 'Reconnect attempt failed');
      this.isReconnecting = false;
      void this.reconnect();
    }
  }

  /**
   * Cleans up all resources.
   */
  private cleanup(): void {
    this.subscriptions.clear();
    this.subscribedProducts.clear();

    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }
}
