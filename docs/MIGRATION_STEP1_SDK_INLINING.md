# Migration Step 1: SDK Service Inlining

## Goal

Replace SDK service method calls (`this.sdk.method()`) with direct `this.client.request()` calls.

**What changes:** The internal implementation of each service method.
**What stays the same:** All types, conversion functions, and public method signatures.

## Prerequisites

- The `CoinbaseAdvTradeClient` is kept (it handles authentication and camelCase conversion)
- All existing `.types.ts` and `.convert.ts` files remain unchanged
- All tests must pass after migration

## SDK Source Code Reference

The original SDK TypeScript source code is available at:
https://github.com/coinbase-samples/advanced-sdk-ts/tree/main/src/rest

**Important:** Before migrating each service, the agent MUST look at the original SDK implementation to understand the exact request structure. The transpiled JavaScript in `node_modules/@coinbase-sample/advanced-trade-sdk-ts/dist/rest/` can also be used as reference.

| Service | SDK Source |
|---------|------------|
| AccountsService | [accounts/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/accounts/index.ts) |
| OrdersService | [orders/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/orders/index.ts) |
| ProductsService | [products/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/products/index.ts) |
| PublicService | [public/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/public/index.ts) |
| PortfoliosService | [portfolios/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/portfolios/index.ts) |
| FeesService | [fees/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/fees/index.ts) |
| FuturesService | [futures/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/futures/index.ts) |
| PerpetualsService | [perpetuals/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/perpetuals/index.ts) |
| ConvertsService | [convert/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/convert/index.ts) |
| DataService | [data/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/data/index.ts) |
| PaymentMethodsService | [paymentMethods/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/paymentMethods/index.ts) |

---

## Verification Requirements

After migrating each service, run the following commands in order:

```bash
npm run format          # Fix formatting issues
npm run lint            # Must have NO warnings/errors
npm run knip            # Must have NO warnings/errors (unused exports/dependencies)
npm run test:coverage   # All tests must pass, 100% coverage in ALL categories
```

### Post-Migration Verification

After ALL services are migrated, verify that no SDK service imports remain:

```bash
# Must return NO results
grep -r "as SdkAccountsService\|as SdkOrdersService\|as SdkProductsService\|as SdkPublicService\|as SdkPortfoliosService\|as SdkFeesService\|as SdkFuturesService\|as SdkPerpetualsService\|as SdkConvertsService\|as SdkDataService\|as SdkPaymentMethodsService" src/

# Must return NO results (SDK service class imports)
grep -r "AccountsService as Sdk\|OrdersService as Sdk\|ProductsService as Sdk\|PublicService as Sdk\|PortfoliosService as Sdk\|FeesService as Sdk\|FuturesService as Sdk\|PerpetualsService as Sdk\|ConvertsService as Sdk\|DataService as Sdk\|PaymentMethodsService as Sdk" src/

# Alternative: search for any remaining SDK service instantiation
grep -r "new Sdk.*Service" src/
```

---

## Test Rules (CRITICAL)

### Tests MUST NOT be deleted

Tests may be **adapted** (e.g., mocks may need to change), but they must **never be removed**.

### Expectations MUST NOT be removed

Test expectations (assertions) may be **adapted structurally**, but their **content must not change**. For example:
- ✅ OK: Change mock setup to match new implementation
- ✅ OK: Adjust how a mock is called if the internal structure changes
- ❌ NOT OK: Remove an `expect()` statement
- ❌ NOT OK: Change what value is being asserted

### Edge Cases

If the agent encounters a situation where it seems necessary to:
- Delete a test
- Remove an expectation
- Significantly change what is being tested

The agent **MUST stop and ask the user** by presenting options. Do not proceed without explicit approval.

---

## How to Migrate a Method

### Pattern: SDK Service Call → Direct Client Request

**Before:**
```typescript
public async someMethod(request: SomeRequest): Promise<SomeResponse> {
  const sdkResponse = (await this.sdk.someMethod(request)) as SdkSomeResponse;
  return toSomeResponse(sdkResponse);
}
```

**After:**
```typescript
public async someMethod(request: SomeRequest): Promise<SomeResponse> {
  const sdkResponse = (
    await this.client.request({
      url: 'endpoint_path',
      queryParams: request,  // or bodyParams for POST/PUT/DELETE
    })
  ).data as SdkSomeResponse;
  return toSomeResponse(sdkResponse);
}
```

### Constructor Change

Each service needs to store the client directly instead of creating an SDK service:

**Before:**
```typescript
import { SomeService as SdkSomeService, CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';

export class SomeService {
  private readonly sdk: SdkSomeService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkSomeService(client);
  }
}
```

**After:**
```typescript
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';

export class SomeService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}
}
```

### HTTP Methods

For non-GET requests, import and use `Method` enum:

```typescript
import { Method } from '@coinbase-sample/core-ts';

// POST
await this.client.request({
  url: 'endpoint',
  method: Method.POST,
  bodyParams: request,
});

// PUT
await this.client.request({
  url: 'endpoint',
  method: Method.PUT,
  bodyParams: request,
});

// DELETE
await this.client.request({
  url: 'endpoint',
  method: Method.DELETE,
});
```

---

## Service-by-Service Migration Guide

### 1. AccountsService

**File:** `src/server/services/AccountsService.ts`
**SDK Source:** [accounts/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/accounts/index.ts)

| Method | URL | Params | Notes |
|--------|-----|--------|-------|
| `listAccounts(request?)` | `accounts` | `queryParams: request` | |
| `getAccount(request)` | `accounts/${request.accountUuid}` | - | URL param |

**Example:**
```typescript
public async listAccounts(request?: ListAccountsRequest): Promise<ListAccountsResponse> {
  const sdkResponse = (
    await this.client.request({
      url: 'accounts',
      queryParams: request ?? {},
    })
  ).data as SdkListAccountsResponse;
  return toListAccountsResponse(sdkResponse);
}

public async getAccount(request: GetAccountRequest): Promise<GetAccountResponse> {
  const sdkResponse = (
    await this.client.request({
      url: `accounts/${request.accountUuid}`,
    })
  ).data as SdkGetAccountResponse;
  return toGetAccountResponse(sdkResponse);
}
```

---

### 2. OrdersService

**File:** `src/server/services/OrdersService.ts`
**SDK Source:** [orders/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/orders/index.ts)

| Method | URL | HTTP | Params | Notes |
|--------|-----|------|--------|-------|
| `listOrders(request?)` | `orders/historical/batch` | GET | `queryParams: request` | |
| `listFills(request?)` | `orders/historical/fills` | GET | `queryParams: request` | |
| `getOrder(request)` | `orders/historical/${request.orderId}` | GET | - | URL param |
| `createOrder(request)` | `orders` | POST | `bodyParams: toSdkCreateOrderRequest(request)` | Uses converter |
| `createOrderPreview(request)` | `orders/preview` | POST | `bodyParams: toSdkPreviewOrderRequest(request)` | Uses converter |
| `closePosition(request)` | `orders/close_position` | POST | `bodyParams: toSdkClosePositionRequest(request)` | Uses converter |
| `cancelOrders(request)` | `orders/batch_cancel` | POST | `bodyParams: request` | |
| `editOrder(request)` | `orders/edit` | POST | `bodyParams: toSdkEditOrderRequest(request)` | Uses converter |
| `editOrderPreview(request)` | `orders/edit_preview` | POST | `bodyParams: toSdkPreviewEditOrderRequest(request)` | Uses converter |

---

### 3. ProductsService

**File:** `src/server/services/ProductsService.ts`
**SDK Source:** [products/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/products/index.ts)

| Method | URL | Params | Notes |
|--------|-----|--------|-------|
| `listProducts(request?)` | `products` | `queryParams: request` | |
| `getProduct(request)` | `products/${request.productId}` | `queryParams: { getTradabilityStatus }` | Special: extract getTradabilityStatus |
| `getProductCandles(request)` | `products/${request.productId}/candles` | `queryParams: { start, end, granularity, limit }` | Uses `toSdkGetProductCandlesRequest` |
| `getProductBook(request)` | `product_book` | `queryParams: request` | |
| `getBestBidAsk(request?)` | `best_bid_ask` | `queryParams: { productIds: request.productIds.join(',') }` | **Special: array join** |
| `getProductMarketTrades(request)` | `products/${request.productId}/ticker` | `queryParams: request` | |

**Special handling for getBestBidAsk:**
```typescript
public async getBestBidAsk(request?: GetBestBidAskRequest): Promise<GetBestBidAskResponse> {
  let queryParams = {};
  if (request?.productIds) {
    queryParams = {
      productIds: request.productIds.join(','),
    };
  }
  const sdkResponse = (
    await this.client.request({
      url: 'best_bid_ask',
      queryParams,
    })
  ).data as SdkGetBestBidAskResponse;
  return toGetBestBidAskResponse(sdkResponse);
}
```

**Special handling for getProduct:**
```typescript
public async getProduct(request: GetProductRequest): Promise<GetProductResponse> {
  let queryParams = {};
  if (request.getTradabilityStatus) {
    queryParams = {
      getTradabilityStatus: request.getTradabilityStatus,
    };
  }
  const sdkResponse = (
    await this.client.request({
      url: `products/${request.productId}`,
      queryParams,
    })
  ).data as SdkGetProductResponse;
  return toGetProductResponse(sdkResponse);
}
```

**Special handling for getProductCandles:**
```typescript
public async getProductCandles(request: GetProductCandlesRequest): Promise<GetProductCandlesResponse> {
  const sdkRequest = toSdkGetProductCandlesRequest(request);
  const queryParams = {
    start: sdkRequest.start,
    end: sdkRequest.end,
    granularity: sdkRequest.granularity,
    limit: sdkRequest.limit || 350,
  };
  const sdkResponse = (
    await this.client.request({
      url: `products/${request.productId}/candles`,
      queryParams,
    })
  ).data as SdkGetProductCandlesResponse;
  return toGetProductCandlesResponse(sdkResponse);
}
```

---

### 4. PublicService

**File:** `src/server/services/PublicService.ts`
**SDK Source:** [public/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/public/index.ts)

| Method | URL | Params | Notes |
|--------|-----|--------|-------|
| `getServerTime()` | `time` | - | |
| `listProducts(request?)` | `market/products` | `queryParams: request` | |
| `getProduct(request)` | `market/products/${request.productId}` | - | |
| `getProductBook(request)` | `market/product_book` | `queryParams: request` | |
| `getProductCandles(request)` | `market/products/${request.productId}/candles` | `queryParams: toSdkGetPublicProductCandlesRequest(request)` | Uses converter |
| `getProductMarketTrades(request)` | `market/products/${request.productId}/ticker` | `queryParams: request` | |

---

### 5. PortfoliosService

**File:** `src/server/services/PortfoliosService.ts`
**SDK Source:** [portfolios/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/portfolios/index.ts)

| Method | URL | HTTP | Params | Notes |
|--------|-----|------|--------|-------|
| `listPortfolios(request?)` | `portfolios` | GET | `queryParams: request` | |
| `getPortfolio(request)` | `portfolios/${request.portfolioUuid}` | GET | - | |
| `createPortfolio(request)` | `portfolios` | POST | `bodyParams: request` | |
| `deletePortfolio(request)` | `portfolios/${request.portfolioUuid}` | DELETE | - | |
| `editPortfolio(request)` | `portfolios/${request.portfolioUuid}` | PUT | `bodyParams: { ...request, portfolioUuid: undefined }` | **Special: remove portfolioUuid from body** |
| `movePortfolioFunds(request)` | `portfolios/move_funds` | POST | `bodyParams: toSdkMovePortfolioFundsRequest(request)` | Uses converter |

**Special handling for editPortfolio:**
```typescript
public async editPortfolio(request: EditPortfolioRequest): Promise<EditPortfolioResponse> {
  const sdkResponse = (
    await this.client.request({
      url: `portfolios/${request.portfolioUuid}`,
      method: Method.PUT,
      bodyParams: { ...request, portfolioUuid: undefined },
    })
  ).data as SdkEditPortfolioResponse;
  return toEditPortfolioResponse(sdkResponse);
}
```

---

### 6. FeesService

**File:** `src/server/services/FeesService.ts`
**SDK Source:** [fees/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/fees/index.ts)

| Method | URL | Params | Notes |
|--------|-----|--------|-------|
| `getTransactionSummary(request)` | `transaction_summary` | `queryParams: request` | |

---

### 7. FuturesService

**File:** `src/server/services/FuturesService.ts`
**SDK Source:** [futures/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/futures/index.ts)

| Method | URL | Params | Notes |
|--------|-----|--------|-------|
| `listPositions()` | `cfm/positions` | - | |
| `getPosition(request)` | `cfm/positions/${request.productId}` | - | |
| `getBalanceSummary()` | `cfm/balance_summary` | - | |
| `listSweeps()` | `cfm/sweeps` | - | |

---

### 8. PerpetualsService

**File:** `src/server/services/PerpetualsService.ts`
**SDK Source:** [perpetuals/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/perpetuals/index.ts)

| Method | URL | Params | Notes |
|--------|-----|--------|-------|
| `listPositions(request)` | `intx/positions/${request.portfolioUuid}` | - | |
| `getPosition(request)` | `intx/positions/${request.portfolioUuid}/${request.symbol}` | - | |
| `getPortfolioSummary(request)` | `intx/portfolio/${request.portfolioUuid}` | - | |
| `getPortfolioBalance(request)` | `intx/balances/${request.portfolioUuid}` | - | |

---

### 9. ConvertsService

**File:** `src/server/services/ConvertsService.ts`
**SDK Source:** [convert/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/convert/index.ts)

| Method | URL | HTTP | Params | Notes |
|--------|-----|------|--------|-------|
| `createConvertQuote(request)` | `convert/quote` | POST | `bodyParams: toSdkCreateConvertQuoteRequest(request)` | Uses converter |
| `commitConvertTrade(request)` | `convert/trade/${request.tradeId}` | POST | `bodyParams: request` | |
| `getConvertTrade(request)` | `convert/trade/${request.tradeId}` | GET | `queryParams: { fromAccount, toAccount }` | **Special: extract params** |

**Special handling for getConvertTrade:**
```typescript
public async getConvertTrade(request: GetConvertTradeRequest): Promise<GetConvertTradeResponse> {
  const queryParams = {
    fromAccount: request.fromAccount,
    toAccount: request.toAccount,
  };
  const sdkResponse = (
    await this.client.request({
      url: `convert/trade/${request.tradeId}`,
      queryParams,
    })
  ).data as SdkGetConvertTradeResponse;
  return toGetConvertTradeResponse(sdkResponse);
}
```

---

### 10. DataService

**File:** `src/server/services/DataService.ts`
**SDK Source:** [data/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/data/index.ts)

| Method | URL | Params | Notes |
|--------|-----|--------|-------|
| `getAPIKeyPermissions()` | `key_permissions` | - | |

---

### 11. PaymentMethodsService

**File:** `src/server/services/PaymentMethodsService.ts`
**SDK Source:** [paymentMethods/index.ts](https://github.com/coinbase-samples/advanced-sdk-ts/blob/main/src/rest/paymentMethods/index.ts)

| Method | URL | Params | Notes |
|--------|-----|--------|-------|
| `listPaymentMethods()` | `payment_methods` | - | |
| `getPaymentMethod(request)` | `payment_methods/${request.paymentMethodId}` | - | |

---

## Migration Checklist

For each service:

- [ ] **AccountsService** (2 methods)
- [ ] **OrdersService** (9 methods)
- [ ] **ProductsService** (6 methods + 2 composite methods that use other methods)
- [ ] **PublicService** (6 methods)
- [ ] **PortfoliosService** (6 methods)
- [ ] **FeesService** (1 method)
- [ ] **FuturesService** (4 methods)
- [ ] **PerpetualsService** (4 methods)
- [ ] **ConvertsService** (3 methods)
- [ ] **DataService** (1 method)
- [ ] **PaymentMethodsService** (2 methods)

**Total: 44 methods to migrate**

---

## Summary of Rules

### Do
- ✅ Look at SDK source code before migrating each method
- ✅ Run all verification commands after each service
- ✅ Adapt test mocks if needed
- ✅ Keep all existing type casts (`as SdkXxxResponse`)

### Don't
- ❌ Modify `.types.ts` or `.convert.ts` files
- ❌ Change public method signatures
- ❌ Delete tests
- ❌ Remove test expectations
- ❌ Leave any SDK service imports after migration
- ❌ Proceed with edge cases without asking

### Verification Commands (in order)
```bash
npm run format
npm run lint
npm run knip
npm run test:coverage
```

All must pass with zero warnings/errors and 100% coverage in all categories.
