import { logger } from '../../logger';
import type { CoinbaseCredentials } from '@client/CoinbaseCredentials';
import {
  MAX_RECONNECT_ATTEMPTS,
  RECONNECT_BASE_DELAY_MS,
} from './WebSocketConnection.constants';

/**
 * Reusable WebSocket connection primitive for Coinbase WebSocket endpoints.
 * Handles connect, reconnect with exponential backoff, JWT auth, and heartbeats.
 * Delivers raw JSON-parsed messages to the consumer.
 *
 * No knowledge of message types — the consumer validates and routes.
 */
export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private isReconnecting = false;
  private isClosed = false;

  // Track subscriptions for reconnect: channel → Set<productId>
  private readonly channelProducts = new Map<string, Set<string>>();

  constructor(
    private readonly url: string,
    private readonly credentials: CoinbaseCredentials,
    private readonly messageHandler: (data: unknown) => void,
    private readonly disconnectHandler: (reason: string) => void,
  ) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public subscribe(channel: string, productIds: string[]): void {
    let products = this.channelProducts.get(channel);
    if (!products) {
      products = new Set();
      this.channelProducts.set(channel, products);
    }
    for (const pid of productIds) {
      products.add(pid);
    }

    void this.sendSubscribe(channel, productIds);
  }

  public unsubscribe(channel: string, productIds: string[]): void {
    const products = this.channelProducts.get(channel);
    if (products) {
      for (const pid of productIds) {
        products.delete(pid);
      }
      if (products.size === 0) {
        this.channelProducts.delete(channel);
      }
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendRaw({
        type: 'unsubscribe',
        product_ids: productIds,
        channel,
        jwt: this.credentials.generateWebSocketJwt(),
      });
    }
  }

  public close(): void {
    this.isClosed = true;
    this.channelProducts.clear();
    this.ws?.close();
    this.ws = null;
    this.connectionPromise = null;
  }

  // ---------------------------------------------------------------------------
  // Connection
  // ---------------------------------------------------------------------------

  private async ensureConnection(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
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

  private createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      let errorOccurred = false;

      ws.addEventListener('open', () => {
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.subscribeToHeartbeats();
        resolve();
      });

      ws.addEventListener('message', (event) => {
        try {
          const data: unknown = JSON.parse(event.data as string);
          this.messageHandler(data);
        } catch (error) {
          logger.streaming.error(
            { err: error },
            'WebSocket message parse error',
          );
          logger.streaming.error({ data: event.data }, 'Raw message');
        }
      });

      ws.addEventListener('close', () => {
        if (this.ws === ws && !errorOccurred) {
          void this.reconnect();
        }
      });

      ws.addEventListener('error', (event) => {
        logger.streaming.error({ event }, 'WebSocket connection error');
        errorOccurred = true;
        reject(new Error('WebSocket connection failed'));
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Reconnect
  // ---------------------------------------------------------------------------

  private async reconnect(): Promise<void> {
    if (this.isClosed) {
      return;
    }
    if (this.isReconnecting) {
      return;
    }
    if (this.channelProducts.size === 0) {
      return;
    }

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      const reason = `Connection failed after ${MAX_RECONNECT_ATTEMPTS} reconnect attempts`;
      logger.streaming.error(reason);
      this.disconnectHandler(reason);
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay =
      RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      this.connectionPromise = this.createConnection();
      await this.connectionPromise;
      this.connectionPromise = null;
      this.resubscribeAll();
    } catch (error) {
      this.connectionPromise = null;
      logger.streaming.error({ err: error }, 'Reconnect attempt failed');
      this.isReconnecting = false;
      void this.reconnect();
    }
  }

  private resubscribeAll(): void {
    for (const [channel, products] of this.channelProducts) {
      if (products.size > 0) {
        this.sendRaw({
          type: 'subscribe',
          product_ids: [...products],
          channel,
          jwt: this.credentials.generateWebSocketJwt(),
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async sendSubscribe(
    channel: string,
    productIds: string[],
  ): Promise<void> {
    await this.ensureConnection();
    this.sendRaw({
      type: 'subscribe',
      product_ids: productIds,
      channel,
      jwt: this.credentials.generateWebSocketJwt(),
    });
  }

  private subscribeToHeartbeats(): void {
    this.sendRaw({
      type: 'subscribe',
      channel: 'heartbeats',
    });
  }

  private sendRaw(message: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.streaming.warn(
        { messageType: message.type },
        'Cannot send - WebSocket not open',
      );
      return;
    }
    this.ws.send(JSON.stringify(message));
  }
}
