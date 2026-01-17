# Trading Skill Features

Complete overview of all features of the autonomous trading agent.

---

## 📊 Overview

| Category             | Features      |
|----------------------|---------------|
| Risk Management      | 6             |
| Order Management     | 5             |
| Technical Analysis   | 6 Categories  |
| Sentiment Analysis   | 2             |
| Liquidity Management | 1             |
| Capital Management   | 4             |
| State Management     | 1             |

---

## 🛡️ Risk Management

### 1. Dynamic ATR-Based Stop-Loss / Take-Profit

Automatically adjusts SL/TP based on current volatility.

| Parameter     | Value      | Description               |
|---------------|------------|---------------------------|
| ATR Period    | 14 Candles | Calculation period        |
| TP Multiplier | 1.5× ATR   | Take-Profit distance      |
| SL Multiplier | 2.0× ATR   | Stop-Loss distance        |
| Min TP        | 2.0%       | Minimum TP (covers fees)  |
| Max SL        | 15.0%      | Maximum loss              |
| Min SL        | 3.0%       | Prevents noise triggers   |

**Example**:

```
BTC @ €95,000, ATR = €1,900 (2%)
→ TP: 95,000 × 1.04 = €98,800 (+4%)
→ SL: 95,000 × 0.96 = €91,200 (-4%)
```

---

### 2. Trailing Stop-Loss

Locks in profits during strong trends while letting winners run.

| Parameter            | Value        | Description                   |
|----------------------|--------------|-------------------------------|
| Activation Threshold | 3.0% Profit  | When trailing becomes active  |
| Trail Distance       | 1.5%         | Distance below highest price  |
| Min Lock-In          | 1.0%         | Minimum profit (covers fees)  |

**Example**:

```
Entry: €100 → Peak: €112 (+12%) → Trail at €110.32
Price drops to €110 → SELL @ ~€110 (+10% instead of fixed +5%)
```

---

### 3. Position Sizing by Signal Strength

| Signal            | Position Size |
|-------------------|---------------|
| Strong (>60%)     | 100% Budget   |
| Medium (40-60%)   | 75% Budget    |
| Weak (20-40%)     | 50% Budget    |
| Very Weak (<20%)  | No Trade      |

---

### 4. Position Sizing by Volatility

| ATR vs Average | Position Size |
|----------------|---------------|
| < 1×           | 100%          |
| 1-2×           | 75%           |
| > 2×           | 50% or Skip   |

---

### 5. Exposure Limits

| Limit                      | Value        |
|----------------------------|--------------|
| Max Risk per Trade         | 2% Portfolio |
| Max Simultaneous Positions | 3            |
| Max Exposure per Asset     | 33% Budget   |

---

### 6. Force Exit (Stagnation Score)

Prevents indefinite capital lockup by forcefully closing positions that stagnate for too long.

**Stagnation Score Formula**:

```
score = (hours_held / 12) × (1 - ABS(pnl_percent / 2%))
```

**Force Exit Threshold**: Score > 2.0

**Examples**:

| Hours Held | PnL    | Score | Action             |
|------------|--------|-------|--------------------|
| 24h        | +0.5%  | 1.75  | Keep (monitoring)  |
| 24h        | -0.5%  | 1.75  | Keep (monitoring)  |
| 30h        | +0.2%  | 2.40  | **Force Close**    |
| 36h        | +1.0%  | 2.25  | **Force Close**    |
| 12h        | +5.0%  | 0     | Keep (profitable)  |

**Impact**: Positions with minimal movement and extended holding time are automatically exited via market order, freeing capital for better opportunities. The score-based approach balances patience with preventing capital stagnation.

---

## 💰 Order Management

### 1. Fee-Optimized Order Selection

Selects order type based on signal strength to minimize fees.

| Signal Strength  | Order Type   | Fee    |
|------------------|--------------|--------|
| > 70% (Strong)   | Market (IOC) | ~0.6%  |
| 40-70% (Normal)  | Limit (GTC)  | ~0.4%  |
| < 40% (Weak)     | No Trade     | -      |

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

| Route                  | Fees                             | Min Profit Required |
|------------------------|----------------------------------|---------------------|
| BTC→SOL (direct)       | ~1.0% (maker 0.4% + taker 0.6%)  | 2.0%                |
| BTC→EUR→SOL (indirect) | ~2.0% (2× trades)                | 3.2%                |

---

### 4. Minimum Profit Threshold

Only trades when expected profit exceeds fees.

```
MIN_PROFIT = 2 × Round-Trip-Fee
Direct: 2.0%, Indirect: 3.2%
```

---

### 5. Trading Decision Logic

Signal aggregation determines trade execution:

**Signal Strength Thresholds:**

| Signal Range  | Classification | Action                          | Position Size   |
|---------------|----------------|---------------------------------|-----------------|
| > +60%        | Strong BUY     | Execute                         | 100% of budget  |
| +40% to +60%  | BUY            | Execute                         | 75% of budget   |
| +20% to +40%  | Weak BUY       | Execute if sentiment bullish    | 50% of budget   |
| -20% to +20%  | Neutral        | HOLD                            | -               |
| -40% to -20%  | Weak SELL      | Execute if sentiment bearish    | 50% position    |
| -60% to -40%  | SELL           | Execute                         | 75% position    |
| < -60%        | Strong SELL    | Execute                         | 100% position   |

**Trade Filters (Skip if):**

- ADX < 20 (no clear trend)
- Conflicting signals between categories
- ATR > 3× average (extreme volatility)
- Volume below average

**Position Sizing Adjustments:**

- Volatility: Low (<1× ATR) +10%, Moderate (1-2×) -10%, High (>2×) -50%
- Exposure limits: Max 33% per asset, max 3 positions, max 2% risk per trade

---

### 6. Two-Stage Profit Verification

Prevents unprofitable market order fallbacks.

**Stage 1** (Limit Order):

- Calculate min profit with limit fees (0.4% × 2 = 0.8%)
- If expected profit > 1.6% (2× fees) → Place limit order
- Wait 120 seconds for fill

**Stage 2** (Fallback Check):

- If limit not filled after timeout → Re-check with market fees (0.4% + 0.6% = 1.0%, total 2.0%)
- If expected profit > 4.0% (2× fees) → Execute market order
- If expected profit < 4.0% → **Cancel order, skip trade**

**Example**:

| Signal Strength | Expected Move | Stage 1 Check | Limit Filled | Stage 2 Check | Result                 |
|-----------------|---------------|---------------|--------------|---------------|------------------------|
| 72% (Strong)    | +4.5%         | ✓ (>1.6%)     | No           | ✓ (>4.0%)     | Market order executed  |
| 55% (Medium)    | +3.2%         | ✓ (>1.6%)     | No           | ✗ (<4.0%)     | Order cancelled        |
| 80% (Strong)    | +5.0%         | ✓ (>1.6%)     | Yes          | N/A           | Limit order filled     |

**Impact**: Optimizes fees by preferring limit orders, but prevents executing unprofitable market fallbacks when signals are marginal.

---

## 📈 Technical Analysis

### Signal Categories with Weighting

| Category                | Weight | Indicators                                |
|-------------------------|--------|-------------------------------------------|
| **Momentum**            | 25%    | RSI, Stochastic, Williams %R, ROC, CCI    |
| **Trend**               | 30%    | MACD, EMA Crossovers, ADX, Parabolic SAR  |
| **Volatility**          | 15%    | Bollinger Bands, ATR, Keltner Channels    |
| **Volume**              | 15%    | OBV, MFI, VWAP                            |
| **Support/Resistance**  | 10%    | Pivot Points, Fibonacci                   |
| **Patterns**            | 5%     | Candlestick Patterns                      |

---

### Momentum Indicators

| Indicator            | BUY Signal                  | SELL Signal                |
|----------------------|-----------------------------|----------------------------|
| RSI (14)             | < 30 (+2), Divergence (+3)  | > 70 (-2)                  |
| Stochastic (14,3,3)  | %K < 20, crosses up (+2)    | %K > 80, crosses down (-2) |
| Williams %R (14)     | < -80 (+1)                  | > -20 (-1)                 |
| CCI (20)             | < -100 (+2)                 | > +100 (-2)                |
| ROC (12)             | Zero cross up (+2)          | Zero cross down (-2)       |

---

### Trend Indicators

| Indicator      | BUY Signal            | SELL Signal           |
|----------------|---------------------- |-----------------------|
| MACD (12,26,9) | Golden Cross (+3)     | Death Cross (-3)      |
| EMA Alignment  | 9 > 21 > 50 (+2)      | 9 < 21 < 50 (-2)      |
| ADX (14)       | > 25, +DI > -DI (+2)  | > 25, -DI > +DI (-2)  |
| Parabolic SAR  | Flip bullish (+2)     | Flip bearish (-2)     |

---

### Volatility Indicators

| Indicator              | BUY Signal       | SELL Signal      |
|------------------------|------------------|------------------|
| Bollinger Bands (20,2) | %B < 0 (+2)      | %B > 1 (-2)      |
| ATR (14)               | Position Sizing  | Position Sizing  |
| Keltner Channels       | Below lower (+1) | Above upper (-1) |

---

### Volume Indicators

| Indicator | BUY Signal              | SELL Signal             |
|-----------|-------------------------|-------------------------|
| OBV       | Bullish Divergence (+2) | Bearish Divergence (-2) |
| MFI (14)  | < 20 (+2)               | > 80 (-2)               |
| VWAP      | Price < VWAP (+1)       | Price > VWAP (-1)       |

---

### Support/Resistance

| Indicator    | BUY Signal             | SELL Signal            |
|--------------|------------------------|------------------------|
| Pivot Points | Bounce off S1/S2 (+2)  | Rejected at R1/R2 (-2) |
| Fibonacci    | 61.8% Retracement (+2) | 38.2% Rejection (-2)   |

---

### Candlestick Patterns

| Pattern           | Signal | Score |
|-------------------|--------|-------|
| Bullish Engulfing | BUY    | +3    |
| Hammer            | BUY    | +2    |
| Morning Star      | BUY    | +3    |
| Bearish Engulfing | SELL   | -3    |
| Shooting Star     | SELL   | -2    |
| Evening Star      | SELL   | -3    |

---

## 🧠 Sentiment Analysis

### 1. Fear & Greed Index

| Index   | Interpretation | Signal               |
|---------|----------------|----------------------|
| 0-10    | Extreme Fear   | Contrarian BUY (+2)  |
| 10-25   | Fear           | BUY bias (+1)        |
| 25-45   | Slight Fear    | Slight BUY (+0.5)    |
| 45-55   | Neutral        | No modifier (0)      |
| 55-75   | Slight Greed   | Slight SELL (-0.5)   |
| 75-90   | Greed          | SELL bias (-1)       |
| 90-100  | Extreme Greed  | Contrarian SELL (-2) |

---

### 2. News Sentiment

| Category      | Examples                  | Score |
|---------------|---------------------------|-------|
| Very Bullish  | ETF Approval, Major Adoption | +2 |
| Bullish       | Partnerships, Upgrades    | +1    |
| Neutral       | Mixed News                | 0     |
| Bearish       | FUD, Minor Hacks          | -1    |
| Very Bearish  | Exchange Collapse         | -2    |

---

## 💧 Liquidity Management

### Pre-Trade Liquidity Check

Checks orderbook before altcoin entries.

| Spread       | Action        | Position Size |
|--------------|---------------|---------------|
| > 0.5%       | Skip Trade    | 0%            |
| 0.2% - 0.5%  | Reduce        | 50%           |
| < 0.2%       | Full Position | 100%          |

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

| Parameter  | Default     | Description             |
|------------|-------------|-------------------------|
| Enabled    | true        | Active by default       |
| Rate       | 50%         | Portion of profits      |
| Min Amount | €0.10       | Minimum for compounding |
| Max Budget | 2× initial  | Budget cap              |

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

### 3. Opportunity Rebalancing

Automatically exit stagnant positions for better opportunities.

| Parameter             | Default | Description                                    |
|-----------------------|---------|------------------------------------------------|
| Enabled               | true    | Active by default                              |
| Stagnation Hours      | 12h     | Time to consider position stagnant             |
| Stagnation Threshold  | 3%      | Max movement to be "stagnant"                  |
| Min Opportunity Delta | 40      | Score difference to trigger                    |
| Min Alternative Score | 50      | Minimum score for alternative                  |
| Max Rebalance Loss    | -2%     | Never rebalance if losing more                 |
| Cooldown              | 4h      | Minimum time between rebalances                |
| Max per Day           | 3       | Prevent over-trading                           |
| Flip-Back Block       | 24h     | Don't rebalance to recently exited position    |

**Rebalancing Decision Matrix**:

| Condition                                      | Action             |
|------------------------------------------------|--------------------|
| `delta > 40` AND `stagnant` AND `pnl > -2%`   | REBALANCE          |
| `delta > 60` AND `pnl > -2%`                   | REBALANCE (urgent) |
| `delta > 30` AND `stagnant` AND `pnl > 0`     | REBALANCE          |
| Otherwise                                      | HOLD               |

**Edge Cases**:

- Multiple eligible → Highest delta first, max 1 per cycle
- High volatility (ATR > 2×) → Increase min delta to 60
- No good alternatives (all < 50%) → HOLD

**Example**:

```
SOL-EUR: Held 18h, +1.2% (stagnant)
ETH-EUR: Signal 78% (alternative)
Delta: 78 - 25 = 53 (> 40 ✓)

→ SELL SOL → BUY ETH
→ Log: "Rebalanced SOL→ETH: stagnant 18h, delta +53"
```

**CLI Arguments**:

```
/trade 5 EUR from BTC                    → Rebalancing active (default)
/trade 5 EUR from BTC no-rebalance       → Rebalancing disabled
/trade 5 EUR from BTC rebalance-delta=50 → Custom delta threshold
/trade 5 EUR from BTC rebalance-max=2    → Max 2 per day
```

---

### 4. Budget Exhaustion Check

Prevents deadlock when budget runs low.

**Logic**:

Before seeking new entries, check if `remaining < minimum order size` (typically €2.00):

- **Insufficient budget BUT positions eligible for rebalancing** → Continue (sell X to buy Y)
- **Insufficient budget AND no rebalanceable positions** → Exit session gracefully
- Escapes deadlock by allowing capital reallocation even with €0 remaining

**Example**:

```
Budget: €0.15 remaining, 3 positions open
- BTC: Stagnant 15h, PnL -0.50€
- ETH: Strong +5.00€, not stagnant → Keep
- SOL: Stagnant 13h, PnL +1.20€, alternative delta +55

→ Rebalance SOL to AVAX frees 3.15€ capital
→ New budget: 0.15€ + 3.15€ - 0.04€ fees = 3.26€
→ Session continues
```

**Impact**: Maximizes capital efficiency through position rotation, prevents premature session termination.

---

## 📁 State Management

### Persistent Trading State

Stored in `.claude/trading-state.json`

**Session Data**:

- Budget (initial, remaining)
- Stats (wins, losses, PnL, fees)
- Config (strategy, interval, dryRun)
- Compound (enabled, rate, events)
- Rebalancing (enabled, history, cooldown)

**Position Data**:

- Entry (price, time, orderType, fee, route)
- Analysis (signalStrength, reason, confidence)
- Risk Management (dynamicSL, dynamicTP, trailingStop)
- Performance (currentPrice, unrealizedPnL, peakPnL)
- Rebalancing (eligible, stagnantSince, bestAlternative)

**Trade History**:

- Complete documentation of all closed trades
- Exit trigger (SL, TP, Trailing, Rebalance, Manual)
- Net PnL after fees

---

## 🎮 Strategies

**Strategy Comparison**:

| Strategy     | Min BUY Score | Min SELL Score | Min Categories | ADX Threshold | Use Case          |
|--------------|---------------|----------------|----------------|---------------|-------------------|
| Aggressive   | +40%          | -40%           | 2+             | > 20          | Default, balanced |
| Conservative | +60%          | -60%           | 3+             | > 25          | Risk-averse       |
| Scalping     | +40%          | -40%           | 2+ (momentum)  | > 20          | Fast trades       |

---

### Aggressive (Default)

| Parameter     | Value                                 |
|---------------|---------------------------------------|
| Take-Profit   | 1.5× ATR (dynamic, typically 3-5%)    |
| Stop-Loss     | 2.0× ATR (dynamic, typically 4-10%)   |
| Min Signal    | > +40%                                |
| ADX Threshold | > 20                                  |

### Conservative

| Parameter     | Value  |
|---------------|--------|
| Take-Profit   | 3%     |
| Stop-Loss     | 5%     |
| Min Signal    | > +60% |
| ADX Threshold | > 25   |

### Scalping

| Parameter   | Value     |
|-------------|-----------|
| Take-Profit | 1-2%      |
| Stop-Loss   | 1-2%      |
| Timeframe   | 1-5 min   |
| Focus       | Momentum  |

---

## ⚡ Quick Commands

| Command           | Description                     |
|-------------------|---------------------------------|
| `/trade [budget]` | Starts autonomous trading loop  |
| `/portfolio`      | Compact status overview         |

---

## 🔄 Trading Loop

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: DATA COLLECTION                                    │
│   1. Check Portfolio Status                                 │
│   2. Collect Market Data                                    │
│   3. Technical Analysis                                     │
│   4. Sentiment Analysis                                     │
├─────────────────────────────────────────────────────────────┤
│ PHASE 2: MANAGE EXISTING POSITIONS (frees up capital)       │
│   5. Check SL/TP/Trailing                                   │
│   6. Rebalancing Check                                      │
│   7. Apply Compound (after exits)                           │
├─────────────────────────────────────────────────────────────┤
│ PHASE 3: NEW ENTRIES (uses freed capital)                   │
│   8. Signal Aggregation                                     │
│   9. Check Fees & Profit Threshold                          │
│  10. Pre-Trade Liquidity Check                              │
│  11. Execute Order                                          │
├─────────────────────────────────────────────────────────────┤
│ PHASE 4: REPORT                                             │
│  12. Output Report                                          │
│  13. Sleep → Repeat                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Complex Scenarios

Real-world examples demonstrating feature interactions:

### Scenario 1: Compound + Rebalancing Interaction

**Initial State**:

- Budget: 10.00€, BTC position +5.00€ profit (unrealized)
- Compound: 50% rate, enabled
- Rebalancing: Enabled, BTC stagnant for 14h

**Sequence**:

1. Rebalancing detects better opportunity in ETH (delta +45)
2. Exit BTC: Sell @ +5.00€ gross
3. Fees: Entry 0.04€ + Exit 0.04€ = 0.08€
4. Net PnL: 5.00€ - 0.08€ = 4.92€
5. **Compound**: 50% × 4.92€ = 2.46€ added to budget
6. New budget: 10.00€ + 4.92€ + 2.46€ = 17.38€
7. Enter ETH: Use budget from freed capital + compounded amount

**Result**: Budget grows to 17.38€, ETH position opened with freed capital

---

### Scenario 2: Trailing Stop Priority vs Rebalancing

**Initial State**:

- SOL position: Entry 100€, Current 112€ (+12%)
- Trailing stop: Active @ 110.32€ (1.5% trail)
- Rebalancing: Eligible, ETH shows better opportunity (delta +50)

**Decision Order**:

1. **Trailing stop checked FIRST** (every cycle)
2. Current price 112€ > Trail 110.32€ → No trigger
3. Update trail: 112€ × 0.985 = 110.32€
4. **Then rebalancing** (if position still open)
5. SOL not stagnant (strong move +12%) → Skip rebalancing
6. HOLD SOL position

**Alternative**: If price drops to 110€:

1. Trailing stop: 110€ < 110.32€ → **TRIGGER**
2. Exit SOL @ 110€ (+10% profit)
3. Rebalancing: Position already closed → Skip
4. Compound: Add 50% of profit to budget
5. Seek new entry (ETH still best opportunity → Enter ETH)

**Result**: Trailing stop takes priority, rebalancing only runs if position still open

---

### Scenario 3: Budget Exhaustion with Multiple Positions

**Initial State**:

- Budget: 10.00€ initial, 0.15€ remaining
- Position 1: BTC-EUR, 3.50€ invested
- Position 2: ETH-EUR, 3.20€ invested
- Position 3: SOL-EUR, 3.15€ invested
- Total invested: 9.85€

**Cycle Check**:

1. Budget check: 0.15€ < 2.00€ minimum → Insufficient for new entry
2. Rebalancing check:
   - BTC: Stagnant 15h, PnL -0.50€
   - ETH: Strong +5.00€, not stagnant → Keep
   - SOL: Moderate +1.20€, stagnant 13h, alternative with delta +55 exists
3. **Rebalancing**: Exit SOL (-0.04€ fee) → 3.15€ freed
4. New budget: 0.15€ + 3.15€ - 0.04€ = 3.26€
5. Enter AVAX with better signal
6. Continue trading

**Result**: Rebalancing prevents budget deadlock, session continues

---

### Scenario 4: Partial Fill with Compound

**Initial State**:

- Budget: 20.00€
- Strong BUY signal for BTC (75%), target size 15.00€

**Sequence**:

1. Place limit order: 15.00€ @ 95,000€
2. Wait 120 seconds
3. Partial fill: Only 10.00€ filled (66% filled)
4. Check order status: `status=FILLED`, `filled_value=10.00€`
5. **No fallback** (order shows FILLED for partial)
6. Position opened: 10.00€ invested
7. Budget remaining: 20.00€ - 10.00€ - 0.04€ fee = 9.96€

**Later - Position Closed at Profit**:
8. Exit @ +3.00€ gross profit
9. Net profit: 3.00€ - 0.08€ fees = 2.92€
10. **Compound**: 50% × 2.92€ = 1.46€
11. Budget: 9.96€ + 10.00€ + 2.92€ + 1.46€ = 24.34€

**Result**: Partial fill handled correctly, no over-buying, compound applied to realized profit

---

### Scenario 5: Consecutive Losses with Rebalancing

**Initial State**:

- Budget: 10.00€, Compound enabled (50% rate)
- Position history: Win (+2€) → Loss (-1€) → Loss (-1€)
- Compound state: Paused after 2 consecutive losses

**Current Cycle**:

1. ETH position: Held 14h, stagnant (+0.80€)
2. AVAX shows strong signal (delta +55)
3. **Rebalancing triggered**:
   - Exit ETH: +0.80€ gross - 0.08€ fees = +0.72€ net
   - This is a WIN → Consecutive losses reset to 0
   - Consecutive wins: 1
4. **Compound still paused** (needs 2 consecutive wins to resume)
5. Budget: 10.00€ + 0.72€ = 10.72€ (no compound added)
6. Enter AVAX: 10.72€ invested

**Next Trade (WIN)**:
7. AVAX exits at +1.50€ net profit
8. Consecutive wins: 2 → **Compound resumes**
9. Compound: 50% × 1.50€ = 0.75€
10. Budget: 10.72€ + 1.50€ + 0.75€ = 12.97€

**Result**: Rebalancing can contribute to win streak recovery, compound resumes after 2 consecutive wins

---

### Scenario 6: Multi-Position Budget Allocation

**Initial State**:

- Budget: 30.00€
- Strong signals for BTC (70%), ETH (65%), SOL (60%)
- Max 3 positions, max 33% per asset

**Decision Process**:

1. **BTC**: Signal 70% → 100% allocation = 30.00€
   - Check exposure: 30.00€ / 30.00€ = 100% > 33% → **REDUCE**
   - Max investment: 30.00€ × 0.33 = 10.00€
   - Enter BTC: 10.00€
   - Remaining: 20.00€

2. **ETH**: Signal 65% → 75% allocation = 15.00€
   - Check exposure: 15.00€ / 30.00€ = 50% > 33% → **REDUCE**
   - Max investment: 30.00€ × 0.33 = 10.00€
   - Enter ETH: 10.00€
   - Remaining: 10.00€

3. **SOL**: Signal 60% → 75% allocation = 7.50€
   - Check exposure: 7.50€ / 30.00€ = 25% < 33% → ✓
   - Check position limit: 3 positions total → At max
   - **Skip** (max positions reached)
   - Remaining: 10.00€

**Result**: 3 positions opened (BTC 10€, ETH 10€, remaining 10€), exposure limits enforced

---

### Scenario 7: Session Resume with Stagnant Position

**Previous Session**:

- BTC position opened: 2026-01-10T10:00:00Z
- Last update: 2026-01-10T14:00:00Z (4h holding)
- Price: Entry 95,000€, Current 95,800€ (+0.84%)
- Stagnant since: 2026-01-10T12:00:00Z (2h ago)

**Session Resume** (2026-01-11T09:00:00Z, 19h later):

1. Validate timestamps:
   - Hours since last update: 19h
   - Stagnant duration: 21h total (2h + 19h)
2. Update position:
   - Current price: 96,200€ (+1.26% total move)
   - Still < 3% → **Still stagnant**
3. Check rebalancing:
   - Stagnant 21h > 12h threshold → Eligible
   - Alternative: ETH signal 75% vs BTC 30% → Delta +45
   - PnL +1.26% > -2% → ✓
4. **Rebalancing triggered**:
   - Exit BTC @ 96,200€
   - Net profit: 1.26% - 0.8% fees = +0.46%
   - Enter ETH
5. Cooldown reset: lastRebalance = 2026-01-11T09:00:00Z

**Result**: Session resume correctly preserves stagnation tracking, rebalancing executes after resume

---

### Scenario 8: Fee Structure Impact on Profit Check

**Two-Stage Profit Verification**:

**Initial Check (Limit Order Scenario)**:

- Signal: BTC 72% (Strong)
- Expected move: +4.5%
- Round-trip fees (limit): 0.8% (maker 0.4% × 2)
- Min profit: 2 × 0.8% = 1.6%
- Check: 4.5% > 1.6% → ✓ **PASS (Limit order placed)**

**Fallback Check (If Limit Not Filled)**:

- Limit order timeout after 120s
- Re-check with market fees: 2.0% (maker 0.4% entry + taker 0.6% exit)
- Min profit: 2 × 2.0% = 4.0%
- Check: 4.5% > 4.0% → ✓ **PASS (Market fallback executed)**

**Alternative - Low Signal**:

- Signal: SOL 55% (Medium)
- Expected move: +3.2%
- Initial check: 3.2% > 1.6% → ✓ (Limit order placed)
- Fallback check: 3.2% < 4.0% → ✗ **FAIL (Cancel order, skip trade)**

**Result**: Two-stage profit check prevents losing trades on market order fallback

---

## � References

- [SKILL.md](../.claude/skills/coinbase-trading/SKILL.md) - Main documentation
- [state-schema.md](../.claude/skills/coinbase-trading/state-schema.md) - State structure
- [strategies.md](../.claude/skills/coinbase-trading/strategies.md) - Strategies
- [indicators.md](../.claude/skills/coinbase-trading/indicators.md) - Indicator formulas
