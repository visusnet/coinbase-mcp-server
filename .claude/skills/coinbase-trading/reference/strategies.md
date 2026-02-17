# Trading Strategies

> **Note**: All indicators mentioned in this document are available as MCP tools.
> Use `calculate_rsi`, `calculate_macd`, `calculate_adx`, etc. instead of manual calculation.
> See [indicators.md](indicators.md) for complete MCP tool reference.

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

- **Take-Profit**: 2.5× ATR (dynamic, typically 2.5-10%)
- **Stop-Loss**: 1.5× ATR (dynamic, typically 2.5-6%)
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

## Strategy: Post-Capitulation Scalp

Activated automatically when `session.regime.current == "POST_CAPITULATION"`. Not user-selectable.

- **Take-Profit**: 4.5% fixed
- **Stop-Loss**: 2.5% fixed
- **Max Position Size**: 50% of available capital (hard cap, CUMULATIVE across all POST_CAP positions)
- **MTF Requirement**: 1H neutral or better (6H/daily skipped)
- **ADX Requirement**: ADX > 10 AND rising + (+DI > -DI) replaces ADX > 20
- **Min Technical Score**: > +33% for BUY
- **Min Categories Confirming**: 2+
- **Duration Limit**: Auto-expires after 72h, falls back to BEAR
- **Trailing Stop**: Uses global trailing (3.0% activation, 1.5% trail, 1.0% min lock-in) — activates before TP, allowing positions to ride strong bounces

**Activation**: F&G < 15 + 3+ pairs at STRONG_SELL (-50) simultaneously + volume spikes (3x+)

**R:R Analysis**: With ~1.5% round-trip fees: net TP = 4.5% - 1.5% = 3.0%, net SL = 2.5% + 1.5% = 4.0%. Breakeven win rate: ~57%. Trailing stop provides intermediate exits between 3-4.5% if price reverses.

**Rationale**: After a 50% crash, 6H EMAs are 30-40% above price (structurally unfillable for months). ADX is 10-14 at bottoms (trend exhaustion, not absence). These filters block all recovery entries. This strategy accepts structural HTF bearishness and trades the bounce with tight stops.

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
| Strong (>60%) | 100% of available capital |
| Medium (40-60%) | 75% of available capital |
| Weak (20-40%) | 50% of available capital |
| Very Weak (<20%) | No trade |

### Based on Volatility (ATR)

- ATR < average: Full position size
- ATR 1-2× average: 75% position size
- ATR > 2× average: 50% position size or skip

### Risk Per Trade

- Max risk per trade: 2% of Default portfolio value
- Max exposure per asset: 33% of available capital

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

**Minimum Profit Thresholds** (dynamic, from `get_transaction_summary`):

- Direct route: `(entry_fee + exit_fee + 0.3% slippage) × 2`
- Indirect route: `(entry_fee + exit_fee + 0.3% slippage) × 4`

As trading volume increases, Coinbase fee tiers drop and thresholds automatically tighten.

**Example Calculation** (at 0.4% maker / 0.6% taker → Direct min 2.6%, Indirect min 5.2%):

| Scenario | Entry | Target (+5%) | Fees | Net | Profitable? |
|----------|-------|--------------|------|-----|-------------|
| Market→Market | 100€ | 105€ | 1.2€ | 3.8€ | ✅ Yes (3.8% > 2.6%) |
| Limit→Market | 100€ | 105€ | 1.0€ | 4.0€ | ✅ Yes (4.0% > 2.6%) |
| Limit→Limit | 100€ | 105€ | 0.8€ | 4.2€ | ✅ Yes (4.2% > 2.6%) |
| Indirect Market→Market | 100€ | 102€ | 1.6€ | 0.4€ | ❌ No (0.4% < 5.2%) |
| Direct Limit→Market | 100€ | 102€ | 1.0€ | 1.0€ | ❌ No (1.0% < 2.6%) |

---

## Liquidity Filter

### When to Check

| Scenario | Check Required? |
|----------|----------------|
| Altcoin entries (SOL, AVAX, MATIC, etc.) | ✅ Yes |
| Major pairs (BTC, ETH) in any quote currency | ❌ No - always liquid |
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

1. **Low ADX**: < 20 in NORMAL/BEAR. In POST_CAPITULATION: ADX > 10 AND rising + (+DI > -DI).
2. **Bollinger Squeeze**: Await breakout direction
3. **Conflicting Signals**: More than 2 categories disagree
4. **High ATR**: Extreme volatility (> 3× average)
5. **Low Volume**: Below average volume
6. **Near Support/Resistance**: Wait for breakout/bounce
7. **Sentiment Extreme**: Unless contrarian strategy active
8. **Major News Pending**: Earnings, FOMC, etc.

### False Breakout Prevention

Before entering on a breakout (price crossing key level), require confirmation:

1. **Time confirmation**: Price must hold above/below the level for at least 15 minutes (one 15m candle close beyond the level)
2. **RSI confirmation**: RSI must be > 40 for bullish breakouts (not deeply oversold momentum pushing price temporarily) or < 60 for bearish breakdowns
3. **Volume confirmation**: Volume on the breakout candle should be above the 20-period average
4. **Prefer stop-limit entries**: Instead of chasing with a market order, set a stop-limit buy above the breakout level. If the breakout is real, it fills. If it's fake, it doesn't.

**Signs of a false breakout:**
- Price spikes above resistance but immediately reverses within the same candle (long upper wick)
- Breakout occurs on declining volume
- RSI is already overbought (>70) at the breakout level
- Higher timeframe trend conflicts with breakout direction

### Conditions that STRENGTHEN signals

1. **Volume Confirmation**: Above average volume
2. **Multiple Timeframe Agreement**: 15m + 1h + 6h align
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
| TP_MULTIPLIER | 2.5 | R:R ≥ 1.67:1, breakeven at ~37.5% win rate |
| SL_MULTIPLIER | 1.5 | Tighter SL cuts losers early |
| MIN_TP | 2.5% | Must exceed round-trip fees + margin |
| MIN_SL | 2.5% | Avoid noise-triggered stops |
| MAX_SL | 10.0% | Capital protection |

### Volatility Categories

| ATR % | Category | Typical TP | Typical SL |
|-------|----------|------------|------------|
| < 1% | Low | 2.5% (floor) | 2.5% (floor) |
| 1-4% | Normal | 2.5-10% | 2.5-6% |
| 4-7% | High | 10-17.5% | 6-10% (capped) |
| > 7% | Extreme | 17.5%+ | 10% (capped) |

### Benefits

1. **Positive R:R structure**: TP/SL = 2.5/1.5 = 1.67:1, breakeven at ~37.5% win rate
2. **Adapts to market conditions**: Both TP and SL scale with ATR
3. **Lets winners run**: Wider TP captures more of favorable moves
4. **Cuts losers early**: Tighter SL limits downside per trade
5. **Risk management**: MAX_SL at 10% prevents catastrophic single-trade losses

---

## Bracket TP/SL (Catastrophic Stop — Outer Layer)

The attached bracket on Coinbase is a wide safety net. It only fires if the bot is offline. The bot's soft SL/TP (above) handles normal exits.

### Bracket SL (all strategies)

```
bracket_sl_pct = clamp(ATR_PERCENT * 3, 8.0, 12.0)
bracket_sl_price = entry_price * (1 - bracket_sl_pct / 100)
```

- Floor 8%: survives 92.8% of daily drawdowns (validated across 10 major pairs, 90 days)
- Ceiling 12%: caps catastrophic single-trade loss
- ATR-adaptive: volatile assets get wider brackets

### Bracket TP (strategy-dependent)

| Strategy | Bracket TP | Reasoning |
|----------|-----------|-----------|
| **Aggressive** | `max(10%, ATR% × 5)` | Wide ceiling — trailing stop manages real exit |
| **Conservative** | `3.0%` fixed | Predictable, moderate target |
| **Scalping** | `round_trip_fees × 2` (~3% at current tier) | Guarantees net profit after fees |
| **Post-Cap Scalp** | `max(8%, round_trip_fees × 4)` | Wide safety net above soft TP |

### Relationship: Bracket vs Soft

| Layer | SL | TP | Managed by |
|-------|----|----|------------|
| **Soft (inner)** | ATR-based (2.5-10%) | ATR/fixed (1.5-10%+) | Bot via `wait_for_event` |
| **Bracket (outer)** | `clamp(ATR% × 3, 8%, 12%)` | Strategy-dependent | Coinbase (attached bracket) |
| **Post-Cap Soft (inner)** | 2.5% fixed | 4.5% fixed | Bot via wait_for_event |

The soft layer is always tighter. The bracket is the fallback.

**Note**: BEAR regime uses the same entry parameters as NORMAL. The distinction exists for state machine transitions (preventing POST_CAP during ongoing bear, requiring stronger recovery signals before NORMAL). Do not add ad-hoc restrictions for BEAR.

---

## Multi-Timeframe Analysis

| Timeframe | Purpose |
|-----------|---------|
| 15 min | Entry/Exit timing |
| 1 hour | Short-term trend |
| 6 hour | Medium-term trend |
| Daily | Long-term trend |

**Rule**: Only trade in direction of higher timeframe trend.

- Daily bullish + 6h bullish + 1h pullback → BUY opportunity
- Daily bearish + 6h bearish + 1h rally → SELL opportunity
