# Error Handling & Resilience Analysis

**Project:** coinbase-mcp-server
**Date:** 2026-01-17
**Analyst:** Error Handling & Resilience Expert

---

## Executive Summary

This analysis examines the error handling, fault tolerance, and system resilience of the coinbase-mcp-server project. The project provides 46 MCP tools for Coinbase Advanced Trade API integration, including a sophisticated autonomous trading skill.

### Key Strengths

1. **Input Validation**: Zod schemas are used extensively for all 46 MCP tool inputs
2. **Defensive Programming**: Some defensive checks exist (parseNumber, division by zero protection)
3. **Environment Validation**: Credentials are validated at startup before server initialization
4. **MCP Error Format**: HTTP-level errors follow JSON-RPC 2.0 error format
5. **Documented Validation**: Trading skill has extensive validation rules documented in state-schema.md

### Key Concerns

1. **CRITICAL: No Error Handling in Tool Calls** - The `call()` wrapper method (CoinbaseMcpServer.ts:1026-1038) has no try-catch, meaning all service errors propagate uncaught to the MCP framework
2. **No Retry Logic**: No retry mechanism for transient API failures
3. **No Circuit Breakers**: No protection against cascading failures when Coinbase API is down
4. **No Timeout Handling**: API calls have no explicit timeouts
5. **Limited Error Context**: Errors lack contextual information for debugging
6. **State Corruption Risk**: Trading state validation is documented but not implemented in code
7. **No Graceful Degradation**: System has no fallback behavior when dependencies fail

### Overall Assessment

**Maturity Level:** Early Stage (2/5)

The project has good input validation but lacks critical production-grade error handling. The absence of try-catch in the tool wrapper is a severe reliability issue. The autonomous trading skill has well-documented validation rules but no implementation, creating significant risk for state corruption and fund loss.

**Industry Comparison:** Below standard for financial applications. Production crypto trading systems typically have:
- Multi-layer error handling
- Circuit breakers for external APIs
- Retry logic with exponential backoff
- State recovery mechanisms
- Dead letter queues for failed operations
- Comprehensive monitoring and alerting

---

## Project Assessment

### General Evaluation

The coinbase-mcp-server is a well-structured TypeScript project with strong type safety and comprehensive API coverage. However, error handling is minimal and primarily relies on letting exceptions propagate to the MCP framework. This approach is insufficient for:

1. **Financial Operations**: No safety nets for failed trades or partial order fills
2. **State Management**: Trading state can become corrupted without recovery
3. **Network Resilience**: No handling for temporary API outages
4. **User Experience**: Errors lack actionable information

### Maturity Level

**Level 2/5: Basic Validation**

- ✅ Input validation with Zod schemas
- ✅ Environment variable checks
- ✅ Type safety with TypeScript strict mode
- ❌ No runtime error recovery
- ❌ No retry mechanisms
- ❌ No circuit breakers
- ❌ No graceful degradation
- ❌ No state recovery

### Comparison to Industry Standards

**Financial Trading Systems (Expected: 4-5/5)**

Industry-standard crypto trading platforms implement:
- Request-level circuit breakers (Coinbase API has rate limits: 10 req/s public, 3-15 req/s private)
- Exponential backoff retry (typically 3-5 retries with jitter)
- Order status reconciliation (poll until FILLED/CANCELLED/REJECTED)
- Dead letter queue for failed operations
- State snapshots for recovery
- Monitoring with PagerDuty/similar

**This Project (Current: 2/5)**
- Zod validation for inputs
- HTTP-level error responses (JSON-RPC format)
- Some defensive null checks
- No retry, no circuit breakers, no state recovery

### Overall Rating

**2/5** - Below production standards

**Justification:**
- Strong foundation with TypeScript and Zod
- Critical gaps in error handling and resilience
- Acceptable for development/testing
- **NOT production-ready** for autonomous trading with real funds
- Requires significant hardening before live deployment

---

## Findings

### 1. Missing Error Handling in MCP Tool Wrapper

**Severity:** Critical

**Problem:**

The `call()` method in CoinbaseMcpServer.ts (lines 1026-1038) wraps all 46 MCP tool implementations but has **no try-catch block**:

```typescript
private call<I, R>(fn: (input: I) => Promise<R>) {
  return async (input: I) => {
    const response = await fn(input);  // ❌ No try-catch
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  };
}
```

**Impact:**
- Any error from Coinbase SDK (network failures, API errors, rate limits) propagates uncaught
- MCP framework receives raw errors instead of properly formatted responses
- No opportunity to log, retry, or provide user-friendly error messages
- Trading operations can fail silently without state updates

**Example Failure Scenarios:**
1. `create_order` fails due to insufficient funds → User sees generic error, order state unknown
2. `get_product_candles` times out → Trading algorithm crashes mid-analysis
3. Rate limit exceeded → All tools fail until cooldown, no backoff strategy

**Options:**

- **Option 1**: Add try-catch to `call()` wrapper with generic error handling
  - Pros: Single point of error handling, consistent error format
  - Cons: Generic handling may miss tool-specific error cases

- **Option 2**: Add try-catch to each service method individually
  - Pros: Tool-specific error handling and recovery
  - Cons: Repetitive code, easy to miss a method

- **Option 3**: Hybrid approach - wrapper catches all, services catch specific errors
  - Pros: Defense in depth, specific recovery where needed
  - Cons: More complex, potential for error masking

**Recommended Option:** Option 3 - Hybrid approach

The `call()` wrapper should catch all errors and return MCP-formatted error responses. Individual services should catch known error types (rate limits, insufficient funds, invalid orders) and provide specific handling. This provides:
1. Guaranteed error containment (no uncaught exceptions)
2. Specific recovery for known scenarios (e.g., retry on rate limit)
3. Meaningful error messages for users
4. Consistent MCP error format

Example implementation:
```typescript
private call<I, R>(fn: (input: I) => Promise<R>) {
  return async (input: I) => {
    try {
      const response = await fn(input);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    } catch (error) {
      // Log error with context
      console.error('Tool call failed:', {
        tool: fn.name,
        input,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return MCP error format
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: {
              code: 'TOOL_EXECUTION_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
              details: { tool: fn.name }
            }
          }, null, 2),
        }],
        isError: true,
      };
    }
  };
}
```

---

### 2. No Retry Logic for Transient Failures

**Severity:** High

**Problem:**

The project makes API calls to Coinbase without any retry mechanism. Network failures, temporary API outages, and rate limits cause immediate failures.

**Affected Areas:**
- All 46 MCP tools (accounts, orders, products, etc.)
- Trading skill data collection (market data, candles, sentiment)
- Order execution (create_order, cancel_orders, edit_order)

**Current Behavior:**
```typescript
// ProductsService.ts - no retry
public async getProductCandlesBatch({...}): Promise<...> {
  const candleResults = await Promise.all(
    productIds.map(async (productId) => ({
      productId,
      response: await this.getProductCandlesFixed({...}), // ❌ Fails on first error
    })),
  );
}
```

**Failure Scenarios:**
1. Temporary network glitch → Trading cycle aborted, missed opportunity
2. Coinbase API rate limit (10/s public, 3-15/s private) → All requests fail for 60s
3. API maintenance window → Server crashes instead of waiting
4. Partial failures in batch requests → Good data discarded with bad

**Options:**

- **Option 1**: Implement exponential backoff in each service method
  - Pros: Fine-grained control per operation
  - Cons: Code duplication, inconsistent retry strategies

- **Option 2**: Wrap Coinbase SDK client with retry interceptor
  - Pros: Centralized retry logic, applies to all calls
  - Cons: One-size-fits-all, may retry non-retryable errors

- **Option 3**: Use external retry library (p-retry, async-retry)
  - Pros: Battle-tested, configurable, minimal code
  - Cons: External dependency, need to integrate per-call

**Recommended Option:** Option 3 - External retry library

Use `p-retry` library with per-operation retry configuration. This provides:
1. Proven exponential backoff algorithm
2. Configurable max attempts per operation type
3. Jitter to avoid thundering herd
4. Abort on non-retryable errors (400 Bad Request)

**Implementation Strategy:**
```typescript
import pRetry from 'p-retry';

// In call() wrapper or service methods
const response = await pRetry(
  async () => {
    const result = await this.sdk.someMethod(params);

    // Abort retry for client errors (non-retryable)
    if (result.status === 400 || result.status === 401) {
      throw new pRetry.AbortError(result.error);
    }

    return result;
  },
  {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 10000,
    randomize: true, // Add jitter
    onFailedAttempt: (error) => {
      console.warn(`Retry ${error.attemptNumber} failed:`, error.message);
    }
  }
);
```

**Retry Categories:**
- Read operations (get_product, list_accounts): 3 retries
- Write operations (create_order, cancel_orders): 2 retries (idempotent only)
- Critical operations (create_order with unique clientOrderId): 1 retry + manual reconciliation

---

### 3. No Circuit Breaker Pattern

**Severity:** High

**Problem:**

The system has no protection against cascading failures when the Coinbase API is degraded or down. Continuous retry attempts can:
1. Exhaust rate limits faster
2. Delay error detection (user waits for multiple retry cycles)
3. Waste resources on known-failing endpoints
4. Prevent graceful degradation to cached data

**Current Behavior:**
Every tool call attempts to contact Coinbase API regardless of recent failure history. If Coinbase API is down:
- Each of 46 tools times out independently
- Trading skill attempts to fetch market data, fails, retries, fails again
- No shared knowledge between calls about API health

**Failure Scenario:**
```
15:00:00 - Trading cycle starts
15:00:01 - list_accounts call → timeout (30s)
15:00:31 - get_product_candles (BTC) → timeout (30s)
15:01:01 - get_product_candles (ETH) → timeout (30s)
15:01:31 - get_best_bid_ask → timeout (30s)
...
15:10:00 - Cycle aborted after 10 minutes of timeouts
```

With circuit breaker:
```
15:00:00 - Trading cycle starts
15:00:01 - list_accounts call → timeout (30s)
15:00:31 - Circuit opens (failure threshold reached)
15:00:31 - All subsequent calls → immediate fail-fast
15:00:32 - Report "Coinbase API unavailable" and skip cycle
15:05:32 - Circuit half-open, single probe request
15:05:33 - Probe succeeds → circuit closed, resume normal operation
```

**Options:**

- **Option 1**: Implement simple in-memory circuit breaker per endpoint
  - Pros: Lightweight, no external dependencies
  - Cons: Lost on server restart, per-process only

- **Option 2**: Use external circuit breaker library (opossum, cockatiel)
  - Pros: Battle-tested, configurable, metrics included
  - Cons: External dependency, learning curve

- **Option 3**: Implement shared circuit breaker with Redis/similar
  - Pros: Multi-instance coordination, persistent state
  - Cons: Complex, requires infrastructure

**Recommended Option:** Option 2 - External circuit breaker library (opossum)

Use `opossum` library for circuit breaker with Prometheus metrics. This provides:
1. Automatic failure detection and fast-fail behavior
2. Half-open state for probe attempts
3. Built-in metrics for monitoring
4. Event emitters for alerting

**Implementation:**
```typescript
import CircuitBreaker from 'opossum';

class CoinbaseMcpServer {
  private circuitBreaker: CircuitBreaker;

  constructor(...) {
    // Wrap Coinbase client with circuit breaker
    this.circuitBreaker = new CircuitBreaker(
      async (fn: Function, ...args: any[]) => fn(...args),
      {
        timeout: 30000,        // 30s timeout
        errorThresholdPercentage: 50, // Open at 50% error rate
        resetTimeout: 30000,   // Try again after 30s
        rollingCountTimeout: 60000,   // 60s window
        rollingCountBuckets: 10,      // 6s buckets
        name: 'coinbase-api',
      }
    );

    this.circuitBreaker.on('open', () => {
      console.error('Circuit breaker OPEN: Coinbase API degraded');
      // Send alert
    });

    this.circuitBreaker.on('halfOpen', () => {
      console.warn('Circuit breaker HALF-OPEN: Probing API health');
    });

    this.circuitBreaker.on('close', () => {
      console.info('Circuit breaker CLOSED: API recovered');
    });
  }

  private call<I, R>(fn: (input: I) => Promise<R>) {
    return async (input: I) => {
      try {
        const response = await this.circuitBreaker.fire(fn, input);
        return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
      } catch (error) {
        if (this.circuitBreaker.opened) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'Service temporarily unavailable. API circuit breaker is open.'
              }, null, 2)
            }],
            isError: true
          };
        }
        // Handle other errors...
      }
    };
  }
}
```

---

### 4. No Timeout Configuration

**Severity:** Medium

**Problem:**

API calls have no explicit timeouts. The SDK and HTTP client may have default timeouts, but these are:
1. Not visible in the code
2. Not configurable per-operation
3. Potentially too long for time-sensitive trading operations

**Impact:**
- Long-running requests can block trading cycles
- No differentiation between fast operations (get_best_bid_ask) and slow ones (list_orders with large history)
- Zombie requests can accumulate under load

**Example:**
Trading skill documentation specifies "interval=15m" for trading cycles. If a market data request hangs for 10 minutes:
- 66% of cycle time wasted on single request
- Technical analysis incomplete
- Entry opportunity missed

**Options:**

- **Option 1**: Set global timeout in SDK client configuration
  - Pros: Simple, single configuration point
  - Cons: One-size-fits-all, fast operations penalized

- **Option 2**: Set per-operation timeouts using Promise.race()
  - Pros: Fine-grained control, operation-specific limits
  - Cons: Repetitive code, easy to forget

- **Option 3**: Combine SDK-level default + per-operation overrides
  - Pros: Sensible defaults with flexibility
  - Cons: Need to maintain timeout configuration

**Recommended Option:** Option 3 - Default timeout + operation overrides

Set SDK-level default timeout of 30s, then override for specific operations:
- Fast reads (get_best_bid_ask, get_server_time): 5s
- Standard reads (get_product, list_accounts): 15s
- Slow reads (list_orders, get_product_candles): 30s
- Writes (create_order, cancel_orders): 45s

**Implementation:**
```typescript
// Configuration
const TIMEOUTS = {
  FAST_READ: 5000,
  STANDARD_READ: 15000,
  SLOW_READ: 30000,
  WRITE: 45000,
};

// Per-operation wrapper
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  return Promise.race([promise, timeout]);
}

// Usage in services
public async getBestBidAsk(request: ...): Promise<...> {
  return withTimeout(
    this.sdk.getBestBidAsk(request),
    TIMEOUTS.FAST_READ,
    'getBestBidAsk'
  );
}
```

---

### 5. Missing Error Context and Logging

**Severity:** Medium

**Problem:**

Error messages lack contextual information needed for debugging and alerting:

1. **No request IDs**: Cannot correlate errors with specific API calls
2. **No timestamps**: Unclear when errors occurred (especially in async operations)
3. **No input sanitization**: Errors may log sensitive data (API keys, order details)
4. **No structured logging**: Plain console.log makes searching difficult
5. **No error categorization**: Cannot distinguish network errors from business logic errors

**Current State:**
```typescript
// CoinbaseMcpServer.ts:81
console.error('Error handling MCP request:', error);
```

This provides minimal debugging information:
- No tool name
- No input parameters (even sanitized)
- No error type classification
- No correlation ID
- Not searchable in log aggregators

**Impact on Trading Skill:**
When autonomous trading fails, operators cannot answer:
- Which trading pair failed?
- Was it a data fetch or order execution?
- Was it a transient network error or invalid order?
- Can the operation be retried safely?

**Options:**

- **Option 1**: Add console.log with more context
  - Pros: No dependencies, quick to implement
  - Cons: Unstructured, hard to search, no log levels

- **Option 2**: Use structured logging library (winston, pino)
  - Pros: Structured JSON logs, log levels, transports
  - Cons: External dependency, migration effort

- **Option 3**: Implement custom error classes with context
  - Pros: Type-safe error handling, clear error hierarchy
  - Cons: Verbose, requires discipline to use

**Recommended Option:** Option 2 + Option 3 - Structured logging + custom errors

Use `pino` for structured logging (fast, JSON output) and define custom error classes for common scenarios.

**Implementation:**

```typescript
// errors.ts
export class CoinbaseAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CoinbaseAPIError';
  }
}

export class OrderExecutionError extends CoinbaseAPIError {
  constructor(
    message: string,
    public readonly orderId: string,
    public readonly productId: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'ORDER_EXECUTION_FAILED', undefined, {
      orderId,
      productId,
      ...context
    });
    this.name = 'OrderExecutionError';
  }
}

// logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ['apiKey', 'privateKey', '*.apiKey', '*.privateKey'],
    censor: '[REDACTED]'
  },
  serializers: {
    error: pino.stdSerializers.err,
  },
});

// Usage in call() wrapper
private call<I, R>(fn: (input: I) => Promise<R>) {
  return async (input: I) => {
    const requestId = crypto.randomUUID();

    try {
      logger.info({
        requestId,
        tool: fn.name,
        input
      }, 'Tool call started');

      const response = await fn(input);

      logger.info({
        requestId,
        tool: fn.name
      }, 'Tool call succeeded');

      return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
    } catch (error) {
      logger.error({
        requestId,
        tool: fn.name,
        input,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          code: (error as any).code,
          stack: error.stack,
        } : String(error)
      }, 'Tool call failed');

      // Return MCP error...
    }
  };
}
```

**Benefits:**
- Correlation across distributed logs via requestId
- Searchable structured logs in JSON format
- Automatic PII redaction
- Log level filtering (debug in dev, error in prod)
- Integration with log aggregators (ELK, Datadog, etc.)

---

### 6. No Input Validation Error Handling

**Severity:** Medium

**Problem:**

While Zod schemas validate all MCP tool inputs, the validation errors are not handled gracefully. The MCP SDK throws validation errors, but:

1. Error messages may expose internal schema details
2. No user-friendly error formatting
3. No input sanitization in error logs
4. No differentiation between schema errors and runtime errors

**Current Behavior:**

When a user calls a tool with invalid input, Zod throws an error like:
```json
{
  "issues": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["productId"],
      "message": "Expected string, received number"
    }
  ]
}
```

This raw error propagates to the user, which:
- Exposes schema internals
- Not user-friendly for non-developers
- Difficult to parse for automated error handling

**Example:**
```typescript
// User calls create_order with invalid side enum
{
  "productId": "BTC-USD",
  "side": "INVALID_SIDE",  // ❌ Not in OrderSide enum
  "orderConfiguration": {...}
}

// Error message:
"Invalid enum value. Expected 'BUY' | 'SELL', received 'INVALID_SIDE'"
```

**Options:**

- **Option 1**: Catch Zod errors and format as user-friendly messages
  - Pros: Better UX, hides schema details
  - Cons: Requires mapping Zod error codes to messages

- **Option 2**: Let Zod errors propagate with minimal formatting
  - Pros: Simple, developer-friendly
  - Cons: Poor UX, schema details exposed

- **Option 3**: Hybrid - sanitize and format while preserving details
  - Pros: Developer-friendly details + user-friendly summary
  - Cons: More code to maintain

**Recommended Option:** Option 3 - Hybrid approach

Format Zod validation errors with:
1. User-friendly summary message
2. Field-level error details
3. Suggested fixes where applicable
4. Example valid inputs

**Implementation:**

```typescript
import { ZodError } from 'zod';

function formatValidationError(error: ZodError): string {
  const fieldErrors = error.issues.map(issue => {
    const field = issue.path.join('.');
    const message = issue.message;

    // Add suggestions based on error code
    let suggestion = '';
    if (issue.code === 'invalid_enum_value') {
      suggestion = ` Valid values: ${issue.options?.join(', ')}`;
    }

    return `  - ${field}: ${message}${suggestion}`;
  }).join('\n');

  return `Invalid input:\n${fieldErrors}\n\nPlease check the API documentation for correct parameter formats.`;
}

// In call() wrapper
private call<I, R>(fn: (input: I) => Promise<R>) {
  return async (input: I) => {
    try {
      const response = await fn(input);
      return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ error, input }, 'Validation error');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message: formatValidationError(error)
              }
            }, null, 2),
          }],
          isError: true,
        };
      }

      // Handle other errors...
    }
  };
}
```

---

### 7. Trading State Corruption Risk

**Severity:** High

**Problem:**

The autonomous trading skill (.claude/skills/coinbase-trading/SKILL.md) manages critical state in `.claude/trading-state.json`, including:
- Open positions (entry price, size, stop-loss/take-profit levels)
- Session budget and P&L
- Compound and rebalancing state

The state-schema.md file documents extensive validation rules:
- Division by zero protection (lines 399-417)
- Budget consistency validation (lines 380-395)
- Performance validation (lines 316-325)
- Session resume timestamp validation (lines 329-354)

**However, these validations are DOCUMENTED but NOT IMPLEMENTED in code.**

**Failure Scenarios:**

1. **Division by Zero:**
```json
// State file after bad data
{
  "openPositions": [{
    "entry": {
      "price": 0  // ❌ Invalid, would cause division by zero
    },
    "riskManagement": {
      "entryATR": 0  // ❌ Invalid ATR
    }
  }]
}

// Code in SKILL.md (line 377):
IF entry_price <= 0:
  → Log: "Invalid entry_price: {entry_price}, using stored values"

// Reality: No validation in actual code, crashes on:
unrealizedPnLPercent = (current - entry) / entry × 100  // ❌ Infinity
```

2. **Budget Inconsistency:**
```json
// Manual edit or crash during update
{
  "session": {
    "budget": {
      "initial": 10.0,
      "remaining": 15.0  // ❌ More than initial?
    },
    "stats": {
      "realizedPnL": -2.0,
      "totalFeesPaid": 0.5
    }
  }
}

// Expected validation (state-schema.md line 383):
calculated_remaining = 10.0 + (-2.0) - 0.5 = 7.5
difference = |7.5 - 15.0| = 7.5 > 0.01  // ❌ Inconsistent!

// Reality: No validation, agent continues with wrong budget
```

3. **Peak PnL Inconsistency:**
```json
{
  "performance": {
    "unrealizedPnLPercent": 5.0,
    "peakPnLPercent": 2.0  // ❌ Peak < current?
  }
}

// Expected validation (state-schema.md line 319):
IF peakPnLPercent < unrealizedPnLPercent:
  peakPnLPercent = unrealizedPnLPercent  // Auto-correct

// Reality: No validation, incorrect trailing stop calculations
```

**Impact:**
- Invalid state causes crashes mid-trading cycle
- Budget tracking becomes unreliable, risk of over-trading
- Stop-loss/take-profit calculations use invalid data
- No recovery mechanism, requires manual state file editing

**Options:**

- **Option 1**: Validate state on every read/write
  - Pros: Catches corruption immediately
  - Cons: Performance overhead, may crash frequently

- **Option 2**: Validate state on session start only
  - Pros: Minimal overhead, one-time check
  - Cons: Corruption during session not detected

- **Option 3**: Validate + auto-correct where safe
  - Pros: Resilient, self-healing
  - Cons: Silent corrections may mask bugs

**Recommended Option:** Option 3 - Validate on read/write + auto-correct

Implement all validations from state-schema.md with:
1. Strict validation on session load (reject if critical fields invalid)
2. Auto-correction for derived fields (peak PnL, trailing stop)
3. Logged warnings for inconsistencies
4. Automatic state snapshot before writes

**Implementation Priority:**

```typescript
// trading-state-validator.ts
class TradingStateValidator {
  validateAndCorrect(state: TradingState): TradingState {
    // Critical validations (throw if failed)
    this.validateBudgetConsistency(state);
    this.validatePositionEntryPrices(state);

    // Auto-corrections (log warning)
    this.correctPerformanceMetrics(state);
    this.correctTimestamps(state);

    return state;
  }

  private validateBudgetConsistency(state: TradingState): void {
    const calculated = state.session.budget.initial
      + state.session.stats.realizedPnL
      - state.session.stats.totalFeesPaid
      - this.sumOpenPositionCost(state.openPositions);

    const difference = Math.abs(calculated - state.session.budget.remaining);

    if (difference > 0.01) {
      logger.error({
        calculated,
        actual: state.session.budget.remaining,
        difference
      }, 'Budget inconsistency detected');

      throw new Error(
        `Budget mismatch: expected ${calculated.toFixed(2)}€, found ${state.session.budget.remaining.toFixed(2)}€`
      );
    }
  }

  private validatePositionEntryPrices(state: TradingState): void {
    for (const position of state.openPositions) {
      if (position.entry.price <= 0) {
        throw new Error(
          `Invalid entry price for ${position.pair}: ${position.entry.price}`
        );
      }

      if (position.riskManagement.entryATR <= 0) {
        logger.warn({
          pair: position.pair,
          atr: position.riskManagement.entryATR
        }, 'Invalid ATR, using fallback values');

        // Fallback to percentage-based SL/TP
        position.riskManagement.dynamicSL = position.entry.price * 0.95;
        position.riskManagement.dynamicTP = position.entry.price * 1.03;
      }
    }
  }

  private correctPerformanceMetrics(state: TradingState): void {
    for (const position of state.openPositions) {
      if (position.performance.peakPnLPercent < position.performance.unrealizedPnLPercent) {
        logger.warn({
          pair: position.pair,
          peak: position.performance.peakPnLPercent,
          current: position.performance.unrealizedPnLPercent
        }, 'Peak PnL inconsistency, correcting');

        position.performance.peakPnLPercent = position.performance.unrealizedPnLPercent;
      }
    }
  }
}
```

---

### 8. No Network Failure Handling

**Severity:** Medium

**Problem:**

The project does not differentiate between network failures and API errors. All errors are treated equally, but network issues should trigger:
1. Retry with exponential backoff (covered in Finding #2)
2. Circuit breaker (covered in Finding #3)
3. Graceful degradation (use cached data, skip optional operations)

**Current Behavior:**

```typescript
// Any network error crashes the operation
const products = await this.products.getProduct({ productId: 'BTC-USD' });
// Network timeout → uncaught error → tool fails
```

**Failure Scenarios:**

1. **DNS resolution failure**: Coinbase API hostname temporarily unresolvable
2. **Connection timeout**: Network congestion or firewall rules
3. **TLS handshake failure**: Certificate issues or MITM protection
4. **Socket hangup**: Connection dropped mid-request

All of these are transient and should be retried, but current code treats them as permanent failures.

**Options:**

- **Option 1**: Detect network errors by error type and retry
  - Pros: Simple, handles most cases
  - Cons: Error type detection is fragile (different HTTP clients = different error types)

- **Option 2**: Classify all errors as retryable/non-retryable by HTTP status code
  - Pros: Standard HTTP semantics
  - Cons: Network errors may not have status codes

- **Option 3**: Combine error type + status code classification
  - Pros: Comprehensive coverage
  - Cons: Complex logic

**Recommended Option:** Option 3 - Hybrid classification

```typescript
// error-classifier.ts
export enum ErrorCategory {
  RETRYABLE_NETWORK = 'RETRYABLE_NETWORK',
  RETRYABLE_SERVER = 'RETRYABLE_SERVER',
  NON_RETRYABLE_CLIENT = 'NON_RETRYABLE_CLIENT',
  NON_RETRYABLE_AUTH = 'NON_RETRYABLE_AUTH',
  UNKNOWN = 'UNKNOWN',
}

export function classifyError(error: Error): ErrorCategory {
  // Network errors (retryable)
  if (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('EAI_AGAIN')
  ) {
    return ErrorCategory.RETRYABLE_NETWORK;
  }

  // Check HTTP status code
  const statusCode = (error as any).statusCode || (error as any).response?.status;

  if (statusCode) {
    // 5xx = server error (retryable)
    if (statusCode >= 500) {
      return ErrorCategory.RETRYABLE_SERVER;
    }

    // 429 = rate limit (retryable with backoff)
    if (statusCode === 429) {
      return ErrorCategory.RETRYABLE_SERVER;
    }

    // 401, 403 = auth error (non-retryable)
    if (statusCode === 401 || statusCode === 403) {
      return ErrorCategory.NON_RETRYABLE_AUTH;
    }

    // 4xx = client error (non-retryable)
    if (statusCode >= 400 && statusCode < 500) {
      return ErrorCategory.NON_RETRYABLE_CLIENT;
    }
  }

  return ErrorCategory.UNKNOWN;
}

// Usage in retry logic
import pRetry from 'p-retry';

const response = await pRetry(
  async () => this.sdk.someMethod(params),
  {
    retries: 3,
    onFailedAttempt: (error) => {
      const category = classifyError(error);

      // Abort retry for non-retryable errors
      if (
        category === ErrorCategory.NON_RETRYABLE_CLIENT ||
        category === ErrorCategory.NON_RETRYABLE_AUTH
      ) {
        throw new pRetry.AbortError(error);
      }

      logger.warn({ category, attempt: error.attemptNumber }, 'Retrying after error');
    }
  }
);
```

---

### 9. Missing Graceful Degradation

**Severity:** Medium

**Problem:**

When dependencies fail (Coinbase API, WebSearch for sentiment), the system has no fallback behavior. A production trading system should:

1. Use cached market data when API is unavailable
2. Skip sentiment analysis if WebSearch fails
3. Operate in degraded mode with reduced functionality
4. Alert users to degraded state

**Current Behavior:**

```typescript
// Trading skill workflow (SKILL.md line 176-200)
// Step 2: Collect Market Data
candles_15m = get_product_candles(pair, FIFTEEN_MINUTE, 100)
candles_1h = get_product_candles(pair, ONE_HOUR, 100)
candles_4h = get_product_candles(pair, FOUR_HOUR, 60)
candles_daily = get_product_candles(pair, ONE_DAY, 30)

// ❌ If any call fails → entire cycle aborted
// ❌ No fallback to cached data
// ❌ No option to skip optional analysis
```

**Failure Scenarios:**

1. **Sentiment API unavailable**: WebSearch timeout → technical analysis unused
2. **Partial market data**: 15m candles OK, 1h fails → discard all data
3. **Order book unavailable**: Liquidity check fails → skip valid trades
4. **Historical data gaps**: API returns incomplete candles → no indicator calculation

**Options:**

- **Option 1**: Fail fast on any dependency failure
  - Pros: Simple, safe (no trading with incomplete data)
  - Cons: Misses opportunities, overly conservative

- **Option 2**: Continue with partial data and warnings
  - Pros: Resilient, maximizes uptime
  - Cons: Risk of bad decisions with incomplete data

- **Option 3**: Tiered degradation based on data criticality
  - Pros: Balance safety and availability
  - Cons: Requires classifying data as critical/optional

**Recommended Option:** Option 3 - Tiered degradation

Classify data as:
- **Critical**: Current price, account balance, order status
- **Important**: 15m candles, order book (for entries)
- **Optional**: Multi-timeframe candles, sentiment, historical volume

**Implementation:**

```typescript
// trading-data-collector.ts
interface MarketData {
  critical: {
    currentPrice: number;
    accountBalance: number;
  };
  important: {
    candles15m: Candle[];
    orderBook: OrderBook;
  };
  optional: {
    candles1h?: Candle[];
    candles4h?: Candle[];
    candlesDaily?: Candle[];
    sentiment?: SentimentData;
  };
  degraded: boolean;
  missingData: string[];
}

async function collectMarketData(pair: string): Promise<MarketData> {
  const missingData: string[] = [];
  let degraded = false;

  // Critical data (fail if missing)
  const currentPrice = await this.getCurrentPrice(pair);
  const accountBalance = await this.getAccountBalance();

  // Important data (warn if missing)
  let candles15m: Candle[] = [];
  try {
    candles15m = await this.getCandles(pair, '15m', 100);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch 15m candles');
    throw new Error('Critical market data unavailable');
  }

  let orderBook: OrderBook | undefined;
  try {
    orderBook = await this.getOrderBook(pair);
  } catch (error) {
    logger.warn({ error }, 'Failed to fetch order book, will skip liquidity checks');
    missingData.push('orderBook');
    degraded = true;
  }

  // Optional data (continue without)
  let candles1h: Candle[] | undefined;
  try {
    candles1h = await this.getCandles(pair, '1h', 100);
  } catch (error) {
    logger.warn({ error }, 'Failed to fetch 1h candles, multi-timeframe analysis degraded');
    missingData.push('candles1h');
    degraded = true;
  }

  // Continue for other optional data...

  if (degraded) {
    logger.warn({
      pair,
      missingData
    }, 'Trading cycle running in degraded mode');
  }

  return {
    critical: { currentPrice, accountBalance },
    important: { candles15m, orderBook: orderBook! },
    optional: { candles1h /* ... */ },
    degraded,
    missingData
  };
}

// Adjust trading logic based on degradation
function calculateSignalStrength(data: MarketData): number {
  let score = 0;

  // Always use 15m candles
  score += analyzeCandles(data.important.candles15m);

  // Use multi-timeframe if available
  if (data.optional.candles1h && data.optional.candles4h) {
    score += multiTimeframeAlignment(
      data.important.candles15m,
      data.optional.candles1h,
      data.optional.candles4h
    );
  } else {
    logger.info('Multi-timeframe analysis skipped (degraded mode)');
  }

  // Use sentiment if available
  if (data.optional.sentiment) {
    score += sentimentModifier(data.optional.sentiment);
  } else {
    logger.info('Sentiment analysis skipped (degraded mode)');
  }

  return score;
}
```

**User Notification:**
```
═══════════════════════════════════════════════════════════════
                 TRADING REPORT (DEGRADED MODE)
═══════════════════════════════════════════════════════════════
⚠️  System running in degraded mode
Missing data: orderBook, candles1h, sentiment

Operating with:
  ✓ Current price data
  ✓ Account balance
  ✓ 15-minute candles (primary analysis)
  ✗ Multi-timeframe confirmation (unavailable)
  ✗ Sentiment analysis (skipped)
  ✗ Liquidity checks (skipped)

Recommendation: Review trades carefully, consider skipping cycle.
═══════════════════════════════════════════════════════════════
```

---

### 10. No Rate Limit Protection

**Severity:** Medium

**Problem:**

Coinbase Advanced Trade API has rate limits:
- **Public endpoints**: 10 requests/second
- **Private endpoints**: 3-15 requests/second (tier-based)

The project makes no attempt to:
1. Track request rates
2. Throttle requests to stay under limits
3. Handle 429 (Too Many Requests) responses
4. Implement token bucket or leaky bucket algorithm

**Current Behavior:**

```typescript
// ProductsService.getProductCandlesBatch
const candleResults = await Promise.all(
  productIds.map(async (productId) => ({
    productId,
    response: await this.getProductCandlesFixed({...}),
  })),
);
```

If user calls `get_product_candles_batch` with 10 products:
- 10 parallel requests sent immediately
- Exceeds rate limit of 10/s
- Some requests return 429
- No retry → partial data loss

**Trading Skill Impact:**

The trading skill fetches market data for multiple pairs and timeframes:
```
BTC-EUR: 15m, 1h, 4h, daily = 4 requests
ETH-EUR: 15m, 1h, 4h, daily = 4 requests
SOL-EUR: 15m, 1h, 4h, daily = 4 requests
Total: 12 requests in quick succession
```

At 10 req/s limit → 2+ requests fail → trading cycle aborted.

**Options:**

- **Option 1**: Sequential requests with delays
  - Pros: Simple, guaranteed under limit
  - Cons: Slow (12 requests = 1.2s minimum), no concurrency

- **Option 2**: Implement token bucket rate limiter
  - Pros: Efficient, allows bursts, self-regulating
  - Cons: Complex to implement correctly

- **Option 3**: Use external rate limiting library (bottleneck, p-limit)
  - Pros: Battle-tested, configurable
  - Cons: External dependency

**Recommended Option:** Option 3 - External rate limiter (bottleneck)

Use `bottleneck` library for token bucket rate limiting with separate limits for public/private endpoints.

**Implementation:**

```typescript
import Bottleneck from 'bottleneck';

class CoinbaseMcpServer {
  private publicLimiter: Bottleneck;
  private privateLimiter: Bottleneck;

  constructor(...) {
    // Public endpoints: 10 req/s
    this.publicLimiter = new Bottleneck({
      reservoir: 10,           // Initial tokens
      reservoirRefreshAmount: 10,  // Refill amount
      reservoirRefreshInterval: 1000, // Refill every 1s
      maxConcurrent: 5,        // Max parallel requests
      minTime: 100,            // Min 100ms between requests
    });

    // Private endpoints: 3 req/s (conservative, tier-dependent)
    this.privateLimiter = new Bottleneck({
      reservoir: 3,
      reservoirRefreshAmount: 3,
      reservoirRefreshInterval: 1000,
      maxConcurrent: 2,
      minTime: 333,            // ~3 req/s
    });

    // Listen for rate limit events
    this.privateLimiter.on('failed', async (error, jobInfo) => {
      const statusCode = (error as any).statusCode;

      if (statusCode === 429) {
        logger.warn({ jobInfo }, 'Rate limit hit, retrying after delay');
        // Return retry delay (ms) or null to abort
        return 5000; // Wait 5s before retry
      }
    });
  }

  // Wrap service calls with rate limiter
  async getProductCandlesRateLimited(request: GetProductCandlesRequest) {
    return this.publicLimiter.schedule(() =>
      this.products.getProductCandlesFixed(request)
    );
  }

  async createOrderRateLimited(request: CreateOrderRequest) {
    return this.privateLimiter.schedule(() =>
      this.orders.createOrder(request)
    );
  }
}

// Usage in getProductCandlesBatch
public async getProductCandlesBatch({...}): Promise<...> {
  // Requests are now rate-limited automatically
  const candleResults = await Promise.all(
    productIds.map(async (productId) => ({
      productId,
      response: await this.getProductCandlesRateLimited({
        productId,
        start,
        end,
        granularity,
      }),
    })),
  );

  // Note: Promise.all still fires all requests,
  // but Bottleneck queues them to respect rate limits
}
```

**Monitoring:**
```typescript
// Add metrics
this.publicLimiter.on('queued', () => {
  metrics.increment('api.rate_limiter.queued', { endpoint: 'public' });
});

this.publicLimiter.on('depleted', () => {
  logger.warn('Public API rate limit depleted, requests queuing');
  metrics.increment('api.rate_limiter.depleted', { endpoint: 'public' });
});
```

---

### 11. No API Error Code Handling

**Severity:** Medium

**Problem:**

The Coinbase API returns specific error codes for different failure scenarios:
- `INSUFFICIENT_FUNDS`: Not enough balance to place order
- `INVALID_ORDER_SIZE`: Order below minimum or above maximum
- `PRODUCT_NOT_FOUND`: Trading pair doesn't exist
- `ORDER_NOT_FOUND`: Order ID invalid or already closed
- `RATE_LIMIT_EXCEEDED`: Too many requests (429)

The project treats all errors equally, missing opportunities for:
1. **Specific error recovery**: Retry on rate limit, reject on insufficient funds
2. **User-friendly messages**: "Insufficient balance" instead of "API error"
3. **Automatic corrections**: Adjust order size if below minimum

**Current Behavior:**

```typescript
// All errors propagate as generic failures
await this.orders.createOrder({...});
// ❌ Insufficient funds → generic error
// ❌ Order size too small → generic error
// ❌ No guidance on how to fix
```

**Trading Skill Impact:**

When autonomous trading encounters errors:
- Insufficient funds → should SKIP trade, not crash
- Invalid order size → should adjust to minimum, not fail
- Product not found → should remove from watchlist
- Order already filled → should update state, not retry

**Options:**

- **Option 1**: Parse error messages with regex
  - Pros: No schema dependency
  - Cons: Fragile, breaks when API changes messages

- **Option 2**: Check error codes if SDK exposes them
  - Pros: Stable, intended interface
  - Cons: SDK may not expose structured errors

- **Option 3**: Maintain error code mapping based on API docs
  - Pros: Comprehensive, documented
  - Cons: Requires maintenance when API changes

**Recommended Option:** Option 2 + Option 3 - SDK errors + fallback mapping

Check SDK for structured error codes, fall back to message parsing if unavailable.

**Implementation:**

```typescript
// coinbase-errors.ts
export enum CoinbaseErrorCode {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_ORDER_SIZE = 'INVALID_ORDER_SIZE',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  UNKNOWN = 'UNKNOWN',
}

export function parseCoinbaseError(error: Error): {
  code: CoinbaseErrorCode;
  message: string;
  isRetryable: boolean;
  userMessage: string;
} {
  // Check if SDK provides error code
  const apiError = error as any;

  if (apiError.code) {
    // Use SDK error code
    const code = Object.values(CoinbaseErrorCode).includes(apiError.code)
      ? apiError.code
      : CoinbaseErrorCode.UNKNOWN;

    return {
      code,
      message: error.message,
      isRetryable: code === CoinbaseErrorCode.RATE_LIMIT_EXCEEDED,
      userMessage: getUserMessage(code, error.message),
    };
  }

  // Fallback: Parse error message
  const message = error.message.toLowerCase();

  if (message.includes('insufficient') && message.includes('funds')) {
    return {
      code: CoinbaseErrorCode.INSUFFICIENT_FUNDS,
      message: error.message,
      isRetryable: false,
      userMessage: 'Insufficient funds to place order. Please check account balance.',
    };
  }

  if (message.includes('order') && message.includes('size')) {
    return {
      code: CoinbaseErrorCode.INVALID_ORDER_SIZE,
      message: error.message,
      isRetryable: false,
      userMessage: 'Order size invalid. Check minimum/maximum order sizes for this product.',
    };
  }

  // Continue for other error codes...

  return {
    code: CoinbaseErrorCode.UNKNOWN,
    message: error.message,
    isRetryable: false,
    userMessage: `Trading error: ${error.message}`,
  };
}

function getUserMessage(code: CoinbaseErrorCode, originalMessage: string): string {
  const messages: Record<CoinbaseErrorCode, string> = {
    [CoinbaseErrorCode.INSUFFICIENT_FUNDS]:
      'Insufficient funds. Cannot place order.',
    [CoinbaseErrorCode.INVALID_ORDER_SIZE]:
      'Order size invalid. Check product minimum/maximum.',
    [CoinbaseErrorCode.PRODUCT_NOT_FOUND]:
      'Trading pair not found. Check product ID.',
    [CoinbaseErrorCode.ORDER_NOT_FOUND]:
      'Order not found. It may have been filled or cancelled.',
    [CoinbaseErrorCode.RATE_LIMIT_EXCEEDED]:
      'Rate limit exceeded. Please wait before retrying.',
    [CoinbaseErrorCode.UNAUTHORIZED]:
      'Authentication failed. Check API credentials.',
    [CoinbaseErrorCode.FORBIDDEN]:
      'Access forbidden. Check API key permissions.',
    [CoinbaseErrorCode.UNKNOWN]:
      originalMessage,
  };

  return messages[code];
}

// Usage in order execution
async function executeOrder(order: CreateOrderRequest): Promise<void> {
  try {
    const result = await this.orders.createOrder(order);
    logger.info({ orderId: result.orderId }, 'Order created successfully');
  } catch (error) {
    const parsed = parseCoinbaseError(error as Error);

    logger.error({
      code: parsed.code,
      message: parsed.message,
      order
    }, 'Order creation failed');

    // Handle specific errors
    switch (parsed.code) {
      case CoinbaseErrorCode.INSUFFICIENT_FUNDS:
        // Update budget state, skip trade
        await this.handleInsufficientFunds(order);
        break;

      case CoinbaseErrorCode.INVALID_ORDER_SIZE:
        // Try to adjust order size
        await this.retryWithAdjustedSize(order);
        break;

      case CoinbaseErrorCode.RATE_LIMIT_EXCEEDED:
        // Should be handled by rate limiter, but log if it happens
        throw new pRetry.AbortError(error);

      default:
        // Unknown error, propagate
        throw error;
    }
  }
}

async function handleInsufficientFunds(order: CreateOrderRequest): Promise<void> {
  logger.warn({
    productId: order.productId,
    requestedSize: order.orderConfiguration
  }, 'Insufficient funds, skipping trade');

  // Update session state
  // Report to user
}

async function retryWithAdjustedSize(order: CreateOrderRequest): Promise<void> {
  // Get product info for minimum order size
  const product = await this.products.getProduct({ productId: order.productId });
  const minSize = parseFloat(product.baseMinSize || '0');

  // Adjust order size
  const currentSize = parseFloat(
    order.orderConfiguration.marketMarketIoc?.baseSize ||
    order.orderConfiguration.limitLimitGtc?.baseSize ||
    '0'
  );

  if (currentSize < minSize) {
    logger.info({
      productId: order.productId,
      currentSize,
      minSize
    }, 'Adjusting order size to minimum');

    // Update order configuration with minimum size
    // Retry order
  }
}
```

---

### 12. No Order Reconciliation

**Severity:** High

**Problem:**

Order execution is fire-and-forget. After calling `create_order`, the system:
1. Does not poll for final order status
2. Assumes order succeeded if API call succeeded
3. Risks state desync if order fills partially or fails asynchronously

**Current Behavior (Trading Skill):**

```typescript
// SKILL.md lines 912-960
// For BUY (Limit Order):
1. Call preview_order
2. Call create_order
3. Wait 120 seconds
4. Call get_order to check status
5. If OPEN → fallback to market order OR cancel

// For BUY (Market Order):
1. Call preview_order
2. Call create_order
3. Record position  // ❌ Assumes order filled
4. Save state

// ❌ No verification that market order actually filled
// ❌ Partial fills not handled for market orders
// ❌ Order rejection not detected
```

**Failure Scenarios:**

1. **Market Order Rejected:**
```
create_order(BTC-EUR, Market, 0.001 BTC)
→ API returns: { success: true, orderId: "abc123" }
→ Agent records position in state
→ Reality: Order rejected due to price movement, 0 BTC purchased
→ State says: "Position open with 0.001 BTC"
→ Agent tries to manage non-existent position
```

2. **Partial Fill:**
```
create_order(ALT-EUR, Market, 100 EUR)
→ API returns: { success: true, orderId: "abc123" }
→ Agent records: "Purchased 100 EUR worth"
→ Reality: Only 70 EUR filled, 30 EUR cancelled (low liquidity)
→ State is 30% incorrect
```

3. **Order Status Unknown:**
```
create_order(...) → Network timeout during response
→ Order may or may not have been placed
→ Agent doesn't know if position exists
→ Risk: Duplicate order if retried
```

**Options:**

- **Option 1**: Poll order status until terminal state (FILLED/CANCELLED/REJECTED)
  - Pros: Accurate, detects all edge cases
  - Cons: Slower, uses API quota

- **Option 2**: Assume success for market orders, poll for limit orders only
  - Pros: Faster for market orders
  - Cons: Risky, market orders can still fail

- **Option 3**: Poll with timeout, accept "unknown" state if timeout
  - Pros: Balance speed and accuracy
  - Cons: Still has unknown state edge case

**Recommended Option:** Option 1 - Always poll until terminal state

For financial operations, accuracy > speed. Always verify order status.

**Implementation:**

```typescript
// order-executor.ts
export enum OrderStatus {
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  UNKNOWN = 'UNKNOWN',
  QUEUED = 'QUEUED',
  CANCEL_QUEUED = 'CANCEL_QUEUED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
}

const TERMINAL_STATES = [
  OrderStatus.FILLED,
  OrderStatus.CANCELLED,
  OrderStatus.EXPIRED,
  OrderStatus.FAILED,
];

interface OrderReconciliationResult {
  status: OrderStatus;
  filledSize: string;
  filledValue: string;
  averagePrice: string;
  fees: string;
  isComplete: boolean;
  partialFillReason?: string;
}

async function createAndReconcileOrder(
  order: CreateOrderRequest
): Promise<OrderReconciliationResult> {
  // Step 1: Create order
  let orderId: string;
  try {
    const response = await this.orders.createOrder(order);
    orderId = response.orderId;

    logger.info({ orderId, order }, 'Order created, polling for status');
  } catch (error) {
    logger.error({ error, order }, 'Order creation failed');
    throw error;
  }

  // Step 2: Poll for terminal status
  const maxAttempts = 60;  // 60 attempts
  const pollInterval = 2000; // 2s interval = 120s max wait

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(pollInterval);

    try {
      const orderStatus = await this.orders.getOrder({ orderId });

      logger.debug({
        orderId,
        attempt,
        status: orderStatus.status,
        filledSize: orderStatus.filledSize,
      }, 'Order status poll');

      // Check if terminal state reached
      if (TERMINAL_STATES.includes(orderStatus.status)) {
        return this.parseOrderResult(orderStatus);
      }

      // Check for partial fill on last attempt
      if (attempt === maxAttempts && orderStatus.status === OrderStatus.PARTIALLY_FILLED) {
        logger.warn({
          orderId,
          filledSize: orderStatus.filledSize,
          totalSize: order.orderConfiguration.limitLimitGtc?.baseSize ||
                     order.orderConfiguration.marketMarketIoc?.baseSize,
        }, 'Order timed out with partial fill');

        // Cancel remaining
        await this.orders.cancelOrders({ orderIds: [orderId] });

        return this.parseOrderResult(orderStatus);
      }

    } catch (error) {
      logger.warn({
        orderId,
        attempt,
        error
      }, 'Failed to fetch order status, retrying');

      // Continue polling even if status check fails
      // (transient network error shouldn't abort reconciliation)
    }
  }

  // Timeout: Order status still unknown
  logger.error({
    orderId,
    order,
    attempts: maxAttempts
  }, 'Order reconciliation timeout, status unknown');

  throw new Error(
    `Order reconciliation timeout for ${orderId}. Status unknown. Manual intervention required.`
  );
}

function parseOrderResult(orderStatus: any): OrderReconciliationResult {
  const filledSize = parseFloat(orderStatus.filledSize || '0');
  const totalSize = parseFloat(orderStatus.size || '0');
  const isComplete = filledSize === totalSize;

  let partialFillReason: string | undefined;
  if (!isComplete && filledSize > 0) {
    const fillPercentage = (filledSize / totalSize) * 100;
    partialFillReason = `Only ${fillPercentage.toFixed(1)}% filled. Likely due to low liquidity.`;
  }

  return {
    status: orderStatus.status,
    filledSize: orderStatus.filledSize,
    filledValue: orderStatus.filledValue,
    averagePrice: orderStatus.averageFilledPrice,
    fees: orderStatus.totalFees,
    isComplete,
    partialFillReason,
  };
}

// Usage in trading skill
async function executeEntry(signal: TradeSignal): Promise<void> {
  const order = this.buildOrderRequest(signal);

  try {
    const result = await this.createAndReconcileOrder(order);

    if (result.status === OrderStatus.FILLED) {
      // Full fill: Record position
      this.recordPosition({
        pair: order.productId,
        size: result.filledSize,
        entryPrice: result.averagePrice,
        fees: result.fees,
      });

      logger.info({
        pair: order.productId,
        size: result.filledSize,
        price: result.averagePrice,
      }, 'Position opened successfully');

    } else if (result.status === OrderStatus.PARTIALLY_FILLED) {
      // Partial fill: Record smaller position + warning
      this.recordPosition({
        pair: order.productId,
        size: result.filledSize,
        entryPrice: result.averagePrice,
        fees: result.fees,
      });

      logger.warn({
        pair: order.productId,
        expectedSize: order.orderConfiguration.marketMarketIoc?.baseSize,
        actualSize: result.filledSize,
        reason: result.partialFillReason,
      }, 'Position opened with partial fill');

    } else {
      // Cancelled/Failed: No position
      logger.error({
        pair: order.productId,
        status: result.status,
      }, 'Order failed, no position created');

      // Do not record position
    }

  } catch (error) {
    logger.error({ error, order }, 'Order execution failed');

    // Critical: State unknown, halt trading
    this.haltTrading('Order reconciliation failed. Manual review required.');
  }
}
```

**Benefits:**
- Accurate position tracking (no state desync)
- Handles partial fills correctly
- Detects order rejections
- Provides clear failure reasons
- Enables safe retry logic (no duplicate orders)

---

### 13. No Dead Letter Queue

**Severity:** Low

**Problem:**

When critical operations fail (order execution, state updates), there's no mechanism to:
1. Queue failed operations for manual review
2. Replay failed operations after fixing underlying issues
3. Analyze failure patterns
4. Ensure no data loss

**Impact:**

- Failed trades lost forever (no audit trail)
- State corruption not recoverable
- Failure patterns not visible
- Compliance issues (no record of attempted trades)

**Options:**

- **Option 1**: Log failed operations to file
  - Pros: Simple, no infrastructure
  - Cons: Manual review, no replay mechanism

- **Option 2**: Use message queue (RabbitMQ, SQS)
  - Pros: Battle-tested, automatic retry
  - Cons: Complex infrastructure, overkill for single-instance

- **Option 3**: Use database table for failed operations
  - Pros: Queryable, persistent, replayable
  - Cons: Requires database setup

**Recommended Option:** Option 1 for MVP, Option 3 for production

For current project: log to structured file. For production: SQLite or similar.

**Implementation:**

```typescript
// dead-letter-queue.ts
interface FailedOperation {
  timestamp: string;
  operation: string;
  input: unknown;
  error: string;
  stack?: string;
  retryable: boolean;
  retryCount: number;
}

class DeadLetterQueue {
  private logPath: string;

  constructor(logPath = '.claude/failed-operations.jsonl') {
    this.logPath = logPath;
  }

  async record(op: FailedOperation): Promise<void> {
    const line = JSON.stringify(op) + '\n';
    await fs.appendFile(this.logPath, line, 'utf-8');

    logger.error({
      operation: op.operation,
      retryable: op.retryable,
    }, 'Operation failed and logged to DLQ');
  }

  async getFailedOperations(): Promise<FailedOperation[]> {
    const content = await fs.readFile(this.logPath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  }

  async replay(operation: FailedOperation): Promise<void> {
    // Attempt to replay failed operation
    // If successful, remove from DLQ
  }
}

// Usage
const dlq = new DeadLetterQueue();

async function executeOrderSafely(order: CreateOrderRequest): Promise<void> {
  try {
    await this.executeOrder(order);
  } catch (error) {
    await dlq.record({
      timestamp: new Date().toISOString(),
      operation: 'create_order',
      input: order,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      retryable: parseCoinbaseError(error as Error).isRetryable,
      retryCount: 0,
    });

    throw error;
  }
}
```

---

## Conclusion

The coinbase-mcp-server has strong foundations (TypeScript, Zod validation, comprehensive API coverage) but lacks production-grade error handling and resilience. The most critical issues are:

1. **No error handling in tool wrapper** (Critical) - All errors propagate uncaught
2. **No retry logic** (High) - Transient failures cause permanent failures
3. **No circuit breakers** (High) - Cascading failures when API is down
4. **Trading state validation not implemented** (High) - Risk of fund loss

**Recommended Remediation Priority:**

1. Add try-catch to `call()` wrapper (1-2 hours)
2. Implement retry logic with p-retry (2-4 hours)
3. Add circuit breaker with opossum (2-4 hours)
4. Implement trading state validation (8-16 hours)
5. Add order reconciliation (4-8 hours)
6. Implement rate limiting (2-4 hours)
7. Add structured logging (2-4 hours)
8. Implement graceful degradation (4-8 hours)

**Total Estimated Effort:** 25-50 hours for production readiness.

The project is **NOT production-ready** for autonomous trading with real funds. It is suitable for:
- Development and testing
- Manual trading with human oversight
- Low-value experimentation

For production use with autonomous trading, all High and Critical severity findings must be addressed.
