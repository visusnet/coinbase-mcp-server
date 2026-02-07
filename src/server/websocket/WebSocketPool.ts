import { logger } from '../../logger';
import {
  isCandlesMessage,
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
  CandleCallback,
  Channel,
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
 * Manages authenticated connections and subscriptions to ticker and candle data.
 */
export class WebSocketPool {
  private connection: WebSocket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private readonly subscribedProducts: Record<Channel, Set<string>> = {
    ticker: new Set(),
    candles: new Set(),
  };
  private reconnectAttempts = 0;
  private readonly subscriptions: Map<string, Subscription> = new Map();
  private isReconnecting = false;
  private isClosed = false;

  /**
   * Creates a new WebSocketPool instance.
   * @param credentials - API credentials for authenticated WebSocket connections
   */
  constructor(private readonly credentials: CoinbaseCredentials) {}

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
  public async subscribeToTicker(
    productIds: string[],
    callback: TickerCallback,
    onReconnect?: ReconnectCallback,
    onDisconnect?: DisconnectCallback,
  ): Promise<string> {
    const subscriptionId = generateSubscriptionId();

    this.subscriptions.set(subscriptionId, {
      channel: 'ticker',
      productIds,
      callback,
      onReconnect,
      onDisconnect,
    });

    await this.ensureConnection();
    this.updateSubscribedProducts('ticker');

    return subscriptionId;
  }

  /**
   * Subscribes to candle updates for the given product IDs.
   * Candles are delivered as 5-minute OHLCV data.
   *
   * @param productIds - Array of product IDs to subscribe to (e.g., ["BTC-EUR", "ETH-EUR"])
   * @param callback - Function called when candle updates are received
   * @param onReconnect - Optional callback invoked when connection is re-established after disconnect
   * @param onDisconnect - Optional callback invoked when connection permanently fails after max retries
   * @returns Promise that resolves with subscription ID when ready to receive candles
   */
  public async subscribeToCandles(
    productIds: string[],
    callback: CandleCallback,
    onReconnect?: ReconnectCallback,
    onDisconnect?: DisconnectCallback,
  ): Promise<string> {
    const subscriptionId = generateSubscriptionId();

    this.subscriptions.set(subscriptionId, {
      channel: 'candles',
      productIds,
      callback,
      onReconnect,
      onDisconnect,
    });

    await this.ensureConnection();
    this.updateSubscribedProducts('candles');

    return subscriptionId;
  }

  /**
   * Unsubscribes from ticker updates.
   * @param subscriptionId - The subscription ID returned by subscribeToTicker()
   */
  public unsubscribeFromTicker(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
    this.updateSubscribedProducts('ticker');
  }

  /**
   * Unsubscribes from candle updates.
   * @param subscriptionId - The subscription ID returned by subscribeToCandles()
   */
  public unsubscribeFromCandles(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
    this.updateSubscribedProducts('candles');
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
      logger.streaming.debug(`Connecting to ${COINBASE_WS_URL}`);
      this.connection = new WebSocket(COINBASE_WS_URL);
      let errorOccurred = false;

      this.connection.addEventListener('open', () => {
        logger.streaming.debug('Connection opened');
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
          logger.streaming.error({ err: error }, 'Message parse error');
          logger.streaming.error({ data: event.data }, 'Raw message');
          return;
        }
        try {
          this.handleMessage(message);
        } catch (error) {
          logger.streaming.error({ err: error }, 'Message handler error');
        }
      });

      this.connection.addEventListener('close', (event) => {
        logger.streaming.debug({ event }, 'Connection closed');
        // Skip reconnect if the error handler already rejected the promise.
        // When called from reconnect(), the rejection triggers a retry via its catch block.
        // When called from ensureConnection(), the error propagates to the caller.
        if (!errorOccurred) {
          void this.reconnect();
        }
      });

      this.connection.addEventListener('error', (event) => {
        logger.streaming.error({ event }, 'Connection error');
        errorOccurred = true;
        reject(new Error('WebSocket connection failed'));
      });
    });
  }

  /**
   * Updates the set of subscribed products for a channel based on active subscriptions.
   */
  private updateSubscribedProducts(channel: Channel): void {
    const subscribedProducts = this.subscribedProducts[channel];
    const newProducts = new Set<string>();

    for (const subscription of this.subscriptions.values()) {
      if (subscription.channel === channel) {
        for (const productId of subscription.productIds) {
          newProducts.add(productId);
        }
      }
    }

    // Find products to subscribe to
    const toSubscribe: string[] = [];
    for (const productId of newProducts) {
      if (!subscribedProducts.has(productId)) {
        toSubscribe.push(productId);
        subscribedProducts.add(productId);
      }
    }

    // Find products to unsubscribe from
    const toUnsubscribe: string[] = [];
    for (const productId of subscribedProducts) {
      if (!newProducts.has(productId)) {
        toUnsubscribe.push(productId);
        subscribedProducts.delete(productId);
      }
    }

    if (toSubscribe.length > 0) {
      this.sendChannelSubscribe(channel, toSubscribe);
    }

    if (toUnsubscribe.length > 0) {
      this.sendChannelUnsubscribe(channel, toUnsubscribe);
    }
  }

  /**
   * Sends a subscribe message to Coinbase WebSocket for a specific channel.
   */
  private sendChannelSubscribe(channel: Channel, productIds: string[]): void {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      logger.streaming.warn('Cannot send subscribe - connection not open');
      return;
    }

    const message = {
      type: 'subscribe',
      product_ids: productIds,
      channel,
      jwt: this.credentials.generateWebSocketJwt(),
    };
    logger.streaming.debug(
      { productIds, channel },
      `Subscribing to ${channel} channel`,
    );
    this.connection.send(JSON.stringify(message));
  }

  /**
   * Sends an unsubscribe message to Coinbase WebSocket for a specific channel.
   */
  private sendChannelUnsubscribe(channel: Channel, productIds: string[]): void {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      return;
    }

    this.connection.send(
      JSON.stringify({
        type: 'unsubscribe',
        product_ids: productIds,
        channel,
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
          for (const subscription of this.subscriptions.values()) {
            if (
              subscription.channel === 'ticker' &&
              subscription.productIds.includes(ticker.productId)
            ) {
              subscription.callback(ticker);
            }
          }
        }
      }
    } else if (isCandlesMessage(message)) {
      for (const event of message.events) {
        for (const candle of event.candles) {
          for (const subscription of this.subscriptions.values()) {
            if (
              subscription.channel === 'candles' &&
              subscription.productIds.includes(candle.productId)
            ) {
              subscription.callback(candle);
            }
          }
        }
      }
    } else if (isHeartbeatsMessage(message)) {
      // Heartbeats keep the connection alive - no action needed
    } else if (isSubscriptionsMessage(message)) {
      logger.streaming.debug('Subscriptions updated');
    } else if (isErrorMessage(message)) {
      logger.streaming.error(
        { message: message.message },
        'Error from Coinbase',
      );

      // Authentication failures are fatal - notify subscribers and close connection
      if (message.message.includes('authentication')) {
        const errorMessage = `WebSocket authentication failed: ${message.message}`;
        for (const subscription of this.subscriptions.values()) {
          subscription.onDisconnect?.(errorMessage);
        }
        this.connection?.close();
      }
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
    logger.streaming.debug('Subscribing to heartbeats channel');
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
      const errorMessage = `Connection failed after ${MAX_RECONNECT_ATTEMPTS} reconnect attempts`;
      for (const subscription of this.subscriptions.values()) {
        subscription.onDisconnect?.(errorMessage);
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
      for (const [channel, products] of Object.entries(
        this.subscribedProducts,
      )) {
        if (products.size > 0) {
          this.sendChannelSubscribe(channel as Channel, [...products]);
        }
      }
    } catch (error) {
      logger.streaming.error({ err: error }, 'Reconnect attempt failed');
      this.isReconnecting = false;
      void this.reconnect();
    }
  }

  /**
   * Cleans up all resources.
   */
  private cleanup(): void {
    this.subscriptions.clear();
    for (const products of Object.values(this.subscribedProducts)) {
      products.clear();
    }

    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }
}
