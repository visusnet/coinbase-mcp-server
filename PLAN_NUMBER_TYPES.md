# Plan: Vereinheitlichung der Zahlen-Typen (v2 - Überarbeitet)

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

---

## Code Review Feedback (v1 → v2)

Der ursprüngliche Plan wurde von einem erfahrenen Code Reviewer geprüft. Wichtigste Anpassungen:

1. **Pragmatischer Ansatz**: Service-Wrapper primär für Services mit numerischen Request-Parametern
2. **Einfache Konvertierungsfunktionen**: Zentrale `numberConversion.ts` statt komplexer Mapper
3. **Kein Response-Mapping**: MCP-Responses gehen direkt an LLM, nur Candles (für interne Weiterverarbeitung) werden gemappt
4. **Fail-fast bei ungültigen Zahlen**: Explizite Fehler statt stiller Korruption

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

**IndicatorToolRegistry.ts** (9 Felder):
- `candleSchema`: `open`, `high`, `low`, `close`, `volume`
- `pivotPoints`: `high`, `low`, `close`, `open`

### 1.4 Interne Interfaces mit strings

- `CandleInput` in `TechnicalIndicatorsService.ts`
- `CalculatePivotPointsInput` in `TechnicalIndicatorsService.ts`

---

## 2. Architektur-Entscheidungen

### 2.1 Service-Wrapper Verzeichnisstruktur

```
src/server/services/
├── index.ts                    # Re-exports aller Services
├── numberConversion.ts         # Zentrale Konvertierungsfunktionen
├── AccountsService.ts          # Wrapper (durchgereicht, keine Konvertierung)
├── OrdersService.ts            # Wrapper mit number→string Konvertierung
├── ConvertsService.ts          # Wrapper mit number→string Konvertierung
├── FeesService.ts              # Wrapper (durchgereicht)
├── PaymentMethodsService.ts    # Wrapper (durchgereicht)
├── PortfoliosService.ts        # Wrapper mit number→string Konvertierung
├── FuturesService.ts           # Wrapper (prüfen ob Konvertierung nötig)
├── PerpetualsService.ts        # Wrapper (prüfen ob Konvertierung nötig)
├── DataService.ts              # Wrapper (durchgereicht)
├── ProductsService.ts          # Refactored mit Candle-Mapping
└── PublicService.ts            # Refactored mit Candle-Mapping
```

### 2.2 Konvertierungsfunktionen

**Datei: `src/server/services/numberConversion.ts`**

```typescript
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
 * Wirft Error bei ungültigen Werten (NaN, Infinity).
 */
export function toNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const num = parseFloat(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return num;
}

/**
 * Konvertiert string zu number (required).
 */
export function toNumberRequired(value: string): number {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return num;
}
```

### 2.3 CandleInput mit number Types

**Neu in `TechnicalIndicatorsService.ts`:**

```typescript
export interface CandleInput {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}
```

**Candle-Mapping-Funktion (in numberConversion.ts oder ProductsService.ts):**

```typescript
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
```

---

## 3. Implementierungsschritte

### Phase 1: Infrastruktur

#### Schritt 1.1: Konvertierungsfunktionen erstellen
- Datei: `src/server/services/numberConversion.ts`
- Tests: `src/server/services/numberConversion.spec.ts`

#### Schritt 1.2: Services-Verzeichnis vorbereiten
- Datei: `src/server/services/index.ts` (Re-exports)

### Phase 2: Service-Wrapper erstellen

Für jeden SDK Service einen Wrapper erstellen, der:
1. Den SDK Service als Dependency injiziert bekommt
2. Alle verwendeten Methoden delegiert
3. Bei Bedarf number→string Konvertierung für Request-Parameter durchführt
4. Response unverändert zurückgibt (außer bei Candles)

#### Schritt 2.1: Einfache Wrapper (keine Konvertierung)
- `AccountsService` - listAccounts(), getAccount()
- `FeesService` - getTransactionsSummary()
- `PaymentMethodsService` - listPaymentMethods(), getPaymentMethod()
- `DataService` - getApiKeyPermissions()

#### Schritt 2.2: Wrapper mit Konvertierung
- `OrdersService` - createOrder(), cancelOrder(), listOrders(), getOrder(), etc.
- `ConvertsService` - createConvertQuote(), commitConvertTrade(), getConvertTrade()
- `PortfoliosService` - movePortfolioFunds() (funds.value)
- `FuturesService` - Methoden prüfen
- `PerpetualsService` - Methoden prüfen

#### Schritt 2.3: ProductsService refactoren
- Von `extends BaseProductsService` zu Delegation
- `getProductCandlesFixed()` → `getProductCandles()`
- Candle-Response zu `CandleInput[]` mit number Types mappen

#### Schritt 2.4: PublicService refactoren
- Analog zu ProductsService

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
  ...
})
// Neu
const candleSchema = z.object({
  open: z.number(),
  high: z.number(),
  ...
})
```

#### Schritt 3.2: Service-Referenzen aktualisieren
- Alle Registries verwenden die neuen Wrapper-Services
- Import-Pfade anpassen

### Phase 4: TechnicalIndicatorsService aktualisieren

#### Schritt 4.1: CandleInput Interface ändern
- `string` → `number` für alle OHLCV-Felder

#### Schritt 4.2: Extract-Funktionen vereinfachen
```typescript
// Alt
function extractClosePrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => parseFloat(candle.close));
}

// Neu
function extractClosePrices(candles: readonly CandleInput[]): number[] {
  return candles.map((candle) => candle.close);
}
```

#### Schritt 4.3: CalculatePivotPointsInput ändern
```typescript
// Alt
export interface CalculatePivotPointsInput {
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly open?: string;
  ...
}

// Neu
export interface CalculatePivotPointsInput {
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly open?: number;
  ...
}
```

### Phase 5: TechnicalAnalysisService aktualisieren

#### Schritt 5.1: parseFloat-Aufrufe entfernen
- `buildPriceSummary()`: Direkt number verwenden
- Alle anderen Methoden mit parseFloat anpassen

#### Schritt 5.2: mapApiCandlesToInput verwenden
- Candle-Mapping über zentrale Funktion

### Phase 6: CoinbaseMcpServer aktualisieren

#### Schritt 6.1: Service-Instantiierung
```typescript
// Alt (direkte SDK-Services)
this.accountsService = client.accounts;
this.ordersService = client.orders;

// Neu (Wrapper-Services)
this.accountsService = new AccountsService(client.accounts);
this.ordersService = new OrdersService(client.orders);
```

### Phase 7: Tests aktualisieren

#### Schritt 7.1: Neue Tests für Konvertierungsfunktionen
- `numberConversion.spec.ts`

#### Schritt 7.2: serviceMocks.ts aktualisieren
- Mock-Daten für CandleInput mit number statt string

#### Schritt 7.3: Bestehende Tests anpassen
- Keine Tests löschen
- Assertions und Mock-Objekte auf number-Werte anpassen

Konkret anzupassende Test-Dateien:
- `src/server/TechnicalIndicatorsService.spec.ts`
- `src/server/TechnicalAnalysisService.spec.ts`
- `src/server/ProductsService.spec.ts`
- `src/server/PublicService.spec.ts`
- `src/server/CoinbaseMcpServer.spec.ts`
- `src/server/indicators/*.spec.ts` (alle Indicator-Helper-Tests)

---

## 4. Datei-Änderungen Zusammenfassung

### 4.1 Neue Dateien (~13)

| Datei | Beschreibung |
|-------|--------------|
| `src/server/services/index.ts` | Re-exports |
| `src/server/services/numberConversion.ts` | Konvertierungsfunktionen |
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

### 4.2 Zu ändernde Dateien (~20)

| Datei | Änderungen |
|-------|------------|
| `src/server/ProductsService.ts` | Refactor zu Delegation, verschieben nach services/ |
| `src/server/PublicService.ts` | Refactor zu Delegation, verschieben nach services/ |
| `src/server/TechnicalIndicatorsService.ts` | CandleInput, PivotPointsInput |
| `src/server/TechnicalAnalysisService.ts` | parseFloat entfernen |
| `src/server/CoinbaseMcpServer.ts` | Service-Instantiierung |
| `src/server/tools/OrderToolRegistry.ts` | z.number(), Service-Referenz |
| `src/server/tools/ConvertToolRegistry.ts` | z.number(), Service-Referenz |
| `src/server/tools/PortfolioToolRegistry.ts` | z.number(), Service-Referenz |
| `src/server/tools/IndicatorToolRegistry.ts` | z.number() |
| `src/server/tools/AccountToolRegistry.ts` | Service-Referenz |
| `src/server/tools/FeeToolRegistry.ts` | Service-Referenz |
| `src/server/tools/PaymentToolRegistry.ts` | Service-Referenz |
| `src/server/tools/FuturesToolRegistry.ts` | Service-Referenz |
| `src/server/tools/PerpetualsToolRegistry.ts` | Service-Referenz |
| `src/server/tools/DataToolRegistry.ts` | Service-Referenz |
| `src/server/tools/ProductToolRegistry.ts` | Service-Referenz |
| `src/server/tools/PublicToolRegistry.ts` | Service-Referenz |
| `src/server/tools/AnalysisToolRegistry.ts` | Service-Referenz |
| `src/server/test/serviceMocks.ts` | Mock-Daten |
| Diverse `*.spec.ts` Dateien | Assertions anpassen |

### 4.3 Zu löschende/verschobene Dateien

| Datei | Aktion |
|-------|--------|
| `src/server/ProductsService.ts` | → `src/server/services/ProductsService.ts` |
| `src/server/PublicService.ts` | → `src/server/services/PublicService.ts` |

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
- [ ] Keine parseFloat() Aufrufe mehr in TechnicalIndicatorsService
- [ ] Keine parseFloat() Aufrufe mehr in TechnicalAnalysisService (außer in Mappern)
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
- Update CandleInput interface to use number types
- Update CalculatePivotPointsInput interface to use number types
- Add centralized number conversion functions
- Update all tool registries to use z.number() schemas
- Remove parseFloat() calls from indicator services
- Update all tests to use number values
```

---

## 7. Hinweise für die Implementierung

### 7.1 Reihenfolge beachten

1. **Zuerst** Konvertierungsfunktionen + Tests
2. **Dann** Service-Wrapper (beginnend mit einfachen, dann komplexe)
3. **Dann** Tool Schemas aktualisieren
4. **Dann** Interne Interfaces (CandleInput, etc.)
5. **Zuletzt** Tests anpassen

### 7.2 TypeScript Compiler nutzen

Nach Änderung der Interfaces zeigt der TypeScript Compiler alle Stellen, die angepasst werden müssen. Systematisch abarbeiten.

### 7.3 Tests nicht löschen

Bestehende Tests nur anpassen (Mock-Daten, Assertions), nicht löschen. Bei Bedarf neue Tests hinzufügen.
