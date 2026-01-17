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

- **Take-Profit**: 1.5× ATR (dynamic, typically 3-5%)
- **Stop-Loss**: 2.0× ATR (dynamic, typically 4-10%)
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

- **Take-Profit**: 1.5%
- **Stop-Loss**: 2.0%
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

### Fee-Adjusted Profitability

Before each trade, calculate net profitability:

```
gross_profit = target_price - entry_price
fees = entry_fee + exit_fee
net_profit = gross_profit - fees
profit_ratio = net_profit / entry_price

IF profit_ratio < MIN_PROFIT_THRESHOLD:
  → Skip Trade (not profitable after fees)
```

**Minimum Profit Thresholds**:

- Direct route (e.g., BTC→SOL): 2.0%
- Indirect route (e.g., BTC→EUR→SOL): 3.2%

**Example Calculation**:

| Scenario | Entry | Target (+5%) | Fees | Net | Profitable? |
|----------|-------|--------------|------|-----|-------------|
| Market→Market | 100€ | 105€ | 1.2€ | 3.8€ | ✅ Yes (3.8%) |
| Limit→Market | 100€ | 105€ | 1.0€ | 4.0€ | ✅ Yes (4.0%) |
| Limit→Limit | 100€ | 105€ | 0.8€ | 4.2€ | ✅ Yes (4.2%) |
| Indirect Market→Market | 100€ | 102€ | 1.6€ | 0.4€ | ❌ No (<3.2%) |
| Direct Limit→Market | 100€ | 102€ | 1.0€ | 1.0€ | ❌ No (<2.0%) |

---

## Liquidity Filter

### When to Check

| Scenario | Check Required? |
|----------|----------------|
| Altcoin entries (SOL, AVAX, MATIC, etc.) | ✅ Yes |
| Major pairs (BTC-EUR, ETH-EUR) | ❌ No - always liquid |
| Limit orders | ❌ No - you control the price |
| Exit orders (SL/TP/Trailing) | ❌ No - must exit regardless |

### Spread Thresholds

| Spread | Action | Position Size | Reason |
|--------|--------|---------------|--------|
| > 0.5% | Skip | 0% | Hidden cost exceeds typical profit |
| 0.2% - 0.5% | Reduce | 50% | Partial exposure, reduced risk |
| < 0.2% | Full | 100% | Acceptable spread |

### Spread Calculation

```
spread_pct = (best_ask - best_bid) / best_bid × 100
```

### Example

Orderbook for SOL-EUR:

- Best Bid: €119.50
- Best Ask: €119.65
- Spread: (119.65 - 119.50) / 119.50 = 0.126%
- Decision: < 0.2% → Full position ✅

---

## Trade Filters

### Conditions to AVOID trading

1. **Low ADX** (< 20): No clear trend
2. **Bollinger Squeeze**: Await breakout direction
3. **Conflicting Signals**: More than 2 categories disagree
4. **High ATR**: Extreme volatility (> 3× average)
5. **Low Volume**: Below average volume
6. **Near Support/Resistance**: Wait for breakout/bounce
7. **Sentiment Extreme**: Unless contrarian strategy active
8. **Major News Pending**: Earnings, FOMC, etc.

### Conditions that STRENGTHEN signals

1. **Volume Confirmation**: Above average volume
2. **Multiple Timeframe Agreement**: 15m + 1h + 4h align
3. **Trend + Momentum Agree**: ADX confirms, RSI not extreme
4. **Clear S/R Levels**: Entry near support (buy) or resistance (sell)
5. **Pattern Completion**: Chart pattern with volume breakout

---

## Trailing Stop Strategy

Trailing stop activates after position becomes profitable, locking in gains as price rises.

### Activation Rules

```
IF profit >= ACTIVATION_THRESHOLD (3.0%):
  → Activate trailing stop
  → Set trailingStopPrice = highestPrice × (1 - TRAIL_PERCENT)

// Update on each price check:
highestPrice = max(highestPrice, currentPrice)
trailingStopPrice = highestPrice × (1 - TRAIL_PERCENT)
```

### Parameters

| Parameter | Value | Reasoning |
|-----------|-------|-----------|
| ACTIVATION_THRESHOLD | 3.0% | Enough profit to justify trailing |
| TRAIL_PERCENT | 1.5% | Tight enough to capture gains |
| MIN_LOCK_IN | 1.0% | Ensures fees are covered |

### Exit Priority

| Condition | Priority | Action |
|-----------|----------|--------|
| Price <= dynamicSL | 1 (Highest) | SELL - Stop Loss |
| Price >= dynamicTP | 2 | SELL - Take Profit |
| Trailing triggered | 3 | SELL - Trailing Stop |

### Trailing Stop Progression

| Profit | Trailing Active | Stop Level |
|--------|-----------------|------------|
| < 3% | No | N/A (use dynamicSL) |
| 3-5% | Yes | highest × 0.985 |
| 5-10% | Yes | highest × 0.985 |
| > 10% | Yes | highest × 0.985 |

### Benefits

1. **Captures extended rallies**: No fixed ceiling on profits
2. **Protects gains**: Locks in profit as price rises
3. **Adapts to momentum**: Tighter exit on reversals
4. **Prevents round-trips**: Avoids watching profits evaporate

---

## ATR-Based Stop-Loss / Take-Profit

Dynamic thresholds based on market volatility:

### Calculation

```
ATR_PERCENT = ATR(14) / Price × 100

TP_PERCENT = max(MIN_TP, ATR_PERCENT × TP_MULTIPLIER)
SL_PERCENT = clamp(ATR_PERCENT × SL_MULTIPLIER, MIN_SL, MAX_SL)

take_profit_price = entry_price × (1 + TP_PERCENT / 100)
stop_loss_price = entry_price × (1 - SL_PERCENT / 100)
```

### Default Parameters

| Parameter | Value | Reasoning |
|-----------|-------|-----------|
| TP_MULTIPLIER | 1.5 | Achievable within 1-2 days |
| SL_MULTIPLIER | 2.0 | Room for normal volatility |
| MIN_TP | 2.0% | Must exceed round-trip fees |
| MIN_SL | 3.0% | Avoid noise-triggered stops |
| MAX_SL | 15.0% | Capital protection |

### Volatility Categories

| ATR % | Category | Typical TP | Typical SL |
|-------|----------|------------|------------|
| < 2% | Low | 2.0% (floor) | 3.0% (floor) |
| 2-5% | Normal | 4-10% | 4-10% |
| 5-10% | High | 10-20% | 10-15% (capped) |
| > 10% | Extreme | 20%+ | 15% (capped) |

### Benefits

1. **Adapts to market conditions**: Wider stops in volatile markets
2. **Reduces premature exits**: Normal swings don't trigger SL
3. **Realistic targets**: TP based on actual price movement
4. **Risk management**: MAX_SL prevents catastrophic losses

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
