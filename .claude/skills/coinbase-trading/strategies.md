# Trading Strategies

## Enhanced Signal Aggregation

### Technical Signal Categories

| Category | Indicators | Weight |
|----------|------------|--------|
| **Momentum** | RSI, Stochastic, Williams %R, ROC, CCI | 25% |
| **Trend** | MACD, EMA Crossovers, ADX, Parabolic SAR, Ichimoku | 30% |
| **Volatility** | Bollinger Bands, ATR, Keltner Channels | 15% |
| **Volume** | OBV, MFI, VWAP, Volume Profile | 15% |
| **Support/Resistance** | Pivot Points, Fibonacci | 10% |
| **Patterns** | Candlesticks, Chart Patterns | 5% |

### Signal Scoring System

Each indicator provides a score from -3 to +3:
- **+3**: Strong BUY signal
- **+2**: BUY signal
- **+1**: Weak BUY signal
- **0**: Neutral
- **-1**: Weak SELL signal
- **-2**: SELL signal
- **-3**: Strong SELL signal

### Quick Reference: Key Signals

| Condition | Signal | Score |
|-----------|--------|-------|
| RSI < 30 | BUY | +2 |
| RSI > 70 | SELL | -2 |
| RSI Bullish Divergence | BUY | +3 |
| Stochastic %K < 20, crosses %D up | BUY | +2 |
| Stochastic %K > 80, crosses %D down | SELL | -2 |
| MACD Golden Cross | BUY | +3 |
| MACD Death Cross | SELL | -3 |
| EMA 50/200 Golden Cross | BUY | +3 |
| EMA 50/200 Death Cross | SELL | -3 |
| ADX > 25 with +DI > -DI | BUY | +2 |
| ADX > 25 with -DI > +DI | SELL | -2 |
| Price at lower Bollinger Band | BUY | +2 |
| Price at upper Bollinger Band | SELL | -2 |
| OBV Bullish Divergence | BUY | +2 |
| OBV Bearish Divergence | SELL | -2 |
| MFI < 20 | BUY | +2 |
| MFI > 80 | SELL | -2 |
| Price bounces off Pivot S1/S2 | BUY | +2 |
| Price rejected at Pivot R1/R2 | SELL | -2 |
| Bullish Engulfing | BUY | +3 |
| Bearish Engulfing | SELL | -3 |
| Double Bottom | BUY | +3 |
| Double Top | SELL | -3 |

---

## Signal Aggregation Matrix

### Technical + Sentiment Combination

| Technical Score | Sentiment | Final Action |
|-----------------|-----------|--------------|
| Strong BUY (>+60%) | Bullish/Neutral | **STRONG BUY** |
| Strong BUY (>+60%) | Bearish | BUY (reduced confidence) |
| BUY (+40% to +60%) | Bullish/Neutral | **BUY** |
| BUY (+40% to +60%) | Bearish | HOLD (conflict) |
| Weak BUY (+20% to +40%) | Bullish | **BUY** |
| Weak BUY (+20% to +40%) | Neutral/Bearish | HOLD |
| Neutral (-20% to +20%) | * | **HOLD** |
| Weak SELL (-40% to -20%) | Bearish | **SELL** |
| Weak SELL (-40% to -20%) | Neutral/Bullish | HOLD |
| SELL (-60% to -40%) | Bearish/Neutral | **SELL** |
| SELL (-60% to -40%) | Bullish | HOLD (conflict) |
| Strong SELL (<-60%) | Bearish/Neutral | **STRONG SELL** |
| Strong SELL (<-60%) | Bullish | SELL (reduced confidence) |

---

## Strategy: Aggressive (Default)

- **Take-Profit**: 5%
- **Stop-Loss**: 10%
- **Min Signal Strength**: 2+ categories with confirming signals
- **Min Technical Score**: > +40% for BUY, < -40% for SELL
- **ADX Threshold**: > 20 (allow moderate trends)

## Strategy: Conservative

- **Take-Profit**: 3%
- **Stop-Loss**: 5%
- **Min Signal Strength**: 3+ categories with confirming signals
- **Min Technical Score**: > +60% for BUY, < -60% for SELL
- **ADX Threshold**: > 25 (require strong trends)

## Strategy: Scalping

- **Take-Profit**: 1-2%
- **Stop-Loss**: 1-2%
- **Timeframe**: 1-5 minute candles
- **Focus**: Momentum indicators (RSI, Stochastic)
- **Volume confirmation required**

---

## Sentiment Interpretation

| Fear & Greed Index | Interpretation | Signal Modifier |
|--------------------|----------------|-----------------|
| 0-10 | Extreme Fear | Contrarian BUY (+2) |
| 10-25 | Fear | BUY bias (+1) |
| 25-45 | Slight Fear | Slight BUY (+0.5) |
| 45-55 | Neutral | No modifier (0) |
| 55-75 | Slight Greed | Slight SELL (-0.5) |
| 75-90 | Greed | SELL bias (-1) |
| 90-100 | Extreme Greed | Contrarian SELL (-2) |

### News Sentiment Analysis

Search for recent news and categorize:
- **Very Bullish**: Major adoption, ETF approval, positive regulation (+2)
- **Bullish**: Positive earnings, partnerships, upgrades (+1)
- **Neutral**: Mixed news, no significant events (0)
- **Bearish**: Negative regulation, hacks, FUD (-1)
- **Very Bearish**: Exchange collapse, major hack, regulatory crackdown (-2)

---

## Position Sizing

### Based on Signal Confidence

| Signal Strength | Position Size |
|-----------------|---------------|
| Strong (>60%) | 100% of budget |
| Medium (40-60%) | 75% of budget |
| Weak (20-40%) | 50% of budget |
| Very Weak (<20%) | No trade |

### Based on Volatility (ATR)

- ATR < average: Full position size
- ATR 1-2× average: 75% position size
- ATR > 2× average: 50% position size or skip

### Risk Per Trade

- Max risk per trade: 2% of total portfolio
- Max simultaneous positions: 3
- Max exposure per asset: 33% of budget

---

## Trade Filters

### Conditions to AVOID trading:

1. **Low ADX** (< 20): No clear trend
2. **Bollinger Squeeze**: Await breakout direction
3. **Conflicting Signals**: More than 2 categories disagree
4. **High ATR**: Extreme volatility (> 3× average)
5. **Low Volume**: Below average volume
6. **Near Support/Resistance**: Wait for breakout/bounce
7. **Sentiment Extreme**: Unless contrarian strategy active
8. **Major News Pending**: Earnings, FOMC, etc.

### Conditions that STRENGTHEN signals:

1. **Volume Confirmation**: Above average volume
2. **Multiple Timeframe Agreement**: 15m + 1h + 4h align
3. **Trend + Momentum Agree**: ADX confirms, RSI not extreme
4. **Clear S/R Levels**: Entry near support (buy) or resistance (sell)
5. **Pattern Completion**: Chart pattern with volume breakout

---

## Trailing Stop Strategy

After position is profitable:
1. Initial stop: -10% from entry
2. At +3% profit: Move stop to breakeven
3. At +5% profit: Move stop to +3%
4. At +7% profit: Move stop to +5%
5. Continue trailing at 2% below highest price

---

## Multi-Timeframe Analysis

| Timeframe | Purpose |
|-----------|---------|
| 15 min | Entry/Exit timing |
| 1 hour | Short-term trend |
| 4 hour | Medium-term trend |
| Daily | Long-term trend |

**Rule**: Only trade in direction of higher timeframe trend.
- Daily bullish + 4h bullish + 1h pullback → BUY opportunity
- Daily bearish + 4h bearish + 1h rally → SELL opportunity
