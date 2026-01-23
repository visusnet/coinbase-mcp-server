# Migration Step 3: Zod Response Schemas with Transform

## Goal

Add Zod response schemas that validate API responses AND convert string numbers to actual numbers using `z.preprocess()`. This replaces manual `*.convert.ts` conversion functions.

**What changes:**
- New `*ResponseSchema` definitions in `*Service.schema.ts` files
- Response types become `z.output<typeof *ResponseSchema>`
- Service methods use `schema.parse()` instead of manual conversion functions
- `*.convert.ts` files are removed (after migration)
- `Sdk*Response` types become obsolete (`.parse()` accepts `unknown`, no casting needed)

**What stays the same:**
- Request schemas (from Step 2)
- Service method signatures
- Tool definitions
- Test assertions (values remain the same)

## Prerequisites

- Step 2 (Zod Schema Extraction) should be completed
- All verification commands must pass before starting

---

## Naming Convention

### Schema Names

| Type | Pattern | Example |
|------|---------|---------|
| Domain object | `*Schema` | `OrderSchema`, `ProductSchema`, `CandleSchema` |
| API request | `Verb*RequestSchema` | `ListOrdersRequestSchema`, `GetProductRequestSchema` |
| API response | `Verb*ResponseSchema` | `ListOrdersResponseSchema`, `GetProductResponseSchema` |

### Type Names (derived from schemas)

| Type | Pattern | Derivation |
|------|---------|------------|
| Domain object | `*` | `type Order = z.output<typeof OrderSchema>` |
| Request | `Verb*Request` | `type ListOrdersRequest = z.infer<typeof ListOrdersRequestSchema>` |
| Response | `Verb*Response` | `type ListOrdersResponse = z.output<typeof ListOrdersResponseSchema>` |

### Examples

```typescript
// Domain objects (no verb, no Request/Response)
OrderSchema        → Order
ProductSchema      → Product
CandleSchema       → Candle

// Request schemas (verb + object + Request)
ListOrdersRequestSchema    → ListOrdersRequest
GetProductRequestSchema    → GetProductRequest
CreateOrderRequestSchema   → CreateOrderRequest

// Response schemas (verb + object + Response)
ListOrdersResponseSchema   → ListOrdersResponse
GetProductResponseSchema   → GetProductResponse
CreateOrderResponseSchema  → CreateOrderResponse
```

---

## Core Concept: preprocess + z.number()

### Why preprocess?

We use `z.preprocess()` because:
1. The API returns strings (e.g., `"85.5"`)
2. We want actual numbers in our code (e.g., `85.5`)
3. Zod's built-in `z.number().finite()` handles validation automatically
4. Clear separation: preprocess = type coercion, schema = validation

### Number Conversion Helpers

Add these to a shared file (e.g., `src/server/services/schema.helpers.ts`):

```typescript
import { z } from 'zod';

/**
 * Converts optional string to optional number.
 * Empty strings are treated as undefined (API returns "" for missing optional fields).
 */
export const zodNumber = z.preprocess(
  (val) => (val === '' || val === undefined ? undefined : Number(val)),
  z.number().finite().optional()
);

/**
 * Converts required string to required number.
 */
export const zodNumberRequired = z.preprocess(
  (val) => Number(val),
  z.number().finite()
);
```

### Type Inference

```typescript
// z.input = What the API returns (before preprocess)
// For preprocess schemas, z.input is `unknown` - we don't need this type
// since .parse() accepts unknown and we don't cast the API client response

// z.output = What our code receives (after preprocess + validation)
type Order = z.output<typeof OrderSchema>;
// { completionPercentage: number, filledSize?: number, ... }

type ListOrdersResponse = z.output<typeof ListOrdersResponseSchema>;
// { orders: Order[], cursor?: string, hasNext: boolean }
```

---

## Important: Handling Unexpected Number Responses

We assume the API returns strings. If during testing you discover the API returns actual numbers for certain fields:

1. **Do NOT use the preprocess helper** for that field
2. **Use `z.number()` directly** instead
3. Document which fields return numbers in a comment

Example:
```typescript
export const SomeResponseSchema = z.object({
  // API returns string, convert to number
  price: zodNumberRequired,

  // API returns actual number (discovered during testing)
  // Do NOT use zodNumber here
  count: z.number().int(),
});
```

---

## Schema File Structure

Each `*Service.schema.ts` file will have this structure:

```typescript
// src/server/services/OrdersService.schema.ts
import { z } from 'zod';
import { zodNumber, zodNumberRequired } from './schema.helpers';

// =============================================================================
// Request Schemas (from Step 2)
// =============================================================================

export const ListOrdersRequestSchema = z.object({ ... });
export const GetOrderRequestSchema = z.object({ ... });

// =============================================================================
// Response Schemas (NEW in Step 3)
// =============================================================================

// Domain object schema (no verb prefix)
export const OrderSchema = z.object({
  orderId: z.string(),
  productId: z.string(),
  userId: z.string(),
  side: z.enum(['BUY', 'SELL']),
  status: z.string(),
  createdTime: z.string(),
  pendingCancel: z.boolean(),
  sizeInQuote: z.boolean(),
  sizeInclusiveOfFees: z.boolean(),
  // ... other string/boolean fields

  // Numeric fields with preprocess conversion
  completionPercentage: zodNumberRequired,
  filledSize: zodNumber,
  averageFilledPrice: zodNumberRequired,
  fee: zodNumber,
  numberOfFills: zodNumberRequired,
  filledValue: zodNumber,
  totalFees: zodNumberRequired,
  totalValueAfterFees: zodNumberRequired,
  outstandingHoldAmount: zodNumber,
  leverage: zodNumber,
});

// API response schemas (VerbObject pattern matching request schemas)
export const ListOrdersResponseSchema = z.object({
  orders: z.array(OrderSchema),
  cursor: z.string().optional(),
  hasNext: z.boolean(),
});

export const GetOrderResponseSchema = z
  .object({
    order: OrderSchema,
  })
  .transform((data) => data.order);

// =============================================================================
// Types (derived from schemas)
// =============================================================================

// Request types
export type ListOrdersRequest = z.infer<typeof ListOrdersRequestSchema>;
export type GetOrderRequest = z.infer<typeof GetOrderRequestSchema>;

// Response types
export type Order = z.output<typeof OrderSchema>;
export type ListOrdersResponse = z.output<typeof ListOrdersResponseSchema>;
export type GetOrderResponse = z.output<typeof GetOrderResponseSchema>;
```

---

## Service Method Updates

### Pattern: Manual Conversion → Schema Parse

**Before:**
```typescript
import type { SdkListOrdersResponse } from './OrdersService.types';
import { toListOrdersResponse } from './OrdersService.convert';

public async listOrders(request?: ListOrdersRequest): Promise<ListOrdersResponse> {
  const sdkResponse = (
    await this.client.request({
      url: 'orders/historical/batch',
      queryParams: request ?? {},
    })
  ).data as SdkListOrdersResponse;  // Cast needed because .data is unknown
  return toListOrdersResponse(sdkResponse);
}
```

**After:**
```typescript
import { ListOrdersResponseSchema, type ListOrdersResponse } from './OrdersService.schema';

public async listOrders(request?: ListOrdersRequest): Promise<ListOrdersResponse> {
  const response = await this.client.request({
    url: 'orders/historical/batch',
    queryParams: request ?? {},
  });
  return ListOrdersResponseSchema.parse(response.data);  // No cast needed, .parse() accepts unknown
}
```

### Handling Nested Transforms

For responses like `GetOrderResponse` where the API returns `{ order: {...} }` but we want just the order:

```typescript
// Schema with transform
export const GetOrderResponseSchema = z
  .object({
    order: OrderSchema,
  })
  .transform((data) => data.order);

// Service method
public async getOrder(request: GetOrderRequest): Promise<GetOrderResponse> {
  const response = await this.client.request({
    url: `orders/historical/${request.orderId}`,
  });
  return GetOrderResponseSchema.parse(response.data);
}
```

---

## Verification Requirements

After migrating each service, run the following commands in order:

```bash
npm run format          # Fix formatting issues
npm run lint            # Must have NO warnings/errors
npm run knip            # Must have NO warnings/errors (unused exports/dependencies)
npm run test:coverage   # All tests must pass, 100% coverage in ALL categories
```

---

## Test Rules (CRITICAL)

### Tests MUST NOT be deleted

Tests may be **adapted** (e.g., mocks may need adjustment), but they must **never be removed**.

### Expectations MUST NOT be removed

Test assertions may be **adapted structurally**, but their **content must not change**. For example:
- ✅ OK: Update mock to return raw API format (strings) instead of converted format
- ✅ OK: Adjust import paths
- ❌ NOT OK: Remove an `expect()` statement
- ❌ NOT OK: Change what value is being asserted

### Mock Updates

Since service methods now parse raw API responses, mocks must return **raw API format** (strings for numeric fields):

**Before (mock returns converted response):**
```typescript
mockSdk.listOrders.mockResolvedValue({
  orders: [{ completionPercentage: 85.5, totalFees: 1.25 }],
});
```

**After (mock returns raw API response):**
```typescript
mockClient.request.mockResolvedValue({
  data: {
    orders: [{ completionPercentage: '85.5', totalFees: '1.25' }],
  },
});
```

### Edge Cases

If the agent encounters a situation where it seems necessary to:
- Delete a test
- Remove an expectation
- Significantly change what is being tested

The agent **MUST stop and ask the user** by presenting options. Do not proceed without explicit approval.

---

## Service-by-Service Migration Guide

### 0. Create Shared Helpers

**New file:** `src/server/services/schema.helpers.ts`

```typescript
import { z } from 'zod';

export const zodNumber = z.preprocess(
  (val) => (val === '' || val === undefined ? undefined : Number(val)),
  z.number().finite().optional()
);

export const zodNumberRequired = z.preprocess(
  (val) => Number(val),
  z.number().finite()
);
```

---

### 1. AccountsService

**File:** `src/server/services/AccountsService.schema.ts`

**Response schemas to add:**
- `AccountSchema` - Domain object with numeric `availableBalance.value` and `hold.value`
- `ListAccountsResponseSchema` - Array of accounts with pagination
- `GetAccountResponseSchema` - Single account (may need transform if wrapped)

**Numeric fields:**
- `availableBalance.value` → zodNumber
- `hold.value` → zodNumber

**Convert file to remove:** `AccountsService.convert.ts`

---

### 2. OrdersService

**File:** `src/server/services/OrdersService.schema.ts`

**Response schemas to add:**
- `OrderSchema` - Domain object
- `FillSchema` - Domain object for fills
- `ListOrdersResponseSchema`
- `GetOrderResponseSchema` (with transform to unwrap)
- `CreateOrderResponseSchema`
- `CancelOrdersResponseSchema`
- `ListFillsResponseSchema`
- `EditOrderResponseSchema`
- `PreviewEditOrderResponseSchema`
- `PreviewOrderResponseSchema`
- `ClosePositionResponseSchema`

**Numeric fields in Order:**
- `completionPercentage` → zodNumberRequired
- `filledSize` → zodNumber
- `averageFilledPrice` → zodNumberRequired
- `fee` → zodNumber
- `numberOfFills` → zodNumberRequired
- `filledValue` → zodNumber
- `totalFees` → zodNumberRequired
- `totalValueAfterFees` → zodNumberRequired
- `outstandingHoldAmount` → zodNumber
- `leverage` → zodNumber

**Convert file to remove:** `OrdersService.convert.ts`

---

### 3. ProductsService

**File:** `src/server/services/ProductsService.schema.ts`

**Response schemas to add:**
- `ProductSchema` - Domain object
- `CandleSchema` - Domain object
- `L2LevelSchema` - Domain object for bids/asks
- `PriceBookSchema` - Domain object
- `MarketTradeSchema` - Domain object
- `ListProductsResponseSchema`
- `GetProductResponseSchema`
- `GetProductCandlesResponseSchema`
- `GetProductBookResponseSchema`
- `GetBestBidAskResponseSchema`
- `GetMarketTradesResponseSchema`

**Numeric fields in Product:**
- `price` → zodNumberRequired
- `pricePercentageChange24h` → zodNumberRequired
- `volume24h` → zodNumberRequired
- `volumePercentageChange24h` → zodNumberRequired
- `baseIncrement` → zodNumberRequired
- `quoteIncrement` → zodNumberRequired
- `quoteMinSize` → zodNumberRequired
- `quoteMaxSize` → zodNumberRequired
- `baseMinSize` → zodNumberRequired
- `baseMaxSize` → zodNumberRequired
- `midMarketPrice` → zodNumber
- `priceIncrement` → zodNumber
- `approximateQuote24hVolume` → zodNumber

**Numeric fields in Candle:**
- `start` → zodNumber
- `low` → zodNumber
- `high` → zodNumber
- `open` → zodNumber
- `close` → zodNumber
- `volume` → zodNumber

**Numeric fields in L2Level (bids/asks):**
- `price` → zodNumber
- `size` → zodNumber

**Convert file to remove:** `ProductsService.convert.ts`

---

### 4. PublicService

**File:** `src/server/services/PublicService.schema.ts`

**Response schemas to add:**
- Same structure as ProductsService but for public endpoints
- `ServerTimeResponseSchema`

**Convert file to remove:** `PublicService.convert.ts` (if exists)

---

### 5. PortfoliosService

**File:** `src/server/services/PortfoliosService.schema.ts`

**Response schemas to add:**
- `PortfolioSchema` - Domain object
- `ListPortfoliosResponseSchema`
- `GetPortfolioResponseSchema`
- `CreatePortfolioResponseSchema`
- `EditPortfolioResponseSchema`
- `DeletePortfolioResponseSchema`
- `MovePortfolioFundsResponseSchema`

**Convert file to remove:** `PortfoliosService.convert.ts`

---

### 6. FeesService

**File:** `src/server/services/FeesService.schema.ts`

**Response schemas to add:**
- `TransactionSummarySchema` - Domain object
- `GetTransactionSummaryResponseSchema`

**Numeric fields:**
- Fee rates, volumes, etc.

**Convert file to remove:** `FeesService.convert.ts` (if exists)

---

### 7. FuturesService

**File:** `src/server/services/FuturesService.schema.ts`

**Response schemas to add:**
- `FuturesPositionSchema` - Domain object
- `FuturesBalanceSummarySchema` - Domain object
- `FuturesSweepSchema` - Domain object
- `ListFuturesPositionsResponseSchema`
- `GetFuturesPositionResponseSchema`
- `GetFuturesBalanceSummaryResponseSchema`
- `ListFuturesSweepsResponseSchema`

**Convert file to remove:** `FuturesService.convert.ts` (if exists)

---

### 8. PerpetualsService

**File:** `src/server/services/PerpetualsService.schema.ts`

**Response schemas to add:**
- `PerpPositionSchema` - Domain object
- `PerpPortfolioSummarySchema` - Domain object
- `PerpPortfolioBalanceSchema` - Domain object
- `ListPerpetualsPositionsResponseSchema`
- `GetPerpetualsPositionResponseSchema`
- `GetPerpetualsPortfolioSummaryResponseSchema`
- `GetPerpetualsPortfolioBalanceResponseSchema`

**Convert file to remove:** `PerpetualsService.convert.ts` (if exists)

---

### 9. ConvertsService

**File:** `src/server/services/ConvertsService.schema.ts`

**Response schemas to add:**
- `ConvertTradeSchema` - Domain object
- `CreateConvertQuoteResponseSchema`
- `CommitConvertTradeResponseSchema`
- `GetConvertTradeResponseSchema`

**Convert file to remove:** `ConvertsService.convert.ts`

---

### 10. DataService

**File:** `src/server/services/DataService.schema.ts`

**Response schemas to add:**
- `ApiKeyPermissionsSchema` - Domain object
- `GetApiKeyPermissionsResponseSchema`

**Convert file to remove:** `DataService.convert.ts` (if exists)

---

### 11. PaymentMethodsService

**File:** `src/server/services/PaymentMethodsService.schema.ts`

**Response schemas to add:**
- `PaymentMethodSchema` - Domain object
- `ListPaymentMethodsResponseSchema`
- `GetPaymentMethodResponseSchema`

**Convert file to remove:** `PaymentMethodsService.convert.ts` (if exists)

---

### 12. Common Types

**File:** `src/server/services/common.schema.ts` (NEW)

Shared domain object schemas used across multiple services:

```typescript
import { z } from 'zod';
import { zodNumber } from './schema.helpers';

// Domain object schemas (no verb prefix, no Response suffix)
export const AmountSchema = z.object({
  value: zodNumber,
  currency: z.string(),
});

export const L2LevelSchema = z.object({
  price: zodNumber,
  size: zodNumber,
});

export const CandleSchema = z.object({
  start: zodNumber,
  low: zodNumber,
  high: zodNumber,
  open: zodNumber,
  close: zodNumber,
  volume: zodNumber,
});

export const PriceBookSchema = z.object({
  productId: z.string(),
  bids: z.array(L2LevelSchema),
  asks: z.array(L2LevelSchema),
  time: z.string().optional(),
});

// Types derived from schemas
export type Amount = z.output<typeof AmountSchema>;
export type L2Level = z.output<typeof L2LevelSchema>;
export type Candle = z.output<typeof CandleSchema>;
export type PriceBook = z.output<typeof PriceBookSchema>;
```

**Convert file to remove:** `common.convert.ts`

---

## Post-Migration Cleanup

After ALL services are migrated:

### 1. Remove Convert Files

```bash
# These files should no longer be needed
rm src/server/services/AccountsService.convert.ts
rm src/server/services/OrdersService.convert.ts
rm src/server/services/ProductsService.convert.ts
rm src/server/services/PortfoliosService.convert.ts
rm src/server/services/ConvertsService.convert.ts
rm src/server/services/common.convert.ts
# ... any others
```

### 2. Remove numberConversion.ts

The manual conversion functions are replaced by Zod preprocess:

```bash
rm src/server/services/numberConversion.ts
```

### 3. Verify No Convert Imports Remain

```bash
# Must return NO results
grep -r "from.*\.convert" src/
grep -r "toNumber\|toNumberRequired" src/server/services/
```

### 4. Update Types Files

Remove Sdk* type re-exports that are no longer needed:

```typescript
// Before
export type { SdkListOrdersResponse } from '@coinbase-sample/...';

// After - remove if no longer used
```

---

## Migration Checklist

- [ ] Create `schema.helpers.ts` with `zodNumber` and `zodNumberRequired`
- [ ] Create `common.schema.ts` with shared response schemas
- [ ] **AccountsService** - Add response schemas, update service, update tests
- [ ] **OrdersService** - Add response schemas, update service, update tests
- [ ] **ProductsService** - Add response schemas, update service, update tests
- [ ] **PublicService** - Add response schemas, update service, update tests
- [ ] **PortfoliosService** - Add response schemas, update service, update tests
- [ ] **FeesService** - Add response schemas, update service, update tests
- [ ] **FuturesService** - Add response schemas, update service, update tests
- [ ] **PerpetualsService** - Add response schemas, update service, update tests
- [ ] **ConvertsService** - Add response schemas, update service, update tests
- [ ] **DataService** - Add response schemas, update service, update tests
- [ ] **PaymentMethodsService** - Add response schemas, update service, update tests
- [ ] Remove all `*.convert.ts` files
- [ ] Remove `numberConversion.ts`
- [ ] Final verification - all commands pass

---

## Summary of Rules

### Do
- ✅ Use `z.preprocess()` for string→number conversion
- ✅ Use `z.number().finite()` for validation (handles NaN, Infinity)
- ✅ Use `zodNumber` for optional numeric fields
- ✅ Use `zodNumberRequired` for required numeric fields
- ✅ Use `z.number()` directly if API returns actual numbers (not strings)
- ✅ Update mocks to return raw API format (strings)
- ✅ Run all verification commands after each service
- ✅ Stop and ask if tests need significant changes

### Don't
- ❌ Use union types (`z.union([z.string(), z.number()])`) - assume strings
- ❌ Throw errors in preprocess - let `z.number().finite()` handle validation
- ❌ Remove convert files until service is fully migrated and tested
- ❌ Delete tests or expectations
- ❌ Change assertion values in tests

### Verification Commands (in order)
```bash
npm run format
npm run lint
npm run knip
npm run test:coverage
```

All must pass with zero warnings/errors and 100% coverage in all categories.
