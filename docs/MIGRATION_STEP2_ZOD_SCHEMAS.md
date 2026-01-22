# Migration Step 2: Zod Schema Extraction

## Goal

Extract Zod schemas from Tool files into dedicated `*Service.schema.ts` files and derive Request types from these schemas using `z.infer<>`.

**What changes:**
- New `*Service.schema.ts` files are created
- Request types in `*Service.types.ts` become `z.infer<typeof *RequestSchema>`
- Tool files import schemas from schema files instead of defining them inline

**What stays the same:**
- All Response types remain unchanged
- All conversion functions remain unchanged
- Service implementations remain unchanged
- Test logic remains unchanged (only imports may change)

## Prerequisites

- All verification commands must pass before starting

## Overview

### Current Structure
```
src/server/
├── services/
│   ├── AccountsService.ts
│   ├── AccountsService.types.ts      # Request types re-exported from SDK or manually defined
│   ├── AccountsService.convert.ts
│   └── ...
└── tools/
    ├── AccountToolRegistry.ts         # Contains inline Zod schemas
    └── ...
```

### Target Structure
```
src/server/
├── services/
│   ├── AccountsService.ts
│   ├── AccountsService.types.ts      # Request types = z.infer<typeof *RequestSchema>, enums defined here
│   ├── AccountsService.schema.ts     # NEW: Zod schemas live here
│   ├── AccountsService.convert.ts
│   └── ...
└── tools/
    ├── AccountToolRegistry.ts         # Imports schemas from schema files
    └── ...
```

---

## Phase 1: Verification

Before migrating, verify that each Tool's inputSchema matches its corresponding Request type.

### Verification Process

For each Tool file:
1. List all `inputSchema` definitions
2. Find the corresponding Request type in `*Service.types.ts`
3. Compare field names, types, and optionality
4. Document any discrepancies

### Expected Mappings

| Tool File | Tool Name | Request Type | Types File |
|-----------|-----------|--------------|------------|
| AccountToolRegistry | `list_accounts` | `ListAccountsRequest` | AccountsService.types.ts |
| AccountToolRegistry | `get_account` | `GetAccountRequest` | AccountsService.types.ts |
| OrderToolRegistry | `list_orders` | `ListOrdersRequest` | OrdersService.types.ts |
| OrderToolRegistry | `get_order` | `GetOrderRequest` | OrdersService.types.ts |
| OrderToolRegistry | `create_order` | `CreateOrderRequest` | OrdersService.types.ts |
| OrderToolRegistry | `cancel_orders` | `CancelOrdersRequest` | OrdersService.types.ts |
| OrderToolRegistry | `list_fills` | `ListFillsRequest` | OrdersService.types.ts |
| OrderToolRegistry | `edit_order` | `EditOrderRequest` | OrdersService.types.ts |
| OrderToolRegistry | `preview_edit_order` | `PreviewEditOrderRequest` | OrdersService.types.ts |
| OrderToolRegistry | `preview_order` | `PreviewOrderRequest` | OrdersService.types.ts |
| OrderToolRegistry | `close_position` | `ClosePositionRequest` | OrdersService.types.ts |
| ProductToolRegistry | `list_products` | `ListProductsRequest` | ProductsService.types.ts |
| ProductToolRegistry | `get_product` | `GetProductRequest` | ProductsService.types.ts |
| ProductToolRegistry | `get_product_book` | `GetProductBookRequest` | ProductsService.types.ts |
| ProductToolRegistry | `get_product_candles` | `GetProductCandlesRequest` | ProductsService.types.ts |
| ProductToolRegistry | `get_product_candles_batch` | `GetProductCandlesBatchRequest` | ProductsService.types.ts |
| ProductToolRegistry | `get_market_trades` | `GetProductMarketTradesRequest` | ProductsService.types.ts |
| ProductToolRegistry | `get_best_bid_ask` | `GetBestBidAskRequest` | ProductsService.types.ts |
| ProductToolRegistry | `get_market_snapshot` | `GetMarketSnapshotRequest` | ProductsService.types.ts |
| PublicToolRegistry | `get_server_time` | (none) | - |
| PublicToolRegistry | `get_public_product` | `GetPublicProductRequest` | PublicService.types.ts |
| PublicToolRegistry | `list_public_products` | `ListPublicProductsRequest` | PublicService.types.ts |
| PublicToolRegistry | `get_public_product_book` | `GetPublicProductBookRequest` | PublicService.types.ts |
| PublicToolRegistry | `get_public_product_candles` | `GetPublicProductCandlesRequest` | PublicService.types.ts |
| PublicToolRegistry | `get_public_market_trades` | `GetPublicMarketTradesRequest` | PublicService.types.ts |
| PortfolioToolRegistry | `list_portfolios` | `ListPortfoliosRequest` | PortfoliosService.types.ts |
| PortfolioToolRegistry | `get_portfolio` | `GetPortfolioRequest` | PortfoliosService.types.ts |
| PortfolioToolRegistry | `create_portfolio` | `CreatePortfolioRequest` | PortfoliosService.types.ts |
| PortfolioToolRegistry | `edit_portfolio` | `EditPortfolioRequest` | PortfoliosService.types.ts |
| PortfolioToolRegistry | `delete_portfolio` | `DeletePortfolioRequest` | PortfoliosService.types.ts |
| PortfolioToolRegistry | `move_portfolio_funds` | `MovePortfolioFundsRequest` | PortfoliosService.types.ts |
| FeeToolRegistry | `get_transaction_summary` | `GetTransactionsSummaryRequest` | FeesService.types.ts |
| FuturesToolRegistry | `list_futures_positions` | (none) | - |
| FuturesToolRegistry | `get_futures_position` | `GetFuturesPositionRequest` | FuturesService.types.ts |
| FuturesToolRegistry | `get_futures_balance_summary` | (none) | - |
| FuturesToolRegistry | `list_futures_sweeps` | (none) | - |
| PerpetualsToolRegistry | `list_perp_positions` | `ListPerpetualsPositionsRequest` | PerpetualsService.types.ts |
| PerpetualsToolRegistry | `get_perp_position` | `GetPerpetualsPositionRequest` | PerpetualsService.types.ts |
| PerpetualsToolRegistry | `get_perp_portfolio_summary` | `GetPerpetualsPortfolioSummaryRequest` | PerpetualsService.types.ts |
| PerpetualsToolRegistry | `get_perp_portfolio_balance` | `GetPerpetualsPortfolioBalanceRequest` | PerpetualsService.types.ts |
| ConvertToolRegistry | `create_convert_quote` | `CreateConvertQuoteRequest` | ConvertsService.types.ts |
| ConvertToolRegistry | `commit_convert_trade` | `CommitConvertTradeRequest` | ConvertsService.types.ts |
| ConvertToolRegistry | `get_convert_trade` | `GetConvertTradeRequest` | ConvertsService.types.ts |
| DataToolRegistry | `get_api_key_permissions` | (none) | - |
| PaymentToolRegistry | `list_payment_methods` | (none) | - |
| PaymentToolRegistry | `get_payment_method` | `GetPaymentMethodRequest` | PaymentMethodsService.types.ts |

**Note:** Tools with "(none)" have no request parameters or use an empty object.

### Discrepancy Handling (CRITICAL)

If ANY discrepancy is found between a Tool's inputSchema and its Request type, the agent **MUST stop immediately** and ask the user.

The agent must present options, for example:

> **Discrepancy found in `OrderToolRegistry.create_order`:**
> - inputSchema has field `clientOrderId` (required)
> - `CreateOrderRequest` type has field `clientOrderId` (optional)
>
> **Options:**
> 1. Make the schema field optional to match the type
> 2. Keep the schema field required and update the type
> 3. Investigate further before deciding
> 4. Other (please specify)

**Types of discrepancies to watch for:**
- Field exists in schema but not in type (or vice versa)
- Field is required in one but optional in the other
- Field has different type (e.g., `string` vs `number`)
- Enum values differ

**Do NOT assume or auto-resolve discrepancies.**

---

## Phase 2: Schema File Creation

### Core Principle: Move, Don't Modify

The schemas from Tool files must be **moved exactly as they are** to the schema files. The only changes allowed are:
1. Adding a name (e.g., `GetAccountRequestSchema`)
2. Adding `export`

**Every field MUST have a `.describe()` call.** If a field in the Tool's inputSchema already has a description, preserve it exactly. If a field lacks a description, this is a discrepancy that must be reported.

### Schema File Structure

Each `*Service.schema.ts` file should follow this pattern:

```typescript
// src/server/services/AccountsService.schema.ts
import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListAccountsRequestSchema = z.object({
  limit: z.number().optional().describe('Maximum number of accounts to return'),
  cursor: z.string().optional().describe('Pagination cursor for next page'),
  retailPortfolioId: z.string().optional().describe('Filter by retail portfolio ID'),
});

export const GetAccountRequestSchema = z.object({
  accountUuid: z.string().describe('The UUID of the account to retrieve'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListAccountsRequest = z.infer<typeof ListAccountsRequestSchema>;
export type GetAccountRequest = z.infer<typeof GetAccountRequestSchema>;
```

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Schema constant | `*RequestSchema` | `GetAccountRequestSchema` |
| Type | `*Request` | `GetAccountRequest` |
| File | `*Service.schema.ts` | `AccountsService.schema.ts` |

### Enum Handling

Enums must be defined locally, **NOT imported from `@coinbase-sample/advanced-trade-sdk-ts`**.

If an enum is used in a schema:
1. Check if the enum already exists in the corresponding `*Service.types.ts`
2. If it exists, import it from there
3. If it does NOT exist, define it in `*Service.types.ts` first, then import it

**Example:**

```typescript
// OrdersService.types.ts
export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
  UNKNOWN_ORDER_SIDE = 'UNKNOWN_ORDER_SIDE',
}

export enum StopPriceDirection {
  STOP_DIRECTION_STOP_UP = 'STOP_DIRECTION_STOP_UP',
  STOP_DIRECTION_STOP_DOWN = 'STOP_DIRECTION_STOP_DOWN',
}
```

```typescript
// OrdersService.schema.ts
import { z } from 'zod';
import { OrderSide, StopPriceDirection } from './OrdersService.types';

export const CreateOrderRequestSchema = z.object({
  clientOrderId: z.string().describe('Unique client order ID'),
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
  side: z.nativeEnum(OrderSide).describe('Order side'),
  orderConfiguration: OrderConfigurationSchema,
});
```

### Nested Schemas

For complex nested structures (like `OrderConfiguration`), move the sub-schemas exactly as defined in the Tool file:

```typescript
// Moved from OrderToolRegistry.ts - DO NOT MODIFY the structure
const MarketMarketIocSchema = z
  .object({
    quoteSize: z.number().optional().describe('Quote size for market order'),
    baseSize: z.number().optional().describe('Base size for market order'),
  })
  .optional();

const LimitLimitGtcSchema = z
  .object({
    baseSize: z.number().describe('Base size for limit order'),
    limitPrice: z.number().describe('Limit price'),
    postOnly: z.boolean().optional().describe('Post-only flag'),
  })
  .optional();

// ... other sub-schemas exactly as in Tool file

export const OrderConfigurationSchema = z
  .object({
    marketMarketIoc: MarketMarketIocSchema,
    limitLimitGtc: LimitLimitGtcSchema,
    // ... other configurations exactly as in Tool file
  })
  .describe('Order configuration (marketMarketIoc, limitLimitGtc, etc.)');
```

---

## Phase 3: Types File Updates

### Update Pattern

**Before (`AccountsService.types.ts`):**
```typescript
// Re-export request types unchanged
export type {
  ListAccountsRequest,
  GetAccountRequest,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/accounts/types';
```

**After (`AccountsService.types.ts`):**
```typescript
// Request types derived from schemas
export type {
  ListAccountsRequest,
  GetAccountRequest,
} from './AccountsService.schema';
```

### Types That Stay in `.types.ts`

The following should remain in `.types.ts` files (NOT moved to schema files):
- Response types (e.g., `ListAccountsResponse`, `GetAccountResponse`)
- SDK type re-exports for conversion (e.g., `SdkListAccountsResponse`)
- Domain model types (e.g., `Account`, `Order`, `Product`)
- **Enums** (defined here, not in schema files)

### Types That Move to `.schema.ts`

- All Request types become `z.infer<typeof *RequestSchema>`
- Complex nested types used in requests (e.g., `OrderConfiguration`)

---

## Phase 4: Tool File Updates

### Update Pattern

**Before (`AccountToolRegistry.ts`):**
```typescript
import * as z from 'zod';

// ... in register():
this.server.registerTool(
  'get_account',
  {
    title: 'Get Account',
    description: 'Get details of a specific account by UUID',
    inputSchema: {
      accountUuid: z.string().describe('The UUID of the account to retrieve'),
    },
  },
  this.call(this.accounts.getAccount.bind(this.accounts)),
);
```

**After (`AccountToolRegistry.ts`):**
```typescript
import { GetAccountRequestSchema } from '../services/AccountsService.schema';

// ... in register():
this.server.registerTool(
  'get_account',
  {
    title: 'Get Account',
    description: 'Get details of a specific account by UUID',
    inputSchema: GetAccountRequestSchema.shape,
  },
  this.call(this.accounts.getAccount.bind(this.accounts)),
);
```

---

## Service-by-Service Migration Guide

### 1. AccountsService

**New file:** `src/server/services/AccountsService.schema.ts`

**Schemas to create:**
- `ListAccountsRequestSchema` (optional fields: limit, cursor, retailPortfolioId)
- `GetAccountRequestSchema` (required: accountUuid)

**Tool file:** `AccountToolRegistry.ts`

---

### 2. OrdersService

**New file:** `src/server/services/OrdersService.schema.ts`

**Enums to define in `OrdersService.types.ts` (if not already present):**
- `OrderSide`
- `StopPriceDirection`

**Schemas to create:**
- `MarketMarketIocSchema`
- `LimitLimitGtcSchema`
- `LimitLimitGtdSchema`
- `LimitLimitFokSchema`
- `SorLimitIocSchema`
- `StopLimitStopLimitGtcSchema`
- `StopLimitStopLimitGtdSchema`
- `TriggerBracketGtcSchema`
- `TriggerBracketGtdSchema`
- `OrderConfigurationSchema`
- `ListOrdersRequestSchema`
- `GetOrderRequestSchema`
- `CreateOrderRequestSchema`
- `CancelOrdersRequestSchema`
- `ListFillsRequestSchema`
- `EditOrderRequestSchema`
- `PreviewEditOrderRequestSchema`
- `PreviewOrderRequestSchema`
- `ClosePositionRequestSchema`

**Tool file:** `OrderToolRegistry.ts`

**Note:** The `orderConfigurationSchema` is already defined in `OrderToolRegistry.ts`. Move it exactly as-is to the schema file.

---

### 3. ProductsService

**New file:** `src/server/services/ProductsService.schema.ts`

**Enums to define in `ProductsService.types.ts` (if not already present):**
- `ProductType`
- `Granularity` (already exists)

**Schemas to create:**
- `ListProductsRequestSchema`
- `GetProductRequestSchema`
- `GetProductBookRequestSchema`
- `GetProductCandlesRequestSchema`
- `GetProductCandlesBatchRequestSchema`
- `GetProductMarketTradesRequestSchema`
- `GetBestBidAskRequestSchema`
- `GetMarketSnapshotRequestSchema`

**Tool file:** `ProductToolRegistry.ts`

---

### 4. PublicService

**New file:** `src/server/services/PublicService.schema.ts`

**Schemas to create:**
- `GetPublicProductRequestSchema`
- `ListPublicProductsRequestSchema`
- `GetPublicProductBookRequestSchema`
- `GetPublicProductCandlesRequestSchema`
- `GetPublicMarketTradesRequestSchema`

**Tool file:** `PublicToolRegistry.ts`

---

### 5. PortfoliosService

**New file:** `src/server/services/PortfoliosService.schema.ts`

**Schemas to create:**
- `ListPortfoliosRequestSchema`
- `GetPortfolioRequestSchema`
- `CreatePortfolioRequestSchema`
- `EditPortfolioRequestSchema`
- `DeletePortfolioRequestSchema`
- `MovePortfolioFundsRequestSchema`

**Tool file:** `PortfolioToolRegistry.ts`

---

### 6. FeesService

**New file:** `src/server/services/FeesService.schema.ts`

**Schemas to create:**
- `GetTransactionsSummaryRequestSchema`

**Tool file:** `FeeToolRegistry.ts`

---

### 7. FuturesService

**New file:** `src/server/services/FuturesService.schema.ts`

**Schemas to create:**
- `GetFuturesPositionRequestSchema`

**Tool file:** `FuturesToolRegistry.ts`

**Note:** Most Futures tools have no request parameters.

---

### 8. PerpetualsService

**New file:** `src/server/services/PerpetualsService.schema.ts`

**Schemas to create:**
- `ListPerpetualsPositionsRequestSchema`
- `GetPerpetualsPositionRequestSchema`
- `GetPerpetualsPortfolioSummaryRequestSchema`
- `GetPerpetualsPortfolioBalanceRequestSchema`

**Tool file:** `PerpetualsToolRegistry.ts`

---

### 9. ConvertsService

**New file:** `src/server/services/ConvertsService.schema.ts`

**Schemas to create:**
- `CreateConvertQuoteRequestSchema`
- `CommitConvertTradeRequestSchema`
- `GetConvertTradeRequestSchema`

**Tool file:** `ConvertToolRegistry.ts`

---

### 10. DataService

**New file:** `src/server/services/DataService.schema.ts`

**Schemas to create:**
- (none - `get_api_key_permissions` has no parameters)

**Tool file:** `DataToolRegistry.ts`

---

### 11. PaymentMethodsService

**New file:** `src/server/services/PaymentMethodsService.schema.ts`

**Schemas to create:**
- `GetPaymentMethodRequestSchema`

**Tool file:** `PaymentToolRegistry.ts`

---

### 12. IndicatorToolRegistry & AnalysisToolRegistry

These tools use `TechnicalIndicatorsService` and `TechnicalAnalysisService` which don't have SDK dependencies. Review if they need schema files or if their schemas can remain inline.

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

### Only Imports May Change

Tests may need to update imports if Request types move from `.types.ts` to `.schema.ts`, but:

- ❌ Test logic MUST NOT change
- ❌ Test assertions MUST NOT change
- ❌ Mock implementations MUST NOT change (unless import paths change)
- ✅ Import statements MAY change

### Example of Allowed Change

**Before:**
```typescript
import type { GetAccountRequest } from '../services/AccountsService.types';
```

**After:**
```typescript
import type { GetAccountRequest } from '../services/AccountsService.schema';
```

### Edge Cases

If the agent encounters a situation where test changes beyond imports seem necessary, the agent **MUST stop and ask the user**.

---

## Migration Checklist

- [ ] **Phase 1: Verification** - Compare all inputSchemas with Request types
- [ ] **AccountsService** - Create schema file, update types, update tool
- [ ] **OrdersService** - Define enums, create schema file, update types, update tool
- [ ] **ProductsService** - Define enums, create schema file, update types, update tool
- [ ] **PublicService** - Create schema file, update types, update tool
- [ ] **PortfoliosService** - Create schema file, update types, update tool
- [ ] **FeesService** - Create schema file, update types, update tool
- [ ] **FuturesService** - Create schema file, update types, update tool
- [ ] **PerpetualsService** - Create schema file, update types, update tool
- [ ] **ConvertsService** - Create schema file, update types, update tool
- [ ] **DataService** - Create schema file (if needed), update tool
- [ ] **PaymentMethodsService** - Create schema file, update types, update tool
- [ ] **IndicatorToolRegistry** - Review and migrate if needed
- [ ] **AnalysisToolRegistry** - Review and migrate if needed
- [ ] **Final verification** - All commands pass, no SDK Request type imports remain

---

## Summary of Rules

### Do
- ✅ Verify inputSchemas match Request types before migrating
- ✅ **Stop and ask** when discrepancies are found (present options)
- ✅ Move schemas exactly as they are (only add name and export)
- ✅ Ensure every field has a `.describe()` call
- ✅ Define enums in `*Service.types.ts`, NOT import from SDK
- ✅ Create `*Service.schema.ts` files for Zod schemas
- ✅ Use `z.infer<typeof *RequestSchema>` for Request types
- ✅ Run all verification commands after each service

### Don't
- ❌ Modify schema structure when moving (only name and export)
- ❌ Import enums from `@coinbase-sample/advanced-trade-sdk-ts`
- ❌ Remove or change `.describe()` calls
- ❌ Modify Response types
- ❌ Modify conversion functions
- ❌ Modify Service implementations
- ❌ Change test logic or assertions
- ❌ Auto-resolve discrepancies without asking

### Verification Commands (in order)
```bash
npm run format
npm run lint
npm run knip
npm run test:coverage
```

All must pass with zero warnings/errors and 100% coverage in all categories.
