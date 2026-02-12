import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { generateKeyPairSync } from 'node:crypto';

// =============================================================================
// Mocks — only WebSocket, fetch, and logger (for silence)
// =============================================================================

import { mockLogger } from '@test/loggerMock';

const logger = mockLogger();
jest.mock('../logger', () => ({ logger }));

// ---------------------------------------------------------------------------
// MockWebSocket — minimal stub that auto-opens via microtask
// ---------------------------------------------------------------------------

type WsHandler = (event: Record<string, unknown>) => void;

class MockWebSocket {
  public static readonly CONNECTING = 0;
  public static readonly OPEN = 1;
  public static readonly CLOSING = 2;
  public static readonly CLOSED = 3;

  public static instances: MockWebSocket[] = [];
  public static shouldError = false;

  public readyState = MockWebSocket.CONNECTING;
  private readonly handlers = new Map<string, Set<WsHandler>>();

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      if (MockWebSocket.shouldError) {
        this.dispatch('error', { message: 'Connection refused' });
      } else {
        this.readyState = MockWebSocket.OPEN;
        this.dispatch('open', {});
      }
    });
  }

  public addEventListener(type: string, handler: WsHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.add(handler);
    }
  }

  public removeEventListener(_type: string, _handler: WsHandler): void {}
  public send(_data: string): void {}

  public close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatch('close', {});
  }

  public simulateMessage(data: unknown): void {
    this.dispatch('message', { data: JSON.stringify(data) });
  }

  private dispatch(type: string, event: Record<string, unknown>): void {
    for (const handler of this.handlers.get(type) ?? []) {
      handler(event);
    }
  }
}

// ---------------------------------------------------------------------------
// Globals — save originals and override in beforeEach
// ---------------------------------------------------------------------------

const savedWebSocket = globalThis.WebSocket;
const savedFetch = globalThis.fetch;

// Generate a valid EC P-256 key (CoinbaseCredentials needs real PEM)
const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const TEST_PRIVATE_KEY = privateKey.export({
  type: 'sec1',
  format: 'pem',
}) as string;
const TEST_API_KEY = 'organizations/test-org/apiKeys/test-key';

// Import AFTER mock setup (jest.mock is hoisted, globals set in beforeEach)
import { CoinbaseMcpServer } from './CoinbaseMcpServer';

describe('Market Event Integration', () => {
  let server: CoinbaseMcpServer;
  let client: Client;

  beforeEach(async () => {
    MockWebSocket.instances = [];
    MockWebSocket.shouldError = false;
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    globalThis.fetch = jest.fn<typeof fetch>();

    server = new CoinbaseMcpServer(TEST_API_KEY, TEST_PRIVATE_KEY);
    const mcpServer = server.getMcpServer();

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await mcpServer.connect(serverTransport);

    client = new Client({ name: 'integration-test', version: '1.0.0' });
    await client.connect(clientTransport);
  });

  afterEach(() => {
    server.close();
    globalThis.WebSocket = savedWebSocket;
    globalThis.fetch = savedFetch;
  });

  function parseToolResult(response: CallToolResult): unknown {
    expect(response.isError).toBe(false);
    return JSON.parse(
      (response.content[0] as { text: string }).text,
    ) as unknown;
  }

  // ---------------------------------------------------------------------------
  // 1. Ticker triggers on price condition
  // ---------------------------------------------------------------------------

  describe('ticker triggers on price condition', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = {
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
              triggered: true,
            },
          ],
        },
      ],
      timestamp: expect.any(String),
    };

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '66000.00')]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. 5m candle triggers on SMA condition via WebSocket
  // ---------------------------------------------------------------------------

  describe('5m candle triggers on SMA condition via WebSocket', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              value: 250,
              period: 2,
              granularity: 'FIVE_MINUTE',
            },
          ],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = {
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              threshold: 250,
              actualValue: 300,
              triggered: true,
            },
          ],
        },
      ],
      timestamp: expect.any(String),
    };

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      // SMA(2) on closes [100, 200, 400] = (200+400)/2 = 300 > 250
      MockWebSocket.instances[0].simulateMessage(
        candleMessage([100, 200, 400]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Non-5m candle triggers on SMA condition via REST
  // ---------------------------------------------------------------------------

  describe('non-5m candle triggers on SMA condition via REST', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              value: 250,
              period: 2,
              granularity: 'ONE_HOUR',
            },
          ],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = {
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              threshold: 250,
              actualValue: 300,
              triggered: true,
            },
          ],
        },
      ],
      timestamp: expect.any(String),
    };

    async function callAndInject(): Promise<unknown> {
      // SMA(2) on closes [100, 200, 400] = (200+400)/2 = 300 > 250
      mockFetchWithCandles();

      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Combined ticker + indicator: ticker triggers first
  // ---------------------------------------------------------------------------

  describe('combined ticker + indicator: ticker triggers first', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            { field: 'price', operator: 'gt', value: 65000 },
            {
              field: 'sma',
              operator: 'gt',
              value: 250,
              period: 2,
              granularity: 'FIVE_MINUTE',
            },
          ],
          logic: 'any',
        },
      ],
      timeout: 10,
    };

    const EXPECTED = {
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
              triggered: true,
            },
            {
              field: 'sma',
              operator: 'gt',
              threshold: 250,
              actualValue: null,
              triggered: false,
            },
          ],
        },
      ],
      timestamp: expect.any(String),
    };

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      // Only inject ticker — no candle data, so SMA stays null
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '66000.00')]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Combined ticker + indicator: indicator triggers first
  // ---------------------------------------------------------------------------

  describe('combined ticker + indicator: indicator triggers first', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            { field: 'price', operator: 'gt', value: 65000 },
            {
              field: 'sma',
              operator: 'gt',
              value: 250,
              period: 2,
              granularity: 'FIVE_MINUTE',
            },
          ],
          logic: 'any',
        },
      ],
      timeout: 10,
    };

    const EXPECTED = {
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: null,
              triggered: false,
            },
            {
              field: 'sma',
              operator: 'gt',
              threshold: 250,
              actualValue: 300,
              triggered: true,
            },
          ],
        },
      ],
      timestamp: expect.any(String),
    };

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      // Only inject candles — no ticker data, so price stays null
      // SMA(2) on [100, 200, 400] = 300 > 250
      MockWebSocket.instances[0].simulateMessage(
        candleMessage([100, 200, 400]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Multiple subscriptions: first product triggers
  // ---------------------------------------------------------------------------

  describe('multiple subscriptions: first product triggers', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
        },
        {
          productId: 'ETH-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 5000 }],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = {
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
              triggered: true,
            },
          ],
        },
        {
          productId: 'ETH-EUR',
          triggered: false,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 5000,
              actualValue: 4000,
              triggered: false,
            },
          ],
        },
      ],
      timestamp: expect.any(String),
    };

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      const ws = MockWebSocket.instances[0];

      // Send ETH first (not triggering) so it has condition results
      ws.simulateMessage(tickerMessage([makeTicker('ETH-EUR', '4000.00')]));
      // Then BTC (triggering)
      ws.simulateMessage(tickerMessage([makeTicker('BTC-EUR', '66000.00')]));

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. WebSocket disconnect returns error
  // ---------------------------------------------------------------------------

  describe('WebSocket disconnect returns error', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
        },
      ],
      timeout: 2,
    };

    const AUTH_ERROR = {
      type: 'error',
      message: 'authentication failure - invalid token',
    };

    const EXPECTED = {
      status: 'error',
      reason: expect.stringContaining('authentication'),
      timestamp: expect.any(String),
    };

    async function callAndDisconnect(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();

      // Simulate authentication error — triggers disconnect
      MockWebSocket.instances[0].simulateMessage(AUTH_ERROR);

      const response = (await toolPromise) as CallToolResult;
      return JSON.parse(
        (response.content[0] as { text: string }).text,
      ) as unknown;
    }

    it('returns error', async () => {
      expect(await callAndDisconnect()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Timeout when no conditions trigger
  // ---------------------------------------------------------------------------

  describe('timeout when no conditions trigger', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 99999 }],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'timeout',
      duration: 10,
    });

    async function callAndTimeout(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      // Let microtasks run to set up WebSocket + subscriptions
      await jest.advanceTimersByTimeAsync(0);

      // Inject a ticker that does NOT meet the condition
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '50000.00')]),
      );

      // Fast-forward past the timeout
      await jest.advanceTimersByTimeAsync(10_000);

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('times out', async () => {
      expect(await callAndTimeout()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. ALL logic: both conditions must trigger
  // ---------------------------------------------------------------------------

  describe('ALL logic: both conditions must trigger', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            { field: 'price', operator: 'gt', value: 65000 },
            { field: 'volume24h', operator: 'gt', value: 500 },
          ],
          logic: 'all',
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
              triggered: true,
            },
            {
              field: 'volume24h',
              operator: 'gt',
              threshold: 500,
              actualValue: 1000.5,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      // Both price (66000 > 65000) and volume (1000.5 > 500) satisfy conditions
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '66000.00')]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. ALL logic: partial trigger does not resolve
  // ---------------------------------------------------------------------------

  describe('ALL logic: partial trigger times out', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            { field: 'price', operator: 'gt', value: 65000 },
            { field: 'volume24h', operator: 'gt', value: 9999 },
          ],
          logic: 'all',
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'timeout',
      duration: 10,
    });

    async function callAndPartialTrigger(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      // Let microtasks run to set up WebSocket + subscriptions
      await jest.advanceTimersByTimeAsync(0);

      // Price triggers (66000 > 65000) but volume does NOT (1000.5 < 9999)
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '66000.00')]),
      );

      // Fast-forward past the timeout
      await jest.advanceTimersByTimeAsync(10_000);

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('times out', async () => {
      expect(await callAndPartialTrigger()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Multiple subscriptions: second product triggers
  // ---------------------------------------------------------------------------

  describe('multiple subscriptions: second product triggers', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 99999 }],
        },
        {
          productId: 'ETH-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 3000 }],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: false,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 99999,
              actualValue: 66000,
              triggered: false,
            },
          ],
        },
        {
          productId: 'ETH-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 3000,
              actualValue: 3500,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      // Both products get a ticker, but only ETH triggers
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([
          makeTicker('BTC-EUR', '66000.00'),
          makeTicker('ETH-EUR', '3500.00'),
        ]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 12. Ticker condition with LT operator
  // ---------------------------------------------------------------------------

  describe('ticker triggers on LT condition', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'lt', value: 70000 }],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'lt',
              threshold: 70000,
              actualValue: 66000,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '66000.00')]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 13. Ticker crossAbove operator
  // ---------------------------------------------------------------------------

  describe('ticker crossAbove triggers on threshold crossing', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            { field: 'price', operator: 'crossAbove', value: 65000 },
          ],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'crossAbove',
              threshold: 65000,
              actualValue: 66000,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      const ws = MockWebSocket.instances[0];

      // First tick: below threshold (sets previousTicker)
      ws.simulateMessage(tickerMessage([makeTicker('BTC-EUR', '64000.00')]));
      // Second tick: above threshold (crosses upward)
      ws.simulateMessage(tickerMessage([makeTicker('BTC-EUR', '66000.00')]));

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 14. Ticker crossBelow operator
  // ---------------------------------------------------------------------------

  describe('ticker crossBelow triggers on threshold crossing', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            { field: 'price', operator: 'crossBelow', value: 65000 },
          ],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'crossBelow',
              threshold: 65000,
              actualValue: 64000,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      const ws = MockWebSocket.instances[0];

      // First tick: above threshold (sets previousTicker)
      ws.simulateMessage(tickerMessage([makeTicker('BTC-EUR', '66000.00')]));
      // Second tick: below threshold (crosses downward)
      ws.simulateMessage(tickerMessage([makeTicker('BTC-EUR', '64000.00')]));

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 15. GTE operator at exact boundary
  // ---------------------------------------------------------------------------

  describe('GTE triggers when value equals threshold', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gte', value: 66000 }],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gte',
              threshold: 66000,
              actualValue: 66000,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      // Price exactly equals threshold — GT would fail, GTE succeeds
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '66000.00')]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 16. Multiple granularities in one subscription
  // ---------------------------------------------------------------------------

  describe('multiple granularities: 5m WebSocket + 1h REST in same subscription', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              value: 250,
              period: 2,
              granularity: 'FIVE_MINUTE',
            },
            {
              field: 'sma',
              operator: 'gt',
              value: 999,
              period: 2,
              granularity: 'ONE_HOUR',
            },
          ],
          logic: 'any',
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              threshold: 250,
              actualValue: 300,
              triggered: true,
            },
            {
              field: 'sma',
              operator: 'gt',
              threshold: 999,
              actualValue: 300,
              triggered: false,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      // REST candles for ONE_HOUR: SMA(2) = (200+400)/2 = 300 < 999
      mockFetchWithCandles();

      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      // WebSocket candles for FIVE_MINUTE: SMA(2) = (200+400)/2 = 300 > 250
      MockWebSocket.instances[0].simulateMessage(
        candleMessage([100, 200, 400]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 17. ALL logic: ticker + indicator both must trigger
  // ---------------------------------------------------------------------------

  describe('ALL logic: ticker + indicator from different sources', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            { field: 'price', operator: 'gt', value: 65000 },
            {
              field: 'sma',
              operator: 'gt',
              value: 250,
              period: 2,
              granularity: 'FIVE_MINUTE',
            },
          ],
          logic: 'all',
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
              triggered: true,
            },
            {
              field: 'sma',
              operator: 'gt',
              threshold: 250,
              actualValue: 300,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      const ws = MockWebSocket.instances[0];

      // Ticker alone satisfies price but ALL requires both
      ws.simulateMessage(tickerMessage([makeTicker('BTC-EUR', '66000.00')]));
      // Candles satisfy SMA — now both conditions met
      ws.simulateMessage(candleMessage([100, 200, 400]));

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 18. Non-auth WebSocket error does not disconnect
  // ---------------------------------------------------------------------------

  describe('non-auth WebSocket error does not disconnect', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      const ws = MockWebSocket.instances[0];

      // Non-auth error — logged but does NOT trigger disconnect
      ws.simulateMessage({ type: 'error', message: 'rate limited' });

      // Valid ticker still arrives and triggers
      ws.simulateMessage(tickerMessage([makeTicker('BTC-EUR', '66000.00')]));

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 19. WebSocket reconnect delivers data after close
  // ---------------------------------------------------------------------------

  describe('WebSocket reconnect delivers data after close', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
        },
      ],
      timeout: 30,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'gt',
              threshold: 65000,
              actualValue: 66000,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndReconnect(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      // Let microtasks settle — WS connects, subscriptions set up
      await jest.advanceTimersByTimeAsync(0);

      // Simulate unexpected close — triggers reconnect with exponential backoff
      MockWebSocket.instances[0].close();

      // Advance past first reconnect delay (1000ms)
      await jest.advanceTimersByTimeAsync(1000);

      // Reconnected WebSocket receives data normally
      MockWebSocket.instances[1].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '66000.00')]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndReconnect()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 20. REST fetch retries then triggers
  // ---------------------------------------------------------------------------

  describe('REST fetch retries then triggers', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              value: 250,
              period: 2,
              granularity: 'ONE_HOUR',
            },
          ],
        },
      ],
      timeout: 60,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              threshold: 250,
              actualValue: 300,
              triggered: true,
            },
          ],
        },
      ],
    });

    function mockFetchFailThenSucceed(): void {
      let attempt = 0;
      (globalThis.fetch as jest.Mock<typeof fetch>).mockImplementation(() => {
        attempt++;
        if (attempt <= 2) {
          return Promise.reject(new Error(`Fetch attempt ${attempt} failed`));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: jest.fn<Response['json']>().mockResolvedValue({
            candles: [
              {
                start: '1707609600',
                high: '110',
                low: '90',
                open: '95',
                close: '100',
                volume: '50',
              },
              {
                start: '1707613200',
                high: '210',
                low: '190',
                open: '195',
                close: '200',
                volume: '50',
              },
              {
                start: '1707616800',
                high: '410',
                low: '390',
                open: '395',
                close: '400',
                volume: '50',
              },
            ],
          }),
          headers: new Headers(),
        } as unknown as Response);
      });
    }

    async function callAndRetry(): Promise<unknown> {
      mockFetchFailThenSucceed();

      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      // Initial fetch fires and fails, pRetry schedules retry
      await jest.advanceTimersByTimeAsync(0);

      // Advance past pRetry retry delays (1000ms + 2000ms)
      await jest.advanceTimersByTimeAsync(5000);

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndRetry()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 21. LTE triggers when value equals threshold
  // ---------------------------------------------------------------------------

  describe('LTE triggers when value equals threshold', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'lte', value: 66000 }],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'price',
              operator: 'lte',
              threshold: 66000,
              actualValue: 66000,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      MockWebSocket.instances[0].simulateMessage(
        tickerMessage([makeTicker('BTC-EUR', '66000.00')]),
      );

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 22. Indicator crossAbove triggers on candle update
  // ---------------------------------------------------------------------------

  describe('indicator crossAbove triggers on candle update', () => {
    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            {
              field: 'sma',
              operator: 'crossAbove',
              value: 250,
              period: 2,
              granularity: 'FIVE_MINUTE',
            },
          ],
        },
      ],
      timeout: 10,
    };

    const EXPECTED = expect.objectContaining({
      status: 'triggered',
      subscriptions: [
        {
          productId: 'BTC-EUR',
          triggered: true,
          conditions: [
            {
              field: 'sma',
              operator: 'crossAbove',
              threshold: 250,
              actualValue: 400,
              triggered: true,
            },
          ],
        },
      ],
    });

    async function callAndInject(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      await settle();
      const ws = MockWebSocket.instances[0];

      // First candles: SMA(2) = (100+200)/2 = 150 — below threshold
      ws.simulateMessage(candleMessage([100, 200]));
      // Updated candles (same starts): SMA(2) = (300+500)/2 = 400 — crosses above
      ws.simulateMessage(candleMessage([300, 500]));

      return parseToolResult((await toolPromise) as CallToolResult);
    }

    it('triggers', async () => {
      expect(await callAndInject()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 23. Max reconnect attempts returns error
  // ---------------------------------------------------------------------------

  describe('max reconnect attempts returns error', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      MockWebSocket.shouldError = false;
      jest.useRealTimers();
    });

    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [{ field: 'price', operator: 'gt', value: 65000 }],
        },
      ],
      timeout: 60,
    };

    const EXPECTED = expect.objectContaining({
      status: 'error',
      reason: expect.stringContaining('reconnect attempts'),
    });

    async function callAndExhaust(): Promise<unknown> {
      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      // Let the initial WebSocket connect
      await jest.advanceTimersByTimeAsync(0);

      // All subsequent connections fail
      MockWebSocket.shouldError = true;
      MockWebSocket.instances[0].close();

      // Advance through each reconnect delay individually so microtasks
      // from MockWebSocket constructors are flushed between attempts.
      // Delays: 1s, 2s, 4s, 8s, 16s (5 attempts, total 31s)
      for (let attempt = 0; attempt < 5; attempt++) {
        const delay = 1000 * Math.pow(2, attempt);
        await jest.advanceTimersByTimeAsync(delay);
      }

      const response = (await toolPromise) as CallToolResult;
      return JSON.parse(
        (response.content[0] as { text: string }).text,
      ) as unknown;
    }

    it('returns error', async () => {
      expect(await callAndExhaust()).toEqual(EXPECTED);
    });
  });

  // ---------------------------------------------------------------------------
  // 24. REST fetch exhausts all retries returns error
  // ---------------------------------------------------------------------------

  describe('REST fetch exhausts all retries returns error', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    const ARGS = {
      subscriptions: [
        {
          productId: 'BTC-EUR',
          conditions: [
            {
              field: 'sma',
              operator: 'gt',
              value: 250,
              period: 2,
              granularity: 'ONE_HOUR',
            },
          ],
        },
      ],
      timeout: 60,
    };

    const EXPECTED = expect.objectContaining({
      status: 'error',
      reason: expect.stringContaining('Network error'),
    });

    async function callAndExhaust(): Promise<unknown> {
      (globalThis.fetch as jest.Mock<typeof fetch>).mockRejectedValue(
        new Error('Network error'),
      );

      const toolPromise = client.callTool({
        name: 'wait_for_market_event',
        arguments: ARGS,
      });

      // Initial fetch fails, pRetry schedules retries
      await jest.advanceTimersByTimeAsync(0);

      // Advance past pRetry delays (7s) + timeout (60s)
      await jest.advanceTimersByTimeAsync(65_000);

      const response = (await toolPromise) as CallToolResult;
      return JSON.parse(
        (response.content[0] as { text: string }).text,
      ) as unknown;
    }

    it('returns error', async () => {
      expect(await callAndExhaust()).toEqual(EXPECTED);
    });
  });
});

// =============================================================================
// Test fixtures
// =============================================================================

function makeTicker(productId: string, price: string): Record<string, unknown> {
  return {
    type: 'ticker',
    product_id: productId,
    price,
    volume_24_h: '1000.50',
    price_percent_chg_24_h: '2.50',
    high_24_h: '67000.00',
    low_24_h: '60000.00',
    high_52_w: '70000.00',
    low_52_w: '30000.00',
    best_bid: '65999.00',
    best_ask: '66001.00',
    best_bid_quantity: '0.50',
    best_ask_quantity: '0.30',
  };
}

function tickerMessage(
  tickers: Record<string, unknown>[],
): Record<string, unknown> {
  return {
    channel: 'ticker',
    timestamp: '2026-02-11T00:00:00.000Z',
    sequence_num: 1,
    events: [{ type: 'update', tickers }],
  };
}

function candleMessage(
  closes: number[],
  productId = 'BTC-EUR',
): Record<string, unknown> {
  return {
    channel: 'candles',
    timestamp: '2026-02-11T00:00:00.000Z',
    sequence_num: 1,
    events: [
      {
        type: 'update',
        candles: closes.map((close, i) => ({
          start: String(1707609600 + i * 300),
          high: String(close + 10),
          low: String(close - 10),
          open: String(close - 5),
          close: String(close),
          volume: '50',
          product_id: productId,
        })),
      },
    ],
  };
}

function mockFetchWithCandles(): void {
  (globalThis.fetch as jest.Mock<typeof fetch>).mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn<Response['json']>().mockResolvedValue({
      candles: [
        {
          start: '1707609600',
          high: '110',
          low: '90',
          open: '95',
          close: '100',
          volume: '50',
        },
        {
          start: '1707613200',
          high: '210',
          low: '190',
          open: '195',
          close: '200',
          volume: '50',
        },
        {
          start: '1707616800',
          high: '410',
          low: '390',
          open: '395',
          close: '400',
          volume: '50',
        },
      ],
    }),
    headers: new Headers(),
  } as unknown as Response);
}

async function settle(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await new Promise<void>((r) => setTimeout(r, 0));
  }
}
