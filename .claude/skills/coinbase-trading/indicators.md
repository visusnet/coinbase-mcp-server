# Technical Indicators

## Momentum Indicators

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

- RSI < 30: Oversold → **BUY signal** (+2)
- RSI < 40: Slightly oversold → **Weak BUY** (+1)
- RSI 40-60: Neutral → No signal (0)
- RSI > 60: Slightly overbought → **Weak SELL** (-1)
- RSI > 70: Overbought → **SELL signal** (-2)

**RSI Divergence** (advanced):

- Bullish divergence: Price makes lower low, RSI makes higher low → **Strong BUY** (+3)
- Bearish divergence: Price makes higher high, RSI makes lower high → **Strong SELL** (-3)

---

### Stochastic Oscillator

**Parameters**: %K period=14, %D period=3, slowing=3

**Calculation**:

1. %K = 100 × (Close - Lowest Low) / (Highest High - Lowest Low)
2. %D = SMA(%K, 3)

**Interpretation**:

- %K < 20 AND %K crosses above %D → **BUY signal** (+2)
- %K > 80 AND %K crosses below %D → **SELL signal** (-2)
- %K < 20: Oversold zone → **Weak BUY** (+1)
- %K > 80: Overbought zone → **Weak SELL** (-1)

---

### Williams %R

**Period**: 14 candles

**Calculation**:

1. %R = (Highest High - Close) / (Highest High - Lowest Low) × -100

**Interpretation**:

- %R < -80: Oversold → **BUY signal** (+1)
- %R > -20: Overbought → **SELL signal** (-1)

---

### ROC (Rate of Change)

**Period**: 12 candles

**Calculation**:

1. ROC = ((Close - Close[12]) / Close[12]) × 100

**Interpretation**:

- ROC > 0 and rising → Bullish momentum (+1)
- ROC < 0 and falling → Bearish momentum (-1)
- ROC crosses zero upward → **BUY signal** (+2)
- ROC crosses zero downward → **SELL signal** (-2)

---

### CCI (Commodity Channel Index)

**Period**: 20 candles

**Calculation**:

1. Typical Price (TP) = (High + Low + Close) / 3
2. SMA of TP over 20 periods
3. Mean Deviation = average of |TP - SMA|
4. CCI = (TP - SMA) / (0.015 × Mean Deviation)

**Interpretation**:

- CCI < -100: Oversold → **BUY signal** (+2)
- CCI > +100: Overbought → **SELL signal** (-2)
- CCI crosses -100 from below → Strong BUY (+3)
- CCI crosses +100 from above → Strong SELL (-3)

---

## Trend Indicators

### MACD (Moving Average Convergence Divergence)

**Components**:

- Fast EMA: 12 periods
- Slow EMA: 26 periods
- Signal line: 9-period EMA of MACD

**Calculation**:

1. MACD line = EMA(12) - EMA(26)
2. Signal line = EMA(MACD, 9)
3. Histogram = MACD - Signal

**Interpretation**:

- MACD above signal + positive histogram → **BUY signal** (+2)
- MACD below signal + negative histogram → **SELL signal** (-2)
- MACD crosses signal from below (Golden Cross) → **Strong BUY** (+3)
- MACD crosses signal from above (Death Cross) → **Strong SELL** (-3)
- Histogram increasing → Momentum strengthening
- Histogram decreasing → Momentum weakening

---

### EMA Crossovers

**Parameters**: EMA(9), EMA(21), EMA(50), EMA(200)

**Interpretation**:

- EMA(9) > EMA(21) > EMA(50) → Strong uptrend (+2)
- EMA(9) < EMA(21) < EMA(50) → Strong downtrend (-2)
- Price above EMA(200) → Long-term bullish (+1)
- Price below EMA(200) → Long-term bearish (-1)
- EMA(50) crosses above EMA(200) (Golden Cross) → **Strong BUY** (+3)
- EMA(50) crosses below EMA(200) (Death Cross) → **Strong SELL** (-3)

---

### ADX (Average Directional Index)

**Period**: 14 candles

**Calculation**:

1. +DM = Current High - Previous High (if positive)
2. -DM = Previous Low - Current Low (if positive)
3. TR = max(High-Low, |High-PrevClose|, |Low-PrevClose|)
4. +DI = 100 × EMA(+DM) / EMA(TR)
5. -DI = 100 × EMA(-DM) / EMA(TR)
6. DX = 100 × |+DI - -DI| / (+DI + -DI)
7. ADX = EMA(DX, 14)

**Interpretation**:

- ADX > 25: Strong trend (confirms other signals)
- ADX < 20: Weak/no trend (avoid trading)
- +DI > -DI with ADX > 25 → **BUY signal** (+2)
- -DI > +DI with ADX > 25 → **SELL signal** (-2)
- +DI crosses above -DI → **BUY signal** (+2)
- -DI crosses above +DI → **SELL signal** (-2)

---

### Parabolic SAR

**Parameters**: AF start=0.02, AF max=0.2

**Interpretation**:

- SAR below price → Uptrend → **BUY signal** (+1)
- SAR above price → Downtrend → **SELL signal** (-1)
- SAR flip from above to below → **Strong BUY** (+2)
- SAR flip from below to above → **Strong SELL** (-2)

---

### Ichimoku Cloud

**Components**:

- Tenkan-sen (Conversion): (9-period high + 9-period low) / 2
- Kijun-sen (Base): (26-period high + 26-period low) / 2
- Senkou Span A: (Tenkan + Kijun) / 2, plotted 26 periods ahead
- Senkou Span B: (52-period high + 52-period low) / 2, plotted 26 periods ahead
- Cloud (Kumo): Area between Senkou Span A and B

**Interpretation**:

- Price above cloud → Bullish (+1)
- Price below cloud → Bearish (-1)
- Price enters cloud from below → Potential reversal, wait
- Tenkan crosses Kijun upward above cloud → **Strong BUY** (+3)
- Tenkan crosses Kijun downward below cloud → **Strong SELL** (-3)
- Future cloud green (A > B) → Bullish bias (+1)
- Future cloud red (B > A) → Bearish bias (-1)

---

## Volatility Indicators

### Bollinger Bands

**Parameters**:

- Period: 20 candles
- Standard deviations: 2

**Calculation**:

1. Middle band = SMA(close, 20)
2. Upper band = Middle + 2 × StdDev(close, 20)
3. Lower band = Middle - 2 × StdDev(close, 20)
4. %B = (Price - Lower) / (Upper - Lower)
5. Bandwidth = (Upper - Lower) / Middle

**Interpretation**:

- Price touches/below lower band (%B < 0) → **BUY signal** (+2)
- Price touches/above upper band (%B > 1) → **SELL signal** (-2)
- Price crosses middle band upward → Bullish (+1)
- Price crosses middle band downward → Bearish (-1)
- Bandwidth squeeze (low volatility) → Breakout imminent, prepare
- Bandwidth expansion → Trend continuation

---

### ATR (Average True Range)

**Period**: 14 candles

**Calculation**:

1. TR = max(High-Low, |High-PrevClose|, |Low-PrevClose|)
2. ATR = SMA(TR, 14)

**Use for**:

- Stop-loss placement: Entry ± 2×ATR
- Position sizing: Smaller positions when ATR high
- Volatility filter: High ATR = risky conditions

**Interpretation**:

- ATR increasing → Increasing volatility, larger moves expected
- ATR decreasing → Decreasing volatility, consolidation
- ATR > 2× average → High risk, reduce position size (-1 to signals)

---

### Keltner Channels

**Parameters**: EMA period=20, ATR multiplier=2

**Calculation**:

1. Middle = EMA(close, 20)
2. Upper = Middle + 2 × ATR(10)
3. Lower = Middle - 2 × ATR(10)

**Interpretation**:

- Price below lower channel → **BUY signal** (+1)
- Price above upper channel → **SELL signal** (-1)
- BB squeeze inside Keltner → Volatility breakout imminent

---

## Volume Indicators

### OBV (On-Balance Volume)

**Calculation**:

1. If close > prev close: OBV = prev OBV + volume
2. If close < prev close: OBV = prev OBV - volume
3. If close = prev close: OBV = prev OBV

**Interpretation**:

- OBV rising with price rising → Trend confirmed (+1)
- OBV falling with price rising → **Bearish divergence** (-2)
- OBV rising with price falling → **Bullish divergence** (+2)
- OBV new high with price not at high → Accumulation, expect breakout (+1)

---

### Volume Profile

**Interpretation**:

- Volume increasing on up moves → Bullish (+1)
- Volume increasing on down moves → Bearish (-1)
- Volume spike > 2× average → Significant move, confirms direction
- Decreasing volume during trend → Trend weakening

---

### MFI (Money Flow Index)

**Period**: 14 candles

**Calculation**:

1. Typical Price = (High + Low + Close) / 3
2. Raw Money Flow = TP × Volume
3. Positive/Negative MF based on TP direction
4. MFI = 100 - (100 / (1 + Positive MF / Negative MF))

**Interpretation**:

- MFI < 20: Oversold → **BUY signal** (+2)
- MFI > 80: Overbought → **SELL signal** (-2)
- MFI divergence from price → Reversal signal (±3)

---

### VWAP (Volume Weighted Average Price)

**Calculation**:

1. VWAP = Σ(Price × Volume) / Σ(Volume)

**Interpretation**:

- Price above VWAP → Bullish, buyers in control (+1)
- Price below VWAP → Bearish, sellers in control (-1)
- Price crosses VWAP upward → **BUY signal** (+1)
- Price crosses VWAP downward → **SELL signal** (-1)

---

## Support & Resistance

### Pivot Points

**Calculation**:

1. Pivot = (High + Low + Close) / 3
2. R1 = 2 × Pivot - Low
3. S1 = 2 × Pivot - High
4. R2 = Pivot + (High - Low)
5. S2 = Pivot - (High - Low)

**Interpretation**:

- Price bouncing off S1/S2 → **BUY signal** (+2)
- Price rejected at R1/R2 → **SELL signal** (-2)
- Price breaks above R1 → Bullish breakout (+2)
- Price breaks below S1 → Bearish breakdown (-2)

---

### Fibonacci Retracement

**Key Levels**: 23.6%, 38.2%, 50%, 61.8%, 78.6%

**Interpretation**:

- Price bounces at 38.2% or 50% retracement → **BUY in uptrend** (+2)
- Price bounces at 61.8% retracement → **Strong BUY** (+3)
- Price fails at 38.2% or 50% → **SELL in downtrend** (-2)
- 78.6% break → Trend reversal likely

---

## Pattern Recognition

### Candlestick Patterns

**Bullish Patterns** (BUY signals):

- Hammer / Inverted Hammer at support → +2
- Bullish Engulfing → +3
- Morning Star → +3
- Three White Soldiers → +3
- Piercing Line → +2
- Doji after downtrend → +1 (reversal warning)

**Bearish Patterns** (SELL signals):

- Shooting Star / Hanging Man at resistance → -2
- Bearish Engulfing → -3
- Evening Star → -3
- Three Black Crows → -3
- Dark Cloud Cover → -2
- Doji after uptrend → -1 (reversal warning)

---

### Chart Patterns

**Bullish Patterns**:

- Double Bottom → +3
- Inverse Head & Shoulders → +3
- Ascending Triangle breakout → +2
- Bull Flag breakout → +2
- Cup and Handle → +2

**Bearish Patterns**:

- Double Top → -3
- Head & Shoulders → -3
- Descending Triangle breakdown → -2
- Bear Flag breakdown → -2

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
