# Plan: Integrated Analysis Tool for Context Reduction

## Summary

Introduction of a new MCP tool `analyze_technical_indicators` that combines candle fetching and indicator calculation server-side. This reduces context usage by ~90-95% since candle data never lands in the LLM context.

Additionally, a new `detect_swing_points` tool (Williams Fractals) will be added as both a standalone indicator and as foundation for correct Fibonacci calculation.

## Problem

The `/trade` skill currently performs the following steps:

1. `get_product_candles` → ~100 candles per timeframe/asset (~3k tokens)
2. `calculate_rsi(candles)` → candles are sent again
3. `calculate_macd(candles)` → candles are sent again
4. ... (15+ indicator calls)

**Result**: ~15-60k tokens per analysis cycle

## Solution

New tool `analyze_technical_indicators`:
- **Input**: productId, granularity, candleCount, indicators (optional)
- **Internal**: Fetches candles via SDK, calculates indicators
- **Output**: Only aggregated result values, NO candles

New tool `detect_swing_points`:
- **Input**: candles, lookback (optional, default: 2)
- **Output**: Swing highs and swing lows with prices and indices
- **Used by**: `analyze_technical_indicators` for Fibonacci calculation

---

## Implementation Steps

### Phase 1: Swing Points Indicator (Foundation)

#### 1.1 New Helper: Swing Point Detection

**File**: `src/server/indicators/swingPoints.ts`

Williams Fractal-based swing detection (industry standard):

```typescript
export interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
}

export interface DetectSwingPointsResponse {
  swingHighs: SwingPoint[];
  swingLows: SwingPoint[];
  latestSwingHigh: SwingPoint | null;
  latestSwingLow: SwingPoint | null;
  trend: 'uptrend' | 'downtrend' | 'sideways';
}

/**
 * Williams Fractal Definition (Standard: lookback=2, i.e., 5 bars total)
 *
 * Swing High: A bar where the high is higher than the highs of
 *             `lookback` bars before AND `lookback` bars after
 *
 * Swing Low:  A bar where the low is lower than the lows of
 *             `lookback` bars before AND `lookback` bars after
 */
export function detectSwingPoints(
  candles: CandleInput[],
  lookback: number = 2
): DetectSwingPointsResponse;
```

#### 1.2 New Tool: `detect_swing_points`

**File**: Update `src/server/tools/IndicatorToolRegistry.ts`

```typescript
this.server.registerTool('detect_swing_points', {
  title: 'Detect Swing Points (Williams Fractals)',
  description:
    'Detect swing highs and swing lows using Williams Fractal method. ' +
    'A swing high occurs when a bar\'s high is higher than the surrounding bars. ' +
    'A swing low occurs when a bar\'s low is lower than the surrounding bars. ' +
    'Useful for identifying support/resistance levels, trend direction, and Fibonacci retracement points.',
  inputSchema: {
    candles: candlesSchema(5, 'Array of candle data (minimum 5 for default lookback)'),
    lookback: z.number().int().min(1).max(10).optional()
      .describe('Number of bars on each side to compare (default: 2, resulting in 5-bar pattern)'),
  },
});
```

### Phase 2: Service Implementation

#### 2.1 New Service: `TechnicalAnalysisService`

**File**: `src/server/TechnicalAnalysisService.ts`

```typescript
interface AnalyzeTechnicalIndicatorsRequest {
  productId: string;
  granularity: Granularity;
  candleCount?: number; // default: 100
  indicators?: IndicatorType[]; // optional, default: all
}

interface AnalyzeTechnicalIndicatorsResponse {
  productId: string;
  granularity: string;
  candleCount: number;
  timestamp: string;
  price: {
    current: number;
    open: number;
    high: number;
    low: number;
    change24h: number;
  };
  indicators: {
    momentum?: MomentumIndicators;
    trend?: TrendIndicators;
    volatility?: VolatilityIndicators;
    volume?: VolumeIndicators;
    patterns?: PatternIndicators;
    supportResistance?: SupportResistanceIndicators;
  };
  signal: {
    score: number; // -100 to +100
    direction: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}
```

**Dependencies**:
- `ProductsService` (for `getProductCandlesFixed`)
- `TechnicalIndicatorsService` (for calculations)

#### 2.2 Pivot Points: Correct Implementation

**Requirement**: Daily OHLC from previous trading day (industry standard)

```typescript
async analyzeTechnicalIndicators(request: AnalyzeTechnicalIndicatorsRequest) {
  // 1. Fetch requested candles (e.g., 15m)
  const candles = await this.productsService.getProductCandlesFixed({
    productId: request.productId,
    granularity: request.granularity,
    start: ...,
    end: ...,
  });

  // 2. For Pivot Points: Fetch Daily candles (additional API call)
  if (this.shouldCalculatePivotPoints(request.indicators)) {
    const dailyCandles = await this.productsService.getProductCandlesFixed({
      productId: request.productId,
      granularity: 'ONE_DAY',
      start: this.getTwoDaysAgo(),
      end: this.getToday(),
    });

    // Use previous trading day (index 1, not current day)
    const previousDay = dailyCandles[1];
    pivotPoints = this.indicators.calculatePivotPoints({
      high: previousDay.high,
      low: previousDay.low,
      close: previousDay.close,
      open: previousDay.open,
    });
  }

  // 3. For Fibonacci: Use fractal-based swing detection
  if (this.shouldCalculateFibonacci(request.indicators)) {
    const swings = detectSwingPoints(candles);

    if (swings.latestSwingHigh && swings.latestSwingLow) {
      fibonacci = this.indicators.calculateFibonacciRetracement({
        start: swings.trend === 'uptrend'
          ? swings.latestSwingLow.price
          : swings.latestSwingHigh.price,
        end: swings.trend === 'uptrend'
          ? swings.latestSwingHigh.price
          : swings.latestSwingLow.price,
      });
    }
  }
}
```

#### 2.3 Define Indicator Types

**File**: `src/server/TechnicalAnalysis.ts` (Types)

All 24 indicator tools supported (23 existing + 1 new):

```typescript
type IndicatorType =
  // Momentum (7)
  | 'rsi' | 'macd' | 'stochastic' | 'adx' | 'cci' | 'williams_r' | 'roc'
  // Trend (4)
  | 'sma' | 'ema' | 'ichimoku' | 'psar'
  // Volatility (3)
  | 'bollinger_bands' | 'atr' | 'keltner'
  // Volume (4)
  | 'obv' | 'mfi' | 'vwap' | 'volume_profile'
  // Pattern Detection (4) - includes new swing_points
  | 'candlestick_patterns' | 'rsi_divergence' | 'chart_patterns' | 'swing_points'
  // Support/Resistance (2)
  | 'pivot_points' | 'fibonacci';

interface MomentumIndicators {
  rsi?: { value: number; signal: string };
  macd?: { macd: number; signal: number; histogram: number; crossover: string };
  stochastic?: { k: number; d: number; signal: string };
  adx?: { adx: number; pdi: number; mdi: number; trendStrength: string };
  cci?: { value: number; signal: string };
  williamsR?: { value: number; signal: string };
  roc?: { value: number; signal: string };
}

interface TrendIndicators {
  sma?: { value: number; trend: string };
  ema?: { value: number; trend: string };
  ichimoku?: { tenkan: number; kijun: number; senkouA: number; senkouB: number; signal: string };
  psar?: { value: number; trend: string };
}

interface VolatilityIndicators {
  bollingerBands?: { upper: number; middle: number; lower: number; percentB: number; signal: string };
  atr?: { value: number; volatility: string };
  keltner?: { upper: number; middle: number; lower: number; signal: string };
}

interface VolumeIndicators {
  obv?: { value: number; trend: string };
  mfi?: { value: number; signal: string };
  vwap?: { value: number; position: string };
  volumeProfile?: { poc: number; valueAreaHigh: number; valueAreaLow: number };
}

interface PatternIndicators {
  candlestickPatterns?: { patterns: string[]; bias: string };
  rsiDivergence?: { type: string | null; strength: string | null };
  chartPatterns?: { patterns: string[]; direction: string | null };
  swingPoints?: {
    latestSwingHigh: number | null;
    latestSwingLow: number | null;
    trend: string;
    swingHighCount: number;
    swingLowCount: number;
  };
}

interface SupportResistanceIndicators {
  pivotPoints?: {
    pivot: number;
    r1: number; r2: number; r3: number;
    s1: number; s2: number; s3: number;
    source: 'daily'; // Always from daily candles
  };
  fibonacci?: {
    trend: string;
    levels: Record<string, number>;
    swingHigh: number;
    swingLow: number;
  };
}
```

### Phase 3: Tool Registration

#### 3.1 New ToolRegistry: `AnalysisToolRegistry`

**File**: `src/server/tools/AnalysisToolRegistry.ts`

- Registers `analyze_technical_indicators` tool
- Uses `TechnicalAnalysisService`
- Zod schema for input validation

### Phase 4: Server Integration

#### 4.1 Update CoinbaseMcpServer.ts

- Instantiate `TechnicalAnalysisService`
- Register `AnalysisToolRegistry`
- Update tool count in assist prompt (69 → 71)

### Phase 5: Tests

#### 5.1 Unit Tests for Swing Points

**File**: `src/server/indicators/swingPoints.spec.ts`

Tests:
- `should detect swing highs with default lookback`
- `should detect swing lows with default lookback`
- `should detect swing points with custom lookback`
- `should return empty arrays when no swings found`
- `should identify uptrend when latest swing low is before latest swing high`
- `should identify downtrend when latest swing high is before latest swing low`
- `should handle minimum candle count`
- `should handle edge cases (all equal prices)`

#### 5.2 Unit Tests for TechnicalAnalysisService

**File**: `src/server/TechnicalAnalysisService.spec.ts`

Tests:
- `should analyze technicals with default indicators`
- `should analyze technicals with specific indicators`
- `should return correct signal direction for bullish data`
- `should return correct signal direction for bearish data`
- `should handle insufficient candle data gracefully`
- `should use default candleCount when not specified`
- `should calculate price summary correctly`
- `should include all momentum indicators when requested`
- `should include all trend indicators when requested`
- `should include all volatility indicators when requested`
- `should include all volume indicators when requested`
- `should include all pattern indicators when requested`
- `should include swing points when requested`
- `should fetch daily candles for pivot points calculation`
- `should calculate pivot points from previous trading day`
- `should use swing points for fibonacci calculation`
- `should determine fibonacci trend from swing point positions`

#### 5.3 Integration Tests for AnalysisToolRegistry

**File**: `src/server/tools/AnalysisToolRegistry.spec.ts`

Tests:
- `should register analyze_technical_indicators tool`
- `should call service with correct parameters`
- `should return formatted response`
- `should handle service errors`

### Phase 6: Documentation

#### 6.1 docs/IMPLEMENTED_TOOLS.md

- Add `detect_swing_points` to "Technical Indicators" section (now 24)
- Add new section "Technical Analysis (1)" for `analyze_technical_indicators`
- Update total tool count (69 → 71)

#### 6.2 README.md

- Update tool count in features section (69 → 71)
- Brief mention of the new tools

#### 6.3 CLAUDE.md

- Update tool count (69 → 71)

#### 6.4 .claude/rules/indicators.md

- Add step to checklist: "Update `analyze_technical_indicators` if adding new indicator"
- Document that new indicators must be supported by both:
  1. Individual `calculate_*` / `detect_*` tool
  2. `analyze_technical_indicators` aggregated tool

#### 6.5 .claude/skills/coinbase-trading/SKILL.md

- Update section "2. Collect Market Data":
  - New tool `analyze_technical_indicators` as primary method
  - Document legacy workflow (individual tools) as alternative
- Update section "3. Technical Analysis":
  - Note integrated calculation via `analyze_technical_indicators`
  - Reduce manual indicator calls
  - Document `detect_swing_points` as standalone tool for:
    - Identifying support/resistance levels
    - Finding Fibonacci retracement points manually
    - Trend direction analysis

#### 6.6 .claude/skills/coinbase-trading/indicators.md

- Add documentation for `detect_swing_points`
- Note about `analyze_technical_indicators` for bundled calculation

---

## Files Overview

### New Files

| File | Description |
|------|-------------|
| `src/server/indicators/swingPoints.ts` | Williams Fractal swing detection |
| `src/server/indicators/swingPoints.spec.ts` | Tests for swing detection |
| `src/server/TechnicalAnalysis.ts` | Type definitions for analysis |
| `src/server/TechnicalAnalysisService.ts` | Service for integrated analysis |
| `src/server/TechnicalAnalysisService.spec.ts` | Unit tests for service |
| `src/server/tools/AnalysisToolRegistry.ts` | Tool registration |
| `src/server/tools/AnalysisToolRegistry.spec.ts` | Tests for tool registry |

### Files to Modify

| File | Changes |
|------|---------|
| `src/server/TechnicalIndicatorsService.ts` | Add `detectSwingPoints` method |
| `src/server/tools/IndicatorToolRegistry.ts` | Register `detect_swing_points` tool |
| `src/server/CoinbaseMcpServer.ts` | Service + Registry integration, tool count |
| `docs/IMPLEMENTED_TOOLS.md` | Document new tools, count |
| `README.md` | Update tool count |
| `CLAUDE.md` | Update tool count |
| `.claude/rules/indicators.md` | Add requirement to update `analyze_technical_indicators` |
| `.claude/skills/coinbase-trading/SKILL.md` | Switch workflow to new tool |
| `.claude/skills/coinbase-trading/indicators.md` | Document new tools |

---

## Acceptance Criteria

### Functional Criteria

- [ ] **AC-01**: Tool `analyze_technical_indicators` is callable via MCP
- [ ] **AC-02**: Tool accepts parameters: `productId`, `granularity`, `candleCount`, `indicators`
- [ ] **AC-03**: Response contains NO raw candle data
- [ ] **AC-04**: Response contains all requested indicator values
- [ ] **AC-05**: Response contains aggregated signal (score, direction, confidence)
- [ ] **AC-06**: Response contains price summary (current, open, high, low, change24h)
- [ ] **AC-07**: When `indicators: undefined`, ALL 24 indicators are calculated
- [ ] **AC-08**: When `candleCount: undefined`, 100 candles are used
- [ ] **AC-09**: Invalid inputs are rejected with meaningful error messages
- [ ] **AC-10**: All 24 indicators are supported:
  - Momentum: rsi, macd, stochastic, adx, cci, williams_r, roc
  - Trend: sma, ema, ichimoku, psar
  - Volatility: bollinger_bands, atr, keltner
  - Volume: obv, mfi, vwap, volume_profile
  - Patterns: candlestick_patterns, rsi_divergence, chart_patterns, swing_points
  - S/R: pivot_points, fibonacci

### Pivot Points Criteria (Industry Standard)

- [ ] **AC-11**: Pivot points are calculated from Daily candles (not requested timeframe)
- [ ] **AC-12**: Pivot points use previous trading day's OHLC (not current day)
- [ ] **AC-13**: Additional API call is made for daily candles when pivot_points requested
- [ ] **AC-14**: Response includes `source: 'daily'` to indicate data source

### Fibonacci Criteria (Industry Standard)

- [ ] **AC-15**: Fibonacci uses Williams Fractal swing detection (not absolute min/max)
- [ ] **AC-16**: Swing detection uses configurable lookback (default: 2 bars each side)
- [ ] **AC-17**: Trend is determined by which swing point occurred more recently
- [ ] **AC-18**: Response includes `swingHigh` and `swingLow` prices used
- [ ] **AC-19**: Response includes detected `trend` (uptrend/downtrend)

### Swing Points Tool Criteria

- [ ] **AC-20**: Tool `detect_swing_points` is callable via MCP
- [ ] **AC-21**: Tool accepts parameters: `candles`, `lookback` (optional)
- [ ] **AC-22**: Response contains arrays of swing highs and swing lows
- [ ] **AC-23**: Each swing point includes `index`, `price`, and `type`
- [ ] **AC-24**: Response includes `latestSwingHigh` and `latestSwingLow`
- [ ] **AC-25**: Response includes detected `trend`
- [ ] **AC-26**: Tool follows same patterns as other `detect_*` tools (naming, schema, response structure)
- [ ] **AC-27**: Tool is documented in ALL relevant documentation (same as other indicator tools):
  - `docs/IMPLEMENTED_TOOLS.md` (Technical Indicators section)
  - `.claude/skills/coinbase-trading/indicators.md`
  - `.claude/skills/coinbase-trading/SKILL.md`

### Industry Standard Compliance (CRITICAL)

**WARNING**: These tools handle real money. Simplified or incorrect calculations can lead to financial losses.

- [ ] **AC-28**: ALL indicator calculations (existing and new) follow industry-standard formulas
- [ ] **AC-29**: No simplifications or approximations that could affect trading decisions
- [ ] **AC-30**: Williams Fractal implementation matches standard definition (5-bar pattern with configurable lookback)
- [ ] **AC-31**: Pivot Points always use daily OHLC from previous trading day (never intraday data)
- [ ] **AC-32**: Fibonacci Retracement uses proper swing detection (never absolute min/max)
- [ ] **AC-33**: All existing 23 indicator tools continue to use correct industry-standard calculations

### Quality Criteria

- [ ] **AC-34**: `npm run test:coverage` shows 100% coverage in all categories
- [ ] **AC-35**: `npm run lint` shows no errors/warnings
- [ ] **AC-36**: `npm run test:types` shows no errors/warnings
- [ ] **AC-37**: `npm run knip` shows no unused exports/dependencies
- [ ] **AC-38**: `npm run format` was executed before commit

### Test Structure Consistency

- [ ] **AC-39**: Tests for `detect_swing_points` follow same patterns as existing indicator tool tests
- [ ] **AC-40**: Tests for `analyze_technical_indicators` follow same patterns as existing service tests
- [ ] **AC-41**: Test file structure matches existing conventions:
  - Helper functions colocated in `src/server/indicators/*.spec.ts`
  - Service tests in `src/server/*.spec.ts`
  - Tool registry tests follow existing registry test patterns
- [ ] **AC-42**: Test descriptions use same style as existing tests (behavioral, user-perspective)
- [ ] **AC-43**: Mock patterns match `serviceMocks.ts` conventions

### Documentation Criteria

- [ ] **AC-44**: `docs/IMPLEMENTED_TOOLS.md` contains both new tools with descriptions
- [ ] **AC-45**: `docs/IMPLEMENTED_TOOLS.md` shows correct tool count (71)
- [ ] **AC-46**: `README.md` shows correct tool count
- [ ] **AC-47**: `CLAUDE.md` shows correct tool count
- [ ] **AC-48**: `.claude/rules/indicators.md` documents requirement to update `analyze_technical_indicators`
- [ ] **AC-49**: `SKILL.md` documents usage of `analyze_technical_indicators`
- [ ] **AC-50**: `SKILL.md` shows reduced workflow (fewer tool calls)
- [ ] **AC-51**: `SKILL.md` documents `detect_swing_points` as standalone alternative
- [ ] **AC-52**: `indicators.md` documents `detect_swing_points` tool

### Backward Compatibility

- [ ] **AC-53**: All existing 69 tools continue to work unchanged
- [ ] **AC-54**: Existing tests for other tools remain green

### Context Reduction (Validation)

- [ ] **AC-55**: Response size of `analyze_technical_indicators` is < 3KB (vs. ~15KB with individual calls)
- [ ] **AC-56**: Response contains `candleCount` but not the candles themselves

---

## Commit Format

```text
feat(analysis): add analyze_technical_indicators and detect_swing_points tools

- Add swingPoints.ts with Williams Fractal swing detection
- Add TechnicalAnalysis.ts with type definitions for all 24 indicators
- Add TechnicalAnalysisService for integrated candle + indicator analysis
- Add AnalysisToolRegistry for MCP tool registration
- Add detect_swing_points tool to IndicatorToolRegistry
- Update CoinbaseMcpServer to include new tools (71 tools total)
- Implement industry-standard pivot points (from daily candles)
- Implement industry-standard fibonacci (from fractal swing points)
- Update .claude/rules/indicators.md with requirement to extend new tool
- Update SKILL.md workflow to use analyze_technical_indicators
- Update docs/IMPLEMENTED_TOOLS.md with new tools
- Update README.md and CLAUDE.md tool counts
- Add comprehensive tests with 100% coverage

Reduces context usage by ~90-95% by keeping candle data server-side
and only returning computed indicator values to the LLM.
```

---

## Execution Order

1. **Create swing points helper** (`src/server/indicators/swingPoints.ts`)
2. **Write swing points tests** (`src/server/indicators/swingPoints.spec.ts`)
3. **Add detectSwingPoints to TechnicalIndicatorsService**
4. **Register detect_swing_points tool** (`IndicatorToolRegistry.ts`)
5. **Create types** (`TechnicalAnalysis.ts`)
6. **Implement service** (`TechnicalAnalysisService.ts`)
7. **Write service tests** (`TechnicalAnalysisService.spec.ts`)
8. **Create tool registry** (`AnalysisToolRegistry.ts`)
9. **Write tool registry tests** (`AnalysisToolRegistry.spec.ts`)
10. **Server integration** (`CoinbaseMcpServer.ts`)
11. **Run quality checks**:
    - `npm run format`
    - `npm run lint`
    - `npm run test:types`
    - `npm run test:coverage`
    - `npm run knip`
12. **Update documentation**:
    - `docs/IMPLEMENTED_TOOLS.md`
    - `README.md`
    - `CLAUDE.md`
    - `.claude/rules/indicators.md`
    - `.claude/skills/coinbase-trading/SKILL.md`
    - `.claude/skills/coinbase-trading/indicators.md`
13. **Final quality checks**
14. **Create commit**

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Complex service dependencies | Use dependency injection |
| Indicator calculation may fail | Graceful degradation with partial results |
| Response might still be large | Only `latestValue` per indicator, no arrays |
| Breaking changes in skill | Document legacy workflow as alternative |
| Future indicators forgotten | Update `.claude/rules/indicators.md` checklist |
| Daily candle API call fails | Return pivot_points as null with error info |
| No swing points detected | Return fibonacci as null with explanation |

---

## Estimated Response Size

**Before (individual tools)**:
- `get_product_candles`: ~3000 tokens (100 candles)
- `calculate_rsi`: ~200 tokens
- `calculate_macd`: ~300 tokens
- ... × 15 indicators = ~15,000 tokens

**After (analyze_technical_indicators)**:
- Single response: ~1000-1500 tokens (slightly larger due to S/R metadata)
- **Savings: ~90-93%**

---

## Indicator Coverage Matrix

| Category | Count | Indicators |
|----------|-------|------------|
| Momentum | 7 | rsi, macd, stochastic, adx, cci, williams_r, roc |
| Trend | 4 | sma, ema, ichimoku, psar |
| Volatility | 3 | bollinger_bands, atr, keltner |
| Volume | 4 | obv, mfi, vwap, volume_profile |
| Patterns | 4 | candlestick_patterns, rsi_divergence, chart_patterns, **swing_points** |
| Support/Resistance | 2 | pivot_points (daily), fibonacci (swing-based) |
| **Total** | **24** | All indicators with industry-standard calculations |

---

## Technical Details: Industry Standard Compliance

### Pivot Points

| Aspect | Implementation |
|--------|----------------|
| Data Source | Daily OHLC (separate API call) |
| Period | Previous trading day |
| Calculation | Standard pivot formula (configurable: Standard, Fibonacci, Woodie, Camarilla, DeMark) |
| Response Metadata | `source: 'daily'` indicates data origin |

### Fibonacci Retracement

| Aspect | Implementation |
|--------|----------------|
| Swing Detection | Williams Fractal (5-bar pattern by default) |
| Lookback | Configurable (default: 2 bars each side) |
| Trend Detection | Based on which swing point occurred more recently |
| Response Metadata | `swingHigh`, `swingLow`, `trend` included |

### Williams Fractal (Swing Points)

| Aspect | Implementation |
|--------|----------------|
| Pattern | 5-bar pattern (2 bars each side by default) |
| Swing High | Bar high > highs of `lookback` bars before AND after |
| Swing Low | Bar low < lows of `lookback` bars before AND after |
| Configurable | `lookback` parameter (1-10) |
