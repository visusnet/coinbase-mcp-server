# Technical Indicators - MCP Tool Reference

This document describes how to interpret the outputs from MCP indicator tools.
**Do NOT calculate indicators manually** - use the MCP tools instead.

## Momentum Indicators

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

**Usage**:
```
div_result = detect_rsi_divergence(candles)
```

**Output Structure**:
```json
{
  "hasBullishDivergence": true,
  "hasBearishDivergence": false,
  "latestDivergence": { "type": "bullish", "strength": 0.8 }
}
```

**Interpretation**:
- `hasBullishDivergence: true` → **Strong BUY** (+3)
- `hasBearishDivergence: true` → **Strong SELL** (-3)

---

### Stochastic Oscillator

**MCP Tool**: `calculate_stochastic`

**Usage**:
```
result = calculate_stochastic(candles, kPeriod=14, dPeriod=3)
```

**Output Structure**:
```json
{
  "kPeriod": 14,
  "dPeriod": 3,
  "latestValue": { "k": 25.5, "d": 28.3 }
}
```

**Interpretation** (use `latestValue.k` and `latestValue.d`):

- k < 20 AND k crosses above d → **BUY signal** (+2)
- k > 80 AND k crosses below d → **SELL signal** (-2)
- k < 20: Oversold zone → **Weak BUY** (+1)
- k > 80: Overbought zone → **Weak SELL** (-1)

---

### Williams %R

**MCP Tool**: `calculate_williams_r`

**Usage**:
```
result = calculate_williams_r(candles, period=14)
```

**Output Structure**:
```json
{
  "period": 14,
  "values": [-45.2, -38.1, -82.4, ...],
  "latestValue": -82.4
}
```

**Interpretation** (use `latestValue`):

- < -80: Oversold → **BUY signal** (+1)
- > -20: Overbought → **SELL signal** (-1)

---

### ROC (Rate of Change)

**MCP Tool**: `calculate_roc`

**Usage**:
```
result = calculate_roc(candles, period=12)
```

**Output Structure**:
```json
{
  "period": 12,
  "values": [2.5, 3.1, -1.2, ...],
  "latestValue": -1.2
}
```

**Interpretation** (use `latestValue` and `values` for trend):

- > 0 and rising → Bullish momentum (+1)
- < 0 and falling → Bearish momentum (-1)
- crosses zero upward → **BUY signal** (+2)
- crosses zero downward → **SELL signal** (-2)

---

### CCI (Commodity Channel Index)

**MCP Tool**: `calculate_cci`

**Usage**:
```
result = calculate_cci(candles, period=20)
```

**Output Structure**:
```json
{
  "period": 20,
  "values": [85.2, 110.5, -105.3, ...],
  "latestValue": -105.3
}
```

**Interpretation** (use `latestValue`):

- < -100: Oversold → **BUY signal** (+2)
- > +100: Overbought → **SELL signal** (-2)
- crosses -100 from below → Strong BUY (+3)
- crosses +100 from above → Strong SELL (-3)

---

## Trend Indicators

### MACD (Moving Average Convergence Divergence)

**MCP Tool**: `calculate_macd`

**Usage**:
```
result = calculate_macd(candles, fastPeriod=12, slowPeriod=26, signalPeriod=9)
```

**Output Structure**:
```json
{
  "fastPeriod": 12,
  "slowPeriod": 26,
  "signalPeriod": 9,
  "latestValue": {
    "MACD": 125.5,
    "signal": 98.2,
    "histogram": 27.3
  }
}
```

**Interpretation** (use `latestValue`):

- MACD > signal + positive histogram → **BUY signal** (+2)
- MACD < signal + negative histogram → **SELL signal** (-2)
- MACD crosses signal from below (Golden Cross) → **Strong BUY** (+3)
- MACD crosses signal from above (Death Cross) → **Strong SELL** (-3)
- histogram increasing → Momentum strengthening
- histogram decreasing → Momentum weakening

---

### EMA (Exponential Moving Average)

**MCP Tool**: `calculate_ema`

**Usage** (call multiple times for different periods):
```
ema_9 = calculate_ema(candles, period=9)
ema_21 = calculate_ema(candles, period=21)
ema_50 = calculate_ema(candles, period=50)
ema_200 = calculate_ema(candles, period=200)
```

**Output Structure**:
```json
{
  "period": 9,
  "values": [45120.5, 45180.2, 45250.8, ...],
  "latestValue": 45250.8
}
```

**Interpretation** (compare `latestValue` from multiple EMAs):

- EMA(9) > EMA(21) > EMA(50) → Strong uptrend (+2)
- EMA(9) < EMA(21) < EMA(50) → Strong downtrend (-2)
- Price above EMA(200) → Long-term bullish (+1)
- Price below EMA(200) → Long-term bearish (-1)
- EMA(50) crosses above EMA(200) (Golden Cross) → **Strong BUY** (+3)
- EMA(50) crosses below EMA(200) (Death Cross) → **Strong SELL** (-3)

---

### ADX (Average Directional Index)

**MCP Tool**: `calculate_adx`

**Usage**:
```
result = calculate_adx(candles, period=14)
```

**Output Structure**:
```json
{
  "period": 14,
  "latestValue": {
    "adx": 28.5,
    "pdi": 25.2,
    "mdi": 18.8
  }
}
```

**Interpretation** (use `latestValue`):

- adx > 25: Strong trend (confirms other signals)
- adx < 20: Weak/no trend (avoid trading)
- pdi > mdi with adx > 25 → **BUY signal** (+2)
- mdi > pdi with adx > 25 → **SELL signal** (-2)
- pdi crosses above mdi → **BUY signal** (+2)
- mdi crosses above pdi → **SELL signal** (-2)

---

### Parabolic SAR

**MCP Tool**: `calculate_psar`

**Usage**:
```
result = calculate_psar(candles, step=0.02, max=0.2)
```

**Output Structure**:
```json
{
  "step": 0.02,
  "max": 0.2,
  "values": [44850.2, 44920.5, 45010.8, ...],
  "latestValue": 45010.8
}
```

**Interpretation** (compare `latestValue` to current price):

- SAR below price → Uptrend → **BUY signal** (+1)
- SAR above price → Downtrend → **SELL signal** (-1)
- SAR flip from above to below → **Strong BUY** (+2)
- SAR flip from below to above → **Strong SELL** (-2)

---

### Ichimoku Cloud

**MCP Tool**: `calculate_ichimoku_cloud`

**Usage**:
```
result = calculate_ichimoku_cloud(candles, conversionPeriod=9, basePeriod=26, spanPeriod=52, displacement=26)
```

**Output Structure**:
```json
{
  "conversionPeriod": 9,
  "basePeriod": 26,
  "spanPeriod": 52,
  "displacement": 26,
  "latestValue": {
    "conversion": 45100.5,
    "base": 44850.2,
    "spanA": 44975.35,
    "spanB": 44500.8,
    "chikou": null
  }
}
```

**Chikou Span (Lagging Span)**:
The `chikou` field represents the current closing price plotted `displacement` periods (default: 26) in the past. This is used to compare current price action with historical price levels.

- For the most recent `displacement` data points, `chikou` will be `null` because we cannot know future closing prices
- For earlier data points, `chikou` contains the close price from `displacement` periods ahead
- When `chikou` is above the historical price at that position → Bullish confirmation
- When `chikou` is below the historical price at that position → Bearish confirmation

**Interpretation** (use `latestValue`):

- Price above spanA AND spanB → Bullish (+1)
- Price below spanA AND spanB → Bearish (-1)
- Price enters cloud from below → Potential reversal, wait
- conversion crosses base upward above cloud → **Strong BUY** (+3)
- conversion crosses base downward below cloud → **Strong SELL** (-3)
- spanA > spanB (green cloud) → Bullish bias (+1)
- spanB > spanA (red cloud) → Bearish bias (-1)
- chikou above price from 26 periods ago → Trend confirmation (+1)

---

## Volatility Indicators

### Bollinger Bands

**MCP Tool**: `calculate_bollinger_bands`

**Usage**:
```
result = calculate_bollinger_bands(candles, period=20, stdDev=2)
```

**Output Structure**:
```json
{
  "period": 20,
  "stdDev": 2,
  "latestValue": {
    "middle": 45000.0,
    "upper": 46200.5,
    "lower": 43799.5,
    "pb": 0.65,
    "bandwidth": 0.0534
  }
}
```

**Interpretation** (use `latestValue`):

- pb < 0 (price below lower band) → **BUY signal** (+2)
- pb > 1 (price above upper band) → **SELL signal** (-2)
- Price crosses middle band upward → Bullish (+1)
- Price crosses middle band downward → Bearish (-1)
- bandwidth low (squeeze) → Breakout imminent, prepare
- bandwidth expanding → Trend continuation

---

### ATR (Average True Range)

**MCP Tool**: `calculate_atr`

**Usage**:
```
result = calculate_atr(candles, period=14)
```

**Output Structure**:
```json
{
  "period": 14,
  "values": [1250.5, 1320.2, 1180.8, ...],
  "latestValue": 1180.8
}
```

**Use for**:

- Stop-loss placement: Entry ± 2×ATR
- Position sizing: Smaller positions when ATR high
- Volatility filter: High ATR = risky conditions

**Interpretation** (compare `latestValue` to historical average):

- ATR increasing → Increasing volatility, larger moves expected
- ATR decreasing → Decreasing volatility, consolidation
- ATR > 2× average → High risk, reduce position size (-1 to signals)

---

### Keltner Channels

**MCP Tool**: `calculate_keltner_channels`

**Usage**:
```
result = calculate_keltner_channels(candles, maPeriod=20, atrPeriod=10, multiplier=2)
```

**Output Structure**:
```json
{
  "maPeriod": 20,
  "atrPeriod": 10,
  "multiplier": 2,
  "latestValue": {
    "middle": 45000.0,
    "upper": 47500.5,
    "lower": 42499.5
  }
}
```

**Interpretation** (compare price to `latestValue`):

- Price below lower channel → **BUY signal** (+1)
- Price above upper channel → **SELL signal** (-1)
- BB squeeze inside Keltner → Volatility breakout imminent

---

## Volume Indicators

### OBV (On-Balance Volume)

**MCP Tool**: `calculate_obv`

**Usage**:
```
result = calculate_obv(candles)
```

**Output Structure**:
```json
{
  "values": [125000, 128500, 126200, ...],
  "latestValue": 126200
}
```

**Interpretation** (analyze `values` trend vs price trend):

- OBV rising with price rising → Trend confirmed (+1)
- OBV falling with price rising → **Bearish divergence** (-2)
- OBV rising with price falling → **Bullish divergence** (+2)
- OBV new high with price not at high → Accumulation, expect breakout (+1)

---

### Volume Profile

**MCP Tool**: `calculate_volume_profile`

**Usage**:
```
result = calculate_volume_profile(candles, noOfBars=12)
```

**Output Structure**:
```json
{
  "noOfBars": 12,
  "zones": [
    { "priceFrom": 44000, "priceTo": 44500, "volume": 125000 },
    ...
  ],
  "pointOfControl": { "priceFrom": 45000, "priceTo": 45500, "volume": 250000 },
  "valueAreaHigh": 46000,
  "valueAreaLow": 44000
}
```

**Interpretation**:

- Price near `pointOfControl` → Strong support/resistance level
- Price above `valueAreaHigh` → Bullish breakout (+1)
- Price below `valueAreaLow` → Bearish breakdown (-1)
- High volume zones act as support/resistance

---

### MFI (Money Flow Index)

**MCP Tool**: `calculate_mfi`

**Usage**:
```
result = calculate_mfi(candles, period=14)
```

**Output Structure**:
```json
{
  "period": 14,
  "values": [55.2, 62.1, 18.5, ...],
  "latestValue": 18.5
}
```

**Interpretation** (use `latestValue`):

- < 20: Oversold → **BUY signal** (+2)
- > 80: Overbought → **SELL signal** (-2)
- MFI divergence from price → Reversal signal (±3)

---

### VWAP (Volume Weighted Average Price)

**MCP Tool**: `calculate_vwap`

**Usage**:
```
result = calculate_vwap(candles)
```

**Output Structure**:
```json
{
  "values": [45120.5, 45180.2, 45250.8, ...],
  "latestValue": 45250.8
}
```

**Interpretation** (compare price to `latestValue`):

- Price above VWAP → Bullish, buyers in control (+1)
- Price below VWAP → Bearish, sellers in control (-1)
- Price crosses VWAP upward → **BUY signal** (+1)
- Price crosses VWAP downward → **SELL signal** (-1)

---

## Support & Resistance

### Pivot Points

**MCP Tool**: `calculate_pivot_points`

**Usage**:
```
result = calculate_pivot_points(high, low, close, type="standard")
```

**Types available**: standard, fibonacci, woodie, camarilla, demark

**Output Structure**:
```json
{
  "type": "standard",
  "pivotPoint": 45000.0,
  "resistance1": 45500.0,
  "resistance2": 46200.0,
  "resistance3": 46700.0,
  "support1": 44300.0,
  "support2": 43800.0,
  "support3": 43100.0
}
```

**Interpretation**:

- Price bouncing off support1/support2 → **BUY signal** (+2)
- Price rejected at resistance1/resistance2 → **SELL signal** (-2)
- Price breaks above resistance1 → Bullish breakout (+2)
- Price breaks below support1 → Bearish breakdown (-2)

---

### Fibonacci Retracement

**MCP Tool**: `calculate_fibonacci_retracement`

**Usage**:
```
result = calculate_fibonacci_retracement(start=43000, end=47000)
```

**Output Structure**:
```json
{
  "start": 43000,
  "end": 47000,
  "trend": "uptrend",
  "levels": [
    { "level": 0, "price": 43000 },
    { "level": 23.6, "price": 43944 },
    { "level": 38.2, "price": 44528 },
    { "level": 50, "price": 45000 },
    { "level": 61.8, "price": 45472 },
    { "level": 78.6, "price": 46144 },
    { "level": 100, "price": 47000 }
  ]
}
```

**Interpretation** (use `levels` for key price levels):

- Price bounces at 38.2% or 50% retracement → **BUY in uptrend** (+2)
- Price bounces at 61.8% retracement → **Strong BUY** (+3)
- Price fails at 38.2% or 50% → **SELL in downtrend** (-2)
- 78.6% break → Trend reversal likely

---

## Pattern Recognition

### Candlestick Patterns

**MCP Tool**: `detect_candlestick_patterns`

**Usage**:
```
result = detect_candlestick_patterns(candles)
```

**Output Structure**:
```json
{
  "bullish": true,
  "bearish": false,
  "patterns": [
    { "name": "Hammer", "type": "bullish", "detected": true },
    { "name": "Bullish Engulfing", "type": "bullish", "detected": true },
    { "name": "Shooting Star", "type": "bearish", "detected": false },
    ...
  ],
  "detectedPatterns": ["Hammer", "Bullish Engulfing"]
}
```

**Interpretation**:

- `bullish: true` → Overall bullish bias (+2)
- `bearish: true` → Overall bearish bias (-2)
- Check `detectedPatterns` for specific patterns:
  - Bullish: Hammer, Bullish Engulfing, Morning Star → +2 to +3
  - Bearish: Shooting Star, Bearish Engulfing, Evening Star → -2 to -3

---

### Chart Patterns

**MCP Tool**: `detect_chart_patterns`

**Usage**:
```
result = detect_chart_patterns(candles, lookbackPeriod=50)
```

**Output Structure**:
```json
{
  "lookbackPeriod": 50,
  "patterns": [
    {
      "type": "double_bottom",
      "direction": "bullish",
      "confidence": 0.85,
      "startIndex": 10,
      "endIndex": 45,
      "priceTarget": 48500.0
    }
  ],
  "bullishPatterns": [...],
  "bearishPatterns": [...],
  "latestPattern": { "type": "double_bottom", ... }
}
```

**Interpretation**:

- Check `bullishPatterns` for: double_bottom, inverse_head_and_shoulders, ascending_triangle, bull_flag → +2 to +3
- Check `bearishPatterns` for: double_top, head_and_shoulders, descending_triangle, bear_flag → -2 to -3
- Use `priceTarget` for take-profit calculation
- Higher `confidence` = more reliable signal

---

## Signal Aggregation

### Weighted Signal Score

| Category | Weight | Max Score |
|----------|--------|-----------|
| Momentum (RSI, Stoch, CCI) | 25% | ±6 |
| Trend (MACD, EMA, ADX) | 30% | ±9 |
| Volatility (BB, ATR) | 15% | ±4 |
| Volume (OBV, MFI, VWAP) | 15% | ±6 |
| Support/Resistance | 10% | ±3 |
| Patterns | 5% | ±3 |

### Final Signal Calculation

```
Total Score = (Momentum × 0.25) + (Trend × 0.30) + (Volatility × 0.15)
            + (Volume × 0.15) + (S/R × 0.10) + (Patterns × 0.05)

Normalized = Total Score / Max Possible Score × 100
```

### Decision Thresholds

| Score Range | Signal | Confidence |
|-------------|--------|------------|
| > +60% | **Strong BUY** | High |
| +40% to +60% | **BUY** | Medium |
| +20% to +40% | **Weak BUY** | Low |
| -20% to +20% | **HOLD** | - |
| -40% to -20% | **Weak SELL** | Low |
| -60% to -40% | **SELL** | Medium |
| < -60% | **Strong SELL** | High |

### Confirmation Rules

1. **Never trade on a single indicator**
2. **Require at least 3 confirming signals from different categories**
3. **ADX > 25 required for trend trades**
4. **Volume confirmation required for breakouts**
5. **Avoid trading during low volatility (ATR squeeze)**
6. **Multiple timeframe confirmation increases confidence**

### Null-Safety

Many MCP tools return `latestValue: null` when insufficient data is available. Always check for null before using:

```
// WRONG - can cause errors:
if (rsi.latestValue < 30) { ... }

// CORRECT - null check first:
if (rsi.latestValue !== null && rsi.latestValue < 30) { ... }
```
