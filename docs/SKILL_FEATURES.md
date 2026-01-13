# Trading Skill Features

Complete overview of all features of the autonomous trading agent.

---

## 📊 Overview

| Category | Features |
|----------|----------|
| Risk Management | 5 |
| Order Management | 4 |
| Technical Analysis | 6 Categories |
| Sentiment Analysis | 2 |
| Liquidity Management | 1 |
| Capital Management | 2 |
| State Management | 1 |

---

## 🛡️ Risk Management

### 1. Dynamic ATR-Based Stop-Loss / Take-Profit

Automatically adjusts SL/TP based on current volatility.

| Parameter | Value | Description |
|-----------|-------|-------------|
| ATR Period | 14 Candles | Calculation period |
| TP Multiplier | 2.0× ATR | Take-Profit distance |
| SL Multiplier | 2.0× ATR | Stop-Loss distance |
| Min TP | 2.0% | Minimum TP (covers fees) |
| Max SL | 15.0% | Maximum loss |
| Min SL | 3.0% | Prevents noise triggers |

**Example**:
```
BTC @ €95,000, ATR = €1,900 (2%)
→ TP: 95,000 × 1.04 = €98,800 (+4%)
→ SL: 95,000 × 0.96 = €91,200 (-4%)
```

---

### 2. Trailing Stop-Loss

Locks in profits during strong trends while letting winners run.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Activation Threshold | 3.0% Profit | When trailing becomes active |
| Trail Distance | 1.5% | Distance below highest price |
| Min Lock-In | 1.0% | Minimum profit (covers fees) |

**Example**:
```
Entry: €100 → Peak: €112 (+12%) → Trail at €110.32
Price drops to €110 → SELL @ ~€110 (+10% instead of fixed +5%)
```

---

### 3. Position Sizing by Signal Strength

| Signal | Position Size |
|--------|---------------|
| Strong (>60%) | 100% Budget |
| Medium (40-60%) | 75% Budget |
| Weak (20-40%) | 50% Budget |
| Very Weak (<20%) | No Trade |

---

### 4. Position Sizing by Volatility

| ATR vs Average | Position Size |
|----------------|---------------|
| < 1× | 100% |
| 1-2× | 75% |
| > 2× | 50% or Skip |

---

### 5. Exposure Limits

| Limit | Value |
|-------|-------|
| Max Risk per Trade | 2% Portfolio |
| Max Simultaneous Positions | 3 |
| Max Exposure per Asset | 33% Budget |

---

## 💰 Order Management

### 1. Fee-Optimized Order Selection

Selects order type based on signal strength to minimize fees.

| Signal Strength | Order Type | Fee |
|-----------------|------------|-----|
| > 70% (Strong) | Market (IOC) | ~0.6% |
| 40-70% (Normal) | Limit (GTC) | ~0.4% |
| < 40% (Weak) | No Trade | - |

---

### 2. Limit Order Workflow

```
1. get_best_bid_ask → current price
2. limit_price = best_ask × 1.0005
3. preview_order → create_order
4. Wait 120 seconds
5. If not filled → cancel + Market Fallback
```

---

### 3. Direct Pair Routing

Prefers direct pairs to save fees.

| Route | Fees | Min Profit Required |
|-------|------|---------------------|
| BTC→SOL (direct) | ~0.8% | 2.0% |
| BTC→EUR→SOL (indirect) | ~1.6% | 3.2% |

---

### 4. Minimum Profit Threshold

Only trades when expected profit exceeds fees.

```
MIN_PROFIT = 2 × Round-Trip-Fee
Direct: 2.0%, Indirect: 3.2%
```

---

## 📈 Technical Analysis

### Signal Categories with Weighting

| Category | Weight | Indicators |
|----------|--------|------------|
| **Momentum** | 25% | RSI, Stochastic, Williams %R, ROC, CCI |
| **Trend** | 30% | MACD, EMA Crossovers, ADX, Parabolic SAR |
| **Volatility** | 15% | Bollinger Bands, ATR, Keltner Channels |
| **Volume** | 15% | OBV, MFI, VWAP |
| **Support/Resistance** | 10% | Pivot Points, Fibonacci |
| **Patterns** | 5% | Candlestick Patterns |

---

### Momentum Indicators

| Indicator | BUY Signal | SELL Signal |
|-----------|------------|-------------|
| RSI (14) | < 30 (+2), Divergence (+3) | > 70 (-2) |
| Stochastic (14,3,3) | %K < 20, crosses up (+2) | %K > 80, crosses down (-2) |
| Williams %R (14) | < -80 (+1) | > -20 (-1) |
| CCI (20) | < -100 (+2) | > +100 (-2) |
| ROC (12) | Zero cross up (+2) | Zero cross down (-2) |

---

### Trend Indicators

| Indicator | BUY Signal | SELL Signal |
|-----------|------------|-------------|
| MACD (12,26,9) | Golden Cross (+3) | Death Cross (-3) |
| EMA Alignment | 9 > 21 > 50 (+2) | 9 < 21 < 50 (-2) |
| ADX (14) | > 25, +DI > -DI (+2) | > 25, -DI > +DI (-2) |
| Parabolic SAR | Flip bullish (+2) | Flip bearish (-2) |

---

### Volatility Indicators

| Indicator | BUY Signal | SELL Signal |
|-----------|------------|-------------|
| Bollinger Bands (20,2) | %B < 0 (+2) | %B > 1 (-2) |
| ATR (14) | Position Sizing | Position Sizing |
| Keltner Channels | Below lower (+1) | Above upper (-1) |

---

### Volume Indicators

| Indicator | BUY Signal | SELL Signal |
|-----------|------------|-------------|
| OBV | Bullish Divergence (+2) | Bearish Divergence (-2) |
| MFI (14) | < 20 (+2) | > 80 (-2) |
| VWAP | Price < VWAP (+1) | Price > VWAP (-1) |

---

### Support/Resistance

| Indicator | BUY Signal | SELL Signal |
|-----------|------------|-------------|
| Pivot Points | Bounce off S1/S2 (+2) | Rejected at R1/R2 (-2) |
| Fibonacci | 61.8% Retracement (+2) | 38.2% Rejection (-2) |

---

### Candlestick Patterns

| Pattern | Signal | Score |
|---------|--------|-------|
| Bullish Engulfing | BUY | +3 |
| Hammer | BUY | +2 |
| Morning Star | BUY | +3 |
| Bearish Engulfing | SELL | -3 |
| Shooting Star | SELL | -2 |
| Evening Star | SELL | -3 |

---

## 🧠 Sentiment Analysis

### 1. Fear & Greed Index

| Index | Interpretation | Signal |
|-------|----------------|--------|
| 0-10 | Extreme Fear | Contrarian BUY (+2) |
| 10-25 | Fear | BUY bias (+1) |
| 25-45 | Slight Fear | Slight BUY (+0.5) |
| 45-55 | Neutral | No modifier (0) |
| 55-75 | Slight Greed | Slight SELL (-0.5) |
| 75-90 | Greed | SELL bias (-1) |
| 90-100 | Extreme Greed | Contrarian SELL (-2) |

---

### 2. News Sentiment

| Category | Examples | Score |
|----------|----------|-------|
| Very Bullish | ETF Approval, Major Adoption | +2 |
| Bullish | Partnerships, Upgrades | +1 |
| Neutral | Mixed News | 0 |
| Bearish | FUD, Minor Hacks | -1 |
| Very Bearish | Exchange Collapse | -2 |

---

## 💧 Liquidity Management

### Pre-Trade Liquidity Check

Checks orderbook before altcoin entries.

| Spread | Action | Position Size |
|--------|--------|---------------|
| > 0.5% | Skip Trade | 0% |
| 0.2% - 0.5% | Reduce | 50% |
| < 0.2% | Full Position | 100% |

**Bypassed for**: BTC-EUR, ETH-EUR, Limit Orders, Exits

---

## 💹 Capital Management

### 1. Budget Tracking

- Budget defined per session (e.g., "5 EUR from BTC")
- Remaining budget persisted in state
- Never exceeds budget across all cycles

---

### 2. Compound Mode

Automatic reinvestment of profits for exponential growth.

| Parameter | Default | Description |
|-----------|---------|-------------|
| Enabled | true | Active by default |
| Rate | 50% | Portion of profits |
| Min Amount | €0.10 | Minimum for compounding |
| Max Budget | 2× initial | Budget cap |

**Risk Controls**:
- Pauses after 2 consecutive losses
- Rate reduces to 25% after 3 consecutive wins
- Only compounds positive PnL

**CLI Arguments**:
```
/trade 5 EUR from BTC                 → Compound active (default)
/trade 5 EUR from BTC no-compound     → Compound disabled
/trade 5 EUR from BTC compound=75     → 75% rate
/trade 5 EUR from BTC compound-cap=15 → Max €15 budget
```

---

## 📁 State Management

### Persistent Trading State

Stored in `.claude/trading-state.json`

**Session Data**:
- Budget (initial, remaining)
- Stats (wins, losses, PnL, fees)
- Config (strategy, interval, dryRun)
- Compound (enabled, rate, events)

**Position Data**:
- Entry (price, time, orderType, fee, route)
- Analysis (signalStrength, reason, confidence)
- Risk Management (stopLoss, takeProfit, trailingStop)
- Performance (currentPrice, unrealizedPnL, peakPnL)

**Trade History**:
- Complete documentation of all closed trades
- Exit trigger (SL, TP, Trailing, Manual)
- Net PnL after fees

---

## 🎮 Strategies

### Aggressive (Default)

| Parameter | Value |
|-----------|-------|
| Take-Profit | 5% |
| Stop-Loss | 10% |
| Min Signal | > +40% |
| ADX Threshold | > 20 |

### Conservative

| Parameter | Value |
|-----------|-------|
| Take-Profit | 3% |
| Stop-Loss | 5% |
| Min Signal | > +60% |
| ADX Threshold | > 25 |

### Scalping

| Parameter | Value |
|-----------|-------|
| Take-Profit | 1-2% |
| Stop-Loss | 1-2% |
| Timeframe | 1-5 min |
| Focus | Momentum |

---

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| `/trade [budget]` | Starts autonomous trading loop |
| `/portfolio` | Compact status overview |

---

## 🔄 Trading Loop

```
1. Check Portfolio Status
2. Collect Market Data (Candles, Prices)
3. Technical Analysis (20+ Indicators)
4. Sentiment Analysis (Fear & Greed, News)
5. Pre-Trade Liquidity Check
6. Signal Aggregation
7. Fee & Profit Threshold Check
8. Execute Order (Limit/Market)
9. Check SL/TP/Trailing for open positions
10. Apply Compound (on profitable exits)
11. Output Report
12. Sleep (interval)
13. → Repeat
```

---

## � References

- [SKILL.md](../.claude/skills/coinbase-trading/SKILL.md) - Main documentation
- [state-schema.md](../.claude/skills/coinbase-trading/state-schema.md) - State structure
- [strategies.md](../.claude/skills/coinbase-trading/strategies.md) - Strategies
- [indicators.md](../.claude/skills/coinbase-trading/indicators.md) - Indicator formulas
