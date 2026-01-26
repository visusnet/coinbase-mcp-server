# Long-Polling Market Events - Implementation Plan

## Overview

An MCP tool (`wait_for_market_event`) that waits server-side for market conditions and only returns when a condition is met or a timeout is reached.

**Advantages over sleep-polling:**
- Event-driven instead of fixed intervals
- Immediate reaction to conditions
- Lower token consumption in the LLM
- More efficient API usage

## Requirements

1. **Monitor multiple products simultaneously**
2. **Flexible conditions** with arbitrary fields and operators
3. **Connection pool** for WebSocket connections
4. **55-second timeout** to avoid MCP timeouts

---

## Schema Design

### Enums and Types

```typescript
// MarketEventService.types.ts

export enum ConditionField {
  PRICE = 'price',
  VOLUME_24H = 'volume24h',
  PERCENT_CHANGE_24H = 'percentChange24h',
  HIGH_24H = 'high24h',
  LOW_24H = 'low24h',
}

export enum ConditionOperator {
  GT = 'gt',           // greater than
  GTE = 'gte',         // greater than or equal
  LT = 'lt',           // less than
  LTE = 'lte',         // less than or equal
  CROSS_ABOVE = 'crossAbove',  // crosses threshold upward
  CROSS_BELOW = 'crossBelow',  // crosses threshold downward
}

export enum ConditionLogic {
  ANY = 'any',  // OR - any condition triggers
  ALL = 'all',  // AND - all conditions must be met
}
```

### Request Schema

```typescript
// MarketEventService.request.ts

export const ConditionSchema = z.object({
  field: z.nativeEnum(ConditionField)
    .describe('The ticker field to monitor'),
  operator: z.nativeEnum(ConditionOperator)
    .describe('Comparison operator'),
  value: z.number()
    .describe('Threshold value to compare against'),
});

export const SubscriptionSchema = z.object({
  productId: z.string()
    .describe('Trading pair to monitor (e.g., "BTC-EUR")'),
  conditions: z.array(ConditionSchema).min(1).max(5)
    .describe('Conditions that trigger the event'),
  logic: z.nativeEnum(ConditionLogic).default(ConditionLogic.ANY)
    .describe('How to combine conditions: "any" (OR) or "all" (AND)'),
});

export const WaitForMarketEventRequestSchema = z.object({
  subscriptions: z.array(SubscriptionSchema).min(1).max(10)
    .describe('Products and conditions to monitor'),
  timeout: z.number().min(1).max(55).default(55)
    .describe('Maximum wait time in seconds (default: 55)'),
});

export type WaitForMarketEventRequest = z.output<typeof WaitForMarketEventRequestSchema>;
```

### Response Schema

```typescript
// MarketEventService.response.ts

export const TickerSchema = z.object({
  price: z.number().describe('Current price'),
  volume24h: z.number().describe('24-hour volume'),
  percentChange24h: z.number().describe('24-hour percent change'),
  high24h: z.number().describe('24-hour high'),
  low24h: z.number().describe('24-hour low'),
  timestamp: z.string().describe('Ticker timestamp'),
});

export const TriggeredConditionSchema = z.object({
  field: z.string().describe('Field that triggered'),
  operator: z.string().describe('Operator used'),
  threshold: z.number().describe('Configured threshold'),
  actualValue: z.number().describe('Actual value that triggered'),
});

export const MarketEventTriggeredResponseSchema = z.object({
  status: z.literal('triggered').describe('Event was triggered'),
  productId: z.string().describe('Product that triggered'),
  triggeredConditions: z.array(TriggeredConditionSchema)
    .describe('Conditions that were met'),
  ticker: TickerSchema.describe('Current ticker data'),
  timestamp: z.string().describe('Event timestamp'),
});

export const MarketEventTimeoutResponseSchema = z.object({
  status: z.literal('timeout').describe('Timeout reached without trigger'),
  lastTickers: z.record(z.string(), TickerSchema)
    .describe('Last known ticker for each subscribed product'),
  duration: z.number().describe('How long we waited in seconds'),
  timestamp: z.string().describe('Timeout timestamp'),
});

export const WaitForMarketEventResponseSchema = z.discriminatedUnion('status', [
  MarketEventTriggeredResponseSchema,
  MarketEventTimeoutResponseSchema,
]);

export type WaitForMarketEventResponse = z.output<typeof WaitForMarketEventResponseSchema>;
```

### Example Calls

**Simple: Price below threshold**
```json
{
  "subscriptions": [
    {
      "productId": "BTC-EUR",
      "conditions": [
        { "field": "price", "operator": "lt", "value": 60000 }
      ]
    }
  ]
}
```

**Complex: Multiple products with different conditions**
```json
{
  "subscriptions": [
    {
      "productId": "BTC-EUR",
      "conditions": [
        { "field": "price", "operator": "crossBelow", "value": 60000 },
        { "field": "percentChange24h", "operator": "lt", "value": -5 }
      ],
      "logic": "any"
    },
    {
      "productId": "ETH-EUR",
      "conditions": [
        { "field": "price", "operator": "crossAbove", "value": 4000 }
      ]
    }
  ],
  "timeout": 55
}
```

**Response on trigger:**
```json
{
  "status": "triggered",
  "productId": "BTC-EUR",
  "triggeredConditions": [
    {
      "field": "price",
      "operator": "crossBelow",
      "threshold": 60000,
      "actualValue": 59850.25
    }
  ],
  "ticker": {
    "price": 59850.25,
    "volume24h": 1234567.89,
    "percentChange24h": -2.34,
    "high24h": 62100.00,
    "low24h": 59500.00,
    "timestamp": "2025-01-25T14:30:00.000Z"
  },
  "timestamp": "2025-01-25T14:30:00.123Z"
}
```

**Response on timeout:**
```json
{
  "status": "timeout",
  "lastTickers": {
    "BTC-EUR": {
      "price": 61200.50,
      "volume24h": 1234567.89,
      "percentChange24h": -0.5,
      "high24h": 62100.00,
      "low24h": 60800.00,
      "timestamp": "2025-01-25T14:30:54.000Z"
    },
    "ETH-EUR": {
      "price": 3850.25,
      "volume24h": 98765.43,
      "percentChange24h": 1.2,
      "high24h": 3900.00,
      "low24h": 3800.00,
      "timestamp": "2025-01-25T14:30:54.000Z"
    }
  },
  "duration": 55,
  "timestamp": "2025-01-25T14:30:55.000Z"
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ MarketEventToolRegistry                                         │
│   └─ wait_for_market_event tool                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ MarketEventService                                              │
│   ├─ waitForEvent(subscriptions, timeout)                       │
│   ├─ evaluateConditions(ticker, conditions, logic)              │
│   └─ Uses WebSocketPool                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ WebSocketPool (Singleton)                                       │
│   ├─ subscribe(productIds, callback)                            │
│   ├─ unsubscribe(subscriptionId)                                │
│   ├─ Connection Management (auto-reconnect)                     │
│   └─ Heartbeat handling                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Coinbase WebSocket                                              │
│   Endpoint: wss://advanced-trade-ws.coinbase.com                │
│   Channel: ticker (real-time price updates)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/server/
├── websocket/
│   ├── WebSocketPool.ts                # Connection Pool (Singleton)
│   ├── WebSocketPool.spec.ts           # Tests
│   ├── types.ts                        # WebSocket Message Types
│   └── auth.ts                         # JWT Generation (optional)
├── services/
│   ├── MarketEventService.ts           # Main logic
│   ├── MarketEventService.request.ts   # Request Schemas
│   ├── MarketEventService.response.ts  # Response Schemas
│   ├── MarketEventService.types.ts     # Enums
│   └── MarketEventService.spec.ts      # Tests
└── tools/
    ├── MarketEventToolRegistry.ts      # Tool Registration
    └── MarketEventToolRegistry.spec.ts # Tests
```

---

## Component Details

### 1. WebSocketPool

**Responsibilities:**
- Singleton pattern for connection sharing
- Automatic reconnect on connection loss
- Heartbeat every 30 seconds
- Subscription management with callbacks

**Interface (with Native WebSocket):**
```typescript
class WebSocketPool {
  // Singleton
  private static instance: WebSocketPool;
  public static getInstance(): WebSocketPool;

  // Connection State (Native WebSocket)
  private connection: WebSocket | null;  // Node.js 22+ native WebSocket
  private connectionPromise: Promise<void> | null;
  private subscribedProducts: Set<string>;
  private reconnectAttempts: number;
  private heartbeatInterval: ReturnType<typeof setInterval> | null;

  // Subscription Management
  private subscriptions: Map<string, {
    productIds: string[];
    callback: (productId: string, ticker: Ticker) => void;
  }>;

  // Public API
  public subscribe(
    productIds: string[],
    callback: (productId: string, ticker: Ticker) => void
  ): string;  // Returns subscriptionId

  public unsubscribe(subscriptionId: string): void;

  // Internal (W3C WebSocket API)
  private ensureConnection(): Promise<void>;
  private createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection = new WebSocket(COINBASE_WS_URL);

      this.connection.addEventListener('open', () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      });

      this.connection.addEventListener('message', (event) => {
        this.handleMessage(JSON.parse(event.data as string));
      });

      this.connection.addEventListener('close', () => {
        this.stopHeartbeat();
        this.reconnect();
      });

      this.connection.addEventListener('error', (error) => {
        reject(error);
      });
    });
  }
  private updateSubscribedProducts(): void;
  private sendSubscribe(productIds: string[]): void;
  private sendUnsubscribe(productIds: string[]): void;
  private handleMessage(data: WebSocketMessage): void;
  private startHeartbeat(): void;
  private stopHeartbeat(): void;
  private reconnect(): void;  // Exponential Backoff
}
```

**Coinbase WebSocket Protocol:**
```typescript
// Subscribe Message
{
  "type": "subscribe",
  "product_ids": ["BTC-EUR", "ETH-EUR"],
  "channel": "ticker"
}

// Ticker Message (received)
{
  "type": "ticker",
  "product_id": "BTC-EUR",
  "price": "61200.50",
  "volume_24_h": "1234567.89",
  "price_percent_chg_24_h": "-0.5",
  "high_24_h": "62100.00",
  "low_24_h": "60800.00"
}
```

### 2. MarketEventService

**Responsibilities:**
- Orchestrates subscriptions
- Evaluates conditions on each ticker update
- Manages timeout
- Stores previous values for crossAbove/crossBelow

**Core Logic:**
```typescript
class MarketEventService {
  constructor(private readonly pool: WebSocketPool) {}

  public async waitForEvent(
    request: WaitForMarketEventRequest
  ): Promise<WaitForMarketEventResponse> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const lastTickers = new Map<string, Ticker>();
      const previousValues = new Map<string, Map<ConditionField, number>>();

      // Timeout Handler
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve({
          status: 'timeout',
          lastTickers: Object.fromEntries(lastTickers),
          duration: request.timeout,
          timestamp: new Date().toISOString(),
        });
      }, request.timeout * 1000);

      // Subscribe
      const productIds = request.subscriptions.map(s => s.productId);
      const subId = this.pool.subscribe(productIds, (productId, ticker) => {
        lastTickers.set(productId, ticker);

        const subscription = request.subscriptions
          .find(s => s.productId === productId);
        if (!subscription) return;

        const triggered = this.evaluateConditions(
          ticker,
          subscription.conditions,
          subscription.logic,
          previousValues.get(productId)
        );

        if (triggered.length > 0) {
          cleanup();
          resolve({
            status: 'triggered',
            productId,
            triggeredConditions: triggered,
            ticker,
            timestamp: new Date().toISOString(),
          });
        }

        this.storePreviousValues(previousValues, productId, ticker);
      });

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.pool.unsubscribe(subId);
      };
    });
  }

  private evaluateConditions(
    ticker: Ticker,
    conditions: Condition[],
    logic: ConditionLogic,
    previousValues?: Map<ConditionField, number>
  ): TriggeredCondition[] {
    const triggered: TriggeredCondition[] = [];

    for (const condition of conditions) {
      const actual = this.getFieldValue(ticker, condition.field);
      const previous = previousValues?.get(condition.field);

      if (this.evaluateOperator(actual, condition.operator, condition.value, previous)) {
        triggered.push({
          field: condition.field,
          operator: condition.operator,
          threshold: condition.value,
          actualValue: actual,
        });

        if (logic === ConditionLogic.ANY) {
          return triggered;  // Early return for OR
        }
      }
    }

    // For ALL logic, only return if all conditions matched
    if (logic === ConditionLogic.ALL && triggered.length === conditions.length) {
      return triggered;
    }

    return logic === ConditionLogic.ANY ? triggered : [];
  }

  private evaluateOperator(
    actual: number,
    operator: ConditionOperator,
    threshold: number,
    previous?: number
  ): boolean {
    switch (operator) {
      case ConditionOperator.GT:
        return actual > threshold;
      case ConditionOperator.GTE:
        return actual >= threshold;
      case ConditionOperator.LT:
        return actual < threshold;
      case ConditionOperator.LTE:
        return actual <= threshold;
      case ConditionOperator.CROSS_ABOVE:
        return previous !== undefined
          && previous <= threshold
          && actual > threshold;
      case ConditionOperator.CROSS_BELOW:
        return previous !== undefined
          && previous >= threshold
          && actual < threshold;
    }
  }
}
```

### 3. MarketEventToolRegistry

**Tool Definition:**
```typescript
class MarketEventToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly marketEvent: MarketEventService
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'wait_for_market_event',
      {
        title: 'Wait for Market Event',
        description: `
Waits for specific market conditions to be met before returning.
Monitors real-time ticker data via WebSocket and triggers when
conditions are satisfied or timeout is reached.

Use this instead of polling with sleep intervals for efficient
event-driven trading strategies.

Returns immediately when any subscription's conditions are met,
or returns timeout status with last known ticker data.
        `.trim(),
        inputSchema: WaitForMarketEventRequestSchema.shape,
      },
      this.call(this.marketEvent.waitForEvent.bind(this.marketEvent))
    );
  }
}
```

---

## Recommended Conditions

| Condition | Description | Use Case |
|-----------|-------------|----------|
| `price lt {value}` | Price below threshold | Buy-the-dip |
| `price gt {value}` | Price above threshold | Take-profit trigger |
| `price crossAbove {value}` | Price breaks upward | Breakout strategy |
| `price crossBelow {value}` | Price breaks downward | Stop-loss trigger |
| `percentChange24h lt {value}` | 24h loss greater than X% | Crash alert |
| `percentChange24h gt {value}` | 24h gain greater than X% | Rally alert |
| `volume24h gt {value}` | High trading volume | Liquidity check |
| `high24h gt {value}` | New 24h high reached | Momentum signal |
| `low24h lt {value}` | New 24h low reached | Capitulation signal |

---

## Implementation Order

### Phase 1: WebSocket Foundation
1. `src/server/websocket/types.ts` - Message Types
2. `src/server/websocket/WebSocketPool.ts` - Connection Pool
3. `src/server/websocket/WebSocketPool.spec.ts` - Tests
4. **Run Quality Checks** (see below)

### Phase 2: Service Layer
5. `src/server/services/MarketEventService.types.ts` - Enums
6. `src/server/services/MarketEventService.request.ts` - Request Schemas
7. `src/server/services/MarketEventService.response.ts` - Response Schemas
8. `src/server/services/MarketEventService.ts` - Service Implementation
9. `src/server/services/MarketEventService.spec.ts` - Tests
10. **Run Quality Checks** (see below)

### Phase 3: MCP Integration
11. `src/server/tools/MarketEventToolRegistry.ts` - Tool Registry
12. `src/server/tools/MarketEventToolRegistry.spec.ts` - Tests
13. `src/server/CoinbaseMcpServer.ts` - Integration
14. **Run Quality Checks** (see below)

### Phase 4: Code Review Loop
15. **Spawn sub-agent for code review** (see below)
16. Fix any issues found
17. Repeat until no new issues

### Phase 5: Documentation
18. `docs/IMPLEMENTED_TOOLS.md` - Update tool documentation

---

## Quality Checks

After every code change, run the following commands in order:

```bash
# 1. Format code
npm run format

# 2. Lint check
npm run lint

# 3. Type check
npm run test:types

# 4. Test coverage (100% is SACRED)
npm run test:coverage

# 5. Unused exports/dependencies
npm run knip
```

**Coverage Requirements:**
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

If any check fails, fix the issues before proceeding.

---

## Code Review Loop

After implementation is complete, spawn an independent sub-agent to review the code:

```
Task: Code Review Sub-Agent

Review all new/modified files for this feature:
- src/server/websocket/**
- src/server/services/MarketEventService*
- src/server/tools/MarketEventToolRegistry*

Check for:
1. TypeScript best practices (no any, explicit types, readonly where appropriate)
2. Error handling (all WebSocket errors caught, meaningful messages)
3. Edge cases (empty arrays, null values, connection failures)
4. Test coverage gaps (missing test scenarios)
5. Schema validation (all fields have .describe())
6. Memory leaks (cleanup of intervals, event listeners)
7. Consistency with existing codebase patterns

Output: List of issues found with file:line references
```

**Loop Process:**
```
while issues_found:
    1. Sub-agent reviews code
    2. If no issues → exit loop
    3. Fix reported issues
    4. Run Quality Checks (format, lint, types, coverage, knip)
    5. Repeat
```

This ensures code quality through independent review before merge.

---

## Dependencies

**No new npm packages required.**

Node.js 22+ provides native WebSocket support via the global `WebSocket` class (W3C-compatible).

```typescript
// Native WebSocket in Node.js 22+
const ws = new WebSocket('wss://advanced-trade-ws.coinbase.com');

ws.addEventListener('open', () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    product_ids: ['BTC-EUR'],
    channel: 'ticker',
  }));
});

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data as string);
  // Handle ticker message
});

ws.addEventListener('close', () => {
  // Reconnect logic
});

ws.addEventListener('error', (error) => {
  // Error handling
});
```

**Prerequisite:** Node.js >= 22.0.0 (verify in `package.json` → `engines`)

---

## Testability

**WebSocketPool Mocking:**
```typescript
// serviceMocks.ts
export const mockWebSocketPool = {
  subscribe: jest.fn<WebSocketPool['subscribe']>(),
  unsubscribe: jest.fn<WebSocketPool['unsubscribe']>(),
} as MockedService<WebSocketPool>;

// Simulate ticker updates in tests
mockWebSocketPool.subscribe.mockImplementation((productIds, callback) => {
  // Simulate immediate ticker
  setTimeout(() => {
    callback('BTC-EUR', {
      price: 59000,
      volume24h: 1000000,
      percentChange24h: -3,
      high24h: 62000,
      low24h: 58500,
      timestamp: '2025-01-25T12:00:00Z',
    });
  }, 10);
  return 'mock-sub-id';
});
```

---

## Open Decisions

1. **Authentication**: Ticker channel is public - auth only needed for User channel
2. **Reconnect Strategy**: Exponential backoff with max retries
3. **Metrics**: Optional logging of connection events

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| WebSocket disconnect | Auto-reconnect with exponential backoff |
| MCP timeout | 55-second default, tool returns cleanly |
| High load with many subscriptions | Max 10 subscriptions per request |
| Stale data after reconnect | Ignore first ticker after reconnect for crossAbove/crossBelow |

---

## Skill Adaptations

The trading skill (`.claude/skills/coinbase-trading/SKILL.md`) must be adapted to use the new `wait_for_market_event` tool.

### Decision Logic: When to use `wait_for_market_event` vs. `sleep`

| Situation | Tool | Reason |
|-----------|------|--------|
| Waiting for next cycle (no condition) | `sleep` | Simple interval waiting |
| Waiting for stop-loss/take-profit | `wait_for_market_event` | Immediate reaction to price thresholds |
| Waiting for entry signal | `wait_for_market_event` | Buy breakout/dip |
| Waiting for volatility spike | `wait_for_market_event` | Volume/percent change condition |

### Skill Changes

#### 1. New Section: Event-Driven Monitoring

**Stop-Loss / Take-Profit Monitoring:**
```
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "lte", value: stopLossPrice },
      { field: "price", operator: "gte", value: takeProfitPrice }
    ],
    logic: "any"
  }],
  timeout: 55
})
```

**Trailing Stop Monitoring:**
```
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "lte", value: trailingStopPrice }
    ]
  }],
  timeout: 55
})
```

**Entry Signal Waiting:**
```
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "crossBelow", value: 60000 },
      { field: "percentChange24h", operator: "lt", value: -5 }
    ],
    logic: "any"
  }],
  timeout: 55
})
```

#### 2. Trading Loop Adaptation (Phase 4)

**Before:**
```
After each trading cycle:
1. Output report
2. Execute sleep based on configured interval
3. Start over
```

**After:**
```
After each trading cycle:
1. Output report
2. Wait for next event:
   - With open positions: wait_for_market_event with SL/TP conditions
   - Without positions, with entry signal: wait_for_market_event with entry conditions
   - Without positions, no signal: sleep for next analysis cycle
3. Handle response:
   - status: "triggered" → Act immediately (execute SL/TP, check entry)
   - status: "timeout" → Perform normal analysis
4. Start over
```

#### 3. Example: Complete Cycle with Event-Driven Monitoring

**Scenario**: BTC-EUR position open, entry @ 95,000€

1. **Analysis complete**
   - SL: 91,200€ (ATR-based)
   - TP: 98,800€ (ATR-based)

2. **Start event monitoring**
   ```
   wait_for_market_event({
     subscriptions: [{
       productId: "BTC-EUR",
       conditions: [
         { field: "price", operator: "lte", value: 91200 },
         { field: "price", operator: "gte", value: 98800 }
       ],
       logic: "any"
     }],
     timeout: 55
   })
   ```

3. **Response: triggered @ 98,850€ (TP)**
   ```json
   {
     "status": "triggered",
     "productId": "BTC-EUR",
     "triggeredConditions": [{
       "field": "price",
       "operator": "gte",
       "threshold": 98800,
       "actualValue": 98850
     }]
   }
   ```

4. **Immediate action**
   - Recognize: TP reached
   - Execute SELL
   - Calculate profit, apply compound
   - Start next cycle

**Comparison with sleep-polling:**
- Sleep (15min): Would detect TP up to 15 minutes later
- Event-driven: Detects TP within seconds

### Summary of Skill Changes

| File | Change |
|------|--------|
| `SKILL.md` | New section "Event-Driven Position Monitoring" |
| `SKILL.md` | Adapt "Autonomous Loop Mode" (Phase 4) |
| `SKILL_FEATURES.md` | New feature documentation for long-polling |

### Implementation Order (Skill)

After completing the MCP tool:

1. Extend **SKILL.md** with event-driven section
2. Adapt **workflow** (sleep → wait_for_market_event decision)
3. Update **SKILL_FEATURES.md**
4. Test with dry-run mode
