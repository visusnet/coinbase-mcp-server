# Plan: Vereinheitlichung der Zahlen-Typen (v6)

## Meta-Information

Dieser Plan wurde erstellt basierend auf folgendem Prompt:

> **Thema**: Vereinheitlichung der Zahlen-Typen.
>
> **Aktuell**: Der MCP Server erwartet bei vielen Zahlen (Fließkommazahlen und Integer-Werte) momentan strings. Das ist historisch bedingt, denn die Coinbase-API arbeitet an vielen Stellen mit strings.
>
> **Ziel**: Alle "unsere" Typen sollen für Variablen, die Zahlen enthalten number statt string verwenden. Das bedeutet, dass wir die Coinbase SDK Services nicht mehr direkt im CoinbaseMcpServer verwenden sollten, sondern eigene Services, die die Coinbase SDK Services intern verwenden.

**Akzeptanzkriterien aus dem Prompt:**
- Alle MCP Tool Schemas nutzen für Zahlenwerte nicht mehr z.string, sondern z.number.
- Zu jedem Coinbase SDK Service gibt es einen eigenen Service, der jede verwendete Methode an den Coinbase SDK Service delegiert und dabei die string Typen ggf. zu number ändert.
- Die bestehenden eigenen Services erweitern nicht länger die Coinbase SDK Services, sondern delegieren.
- Alle Qualitätskriterien sind erfüllt (100% Coverage, lint, types, knip).
- Es gibt nur einen Commit für diese Änderungen.
- Es wurden keine Tests gelöscht, maximal auf neue Methodensignaturen und ggf. Mocks angepasst.
- Hilfsmethoden, Indikator-Berechnungen, etc. verwenden number konsistent.
- **Jede Funktion und jede Methode MUSS den Return Type explizit angeben.**

---

## Code Review Historie

### v1 → v2
- Pragmatischer Ansatz statt Over-Engineering
- Einfache Konvertierungsfunktionen statt komplexer Mapper
- Kein Response-Mapping (außer Candles)

### v2 → v3
- CRITICAL: Referenz auf nicht-existierende `serviceMocks.ts` entfernt
- MAJOR: `mapApiCandlesToInput` in TechnicalAnalysisService.ts explizit dokumentiert
- MAJOR: Import-Pfad-Änderungen bei Verschiebung explizit gelistet
- MAJOR: Naming bei ProductsService/PublicService Delegation geklärt
- MINOR: parseFloat durch Number() ersetzt für strikte Validierung
- MINOR: Platzierung von mapSdkCandleToInput geklärt (in numberConversion.ts)
- MINOR: Test-Datei-Liste vervollständigt
- MINOR: Wrapper-Tests-Strategie dokumentiert

### v3 → v4
- MAJOR: Service-Instantiierung korrigiert (Wrapper erhalten `CoinbaseAdvTradeClient`, erstellen intern SDK-Service)
- MAJOR: ProductsService vollständige Methodenliste dokumentiert (10 Methoden)
- MAJOR: PublicService vollständige Methodenliste dokumentiert (7 Methoden)
- MINOR: Test-Coverage-Strategie für Wrapper detaillierter dokumentiert

### v4 → v5
- MAJOR: Explizites PublicService Wrapper-Beispiel mit korrektem Import-Pfad (`@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js` statt `dist/index.js`)
- MINOR: Explizite Dokumentation der `getProducts()` Methodenanpassung (von `getProductFixed()` auf `getProduct()`)

### v5 → v6
- MAJOR: Neues Akzeptanzkriterium hinzugefügt: Jede Funktion und Methode MUSS expliziten Return Type haben
- MAJOR: Alle Code-Beispiele im Plan aktualisiert mit expliziten Return Types

---

## 1. Analyse des Ist-Zustands

### 1.1 Direkt verwendete Coinbase SDK Services

| SDK Service | Tool Registry | Numerische Request-Parameter | Wrapper nötig? |
|-------------|---------------|------------------------------|----------------|
| `AccountsService` | `AccountToolRegistry` | Keine | Ja (Akzeptanzkriterium) |
| `OrdersService` | `OrderToolRegistry` | baseSize, quoteSize, limitPrice, stopPrice, etc. | **Ja** |
| `ConvertsService` | `ConvertToolRegistry` | amount | **Ja** |
| `FeesService` | `FeeToolRegistry` | Keine | Ja (Akzeptanzkriterium) |
| `PaymentMethodsService` | `PaymentToolRegistry` | Keine | Ja (Akzeptanzkriterium) |
| `PortfoliosService` | `PortfolioToolRegistry` | funds.value | **Ja** |
| `FuturesService` | `FuturesToolRegistry` | Keine | Ja (Akzeptanzkriterium) |
| `PerpetualsService` | `PerpetualsToolRegistry` | Keine | Ja (Akzeptanzkriterium) |
| `DataService` | `DataToolRegistry` | Keine | Ja (Akzeptanzkriterium) |

### 1.2 Bestehende eigene Services (müssen refactored werden)

| Service | Aktuell | Ziel |
|---------|---------|------|
| `ProductsService` | extends `BaseProductsService` | Delegation + number Types |
| `PublicService` | extends `BasePublicService` | Delegation + number Types |

### 1.3 String-basierte Zahlenfelder in Tool Schemas

**OrderToolRegistry.ts** (27 Felder):

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

In separaten Tools:
- `edit_order`: price, size
- `preview_edit_order`: price, size
- `close_position`: size

**ConvertToolRegistry.ts** (1 Feld):
- `amount`

**PortfolioToolRegistry.ts** (1 Feld):
- `funds.value`

**IndicatorToolRegistry.ts** (9 Felder, verwendet an ~15 Stellen):
- `candleSchema`: `open`, `high`, `low`, `close`, `volume` (verwendet in allen Candle-basierten Tools)
- `pivotPoints`: `high`, `low`, `close`, `open`

### 1.4 Interne Interfaces mit strings

- `CandleInput` in `TechnicalIndicatorsService.ts` (Zeile 91-97)
- `CalculatePivotPointsInput` in `TechnicalIndicatorsService.ts` (Zeile 560-566)
- `mapApiCandlesToInput()` Funktion in `TechnicalAnalysisService.ts` (Zeile 1078-1096) - **Kritisch!**

---

## 2. Architektur-Entscheidungen

### 2.1 Service-Wrapper Verzeichnisstruktur

```
src/server/services/
├── index.ts                    # Re-exports aller Services
├── numberConversion.ts         # Zentrale Konvertierungsfunktionen + Candle-Mapping
├── numberConversion.spec.ts    # Tests für Konvertierungsfunktionen
├── AccountsService.ts          # Wrapper (durchgereicht, keine Konvertierung)
├── OrdersService.ts            # Wrapper mit number→string Konvertierung
├── ConvertsService.ts          # Wrapper mit number→string Konvertierung
├── FeesService.ts              # Wrapper (durchgereicht)
├── PaymentMethodsService.ts    # Wrapper (durchgereicht)
├── PortfoliosService.ts        # Wrapper mit number→string Konvertierung
├── FuturesService.ts           # Wrapper (durchgereicht)
├── PerpetualsService.ts        # Wrapper (durchgereicht)
├── DataService.ts              # Wrapper (durchgereicht)
├── ProductsService.ts          # Refactored mit Candle-Mapping
├── ProductsService.spec.ts     # Verschobene Tests
├── PublicService.ts            # Refactored mit Candle-Mapping
└── PublicService.spec.ts       # Verschobene Tests
```

### 2.2 Konvertierungsfunktionen

**Datei: `src/server/services/numberConversion.ts`**

```typescript
import type { CandleInput } from '../TechnicalIndicatorsService';

/**
 * Konvertiert number zu string für SDK-Aufrufe.
 * Gibt undefined zurück wenn value undefined ist.
 */
export function toString(value: number | undefined): string | undefined {
  return value !== undefined ? value.toString() : undefined;
}

/**
 * Konvertiert number zu string (required).
 */
export function toStringRequired(value: number): string {
  return value.toString();
}

/**
 * Konvertiert string zu number.
 * Wirft Error bei ungültigen Werten (NaN, Infinity, oder teilweise geparste Strings).
 * Verwendet Number() statt parseFloat() für strikte Validierung.
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
 * Konvertiert string zu number (required).
 * Verwendet Number() statt parseFloat() für strikte Validierung.
 */
export function toNumberRequired(value: string): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return num;
}

/**
 * Mappt eine SDK-Candle zu CandleInput mit number Types.
 * Wird von ProductsService, PublicService und TechnicalAnalysisService verwendet.
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
 * Mappt ein Array von SDK-Candles zu CandleInput[] mit number Types.
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

### 2.3 CandleInput mit number Types

**Änderung in `TechnicalIndicatorsService.ts`:**

```typescript
// Alt (Zeile 91-97)
export interface CandleInput {
  readonly open: string;
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly volume: string;
}

// Neu
export interface CandleInput {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}
```

### 2.4 ProductsService/PublicService Delegation (vollständige Dokumentation)

**Wichtig:** Die SDK-Services werden im aktuellen Code mit `new XService(this.client)` erstellt.

**ProductsService** - Zu delegierende Methoden:

| Methode | Quelle | Änderung |
|---------|--------|----------|
| `listProducts()` | Geerbt von SDK | Reine Delegation |
| `getProduct()` | Geerbt von SDK | Reine Delegation |
| `getProductCandles()` | Geerbt von SDK | Delegation + `toUnixTimestamp()` |
| `getProductBook()` | Geerbt von SDK | Reine Delegation |
| `getBestBidAsk()` | Geerbt von SDK | Reine Delegation |
| `getProductMarketTrades()` | Geerbt von SDK | Reine Delegation |
| `getProductFixed()` | Eigene (Zeile 33-35) | Entfällt (getProduct reicht) |
| `getProductCandlesFixed()` | Eigene (Zeile 42-51) | Wird zu `getProductCandles()` |
| `getMarketSnapshot()` | Eigene (Zeile 53-104) | Bleibt, verwendet `getProductCandles()` |
| `getProductCandlesBatch()` | Eigene (Zeile 106-142) | Bleibt, verwendet `getProductCandles()` |

**PublicService** - Zu delegierende Methoden:

| Methode | Quelle | Änderung |
|---------|--------|----------|
| `getServerTime()` | Geerbt von SDK | Reine Delegation |
| `getProduct()` | Geerbt von SDK | Reine Delegation |
| `listProducts()` | Geerbt von SDK | Reine Delegation |
| `getProductBook()` | Geerbt von SDK | Reine Delegation |
| `getProductMarketTrades()` | Geerbt von SDK | Reine Delegation |
| `getProductCandles()` | Geerbt von SDK | Delegation + `toUnixTimestamp()` |
| `getProductCandlesFixed()` | Eigene (Zeile 14-23) | Wird zu `getProductCandles()` |

**Beispiel ProductsService (Delegation):**

```typescript
// src/server/services/ProductsService.ts
import { ProductsService as SdkProductsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListProductsRequest,
  ListProductsResponse,
  GetProductRequest,
  GetProductCandlesRequest,
  GetProductCandlesResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';
import type { Product } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';
import { toUnixTimestamp } from '../ProductCandles';
import type {
  GetMarketSnapshotRequest,
  GetMarketSnapshotResponse,
  GetProductCandlesBatchRequest,
  GetProductCandlesBatchResponse,
} from '../MarketSnapshot';
import { mapSdkCandlesToInput } from './numberConversion';

export class ProductsService {
  private readonly sdk: SdkProductsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkProductsService(client);
  }

  // Reine Delegation
  public listProducts(request?: ListProductsRequest): Promise<ListProductsResponse> {
    return this.sdk.listProducts(request);
  }

  public getProduct(request: GetProductRequest): Promise<Product> {
    return this.sdk.getProduct(request) as Promise<Product>;
  }

  // Delegation mit Timestamp-Konvertierung
  public getProductCandles(request: GetProductCandlesRequest): Promise<GetProductCandlesResponse> {
    return this.sdk.getProductCandles({
      ...request,
      start: toUnixTimestamp(request.start),
      end: toUnixTimestamp(request.end),
    }) as Promise<GetProductCandlesResponse>;
  }

  // ... weitere Methoden (getBestBidAsk, getProductBook, getProductMarketTrades)

  // Eigene Methoden bleiben (verwenden jetzt getProductCandles statt getProductCandlesFixed)
  public async getMarketSnapshot(request: GetMarketSnapshotRequest): Promise<GetMarketSnapshotResponse> {
    // Implementierung bleibt gleich, ruft jetzt this.getProductCandles() auf
  }

  public async getProductCandlesBatch(request: GetProductCandlesBatchRequest): Promise<GetProductCandlesBatchResponse> {
    // Implementierung bleibt gleich, ruft jetzt this.getProductCandles() auf
  }
}
```

**Wichtig:** `getProductCandlesFixed()` wird zu `getProductCandles()` umbenannt, da der Wrapper jetzt IMMER die korrekte Timestamp-Konvertierung durchführt.

---

## 3. Implementierungsschritte

### Phase 1: Infrastruktur

#### Schritt 1.1: Services-Verzeichnis erstellen
```bash
mkdir -p src/server/services
```

#### Schritt 1.2: Konvertierungsfunktionen erstellen
- Datei: `src/server/services/numberConversion.ts`
- Inhalt: Wie in Sektion 2.2 definiert
- Tests: `src/server/services/numberConversion.spec.ts`

### Phase 2: Service-Wrapper erstellen

Für jeden SDK Service einen Wrapper erstellen, der:
1. Den `CoinbaseAdvTradeClient` als Parameter erhält
2. Intern den SDK-Service instantiiert
3. Alle verwendeten Methoden delegiert
4. Bei Bedarf number→string Konvertierung für Request-Parameter durchführt
5. Response unverändert zurückgibt (außer bei Candles)

#### Schritt 2.1: Einfache Wrapper (reine Delegation, keine Konvertierung)
- `AccountsService` - listAccounts(), getAccount()
- `FeesService` - getTransactionsSummary()
- `PaymentMethodsService` - listPaymentMethods(), getPaymentMethod()
- `DataService` - getApiKeyPermissions()
- `FuturesService` - listFuturesPositions(), getFuturesPosition(), etc.
- `PerpetualsService` - listPositions(), getPosition(), etc.

**Beispiel für einfachen Wrapper:**
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
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/accounts/types';

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

#### Schritt 2.2: Wrapper mit Konvertierung (number→string für Requests)
- `OrdersService` - createOrder(), editOrder(), previewEditOrder(), closePosition(), etc.
- `ConvertsService` - createConvertQuote(), commitConvertTrade(), getConvertTrade()
- `PortfoliosService` - movePortfolioFunds() (funds.value)

**Beispiel für Wrapper mit Konvertierung:**
```typescript
// src/server/services/OrdersService.ts
import {
  OrdersService as SdkOrdersService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  CreateOrderRequest as SdkCreateOrderRequest,
  CreateOrderResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/orders/types';
import { toStringRequired } from './numberConversion';

// Eigener Request-Type mit number statt string
interface CreateOrderRequest {
  // ... mit number-Feldern statt string
}

export class OrdersService {
  private readonly sdk: SdkOrdersService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkOrdersService(client);
  }

  public createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Konvertiere number-Felder zu strings für SDK
    return this.sdk.createOrder(this.convertCreateOrderRequest(request));
  }

  private convertCreateOrderRequest(request: CreateOrderRequest): SdkCreateOrderRequest {
    // Konvertiere baseSize, limitPrice, etc. zu strings mit toStringRequired()
    // ...
  }
}
```

#### Schritt 2.3: ProductsService refactoren
- Von `extends BaseProductsService` zu Delegation
- `getProductCandlesFixed()` wird zu `getProductCandles()`
- `getProductFixed()` entfällt, `getProduct()` wird direkt verwendet
- **Wichtig:** Die private Methode `getProducts()` muss von `this.getProductFixed()` auf `this.getProduct()` geändert werden (Zeile 152-156)
- Candle-Response wird zu `CandleInput[]` mit number Types gemappt (via `mapSdkCandlesToInput`)
- `toUnixTimestamp()` wird intern angewendet

#### Schritt 2.4: PublicService refactoren

**WICHTIG:** Der PublicService verwendet einen ANDEREN Import-Pfad als die anderen Services!

```typescript
// src/server/services/PublicService.ts
// ACHTUNG: Anderer Import-Pfad als bei anderen Services!
import { PublicService as SdkPublicService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js';
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
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/types';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { toUnixTimestamp } from '../ProductCandles';

export class PublicService {
  private readonly sdk: SdkPublicService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPublicService(client);
  }

  // Reine Delegation für geerbte Methoden
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

  // Delegation mit Timestamp-Konvertierung (ersetzt getProductCandlesFixed)
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

### Phase 3: Tool Schemas aktualisieren

#### Schritt 3.1: z.string() → z.number() für Zahlenfelder

**OrderToolRegistry.ts:**
```typescript
// Alt
baseSize: z.string().describe('Amount to buy/sell')
// Neu
baseSize: z.number().describe('Amount to buy/sell')
```

**ConvertToolRegistry.ts:**
```typescript
// Alt
amount: z.string().describe('Amount to convert')
// Neu
amount: z.number().describe('Amount to convert')
```

**PortfolioToolRegistry.ts:**
```typescript
// Alt
value: z.string().describe('Amount to transfer')
// Neu
value: z.number().describe('Amount to transfer')
```

**IndicatorToolRegistry.ts:**
```typescript
// Alt
const candleSchema = z.object({
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
})
// Neu
const candleSchema = z.object({
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
})

// Und für pivotPoints:
// Alt
high: z.string().describe('Previous period high price')
// Neu
high: z.number().describe('Previous period high price')
```

#### Schritt 3.2: Service-Referenzen und Import-Pfade aktualisieren

**Alle Tool Registries müssen ihre Imports ändern:**

```typescript
// Alt (z.B. in ProductToolRegistry.ts)
import type { ProductsService } from '../ProductsService';

// Neu
import type { ProductsService } from '../services/ProductsService';
```

**Betroffene Dateien und ihre Import-Änderungen:**

| Datei | Alt | Neu |
|-------|-----|-----|
| `tools/ProductToolRegistry.ts` | `../ProductsService` | `../services/ProductsService` |
| `tools/PublicToolRegistry.ts` | `../PublicService` | `../services/PublicService` |
| `tools/AnalysisToolRegistry.ts` | `../TechnicalAnalysisService` | (bleibt, aber TAS importiert neu) |
| `TechnicalAnalysisService.ts` | `./ProductsService` | `./services/ProductsService` |

### Phase 4: TechnicalIndicatorsService aktualisieren

#### Schritt 4.1: CandleInput Interface ändern
- `string` → `number` für alle OHLCV-Felder (Zeile 91-97)

#### Schritt 4.2: Extract-Funktionen vereinfachen
```typescript
// Alt (Zeile 1506-1507)
function extractOpenPrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => parseFloat(candle.open));
}

// Neu
function extractOpenPrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => candle.open);
}

// Analog für alle anderen extract-Funktionen (extractClosePrices, extractHighPrices, etc.)
```

#### Schritt 4.3: CalculatePivotPointsInput ändern
```typescript
// Alt (Zeile 560-566)
export interface CalculatePivotPointsInput {
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly open?: string;
  readonly type?: PivotPointsType;
}

// Neu
export interface CalculatePivotPointsInput {
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly open?: number;
  readonly type?: PivotPointsType;
}
```

#### Schritt 4.4: calculatePivotPoints Methode anpassen
```typescript
// Alt (Zeile 1346-1367)
public calculatePivotPoints(input: CalculatePivotPointsInput): PivotPointsOutput {
  const high = parseFloat(input.high);
  const low = parseFloat(input.low);
  const close = parseFloat(input.close);
  const open = input.open ? parseFloat(input.open) : close;
  // ...
}

// Neu
public calculatePivotPoints(input: CalculatePivotPointsInput): PivotPointsOutput {
  const { high, low, close } = input;
  const open = input.open ?? close;
  // ... (kein parseFloat mehr nötig)
}
```

### Phase 5: TechnicalAnalysisService aktualisieren

#### Schritt 5.1: mapApiCandlesToInput ersetzen

Die lokale Funktion `mapApiCandlesToInput` (Zeile 1078-1096) wird durch den Import aus `numberConversion.ts` ersetzt:

```typescript
// Alt (Zeile 1078-1096)
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

// Neu
import { mapSdkCandlesToInput } from './services/numberConversion';

// In fetchCandles() und fetchDailyCandles():
return mapSdkCandlesToInput(response.candles);
```

#### Schritt 5.2: parseFloat-Aufrufe entfernen

```typescript
// Alt (z.B. in buildPriceSummary, Zeile 166-194)
const current = parseFloat(latest.close);
const open = parseFloat(oldest.open);
const high = Math.max(...candles.map((c) => parseFloat(c.high)));
const low = Math.min(...candles.map((c) => parseFloat(c.low)));

// Neu
const current = latest.close;
const open = oldest.open;
const high = Math.max(...candles.map((c) => c.high));
const low = Math.min(...candles.map((c) => c.low));

// Analog für alle anderen parseFloat-Aufrufe (ca. 30 Stellen)
```

#### Schritt 5.3: calculateSupportResistanceIndicators anpassen

Da `CandleInput` jetzt numbers hat, funktioniert der Aufruf von `calculatePivotPoints` automatisch:

```typescript
// Dieser Code funktioniert unverändert, da previousDay.high etc. jetzt numbers sind
this.indicatorsService.calculatePivotPoints({
  high: previousDay.high,
  low: previousDay.low,
  close: previousDay.close,
  open: previousDay.open,
});
```

### Phase 6: CoinbaseMcpServer aktualisieren

#### Schritt 6.1: Imports anpassen
```typescript
// Alt (SDK-Services direkt importiert)
import {
  AccountsService,
  OrdersService,
  // ...
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';

// Neu (nur CoinbaseAdvTradeClient vom SDK, Wrapper aus services/)
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

#### Schritt 6.2: Service-Instantiierung

**Aktueller Code (CoinbaseMcpServer.ts, Zeile 54-74):**
```typescript
const credentials = new CoinbaseAdvTradeCredentials(apiKey, privateKey);
this.client = new CoinbaseAdvTradeClient(credentials);

// Alt: SDK-Services werden mit Client erstellt
this.accounts = new AccountsService(this.client);  // SDK AccountsService
this.orders = new OrdersService(this.client);      // SDK OrdersService
this.products = new ProductsService(this.client);  // Eigener, extends SDK
// ...
```

**Neuer Code:**
```typescript
const credentials = new CoinbaseAdvTradeCredentials(apiKey, privateKey);
this.client = new CoinbaseAdvTradeClient(credentials);

// Neu: Wrapper-Services werden mit Client erstellt
// Die Wrapper erstellen intern die SDK-Services
this.accounts = new AccountsService(this.client);   // Wrapper AccountsService
this.orders = new OrdersService(this.client);       // Wrapper OrdersService
this.products = new ProductsService(this.client);   // Wrapper ProductsService (Delegation)
// ...
```

**Wichtig:** Die Wrapper erhalten den `CoinbaseAdvTradeClient` und erstellen intern den jeweiligen SDK-Service. Das Interface bleibt gleich - nur die Implementierung ändert sich.

### Phase 7: Tests aktualisieren

#### Schritt 7.1: Neue Tests für Konvertierungsfunktionen
- `src/server/services/numberConversion.spec.ts`
- Testet: toString, toStringRequired, toNumber, toNumberRequired
- Testet: mapSdkCandleToInput, mapSdkCandlesToInput
- Edge-Cases: undefined, NaN, Infinity, ungültige Strings

#### Schritt 7.2: Wrapper-Tests und 100% Coverage-Strategie

**Einfache Wrapper (reine Delegation):**
Diese delegieren nur an das SDK. Um 100% Coverage zu erreichen, gibt es zwei Optionen:

1. **Option A (empfohlen):** Die Wrapper werden durch die existierenden Integration-Tests in `CoinbaseMcpServer.spec.ts` indirekt getestet. Istanbul/V8 Coverage misst alle Zeilen die durchlaufen werden.

2. **Option B:** Minimale Unit-Tests für jeden Wrapper, die prüfen ob die SDK-Methode aufgerufen wird.

**Wrapper mit Konvertierung (OrdersService, ConvertsService, PortfoliosService):**
Diese MÜSSEN getestet werden, um die number→string Konvertierung zu verifizieren:
- `src/server/services/OrdersService.spec.ts`
- `src/server/services/ConvertsService.spec.ts`
- `src/server/services/PortfoliosService.spec.ts`

**ProductsService und PublicService:**
Die bestehenden Tests (`ProductsService.spec.ts`, `PublicService.spec.ts`) werden mit nach `services/` verschoben und angepasst.

Die existierenden Tests für die Tool Registries (über CoinbaseMcpServer.spec.ts) decken die Integration ab.

#### Schritt 7.3: Bestehende Tests anpassen
- Keine Tests löschen
- Mock-Daten von strings zu numbers ändern
- Assertions auf number-Werte anpassen

**Vollständige Liste der anzupassenden Test-Dateien:**

| Datei | Änderungen |
|-------|------------|
| `src/index.spec.ts` | Prüfen ob betroffen |
| `src/server/CoinbaseMcpServer.spec.ts` | Mock-Daten, Service-Instantiierung |
| `src/server/TechnicalIndicatorsService.spec.ts` | CandleInput mit numbers, PivotPointsInput mit numbers |
| `src/server/TechnicalAnalysisService.spec.ts` | CandleInput mit numbers |
| `src/server/ProductsService.spec.ts` | Verschieben nach services/, Candle-Mapping testen |
| `src/server/PublicService.spec.ts` | Verschieben nach services/, Candle-Mapping testen |
| `src/server/ProductCandles.spec.ts` | Prüfen ob betroffen (nur timestamp utils) |
| `src/server/indicators/pivotPoints.spec.ts` | Input ist jetzt number |
| `src/server/indicators/rsiDivergence.spec.ts` | Prüfen ob betroffen |
| `src/server/indicators/volumeProfile.spec.ts` | Prüfen ob betroffen |
| `src/server/indicators/chartPatterns.spec.ts` | Prüfen ob betroffen |
| `src/server/indicators/swingPoints.spec.ts` | Prüfen ob betroffen |

---

## 4. Datei-Änderungen Zusammenfassung

### 4.1 Neue Dateien (~14)

| Datei | Beschreibung |
|-------|--------------|
| `src/server/services/index.ts` | Re-exports |
| `src/server/services/numberConversion.ts` | Konvertierungsfunktionen + Candle-Mapping |
| `src/server/services/numberConversion.spec.ts` | Tests |
| `src/server/services/AccountsService.ts` | Wrapper |
| `src/server/services/OrdersService.ts` | Wrapper |
| `src/server/services/ConvertsService.ts` | Wrapper |
| `src/server/services/FeesService.ts` | Wrapper |
| `src/server/services/PaymentMethodsService.ts` | Wrapper |
| `src/server/services/PortfoliosService.ts` | Wrapper |
| `src/server/services/FuturesService.ts` | Wrapper |
| `src/server/services/PerpetualsService.ts` | Wrapper |
| `src/server/services/DataService.ts` | Wrapper |

### 4.2 Zu verschiebende Dateien (4)

| Von | Nach |
|-----|------|
| `src/server/ProductsService.ts` | `src/server/services/ProductsService.ts` |
| `src/server/ProductsService.spec.ts` | `src/server/services/ProductsService.spec.ts` |
| `src/server/PublicService.ts` | `src/server/services/PublicService.ts` |
| `src/server/PublicService.spec.ts` | `src/server/services/PublicService.spec.ts` |

### 4.3 Zu ändernde Dateien (~20)

| Datei | Änderungen |
|-------|------------|
| `src/server/TechnicalIndicatorsService.ts` | CandleInput, PivotPointsInput, extract-Funktionen |
| `src/server/TechnicalIndicatorsService.spec.ts` | Mock-Daten |
| `src/server/TechnicalAnalysisService.ts` | Import mapSdkCandlesToInput, parseFloat entfernen |
| `src/server/TechnicalAnalysisService.spec.ts` | Mock-Daten |
| `src/server/CoinbaseMcpServer.ts` | Service-Imports und Instantiierung |
| `src/server/CoinbaseMcpServer.spec.ts` | Mock-Daten |
| `src/server/tools/OrderToolRegistry.ts` | z.number(), Service-Import |
| `src/server/tools/ConvertToolRegistry.ts` | z.number(), Service-Import |
| `src/server/tools/PortfolioToolRegistry.ts` | z.number(), Service-Import |
| `src/server/tools/IndicatorToolRegistry.ts` | z.number() für candleSchema und pivotPoints |
| `src/server/tools/AccountToolRegistry.ts` | Service-Import |
| `src/server/tools/FeeToolRegistry.ts` | Service-Import |
| `src/server/tools/PaymentToolRegistry.ts` | Service-Import |
| `src/server/tools/FuturesToolRegistry.ts` | Service-Import |
| `src/server/tools/PerpetualsToolRegistry.ts` | Service-Import |
| `src/server/tools/DataToolRegistry.ts` | Service-Import |
| `src/server/tools/ProductToolRegistry.ts` | Service-Import |
| `src/server/tools/PublicToolRegistry.ts` | Service-Import |
| `src/server/tools/AnalysisToolRegistry.ts` | Service-Import (falls betroffen) |
| `src/server/indicators/pivotPoints.spec.ts` | Input-Daten |

---

## 5. Qualitätssicherung

### 5.1 Vor dem Commit

```bash
npm run test:types    # TypeScript Fehler
npm run lint          # ESLint Fehler/Warnungen
npm run test:coverage # 100% Coverage
npm run knip          # Unused exports
```

### 5.2 Checkliste

- [ ] Alle MCP Tool Schemas verwenden z.number() für Zahlenwerte
- [ ] Alle SDK Services haben einen Wrapper-Service
- [ ] ProductsService/PublicService verwenden Delegation statt extends
- [ ] CandleInput verwendet number statt string
- [ ] CalculatePivotPointsInput verwendet number statt string
- [ ] Keine parseFloat() Aufrufe mehr in TechnicalIndicatorsService (außer in extract-Funktionen die entfernt wurden)
- [ ] Keine parseFloat() Aufrufe mehr in TechnicalAnalysisService
- [ ] mapApiCandlesToInput in TechnicalAnalysisService durch mapSdkCandlesToInput ersetzt
- [ ] Alle Import-Pfade für verschobene Services aktualisiert
- [ ] **Jede Funktion und Methode hat einen expliziten Return Type**
- [ ] 100% Test-Coverage
- [ ] Keine ESLint Fehler/Warnungen
- [ ] Keine TypeScript Fehler
- [ ] Keine unbenutzten Exports (knip)

---

## 6. Commit-Message

```
refactor: standardize number types across MCP tools and services

BREAKING CHANGE: All MCP tool schemas now use z.number() instead of
z.string() for numeric values (amounts, prices, OHLCV data).

- Create service wrappers for all Coinbase SDK services with number→string
  conversion for request parameters
- Refactor ProductsService and PublicService to use delegation instead
  of inheritance
- Move ProductsService and PublicService to src/server/services/
- Update CandleInput interface to use number types
- Update CalculatePivotPointsInput interface to use number types
- Add centralized number conversion functions (using Number() for strict validation)
- Add mapSdkCandlesToInput for Candle mapping
- Update all tool registries to use z.number() schemas
- Remove parseFloat() calls from indicator services
- Update all tests to use number values
```

---

## 7. Hinweise für die Implementierung

### 7.1 Reihenfolge beachten

1. **Zuerst** Services-Verzeichnis + Konvertierungsfunktionen + Tests
2. **Dann** Service-Wrapper erstellen (beginnend mit einfachen)
3. **Dann** ProductsService/PublicService verschieben und refactoren
4. **Dann** Tool Schemas und Import-Pfade aktualisieren
5. **Dann** TechnicalIndicatorsService (Interfaces + extract-Funktionen)
6. **Dann** TechnicalAnalysisService (mapSdkCandlesToInput + parseFloat entfernen)
7. **Dann** CoinbaseMcpServer aktualisieren
8. **Zuletzt** Alle Tests anpassen

### 7.2 TypeScript Compiler nutzen

Nach Änderung der Interfaces zeigt der TypeScript Compiler alle Stellen, die angepasst werden müssen. Systematisch abarbeiten.

### 7.3 Tests nicht löschen

Bestehende Tests nur anpassen (Mock-Daten, Assertions), nicht löschen. Bei Bedarf neue Tests hinzufügen.

### 7.4 Git-Strategie

Alle Änderungen in einem Commit. Bei Verschiebung von Dateien:
```bash
git mv src/server/ProductsService.ts src/server/services/ProductsService.ts
```
Damit bleibt die Git-Historie erhalten.
