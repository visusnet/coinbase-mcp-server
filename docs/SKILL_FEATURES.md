# Trading Skill Features

Complete overview of all features of the autonomous trading agent.

---

## 📊 Overview

| Category              | Features      |
|-----------------------|---------------|
| Risk Management       | 6             |
| Order Management      | 6             |
| Technical Analysis    | 6 Categories  |
| Sentiment Analysis    | 2             |
| Liquidity Management  | 1             |
| Capital Management    | 4             |
| Event-Driven Monitoring | 1           |
| State Management      | 1             |

---

## 🛡️ Risk Management

### 1. Dynamic ATR-Based Stop-Loss / Take-Profit

Automatically adjusts SL/TP based on current volatility.

| Parameter     | Value      | Description               |
|---------------|------------|---------------------------|
| ATR Period    | 14 Candles | Calculation period        |
| TP Multiplier | 2.5× ATR   | Take-Profit distance      |
| SL Multiplier | 1.5× ATR   | Stop-Loss distance        |
| Min TP        | 2.5%       | Minimum TP (covers fees)  |
| Max SL        | 10.0%      | Capital protection        |
| Min SL        | 2.5%       | Prevents noise triggers   |

**Example** (ATR% ≈ 2.7%):

```
BTC @ €95,000, ATR ≈ 2.7%
→ Soft TP: max(2.5%, 2.7% × 2.5) = 6.75% → €101,400
→ Soft SL: clamp(2.7% × 1.5, 2.5%, 10%) = 4.05% → €91,150
```

**Dual-Layer Protection**:

- **Inner Layer (Primary)**: Bot-managed soft SL/TP — tighter thresholds checked each cycle via `wait_for_market_event`, plus trailing stop management and 24h recalculation
- **Outer Layer (Fallback)**: Attached bracket orders on Coinbase — wide catastrophic stop (`clamp(ATR% × 3, 8%, 12%)`) that only fires if the bot is offline

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
| Strong (>60%)     | 100% Capital  |
| Medium (40-60%)   | 75% Capital   |
| Weak (20-40%)     | 50% Capital   |
| Very Weak (<20%)  | No Trade      |

---

### 4. Position Sizing by Volatility

| ATR vs Average | Multiplier | Example (75% base) |
|----------------|------------|---------------------|
| < 1×           | ×1.10      | 82.5%               |
| 1-2×           | ×0.90      | 67.5%               |
| > 2×           | ×0.50      | 37.5%               |

Final position size = min(100%, base × multiplier)

---

### 5. Exposure Limits

| Limit                      | Value        |
|----------------------------|--------------|
| Max Risk per Trade         | 2% Portfolio |
| Max Exposure per Asset     | 33% Capital  |

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
| > +60%        | Strong BUY     | Execute                         | 100% of capital |
| +40% to +60%  | BUY            | Execute                         | 75% of capital  |
| +20% to +40%  | Weak BUY       | Execute if sentiment bullish    | 50% of capital  |
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
- Exposure limits: Max 33% per asset, max 2% risk per trade

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

## ⚡ Event-Driven Monitoring

### Long-Polling Market Events

Use `wait_for_market_event` for efficient, event-driven position monitoring instead of polling with sleep intervals.

| Parameter     | Value           | Description                           |
|---------------|-----------------|---------------------------------------|
| Max Timeout   | 55 seconds      | Avoids MCP timeout (60s)              |
| Max Subscriptions | 10          | Products to monitor per call          |
| Max Conditions | 5 per product  | Conditions per subscription           |
| Logic Modes   | any / all       | OR (any condition) / AND (all)        |

**Ticker Fields:**

| Field            | Description             |
|------------------|-------------------------|
| price            | Current price           |
| volume24h        | 24-hour trading volume  |
| percentChange24h | 24-hour percent change  |
| high24h          | 24-hour high            |
| low24h           | 24-hour low             |

**Indicator Fields** (with configurable granularity and parameters):

| Field              | Description                     |
|--------------------|---------------------------------|
| rsi                | Relative Strength Index         |
| macd               | MACD line value                 |
| macd.histogram     | MACD histogram                  |
| macd.signal        | MACD signal line                |
| bollingerBands     | Bollinger Bands position        |
| sma                | Simple Moving Average           |
| ema                | Exponential Moving Average      |
| stochastic         | Stochastic %K                   |
| stochastic.d       | Stochastic %D                   |

**Available Operators:**

| Operator    | Description                                  |
|-------------|----------------------------------------------|
| gt          | Greater than                                 |
| gte         | Greater than or equal                        |
| lt          | Less than                                    |
| lte         | Less than or equal                           |
| crossAbove  | Price crosses threshold upward               |
| crossBelow  | Price crosses threshold downward             |

**Use Cases:**

| Scenario                  | Configuration                                    |
|---------------------------|--------------------------------------------------|
| Soft Stop-Loss Monitoring | `price lte {softStopLossPrice}`                  |
| Soft Take-Profit Monitoring | `price gte {softTakeProfitPrice}`              |
| Trailing Stop             | `price lte {trailingStopPrice}`                  |
| Buy the Dip               | `price crossBelow {targetPrice}`                 |
| Breakout Entry            | `price crossAbove {resistanceLevel}`             |
| Volatility Alert          | `percentChange24h lt -5` OR `gt 5`               |
| RSI Oversold Recovery     | `rsi crossAbove 30` (granularity: FIFTEEN_MINUTE) |

**Example: SL/TP Monitoring**

```
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "lte", value: 91200 },  // SL
      { field: "price", operator: "gte", value: 98800 }   // TP
    ],
    logic: "any"
  }],
  timeout: 55
})
```

**Example: Indicator Condition**

```
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "rsi", operator: "crossAbove", value: 30,
        granularity: "FIFTEEN_MINUTE", parameters: { period: 14 } }
    ],
    logic: "any"
  }],
  timeout: 55
})
```

**Response Types:**

| Status    | Meaning                          | Action                        |
|-----------|----------------------------------|-------------------------------|
| triggered | Condition met                    | Execute SL/TP/Entry           |
| timeout   | 55s elapsed without trigger      | Perform normal analysis cycle |

**Benefits vs Sleep-Polling:**

| Aspect           | Sleep (15min)          | Event-Driven            |
|------------------|------------------------|-------------------------|
| SL/TP Detection  | Up to 15 minutes late  | Within seconds          |
| Token Usage      | Higher                 | Lower                   |
| API Calls        | Every interval         | Only on triggers        |
| Reaction Time    | Interval-dependent     | Near-instant            |

**Integration with Trading Loop:**

```
After each analysis cycle:
1. If open positions → wait_for_market_event with SL/TP conditions
2. If no positions but entry signal → wait_for_market_event with entry conditions
3. If no positions and no signal → sleep for next analysis cycle
```

---

## 💹 Capital Management

### 1. HODL Safe Portfolio Isolation

Trading capital is isolated at the API level using Coinbase portfolios.

| Component | Purpose |
|-----------|---------|
| **Default Portfolio** | Trading capital — the bot trades exclusively here |
| **HODL Safe Portfolio** | Protected user holdings — the bot never touches this |

**How it works**:

- On fresh start (`/trade 10 EUR from BTC`): bot creates HODL Safe, moves all assets except the allocated budget into it
- On warm start: bot verifies HODL Safe exists, trades with whatever is in Default
- The Default portfolio balance IS the trading capital — no separate budget tracking needed

**Sacred Rule**: The skill must NEVER move funds from the HODL Safe to the Default portfolio.

---

### 2. Profit Protection

Automatically moves a configurable percentage of realized gains to HODL Safe after each profitable exit.

| Parameter | Default | Description |
|-----------|---------|-------------|
| Protection Rate | 50% | Portion of profits moved to HODL Safe |

**Options** (chosen at session start):

- 0% — keep all profits for trading
- 50% — balanced protection and reinvestment (recommended)
- 100% — all profits leave trading capital
- Custom — user-specified percentage

**Example**:

```
Exit SOL-EUR with +5.00€ net profit, protection rate 50%
→ Move 2.50€ to HODL Safe
→ 2.50€ stays in Default for trading
```

Rebalance exits skip profit protection — rebalancing is capital reallocation, not realized gains leaving the system.

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

### 4. Capital Exhaustion Check

Prevents deadlock when trading capital runs low.

Before seeking new entries, check if Default portfolio balance < minimum order size (typically €2.00):

- **Insufficient capital BUT positions eligible for rebalancing** → Continue (sell X to buy Y)
- **Insufficient capital AND no rebalanceable positions** → Exit session gracefully
- Escapes deadlock by allowing capital reallocation even with €0 remaining

**Example**:

```
Default balance: €0.15, 3 positions open
- BTC: Stagnant 15h, PnL -0.50€
- ETH: Strong +5.00€, not stagnant → Keep
- SOL: Stagnant 13h, PnL +1.20€, alternative delta +55

→ Rebalance SOL to AVAX frees 3.15€ capital
→ Session continues
```

---

## 📁 State Management

### Persistent Trading State

Stored in `.claude/trading-state.json`

**Portfolio Data**:

- Portfolio UUIDs (Default, HODL Safe)
- Fund allocation status
- Profit protection rate

**Session Data**:

- Stats (wins, losses, PnL, fees)
- Config (strategy, interval, dryRun)
- Rebalancing (enabled, history, cooldown)

**Position Data**:

- Entry (price, time, orderType, fee)
- Strategy (aggressive / conservative / scalping — per-position)
- Analysis (signalStrength, reason, confidence)
- Risk Management (dynamicSL, dynamicTP, bracketSL, bracketTP, trailingStop, bracketOrderId, hasBracket)
- Performance (currentPrice, unrealizedPnL, peakPnL)

**Trade History**:

- Complete documentation of all closed trades
- Exit trigger (SL, TP, Trailing, bracketSL, bracketTP, Rebalance, Manual)
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
| Take-Profit   | max(2.5%, ATR% × 2.5) — dynamic, typically 2.5-10% |
| Stop-Loss     | clamp(ATR% × 1.5, 2.5%, 10%) — dynamic             |
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
| Take-Profit | 1.5%      |
| Stop-Loss   | 2.0%      |
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
│   2. Pair Screening                                         │
│   3. Collect Market Data (for selected pairs)               │
│   4. Technical Analysis                                     │
│   5. Sentiment Analysis                                     │
├─────────────────────────────────────────────────────────────┤
│ PHASE 2: MANAGE EXISTING POSITIONS (frees up capital)       │
│   6. Strategy Re-evaluation                                 │
│   7. Check SL/TP/Trailing                                   │
│   8. Rebalancing Check                                      │
│   9. Capital Exhaustion Check                               │
├─────────────────────────────────────────────────────────────┤
│ PHASE 3: NEW ENTRIES (uses freed capital)                   │
│  10. Signal Aggregation                                     │
│  11. Apply Volatility-Based Position Sizing                 │
│  12. Check Fees & Profit Threshold                          │
│  13. Pre-Trade Liquidity Check                              │
│  14. Execute Order                                          │
├─────────────────────────────────────────────────────────────┤
│ PHASE 4: REPORT                                             │
│  15. Output Report                                          │
│      → Sleep → Repeat                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Complex Scenarios

Real-world examples demonstrating feature interactions:

### Scenario 1: Trailing Stop Priority vs Rebalancing

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
4. Seek new entry (ETH still best opportunity → Enter ETH)

**Result**: Trailing stop takes priority, rebalancing only runs if position still open

---

### Scenario 2: Capital Exhaustion with Multiple Positions

**Initial State**:

- Default balance: 0.15€
- Position 1: BTC-EUR, 3.50€ invested
- Position 2: ETH-EUR, 3.20€ invested
- Position 3: SOL-EUR, 3.15€ invested
- Total invested: 9.85€

**Cycle Check**:

1. Capital check: 0.15€ < 2.00€ minimum → Insufficient for new entry
2. Rebalancing check:
   - BTC: Stagnant 15h, PnL -0.50€
   - ETH: Strong +5.00€, not stagnant → Keep
   - SOL: Moderate +1.20€, stagnant 13h, alternative with delta +55 exists
3. **Rebalancing**: Exit SOL (-0.04€ fee) → 3.15€ freed
4. Available capital: 0.15€ + 3.15€ - 0.04€ = 3.26€
5. Enter AVAX with better signal
6. Continue trading

**Result**: Rebalancing prevents capital deadlock, session continues

---

### Scenario 3: Multi-Position Capital Allocation

**Initial State**:

- Available capital: 30.00€
- Strong signals for BTC (70%), ETH (65%), SOL (60%)
- Max 33% exposure per asset

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
   - Enter SOL: 7.50€
   - Remaining: 2.50€

**Result**: 3 positions opened (BTC 10€, ETH 10€, SOL 7.50€), 2.50€ remaining. Exposure limits enforced per-asset.

---

### Scenario 4: Session Resume with Stagnant Position

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

### Scenario 5: Fee Structure Impact on Profit Check

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

### Scenario 6: Multi-Timeframe Conflicts

**Initial State**:

- BTC-EUR Analysis
- 15m: Strong BUY Signal (65%)
- 1h: BULLISH (aligned)
- 6h: BEARISH (conflict detected)
- Daily: BEARISH (conflict detected)

**Multi-Timeframe Filter Applied**:

1. Original Signal: 65% BUY
2. Conflict Detection: 6h and daily show BEARISH
3. Log: "BUY signal rejected: conflicts with higher timeframe trend"
4. Log: "  Daily: bearish, 6h: bearish, 1h: bullish"
5. Adjusted Signal: 65% × 0.3 = 19.5% (70% reduction for 6h/daily conflict)
6. Threshold Check: 19.5% < 40% (minimum for trade execution)

**Result**: Trade SKIPPED due to higher timeframe trend conflict. Multi-Timeframe Alignment prevents counter-trend entries, avoiding trades against major market direction.

---

### Scenario 7: Force Exit via Stagnation Score

**Initial State**:

- SOL-EUR Position
- Entry: 119.34 EUR @ 2026-01-12 13:17:00
- Current: 119.58 EUR (+0.20%)
- Holding Time: 30 hours

**Stagnation Score Calculation**:

1. Formula: `stagnation_score = (holdingTimeHours / 12) × (1 - abs(unrealizedPnLPercent / 2.0))`
2. Calculation: `(30 / 12) × (1 - abs(0.20 / 2.0))`
3. Calculation: `2.5 × (1 - 0.10)`
4. Result: `stagnation_score = 2.25`
5. Threshold Check: 2.25 > 2.0 → FORCE EXIT triggered

**Exit Execution**:

- Action: Market Order SELL SOL-EUR
- Reason: "Maximum stagnation threshold exceeded"
- Log: "Force closed SOL-EUR after 30h: stagnation_score=2.25, PnL=+0.20%"

**Result**: Force Exit prevents indefinite capital lockup. Position with minimal profit and extended holding time is automatically closed to free capital for better opportunities.

---

## 📚 References

- [SKILL.md](../.claude/skills/coinbase-trading/SKILL.md) - Orchestrator and configuration
- [session-start.md](../.claude/skills/coinbase-trading/phases/session-start.md) - HODL Safe setup and session flows
- [phase-enter.md](../.claude/skills/coinbase-trading/phases/phase-enter.md) - Signal aggregation, position sizing, order execution
- [phase-manage.md](../.claude/skills/coinbase-trading/phases/phase-manage.md) - SL/TP, trailing stops, rebalancing
- [state-schema.md](../.claude/skills/coinbase-trading/reference/state-schema.md) - State structure
- [strategies.md](../.claude/skills/coinbase-trading/reference/strategies.md) - Signal scoring and strategies
- [indicators.md](../.claude/skills/coinbase-trading/reference/indicators.md) - Indicator MCP tools
- [output-format.md](../.claude/skills/coinbase-trading/reference/output-format.md) - Report format
- [market-event-guide.md](../.claude/skills/coinbase-trading/reference/market-event-guide.md) - Event monitoring guide
