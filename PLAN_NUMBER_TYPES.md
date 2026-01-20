# Plan: Standardization of Number Types (v9)

## Meta Information

This plan was created based on the following prompt:

> **Topic**: Standardization of number types.
>
> **Current State**: The MCP Server currently expects strings for many numbers (floating-point and integer values). This is due to historical reasons, as the Coinbase API works with strings in many places.
>
> **Goal**: All "our" types should use number instead of string for variables that contain numbers. This means we should no longer use the Coinbase SDK Services directly in CoinbaseMcpServer, but our own services that use the Coinbase SDK Services internally.

**Acceptance Criteria from the prompt:**
- All MCP Tool Schemas use z.number() instead of z.string() for numeric values.
- For each Coinbase SDK Service, there is a wrapper service that delegates each used method to the Coinbase SDK Service and changes string types to number where needed.
- Existing custom services no longer extend the Coinbase SDK Services but delegate instead.
- All quality criteria are met (100% coverage, lint, types, knip).
- There is only one commit for these changes.
- No tests were deleted, only adapted for new method signatures and mocks.
- Helper methods, indicator calculations, etc. use number consistently.
- **Every function and method MUST have an explicit return type.**
- **Request and Response types from the SDK must NOT be used directly. Each service gets an XService.types.ts file.**
- **Service mocks should mock our wrapper services, NOT the SDK services.**
- **Test assertions must NOT be reduced to property existence checks (toHaveProperty, toBeDefined). If actual values exist in assertions, they must be preserved unchanged.**

---

## Code Review History

### v1 → v2
- Pragmatic approach instead of over-engineering
- Simple conversion functions instead of complex mappers
- No response mapping (except for candles)

### v2 → v3
- CRITICAL: Removed incorrect reference to serviceMocks.ts file path in an earlier version of the plan
- MAJOR: Explicitly documented `mapApiCandlesToInput` in TechnicalAnalysisService.ts
- MAJOR: Explicitly listed import path changes when moving files
- MAJOR: Clarified naming for ProductsService/PublicService delegation
- MINOR: Replaced parseFloat with Number() for strict validation
- MINOR: Clarified placement of mapSdkCandleToInput (in numberConversion.ts)
- MINOR: Completed test file list
- MINOR: Documented wrapper test strategy

### v3 → v4
- MAJOR: Corrected service instantiation (wrappers receive `CoinbaseAdvTradeClient`, create SDK service internally)
- MAJOR: Documented complete ProductsService method list (10 methods)
- MAJOR: Documented complete PublicService method list (7 methods)
- MINOR: More detailed test coverage strategy for wrappers

### v4 → v5
- MAJOR: Explicit PublicService wrapper example with correct import path (`@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js` instead of `dist/index.js`)
- MINOR: Explicit documentation of `getProducts()` method change (from `getProductFixed()` to `getProduct()`)

### v5 → v6
- MAJOR: Added new acceptance criterion: Every function and method MUST have explicit return type
- MAJOR: Updated all code examples in the plan with explicit return types

### v6 → v7
- MAJOR: Translated entire plan to English
- MAJOR: Added new acceptance criterion: SDK types must not be used directly
- MAJOR: Added XService.types.ts pattern for type decoupling
- MAJOR: Updated mock strategy: mocks should mock our wrapper services, not SDK services
- MAJOR: Documented type mapping approach (SDK types → our types in .types.ts files)

### v7 → v8
- MAJOR: Added `src/test/serviceMocks.ts` to files to change with detailed update notes
- MAJOR: Removed non-existent `src/server/indicators/pivotPoints.spec.ts` from test file list
- MINOR: Clarified v2→v3 changelog note about serviceMocks.ts path issue
- MINOR: Updated file count to accurate number (26 new files)
- MINOR: Added note about `GetConvertTrade` method naming (capital G from SDK)
- MINOR: Added documentation for private helper methods (getOrderBooks, getProducts)

### v8 → v9
- MAJOR: Added new acceptance criterion: Test assertions must not be reduced to property existence checks; actual values must be preserved

---

## 1. Analysis of Current State

### 1.1 Directly Used Coinbase SDK Services

| SDK Service | Tool Registry | Numeric Request Parameters | Wrapper Needed? |
|-------------|---------------|------------------------------|----------------|
| `AccountsService` | `AccountToolRegistry` | None | Yes (acceptance criterion) |
| `OrdersService` | `OrderToolRegistry` | baseSize, quoteSize, limitPrice, stopPrice, etc. | **Yes** |
| `ConvertsService` | `ConvertToolRegistry` | amount | **Yes** |
| `FeesService` | `FeeToolRegistry` | None | Yes (acceptance criterion) |
| `PaymentMethodsService` | `PaymentToolRegistry` | None | Yes (acceptance criterion) |
| `PortfoliosService` | `PortfolioToolRegistry` | funds.value | **Yes** |
| `FuturesService` | `FuturesToolRegistry` | None | Yes (acceptance criterion) |
| `PerpetualsService` | `PerpetualsToolRegistry` | None | Yes (acceptance criterion) |
| `DataService` | `DataToolRegistry` | None | Yes (acceptance criterion) |

### 1.2 Existing Custom Services (must be refactored)

| Service | Current | Target |
|---------|---------|------|
| `ProductsService` | extends `BaseProductsService` | Delegation + number types |
| `PublicService` | extends `BasePublicService` | Delegation + number types |

### 1.3 String-based Number Fields in Tool Schemas

**OrderToolRegistry.ts** (27 fields):

In `orderConfigurationSchema`:
- `marketMarketIoc`: quoteSize, baseSize
- `limitLimitGtc`: baseSize, limitPrice
- `limitLimitGtd`: baseSize, limitPrice
- `limitLimitFok`: baseSize, limitPrice
- `sorLimitIoc`: baseSize, limitPrice
- `stopLimitStopLimitGtc`: baseSize, limitPrice, stopPrice
- `stopLimitStopLimitGtd`: baseSize, limitPrice, stopPrice
- `triggerBracketGtc`: baseSize, limitPrice, stopTriggerPrice
- `triggerBracketGtd`: baseSize, limitPrice, stopTriggerPrice

In separate tools:
- `edit_order`: price, size
- `preview_edit_order`: price, size
- `close_position`: size

**ConvertToolRegistry.ts** (1 field):
- `amount`

**PortfolioToolRegistry.ts** (1 field):
- `funds.value`

**IndicatorToolRegistry.ts** (9 fields, used in ~15 places):
- `candleSchema`: `open`, `high`, `low`, `close`, `volume` (used in all candle-based tools)
- `pivotPoints`: `high`, `low`, `close`, `open`

### 1.4 Internal Interfaces with strings

- `CandleInput` in `TechnicalIndicatorsService.ts` (line 91-97)
- `CalculatePivotPointsInput` in `TechnicalIndicatorsService.ts` (line 560-566)
- `mapApiCandlesToInput()` function in `TechnicalAnalysisService.ts` (line 1078-1096) - **Critical!**

---

## 2. Architecture Decisions

### 2.1 Type Decoupling Strategy

**Core Principle:** SDK types must NOT be used directly outside of the service layer. Each service gets its own types file.

**Type File Structure:**
```
src/server/services/
├── AccountsService.types.ts      # Re-exports or defines own types
├── OrdersService.types.ts        # Defines own types with number fields
├── ConvertsService.types.ts      # Defines own types with number fields
├── FeesService.types.ts          # Re-exports SDK types
├── PaymentMethodsService.types.ts # Re-exports SDK types
├── PortfoliosService.types.ts    # Defines own types with number fields
├── FuturesService.types.ts       # Re-exports SDK types
├── PerpetualsService.types.ts    # Re-exports SDK types
├── DataService.types.ts          # Re-exports SDK types
├── ProductsService.types.ts      # Defines own types where needed
├── PublicService.types.ts        # Defines own types where needed
└── numberConversion.ts           # Shared conversion utilities
```

**Two Approaches for Type Files:**

1. **For services WITH numeric conversion** (Orders, Converts, Portfolios, Products, Public):
   - Define OWN types with `number` instead of `string`
   - The service converts between our types and SDK types

2. **For services WITHOUT numeric conversion** (Accounts, Fees, Payments, Futures, Perpetuals, Data):
   - Re-export SDK types from the .types.ts file
   - This maintains the decoupling layer even when types are unchanged

**Example OrdersService.types.ts (with conversion):**
```typescript
// src/server/services/OrdersService.types.ts

// Our types with number instead of string
export interface CreateOrderRequest {
  readonly clientOrderId: string;
  readonly productId: string;
  readonly side: 'BUY' | 'SELL';
  readonly orderConfiguration: OrderConfiguration;
}

export interface MarketMarketIoc {
  readonly quoteSize?: number;  // number instead of string
  readonly baseSize?: number;   // number instead of string
}

export interface LimitLimitGtc {
  readonly baseSize: number;    // number instead of string
  readonly limitPrice: number;  // number instead of string
  readonly postOnly?: boolean;
}

// ... other order configuration types with number fields

// Response types can be re-exported if they don't need conversion
export type { CreateOrderResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/orders/types';
```

**Example AccountsService.types.ts (no conversion needed):**
```typescript
// src/server/services/AccountsService.types.ts

// Re-export SDK types unchanged - this is the decoupling layer
export type {
  ListAccountsRequest,
  ListAccountsResponse,
  GetAccountRequest,
  GetAccountResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/accounts/types';
```

### 2.2 Service Wrapper Directory Structure

```
src/server/services/
├── index.ts                      # Re-exports all services and types
├── numberConversion.ts           # Central conversion functions + candle mapping
├── numberConversion.spec.ts      # Tests for conversion functions
├── AccountsService.ts            # Wrapper (pass-through, no conversion)
├── AccountsService.types.ts      # Type re-exports
├── OrdersService.ts              # Wrapper with number→string conversion
├── OrdersService.types.ts        # Own types with number fields
├── OrdersService.spec.ts         # Tests for conversion logic
├── ConvertsService.ts            # Wrapper with number→string conversion
├── ConvertsService.types.ts      # Own types with number fields
├── ConvertsService.spec.ts       # Tests for conversion logic
├── FeesService.ts                # Wrapper (pass-through)
├── FeesService.types.ts          # Type re-exports
├── PaymentMethodsService.ts      # Wrapper (pass-through)
├── PaymentMethodsService.types.ts # Type re-exports
├── PortfoliosService.ts          # Wrapper with number→string conversion
├── PortfoliosService.types.ts    # Own types with number fields
├── PortfoliosService.spec.ts     # Tests for conversion logic
├── FuturesService.ts             # Wrapper (pass-through)
├── FuturesService.types.ts       # Type re-exports
├── PerpetualsService.ts          # Wrapper (pass-through)
├── PerpetualsService.types.ts    # Type re-exports
├── DataService.ts                # Wrapper (pass-through)
├── DataService.types.ts          # Type re-exports
├── ProductsService.ts            # Refactored with candle mapping
├── ProductsService.types.ts      # Own types where needed
├── ProductsService.spec.ts       # Moved tests
├── PublicService.ts              # Refactored with candle mapping
├── PublicService.types.ts        # Own types where needed
└── PublicService.spec.ts         # Moved tests
```

### 2.3 Conversion Functions

**File: `src/server/services/numberConversion.ts`**

```typescript
import type { CandleInput } from '../TechnicalIndicatorsService';

/**
 * Converts number to string for SDK calls.
 * Returns undefined if value is undefined.
 */
export function toString(value: number | undefined): string | undefined {
  return value !== undefined ? value.toString() : undefined;
}

/**
 * Converts number to string (required).
 */
export function toStringRequired(value: number): string {
  return value.toString();
}

/**
 * Converts string to number.
 * Throws Error for invalid values (NaN, Infinity, or partially parsed strings).
 * Uses Number() instead of parseFloat() for strict validation.
 */
export function toNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return num;
}

/**
 * Converts string to number (required).
 * Uses Number() instead of parseFloat() for strict validation.
 */
export function toNumberRequired(value: string): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return num;
}

/**
 * Maps an SDK candle to CandleInput with number types.
 * Used by ProductsService, PublicService, and TechnicalAnalysisService.
 */
export function mapSdkCandleToInput(candle: {
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}): CandleInput {
  return {
    open: toNumberRequired(candle.open ?? '0'),
    high: toNumberRequired(candle.high ?? '0'),
    low: toNumberRequired(candle.low ?? '0'),
    close: toNumberRequired(candle.close ?? '0'),
    volume: toNumberRequired(candle.volume ?? '0'),
  };
}

/**
 * Maps an array of SDK candles to CandleInput[] with number types.
 */
export function mapSdkCandlesToInput(
  candles: ReadonlyArray<{
    open?: string;
    high?: string;
    low?: string;
    close?: string;
    volume?: string;
  }> | undefined,
): CandleInput[] {
  return (candles ?? []).map(mapSdkCandleToInput);
}
```

### 2.4 CandleInput with number Types

**Change in `TechnicalIndicatorsService.ts`:**

```typescript
// Old (line 91-97)
export interface CandleInput {
  readonly open: string;
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly volume: string;
}

// New
export interface CandleInput {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}
```

### 2.5 ProductsService/PublicService Delegation (Complete Documentation)

**Important:** SDK services are created in the current code with `new XService(this.client)`.

**ProductsService** - Methods to delegate:

| Method | Source | Change |
|---------|--------|----------|
| `listProducts()` | Inherited from SDK | Pure delegation |
| `getProduct()` | Inherited from SDK | Pure delegation |
| `getProductCandles()` | Inherited from SDK | Delegation + `toUnixTimestamp()` |
| `getProductBook()` | Inherited from SDK | Pure delegation |
| `getBestBidAsk()` | Inherited from SDK | Pure delegation |
| `getProductMarketTrades()` | Inherited from SDK | Pure delegation |
| `getProductFixed()` | Custom (line 33-35) | Removed (getProduct suffices) |
| `getProductCandlesFixed()` | Custom (line 42-51) | Becomes `getProductCandles()` |
| `getMarketSnapshot()` | Custom (line 53-104) | Remains, uses `getProductCandles()` |
| `getProductCandlesBatch()` | Custom (line 106-142) | Remains, uses `getProductCandles()` |

**PublicService** - Methods to delegate:

| Method | Source | Change |
|---------|--------|----------|
| `getServerTime()` | Inherited from SDK | Pure delegation |
| `getProduct()` | Inherited from SDK | Pure delegation |
| `listProducts()` | Inherited from SDK | Pure delegation |
| `getProductBook()` | Inherited from SDK | Pure delegation |
| `getProductMarketTrades()` | Inherited from SDK | Pure delegation |
| `getProductCandles()` | Inherited from SDK | Delegation + `toUnixTimestamp()` |
| `getProductCandlesFixed()` | Custom (line 14-23) | Becomes `getProductCandles()` |

**Example ProductsService (Delegation):**

```typescript
// src/server/services/ProductsService.ts
import { ProductsService as SdkProductsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { toUnixTimestamp } from '../ProductCandles';
import { mapSdkCandlesToInput } from './numberConversion';
import type {
  ListProductsRequest,
  ListProductsResponse,
  GetProductRequest,
  GetProductCandlesRequest,
  GetProductCandlesResponse,
  GetMarketSnapshotRequest,
  GetMarketSnapshotResponse,
  GetProductCandlesBatchRequest,
  GetProductCandlesBatchResponse,
  Product,
} from './ProductsService.types';

export class ProductsService {
  private readonly sdk: SdkProductsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkProductsService(client);
  }

  // Pure delegation
  public listProducts(request?: ListProductsRequest): Promise<ListProductsResponse> {
    return this.sdk.listProducts(request);
  }

  public getProduct(request: GetProductRequest): Promise<Product> {
    return this.sdk.getProduct(request) as Promise<Product>;
  }

  // Delegation with timestamp conversion
  public getProductCandles(request: GetProductCandlesRequest): Promise<GetProductCandlesResponse> {
    return this.sdk.getProductCandles({
      ...request,
      start: toUnixTimestamp(request.start),
      end: toUnixTimestamp(request.end),
    }) as Promise<GetProductCandlesResponse>;
  }

  // ... other methods (getBestBidAsk, getProductBook, getProductMarketTrades)

  // Custom methods remain (now use getProductCandles instead of getProductCandlesFixed)
  public async getMarketSnapshot(request: GetMarketSnapshotRequest): Promise<GetMarketSnapshotResponse> {
    // Implementation remains the same, now calls this.getProductCandles()
  }

  public async getProductCandlesBatch(request: GetProductCandlesBatchRequest): Promise<GetProductCandlesBatchResponse> {
    // Implementation remains the same, now calls this.getProductCandles()
  }
}
```

**Important:** `getProductCandlesFixed()` is renamed to `getProductCandles()`, since the wrapper now ALWAYS performs the correct timestamp conversion.

---

## 3. Implementation Steps

### Phase 1: Infrastructure

#### Step 1.1: Create services directory
```bash
mkdir -p src/server/services
```

#### Step 1.2: Create conversion functions
- File: `src/server/services/numberConversion.ts`
- Content: As defined in Section 2.3
- Tests: `src/server/services/numberConversion.spec.ts`

### Phase 2: Create Service Wrappers with Types

For each SDK Service, create a wrapper and types file that:
1. Types file defines own types (with number fields) or re-exports SDK types
2. Wrapper receives `CoinbaseAdvTradeClient` as parameter
3. Wrapper internally instantiates the SDK service
4. Wrapper delegates all used methods
5. Wrapper performs number→string conversion for request parameters where needed
6. Response is returned unchanged (except for candles)

#### Step 2.1: Simple wrappers (pure delegation, no conversion)
- `AccountsService` + `AccountsService.types.ts` - listAccounts(), getAccount()
- `FeesService` + `FeesService.types.ts` - getTransactionsSummary()
- `PaymentMethodsService` + `PaymentMethodsService.types.ts` - listPaymentMethods(), getPaymentMethod()
- `DataService` + `DataService.types.ts` - getApiKeyPermissions()
- `FuturesService` + `FuturesService.types.ts` - listFuturesPositions(), getFuturesPosition(), etc.
- `PerpetualsService` + `PerpetualsService.types.ts` - listPositions(), getPosition(), etc.

**Example for simple wrapper with types:**
```typescript
// src/server/services/AccountsService.types.ts
export type {
  ListAccountsRequest,
  ListAccountsResponse,
  GetAccountRequest,
  GetAccountResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/accounts/types';
```

```typescript
// src/server/services/AccountsService.ts
import {
  AccountsService as SdkAccountsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListAccountsRequest,
  ListAccountsResponse,
  GetAccountRequest,
  GetAccountResponse,
} from './AccountsService.types';

export class AccountsService {
  private readonly sdk: SdkAccountsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkAccountsService(client);
  }

  public listAccounts(request?: ListAccountsRequest): Promise<ListAccountsResponse> {
    return this.sdk.listAccounts(request);
  }

  public getAccount(request: GetAccountRequest): Promise<GetAccountResponse> {
    return this.sdk.getAccount(request);
  }
}
```

#### Step 2.2: Wrappers with conversion (number→string for requests)
- `OrdersService` + `OrdersService.types.ts` - createOrder(), editOrder(), previewEditOrder(), closePosition(), etc.
- `ConvertsService` + `ConvertsService.types.ts` - createConvertQuote(), commitConvertTrade(), GetConvertTrade()
  - **Note:** The SDK uses `GetConvertTrade` (capital G). Our wrapper preserves this naming for SDK compatibility.
- `PortfoliosService` + `PortfoliosService.types.ts` - movePortfolioFunds() (funds.value)

**Example for wrapper with conversion and own types:**
```typescript
// src/server/services/OrdersService.types.ts

// Our request type with number instead of string
export interface MarketMarketIoc {
  readonly quoteSize?: number;
  readonly baseSize?: number;
}

export interface LimitLimitGtc {
  readonly baseSize: number;
  readonly limitPrice: number;
  readonly postOnly?: boolean;
}

// ... other order configuration types

export interface OrderConfiguration {
  readonly marketMarketIoc?: MarketMarketIoc;
  readonly limitLimitGtc?: LimitLimitGtc;
  // ... other configurations
}

export interface CreateOrderRequest {
  readonly clientOrderId: string;
  readonly productId: string;
  readonly side: 'BUY' | 'SELL';
  readonly orderConfiguration: OrderConfiguration;
}

// Response types can be re-exported
export type { CreateOrderResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/orders/types';
```

```typescript
// src/server/services/OrdersService.ts
import {
  OrdersService as SdkOrdersService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { CreateOrderRequest as SdkCreateOrderRequest } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/orders/types';
import { toString } from './numberConversion';
import type { CreateOrderRequest, CreateOrderResponse } from './OrdersService.types';

export class OrdersService {
  private readonly sdk: SdkOrdersService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkOrdersService(client);
  }

  public createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.sdk.createOrder(this.convertCreateOrderRequest(request));
  }

  private convertCreateOrderRequest(request: CreateOrderRequest): SdkCreateOrderRequest {
    // Convert number fields to strings using toString()
    // ...
  }
}
```

#### Step 2.3: Refactor ProductsService
- From `extends BaseProductsService` to delegation
- `getProductCandlesFixed()` becomes `getProductCandles()`
- `getProductFixed()` removed, `getProduct()` used directly
- **Important:** Private methods must be updated:
  - `getProducts()` (line 152-156): Change from `this.getProductFixed()` to `this.getProduct()`
  - `getOrderBooks()` (line 144-150): Uses `this.getProductBook()` - no change needed
- Candle response is mapped to `CandleInput[]` with number types (via `mapSdkCandlesToInput`)
- `toUnixTimestamp()` is applied internally
- Create `ProductsService.types.ts` with own types

#### Step 2.4: Refactor PublicService

**IMPORTANT:** PublicService uses a DIFFERENT import path than other services!

```typescript
// src/server/services/PublicService.types.ts
export type {
  GetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse,
  GetPublicProductRequest,
  GetPublicProductResponse,
  ListPublicProductsRequest,
  ListPublicProductsResponse,
  GetPublicProductBookRequest,
  GetPublicProductBookResponse,
  GetPublicMarketTradesRequest,
  GetPublicMarketTradesResponse,
  GetServerTimeResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/types';
```

```typescript
// src/server/services/PublicService.ts
// ATTENTION: Different import path than other services!
import { PublicService as SdkPublicService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { toUnixTimestamp } from '../ProductCandles';
import type {
  GetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse,
  GetPublicProductRequest,
  GetPublicProductResponse,
  ListPublicProductsRequest,
  ListPublicProductsResponse,
  GetPublicProductBookRequest,
  GetPublicProductBookResponse,
  GetPublicMarketTradesRequest,
  GetPublicMarketTradesResponse,
  GetServerTimeResponse,
} from './PublicService.types';

export class PublicService {
  private readonly sdk: SdkPublicService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPublicService(client);
  }

  // Pure delegation for inherited methods
  public getServerTime(): Promise<GetServerTimeResponse> {
    return this.sdk.getServerTime();
  }

  public getProduct(request: GetPublicProductRequest): Promise<GetPublicProductResponse> {
    return this.sdk.getProduct(request);
  }

  public listProducts(request?: ListPublicProductsRequest): Promise<ListPublicProductsResponse> {
    return this.sdk.listProducts(request);
  }

  public getProductBook(request: GetPublicProductBookRequest): Promise<GetPublicProductBookResponse> {
    return this.sdk.getProductBook(request);
  }

  public getProductMarketTrades(request: GetPublicMarketTradesRequest): Promise<GetPublicMarketTradesResponse> {
    return this.sdk.getProductMarketTrades(request);
  }

  // Delegation with timestamp conversion (replaces getProductCandlesFixed)
  public getProductCandles(
    request: GetPublicProductCandlesRequest,
  ): Promise<GetPublicProductCandlesResponse> {
    return this.sdk.getProductCandles({
      ...request,
      start: toUnixTimestamp(request.start),
      end: toUnixTimestamp(request.end),
    }) as Promise<GetPublicProductCandlesResponse>;
  }
}
```

### Phase 3: Update Tool Schemas

#### Step 3.1: z.string() → z.number() for numeric fields

**OrderToolRegistry.ts:**
```typescript
// Old
baseSize: z.string().describe('Amount to buy/sell')
// New
baseSize: z.number().describe('Amount to buy/sell')
```

**ConvertToolRegistry.ts:**
```typescript
// Old
amount: z.string().describe('Amount to convert')
// New
amount: z.number().describe('Amount to convert')
```

**PortfolioToolRegistry.ts:**
```typescript
// Old
value: z.string().describe('Amount to transfer')
// New
value: z.number().describe('Amount to transfer')
```

**IndicatorToolRegistry.ts:**
```typescript
// Old
const candleSchema = z.object({
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
})
// New
const candleSchema = z.object({
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
})

// And for pivotPoints:
// Old
high: z.string().describe('Previous period high price')
// New
high: z.number().describe('Previous period high price')
```

#### Step 3.2: Update service references and import paths

**All Tool Registries must change their imports:**

```typescript
// Old (e.g., in ProductToolRegistry.ts)
import type { ProductsService } from '../ProductsService';

// New
import type { ProductsService } from '../services/ProductsService';
```

**Affected files and their import changes:**

| File | Old | New |
|-------|-----|-----|
| `tools/ProductToolRegistry.ts` | `../ProductsService` | `../services/ProductsService` |
| `tools/PublicToolRegistry.ts` | `../PublicService` | `../services/PublicService` |
| `tools/AnalysisToolRegistry.ts` | `../TechnicalAnalysisService` | (remains, but TAS imports differently) |
| `TechnicalAnalysisService.ts` | `./ProductsService` | `./services/ProductsService` |

### Phase 4: Update TechnicalIndicatorsService

#### Step 4.1: Change CandleInput interface
- `string` → `number` for all OHLCV fields (line 91-97)

#### Step 4.2: Simplify extract functions
```typescript
// Old (line 1506-1507)
function extractOpenPrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => parseFloat(candle.open));
}

// New
function extractOpenPrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => candle.open);
}

// Similarly for all other extract functions (extractClosePrices, extractHighPrices, etc.)
```

#### Step 4.3: Change CalculatePivotPointsInput
```typescript
// Old (line 560-566)
export interface CalculatePivotPointsInput {
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly open?: string;
  readonly type?: PivotPointsType;
}

// New
export interface CalculatePivotPointsInput {
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly open?: number;
  readonly type?: PivotPointsType;
}
```

#### Step 4.4: Adapt calculatePivotPoints method
```typescript
// Old (line 1346-1367)
public calculatePivotPoints(input: CalculatePivotPointsInput): PivotPointsOutput {
  const high = parseFloat(input.high);
  const low = parseFloat(input.low);
  const close = parseFloat(input.close);
  const open = input.open ? parseFloat(input.open) : close;
  // ...
}

// New
public calculatePivotPoints(input: CalculatePivotPointsInput): PivotPointsOutput {
  const { high, low, close } = input;
  const open = input.open ?? close;
  // ... (no parseFloat needed anymore)
}
```

### Phase 5: Update TechnicalAnalysisService

#### Step 5.1: Replace mapApiCandlesToInput

The local function `mapApiCandlesToInput` (line 1078-1096) is replaced by the import from `numberConversion.ts`:

```typescript
// Old (line 1078-1096)
function mapApiCandlesToInput(
  candles: ReadonlyArray<{...}> | undefined,
): CandleInput[] {
  return (candles ?? []).map((c) => ({
    open: c.open ?? '0',
    high: c.high ?? '0',
    low: c.low ?? '0',
    close: c.close ?? '0',
    volume: c.volume ?? '0',
  }));
}

// New
import { mapSdkCandlesToInput } from './services/numberConversion';

// In fetchCandles() and fetchDailyCandles():
return mapSdkCandlesToInput(response.candles);
```

#### Step 5.2: Remove parseFloat calls

```typescript
// Old (e.g., in buildPriceSummary, line 166-194)
const current = parseFloat(latest.close);
const open = parseFloat(oldest.open);
const high = Math.max(...candles.map((c) => parseFloat(c.high)));
const low = Math.min(...candles.map((c) => parseFloat(c.low)));

// New
const current = latest.close;
const open = oldest.open;
const high = Math.max(...candles.map((c) => c.high));
const low = Math.min(...candles.map((c) => c.low));

// Similarly for all other parseFloat calls (~30 places)
```

#### Step 5.3: Adapt calculateSupportResistanceIndicators

Since `CandleInput` now has numbers, the call to `calculatePivotPoints` works automatically:

```typescript
// This code works unchanged since previousDay.high etc. are now numbers
this.indicatorsService.calculatePivotPoints({
  high: previousDay.high,
  low: previousDay.low,
  close: previousDay.close,
  open: previousDay.open,
});
```

### Phase 6: Update CoinbaseMcpServer

#### Step 6.1: Adapt imports
```typescript
// Old (SDK services directly imported)
import {
  AccountsService,
  OrdersService,
  // ...
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';

// New (only CoinbaseAdvTradeClient from SDK, wrappers from services/)
import {
  CoinbaseAdvTradeClient,
  CoinbaseAdvTradeCredentials,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import {
  AccountsService,
  OrdersService,
  ConvertsService,
  FeesService,
  PaymentMethodsService,
  PortfoliosService,
  FuturesService,
  PerpetualsService,
  DataService,
  ProductsService,
  PublicService,
} from './services';
```

#### Step 6.2: Service instantiation

**Current code (CoinbaseMcpServer.ts, line 54-74):**
```typescript
const credentials = new CoinbaseAdvTradeCredentials(apiKey, privateKey);
this.client = new CoinbaseAdvTradeClient(credentials);

// Old: SDK services are created with client
this.accounts = new AccountsService(this.client);  // SDK AccountsService
this.orders = new OrdersService(this.client);      // SDK OrdersService
this.products = new ProductsService(this.client);  // Own, extends SDK
// ...
```

**New code:**
```typescript
const credentials = new CoinbaseAdvTradeCredentials(apiKey, privateKey);
this.client = new CoinbaseAdvTradeClient(credentials);

// New: Wrapper services are created with client
// The wrappers create the SDK services internally
this.accounts = new AccountsService(this.client);   // Wrapper AccountsService
this.orders = new OrdersService(this.client);       // Wrapper OrdersService
this.products = new ProductsService(this.client);   // Wrapper ProductsService (delegation)
// ...
```

**Important:** The wrappers receive `CoinbaseAdvTradeClient` and create the respective SDK service internally. The interface remains the same - only the implementation changes.

### Phase 7: Update Tests

#### Step 7.1: New tests for conversion functions
- `src/server/services/numberConversion.spec.ts`
- Tests: toString, toStringRequired, toNumber, toNumberRequired
- Tests: mapSdkCandleToInput, mapSdkCandlesToInput
- Edge cases: undefined, NaN, Infinity, invalid strings

#### Step 7.2: Mock Strategy - Mock Our Services, Not SDK

**Core Principle:** Tests should mock our wrapper services, NOT the SDK services directly.

**Why this approach:**
1. Our services are the interface that the rest of the application uses
2. Mocking at our service layer tests the integration more accurately
3. SDK implementation details are encapsulated within our wrappers

**Example mock for ProductsService:**
```typescript
// In test files, mock our service, not SDK
const mockProductsService = {
  listProducts: vi.fn(),
  getProduct: vi.fn(),
  getProductCandles: vi.fn(),
  getMarketSnapshot: vi.fn(),
  getProductCandlesBatch: vi.fn(),
  getBestBidAsk: vi.fn(),
  getProductBook: vi.fn(),
  getProductMarketTrades: vi.fn(),
};

// Use in tests
vi.mock('./services/ProductsService', () => ({
  ProductsService: vi.fn(() => mockProductsService),
}));
```

**Example mock for OrdersService (with conversion):**
```typescript
const mockOrdersService = {
  createOrder: vi.fn(),
  editOrder: vi.fn(),
  cancelOrders: vi.fn(),
  listOrders: vi.fn(),
  listFills: vi.fn(),
  getOrder: vi.fn(),
  previewOrder: vi.fn(),
  previewEditOrder: vi.fn(),
  closePosition: vi.fn(),
};
```

#### Step 7.3: Wrapper tests and 100% coverage strategy

**Simple wrappers (pure delegation):**
These only delegate to the SDK. To achieve 100% coverage, there are two options:

1. **Option A (recommended):** The wrappers are indirectly tested through existing integration tests in `CoinbaseMcpServer.spec.ts`. Istanbul/V8 coverage measures all lines that are executed.

2. **Option B:** Minimal unit tests for each wrapper that verify the SDK method is called.

**Wrappers with conversion (OrdersService, ConvertsService, PortfoliosService):**
These MUST be tested to verify the number→string conversion:
- `src/server/services/OrdersService.spec.ts`
- `src/server/services/ConvertsService.spec.ts`
- `src/server/services/PortfoliosService.spec.ts`

**ProductsService and PublicService:**
Existing tests (`ProductsService.spec.ts`, `PublicService.spec.ts`) are moved to `services/` and adapted.

The existing tests for the Tool Registries (via CoinbaseMcpServer.spec.ts) cover the integration.

#### Step 7.4: Adapt existing tests
- Do not delete tests
- Change mock data from strings to numbers
- Adapt assertions to number values
- **IMPORTANT:** Do NOT reduce assertions to property existence checks (toHaveProperty, toBeDefined). If a test asserts actual values, those assertions must be preserved with the correct number values.

**Complete list of test files to adapt:**

| File | Changes |
|-------|------------|
| `src/index.spec.ts` | Check if affected |
| `src/server/CoinbaseMcpServer.spec.ts` | Mock data, service instantiation, mock our services |
| `src/server/TechnicalIndicatorsService.spec.ts` | CandleInput with numbers, PivotPointsInput with numbers |
| `src/server/TechnicalAnalysisService.spec.ts` | CandleInput with numbers |
| `src/server/ProductsService.spec.ts` | Move to services/, candle mapping tests |
| `src/server/PublicService.spec.ts` | Move to services/, candle mapping tests |
| `src/server/ProductCandles.spec.ts` | Check if affected (only timestamp utils) |
| `src/server/indicators/rsiDivergence.spec.ts` | Check if affected |
| `src/server/indicators/volumeProfile.spec.ts` | Check if affected |
| `src/server/indicators/chartPatterns.spec.ts` | Check if affected |
| `src/server/indicators/swingPoints.spec.ts` | Check if affected |
| `src/test/serviceMocks.ts` | Import paths, remove deprecated methods, mock wrapper services |

**Note:** Pivot point tests are covered in TechnicalIndicatorsService.spec.ts, not a separate file.

---

## 4. File Changes Summary

### 4.1 New Files (26)

| File | Description |
|-------|--------------|
| `src/server/services/index.ts` | Re-exports services and types |
| `src/server/services/numberConversion.ts` | Conversion functions + candle mapping |
| `src/server/services/numberConversion.spec.ts` | Tests |
| `src/server/services/AccountsService.ts` | Wrapper |
| `src/server/services/AccountsService.types.ts` | Type re-exports |
| `src/server/services/OrdersService.ts` | Wrapper |
| `src/server/services/OrdersService.types.ts` | Own types with number fields |
| `src/server/services/OrdersService.spec.ts` | Conversion tests |
| `src/server/services/ConvertsService.ts` | Wrapper |
| `src/server/services/ConvertsService.types.ts` | Own types with number fields |
| `src/server/services/ConvertsService.spec.ts` | Conversion tests |
| `src/server/services/FeesService.ts` | Wrapper |
| `src/server/services/FeesService.types.ts` | Type re-exports |
| `src/server/services/PaymentMethodsService.ts` | Wrapper |
| `src/server/services/PaymentMethodsService.types.ts` | Type re-exports |
| `src/server/services/PortfoliosService.ts` | Wrapper |
| `src/server/services/PortfoliosService.types.ts` | Own types with number fields |
| `src/server/services/PortfoliosService.spec.ts` | Conversion tests |
| `src/server/services/FuturesService.ts` | Wrapper |
| `src/server/services/FuturesService.types.ts` | Type re-exports |
| `src/server/services/PerpetualsService.ts` | Wrapper |
| `src/server/services/PerpetualsService.types.ts` | Type re-exports |
| `src/server/services/DataService.ts` | Wrapper |
| `src/server/services/DataService.types.ts` | Type re-exports |
| `src/server/services/ProductsService.types.ts` | Own types where needed |
| `src/server/services/PublicService.types.ts` | Own types where needed |

### 4.2 Files to Move (4)

| From | To |
|-----|------|
| `src/server/ProductsService.ts` | `src/server/services/ProductsService.ts` |
| `src/server/ProductsService.spec.ts` | `src/server/services/ProductsService.spec.ts` |
| `src/server/PublicService.ts` | `src/server/services/PublicService.ts` |
| `src/server/PublicService.spec.ts` | `src/server/services/PublicService.spec.ts` |

### 4.3 Files to Change (20)

| File | Changes |
|-------|------------|
| `src/server/TechnicalIndicatorsService.ts` | CandleInput, PivotPointsInput, extract functions |
| `src/server/TechnicalIndicatorsService.spec.ts` | Mock data |
| `src/server/TechnicalAnalysisService.ts` | Import mapSdkCandlesToInput, remove parseFloat |
| `src/server/TechnicalAnalysisService.spec.ts` | Mock data |
| `src/server/CoinbaseMcpServer.ts` | Service imports and instantiation |
| `src/server/CoinbaseMcpServer.spec.ts` | Mock data, mock our services |
| `src/server/tools/OrderToolRegistry.ts` | z.number(), service import |
| `src/server/tools/ConvertToolRegistry.ts` | z.number(), service import |
| `src/server/tools/PortfolioToolRegistry.ts` | z.number(), service import |
| `src/server/tools/IndicatorToolRegistry.ts` | z.number() for candleSchema and pivotPoints |
| `src/server/tools/AccountToolRegistry.ts` | Service import |
| `src/server/tools/FeeToolRegistry.ts` | Service import |
| `src/server/tools/PaymentToolRegistry.ts` | Service import |
| `src/server/tools/FuturesToolRegistry.ts` | Service import |
| `src/server/tools/PerpetualsToolRegistry.ts` | Service import |
| `src/server/tools/DataToolRegistry.ts` | Service import |
| `src/server/tools/ProductToolRegistry.ts` | Service import |
| `src/server/tools/PublicToolRegistry.ts` | Service import |
| `src/server/tools/AnalysisToolRegistry.ts` | Service import (if affected) |
| `src/test/serviceMocks.ts` | **Critical update** (see Section 4.4) |

### 4.4 serviceMocks.ts Updates (Critical)

The central mock file `src/test/serviceMocks.ts` requires significant updates to align with the new architecture:

**Current state:**
- Imports SDK services directly: `import { AccountsService, OrdersService, ... } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js'`
- Imports ProductsService/PublicService from old paths: `@server/ProductsService`, `@server/PublicService`
- Mocks SDK services and passes them to test files
- Contains deprecated method mocks like `getProductFixed()`, `getProductCandlesFixed()`

**Required changes:**

1. **Update imports for moved services:**
   ```typescript
   // Old
   import { ProductsService } from '@server/ProductsService';
   import { PublicService } from '@server/PublicService';

   // New
   import { ProductsService } from '@server/services/ProductsService';
   import { PublicService } from '@server/services/PublicService';
   ```

2. **Import wrapper services instead of SDK services:**
   ```typescript
   // Old
   import { AccountsService, OrdersService, ... } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';

   // New
   import type { AccountsService } from '@server/services/AccountsService';
   import type { OrdersService } from '@server/services/OrdersService';
   // ... etc for all services
   ```

3. **Remove deprecated method mocks from ProductsService:**
   - Remove `getProductFixed` mock
   - Remove `getProductCandlesFixed` mock

4. **Remove deprecated method mocks from PublicService:**
   - Remove `getProductCandlesFixed` mock

5. **Update mockServices() function:**
   ```typescript
   // Old: Mocks SDK services
   jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => {
     return {
       AccountsService: jest.fn().mockImplementation(() => mockAccountsService),
       // ...
     };
   });

   // New: Mocks our wrapper services
   jest.mock('@server/services/AccountsService', () => ({
     AccountsService: jest.fn().mockImplementation(() => mockAccountsService),
   }));
   jest.mock('@server/services/OrdersService', () => ({
     OrdersService: jest.fn().mockImplementation(() => mockOrdersService),
   }));
   // ... etc for all wrapper services
   ```

6. **Note on method naming:** The SDK uses `GetConvertTrade` (capital G). Our wrapper and mocks should preserve this naming.

---

## 5. Quality Assurance

### 5.1 Before Commit

```bash
npm run test:types    # TypeScript errors
npm run lint          # ESLint errors/warnings
npm run test:coverage # 100% coverage
npm run knip          # Unused exports
```

### 5.2 Checklist

- [ ] All MCP Tool Schemas use z.number() for numeric values
- [ ] All SDK Services have a wrapper service
- [ ] Each service has an XService.types.ts file
- [ ] SDK types are not used directly outside of .types.ts files
- [ ] ProductsService/PublicService use delegation instead of extends
- [ ] CandleInput uses number instead of string
- [ ] CalculatePivotPointsInput uses number instead of string
- [ ] No parseFloat() calls in TechnicalIndicatorsService (extract functions simplified to use number properties directly)
- [ ] No parseFloat() calls in TechnicalAnalysisService
- [ ] mapApiCandlesToInput in TechnicalAnalysisService replaced by mapSdkCandlesToInput
- [ ] All import paths for moved services updated
- [ ] **Every function and method has an explicit return type**
- [ ] **Service mocks mock our wrapper services, not SDK services**
- [ ] `src/test/serviceMocks.ts` updated (import paths, deprecated methods removed)
- [ ] **Test assertions preserve actual values** (no reduction to toHaveProperty/toBeDefined)
- [ ] 100% test coverage
- [ ] No ESLint errors/warnings
- [ ] No TypeScript errors
- [ ] No unused exports (knip)

---

## 6. Commit Message

```
refactor(server): standardize number types across MCP tools and services

BREAKING CHANGE: All MCP tool schemas now use z.number() instead of
z.string() for numeric values (amounts, prices, OHLCV data).

- Create service wrappers for all Coinbase SDK services with number→string
  conversion for request parameters
- Add XService.types.ts files for type decoupling (SDK types not used directly)
- Refactor ProductsService and PublicService to use delegation instead
  of inheritance
- Move ProductsService and PublicService to src/server/services/
- Update CandleInput interface to use number types
- Update CalculatePivotPointsInput interface to use number types
- Add centralized number conversion functions (using Number() for strict validation)
- Add mapSdkCandlesToInput for Candle mapping
- Update all tool registries to use z.number() schemas
- Remove parseFloat() calls from indicator services
- Update all tests to use number values and mock wrapper services
```

---

## 7. Implementation Notes

### 7.1 Maintain Order

1. **First** services directory + conversion functions + tests
2. **Then** type files for all services (XService.types.ts)
3. **Then** service wrappers (starting with simple ones)
4. **Then** move and refactor ProductsService/PublicService
5. **Then** update tool schemas and import paths
6. **Then** TechnicalIndicatorsService (interfaces + extract functions)
7. **Then** TechnicalAnalysisService (mapSdkCandlesToInput + remove parseFloat)
8. **Then** update CoinbaseMcpServer
9. **Finally** adapt all tests

### 7.2 Use TypeScript Compiler

After changing the interfaces, the TypeScript compiler shows all places that need to be adapted. Work through them systematically.

### 7.3 Do Not Delete Tests

Only adapt existing tests (mock data, assertions), do not delete them. Add new tests where needed.

### 7.4 Git Strategy

All changes in one commit. When moving files:
```bash
git mv src/server/ProductsService.ts src/server/services/ProductsService.ts
```
This preserves Git history.

### 7.5 Type File Consistency

Ensure all services follow the same pattern:
- Services with numeric conversion: Define own types in .types.ts
- Services without numeric conversion: Re-export SDK types in .types.ts
- Tool registries import types from our .types.ts files, never directly from SDK
