# Migration Plan: Skill zu MCP Indikator-Tools

## Zusammenfassung

Der Trading-Skill berechnet aktuell technische Indikatoren selbst ("Calculate indicators yourself"). Der MCP Server hat jedoch 22 getestete Indikator-Tools, die stattdessen verwendet werden sollten.

**Vorteile der Migration:**
- Getesteter Code (100% Test-Coverage)
- Konsistente Berechnungen
- Wartbarkeit (Fixes an einer Stelle)
- Keine Formel-Duplikation

---

## Phase 1: SKILL.md - Kritische Anweisungen ändern

### Änderung 1.1: Zeilen 21-29 (DO-Sektion)

**VORHER:**
```markdown
**DO:**

- Call MCP tools DIRECTLY (e.g., `list_accounts`, `get_product_candles`, `create_order`)
- The MCP server is ALREADY RUNNING - tools are available NOW
- Calculate indicators yourself from the candle data returned
- Make trading decisions based on the data

You are a TRADER using the API, not a DEVELOPER building it.
```

**NACHHER:**
```markdown
**DO:**

- Call MCP tools DIRECTLY (e.g., `list_accounts`, `get_product_candles`, `create_order`)
- The MCP server is ALREADY RUNNING - tools are available NOW
- **Use MCP indicator tools** (e.g., `calculate_rsi`, `calculate_macd`) instead of manual calculation
- Make trading decisions based on the indicator results

You are a TRADER using the API, not a DEVELOPER building it.
```

### Änderung 1.2: Nach Zeile 46 - Neue Sektion einfügen

**EINFÜGEN nach "Allowed Pairs":**
```markdown
### Available Indicator Tools

The MCP server provides 22 technical indicator tools. **Always use these instead of manual calculation:**

**Momentum:**
- `calculate_rsi` - RSI with configurable period
- `calculate_stochastic` - Stochastic Oscillator (%K, %D)
- `calculate_williams_r` - Williams %R
- `calculate_cci` - Commodity Channel Index
- `calculate_roc` - Rate of Change
- `detect_rsi_divergence` - Detects bullish/bearish divergence

**Trend:**
- `calculate_macd` - MACD line, signal, histogram
- `calculate_ema` - EMA with configurable period (call multiple times for 9/21/50/200)
- `calculate_adx` - ADX with +DI/-DI
- `calculate_psar` - Parabolic SAR
- `calculate_ichimoku_cloud` - All 5 Ichimoku components

**Volatility:**
- `calculate_bollinger_bands` - BB with %B and bandwidth
- `calculate_atr` - Average True Range
- `calculate_keltner_channels` - Keltner Channels

**Volume:**
- `calculate_obv` - On-Balance Volume
- `calculate_mfi` - Money Flow Index
- `calculate_vwap` - Volume Weighted Average Price
- `calculate_volume_profile` - POC and Value Area

**Support/Resistance:**
- `calculate_pivot_points` - 5 types (Standard, Fibonacci, Woodie, Camarilla, DeMark)
- `calculate_fibonacci_retracement` - Fib levels from swing high/low

**Patterns:**
- `detect_candlestick_patterns` - 31 candlestick patterns
- `detect_chart_patterns` - Double Top/Bottom, H&S, Triangles, Flags
```

---

## Phase 2: SKILL.md - Sektion 3 "Technical Analysis" umstrukturieren

### Änderung 2.1: Zeilen 243-310 ersetzen

**VORHER (Zeilen 243-254):**
```markdown
### 3. Technical Analysis

Calculate for each pair using the comprehensive indicator suite:

**Momentum Indicators**:

- **RSI (14)**: < 30 BUY (+2), > 70 SELL (-2), divergence (±3)
- **Stochastic (14,3,3)**: < 20 with %K cross up → BUY (+2)
- **Williams %R (14)**: < -80 BUY (+1), > -20 SELL (-1)
- **CCI (20)**: < -100 BUY (+2), > +100 SELL (-2)
- **ROC (12)**: Zero crossover signals (±2)
```

**NACHHER:**
```markdown
### 3. Technical Analysis

For each pair, call MCP indicator tools and interpret the results:

**Momentum Indicators** (use MCP tools):

```
rsi = calculate_rsi(candles, period=14)
→ rsi.latestValue < 30: BUY (+2), > 70: SELL (-2)

rsi_div = detect_rsi_divergence(candles)
→ rsi_div.hasBullishDivergence: +3, hasBearishDivergence: -3

stoch = calculate_stochastic(candles)
→ stoch.k < 20 && stoch.k > stoch.d: BUY (+2)

williams = calculate_williams_r(candles)
→ williams.latestValue < -80: BUY (+1), > -20: SELL (-1)

cci = calculate_cci(candles)
→ cci.latestValue < -100: BUY (+2), > +100: SELL (-2)

roc = calculate_roc(candles)
→ roc.latestValue crosses 0 upward: BUY (+2)
```
```

### Änderung 2.2: Trend-Indikatoren (Zeilen 255-267)

**NACHHER:**
```markdown
**Trend Indicators** (use MCP tools):

```
macd = calculate_macd(candles)
→ macd.histogram > 0 && macd.MACD > macd.signal: BUY (+2)
→ Golden cross (MACD crosses signal from below): +3

ema_9 = calculate_ema(candles, period=9)
ema_21 = calculate_ema(candles, period=21)
ema_50 = calculate_ema(candles, period=50)
→ ema_9.latestValue > ema_21.latestValue > ema_50.latestValue: Uptrend (+2)

adx = calculate_adx(candles)
→ adx.latestValue.adx > 25: Strong trend (confirms signals)
→ adx.latestValue.pdi > adx.latestValue.mdi: Bullish (+2)

psar = calculate_psar(candles)
→ price > psar.latestValue: Uptrend (+1)
→ SAR flip: ±2

ichimoku = calculate_ichimoku_cloud(candles)
→ price > ichimoku.latestValue.spanA && price > ichimoku.latestValue.spanB: Bullish (+1)
→ ichimoku.latestValue.conversion crosses ichimoku.latestValue.base above cloud: +3
```
```

### Änderung 2.3: Volatility-Indikatoren (Zeilen 269-273)

**NACHHER:**
```markdown
**Volatility Indicators** (use MCP tools):

```
bb = calculate_bollinger_bands(candles)
→ bb.latestValue.pb < 0: Oversold, BUY (+2)
→ bb.latestValue.pb > 1: Overbought, SELL (-2)

atr = calculate_atr(candles)
→ Use for position sizing: High ATR = smaller position

keltner = calculate_keltner_channels(candles)
→ price < keltner.lower: BUY (+1)
→ price > keltner.upper: SELL (-1)
```
```

### Änderung 2.4: Volume-Indikatoren (Zeilen 275-279)

**NACHHER:**
```markdown
**Volume Indicators** (use MCP tools):

```
obv = calculate_obv(candles)
→ OBV trend diverges from price: ±2

mfi = calculate_mfi(candles)
→ mfi.latestValue < 20: BUY (+2), > 80: SELL (-2)

vwap = calculate_vwap(candles)
→ price > vwap.latestValue: Bullish bias (+1)

volume_profile = calculate_volume_profile(candles)
→ price near POC: Strong support/resistance
```
```

### Änderung 2.5: Support/Resistance (Zeilen 281-284)

**NACHHER:**
```markdown
**Support/Resistance** (use MCP tools):

```
pivots = calculate_pivot_points(candles, type="standard")
→ price bounces off support1: BUY (+2)
→ price rejected at resistance1: SELL (-2)

fib = calculate_fibonacci_retracement(candles, swingHigh, swingLow)
→ price at 61.8% retracement: Strong level (±2)
```
```

### Änderung 2.6: Patterns (Zeilen 286-289)

**NACHHER:**
```markdown
**Patterns** (use MCP tools):

```
candle_patterns = detect_candlestick_patterns(candles)
→ candle_patterns.bullish == true: Overall bullish bias (+2)
→ candle_patterns.bearish == true: Overall bearish bias (-2)
→ Check candle_patterns.detectedPatterns for specific patterns (e.g., ["Hammer", "Morning Star"])

chart_patterns = detect_chart_patterns(candles)
→ double_bottom, inverse_head_and_shoulders: Bullish (+3)
→ double_top, head_and_shoulders: Bearish (-3)
```
```

---

## Phase 3: indicators.md - Umstrukturierung

### Änderung 3.1: Header und Einleitung

**VORHER (Zeilen 1-2):**
```markdown
# Technical Indicators
```

**NACHHER:**
```markdown
# Technical Indicators - MCP Tool Reference

This document describes how to interpret the outputs from MCP indicator tools.
**Do NOT calculate indicators manually** - use the MCP tools instead.
```

### Änderung 3.2: Jeder Indikator-Abschnitt

**Beispiel RSI - VORHER (Zeilen 5-29):**
```markdown
### RSI (Relative Strength Index)

**Period**: 14 candles

**Calculation**:

1. Calculate price changes: `change = close[i] - close[i-1]`
2. Separate gains (positive) and losses (negative, absolute)
3. Average gain = SMA(gains, 14)
4. Average loss = SMA(losses, 14)
5. RS = Average gain / Average loss
6. RSI = 100 - (100 / (1 + RS))

**Interpretation**:
...
```

**Beispiel RSI - NACHHER:**
```markdown
### RSI (Relative Strength Index)

**MCP Tool**: `calculate_rsi`

**Usage**:
```
result = calculate_rsi(candles, period=14)
```

**Output Structure**:
```json
{
  "period": 14,
  "values": [65.2, 68.1, 62.4, ...],
  "latestValue": 62.4
}
```

**Interpretation** (use `latestValue`):

- < 30: Oversold → **BUY signal** (+2)
- < 40: Slightly oversold → **Weak BUY** (+1)
- 40-60: Neutral → No signal (0)
- > 60: Slightly overbought → **Weak SELL** (-1)
- > 70: Overbought → **SELL signal** (-2)

**RSI Divergence** - use `detect_rsi_divergence`:
```
div_result = detect_rsi_divergence(candles)
```
- `hasBullishDivergence: true` → **Strong BUY** (+3)
- `hasBearishDivergence: true` → **Strong SELL** (-3)
```

### Änderung 3.3: Calculation-Sektionen entfernen

Für ALLE Indikatoren:
- **Entfernen**: `**Calculation**:` Sektionen mit Formeln
- **Hinzufügen**: `**MCP Tool**:`, `**Usage**:`, `**Output Structure**:`
- **Behalten**: `**Interpretation**:` Sektionen

---

## Phase 4: state-schema.md - Indikator-Cache ergänzen

### Änderung 4.1: Neue Sektion für Indikator-Caching

**EINFÜGEN:**
```markdown
### Indicator Cache (Optional Optimization)

To avoid recalculating indicators, cache results in session state:

```json
{
  "session": {
    "indicatorCache": {
      "BTC-EUR": {
        "15m": {
          "timestamp": "2026-01-19T10:30:00Z",
          "rsi": { "latestValue": 65, "signal": "neutral" },
          "macd": { "histogram": 120, "signal": "bullish" },
          "adx": { "adx": 28, "trend": "strong" },
          "scores": {
            "momentum": 55,
            "trend": 70,
            "volatility": 45,
            "volume": 60,
            "final": 58
          }
        }
      }
    }
  }
}
```

Cache is invalidated when new candles are fetched.
```

---

## Phase 5: strategies.md - MCP Tool-Referenzen

### Änderung 5.1: Tool-Hinweise ergänzen

In jeder Strategie-Beschreibung hinzufügen:
```markdown
**Tools used**: `calculate_rsi`, `calculate_macd`, `calculate_bollinger_bands`
```

---

## Implementierungs-Reihenfolge

| Schritt | Datei | Änderung | Priorität | Aufwand |
|---------|-------|----------|-----------|---------|
| 1 | SKILL.md | Zeilen 21-29 (kritische Anweisung) | **P0** | 5 min |
| 2 | SKILL.md | Neue Sektion "Available Indicator Tools" | **P0** | 15 min |
| 3 | SKILL.md | Sektion 3 komplett umschreiben | **P1** | 45 min |
| 4 | indicators.md | Alle Momentum-Indikatoren | **P1** | 30 min |
| 5 | indicators.md | Alle Trend-Indikatoren | **P1** | 30 min |
| 6 | indicators.md | Alle Volatility/Volume/S&R | **P1** | 30 min |
| 7 | indicators.md | Alle Pattern-Indikatoren | **P1** | 15 min |
| 8 | state-schema.md | Indicator Cache Sektion | **P2** | 15 min |
| 9 | strategies.md | Tool-Referenzen | **P3** | 15 min |

**Gesamtaufwand**: ~3.5 Stunden

---

## Validierung nach Migration

### Test-Checklist

1. [ ] Skill erkennt `calculate_rsi` als verfügbares Tool
2. [ ] Skill ruft `calculate_macd(candles)` statt manueller Berechnung
3. [ ] Interpretationslogik nutzt `latestValue` korrekt
4. [ ] Multi-EMA Alignment funktioniert mit 3 separaten `calculate_ema` Aufrufen
5. [ ] `detect_candlestick_patterns` wird für Pattern-Erkennung verwendet
6. [ ] `detect_chart_patterns` wird für Chart-Pattern verwendet
7. [ ] Signal-Aggregation nutzt Tool-Outputs korrekt

### Beispiel-Workflow nach Migration

```
1. get_product_candles("BTC-EUR", "FIFTEEN_MINUTE", 100)
2. calculate_rsi(candles) → { latestValue: 35 } → "Weak BUY" (+1)
3. calculate_macd(candles) → { latestValue: { histogram: 150 } } → "Bullish" (+2)
4. calculate_ema(candles, period=9) → { latestValue: 45000 }
5. calculate_ema(candles, period=21) → { latestValue: 44500 }
6. calculate_adx(candles) → { latestValue: { adx: 32, pdi: 25, mdi: 18 } } → "Strong uptrend" (+2)
7. detect_candlestick_patterns(candles) → { bullish: true, detectedPatterns: ["Hammer"] } → +2
8. Aggregate: momentum=+1, trend=+4, patterns=+2 → Final Score: 65 → BUY
```

---

## Entfernte Implementierungen (aus indicators.md)

Nach der Migration können folgende Sektionen entfernt/vereinfacht werden:

- [ ] RSI Calculation (6 Schritte)
- [ ] Stochastic Calculation (2 Schritte)
- [ ] Williams %R Calculation
- [ ] ROC Calculation
- [ ] CCI Calculation (4 Schritte)
- [ ] MACD Calculation (3 Schritte)
- [ ] EMA Calculation (Formel)
- [ ] ADX Calculation (7 Schritte)
- [ ] Parabolic SAR Calculation
- [ ] Ichimoku Calculation (4 Komponenten)
- [ ] Bollinger Bands Calculation (5 Schritte)
- [ ] ATR Calculation (2 Schritte)
- [ ] Keltner Channels Calculation
- [ ] OBV Calculation
- [ ] MFI Calculation (4 Schritte)
- [ ] VWAP Calculation
- [ ] Pivot Points Calculation (alle 5 Typen)
- [ ] Fibonacci Calculation

**Total**: ~40 manuelle Berechnungsformeln werden durch 22 MCP Tool-Aufrufe ersetzt.

---

## Null-Safety Hinweise

Alle MCP Indikator-Tools können `latestValue: null` zurückgeben, wenn nicht genügend Daten vorhanden sind. Der Skill MUSS dies berücksichtigen:

```
// FALSCH - kann zu Runtime-Fehlern führen:
if (rsi.latestValue < 30) { ... }

// RICHTIG - Null-Check:
if (rsi.latestValue !== null && rsi.latestValue < 30) { ... }
```

**Betroffene Tools mit `latestValue: T | null`:**
- `calculate_rsi` → `latestValue: number | null`
- `calculate_macd` → `latestValue: MacdValue | null`
- `calculate_ema` → `latestValue: number | null`
- `calculate_bollinger_bands` → `latestValue: BollingerBandsValue | null`
- `calculate_atr` → `latestValue: number | null`
- `calculate_stochastic` → `latestValue: StochasticValue | null`
- `calculate_adx` → `latestValue: AdxValue | null`
- `calculate_obv` → `latestValue: number | null`
- `calculate_vwap` → `latestValue: number | null`
- `calculate_cci` → `latestValue: number | null`
- `calculate_williams_r` → `latestValue: number | null`
- `calculate_roc` → `latestValue: number | null`
- `calculate_mfi` → `latestValue: number | null`
- `calculate_psar` → `latestValue: number | null`
- `calculate_ichimoku_cloud` → `latestValue: IchimokuCloudDataPoint | null`
- `calculate_keltner_channels` → `latestValue: KeltnerChannelsDataPoint | null`
- `calculate_volume_profile` → `pointOfControl: VolumeProfileZone | null`
- `detect_rsi_divergence` → `latestDivergence: RsiDivergence | null`
- `detect_chart_patterns` → `latestPattern: ChartPattern | null`

---

## Rollback-Strategie

Falls die Migration Probleme verursacht, kann sie schrittweise rückgängig gemacht werden:

### Sofort-Rollback (Phase 1)
Ändere in SKILL.md Zeile 37 zurück zu:
```markdown
- Calculate indicators yourself from the candle data returned
```

### Partieller Rollback
Falls nur bestimmte Indikatoren Probleme machen:
1. Behalte funktionierende MCP-Tool-Aufrufe
2. Füge manuelle Berechnung nur für problematische Indikatoren hinzu
3. Dokumentiere in indicators.md welche Indikatoren manuell berechnet werden

### Vollständiger Rollback
1. Git revert der SKILL.md Änderungen
2. Git revert der indicators.md Änderungen
3. Behalte state-schema.md Cache-Sektion (schadet nicht)

---

## Verifizierung: Formel-Obsoleszenz

**Ergebnis der Analyse:** 95% der manuellen Berechnungsformeln werden obsolet.

| Kategorie | Formeln | Status |
|-----------|---------|--------|
| Momentum (RSI, Stochastic, Williams %R, CCI, ROC, RSI Divergence) | 6 | ✅ Alle obsolet |
| Trend (MACD, EMA, ADX, PSAR, Ichimoku) | 5 | ✅ Alle obsolet |
| Volatility (Bollinger, ATR, Keltner) | 3 | ✅ Alle obsolet |
| Volume (OBV, MFI, VWAP, Volume Profile) | 4 | ✅ Alle obsolet |
| Support/Resistance (Pivots, Fibonacci) | 2 | ✅ Alle obsolet |
| Patterns (31 Candlestick, 9 Chart) | 2 | ✅ Alle obsolet |

**Einzige Lücke:** Bollinger Bandwidth (trivial: `(upper - lower) / middle`)

**Signal Aggregation bleibt erhalten** - Dies ist beabsichtigte Trading-Strategie-Logik, keine Indikator-Berechnung.
