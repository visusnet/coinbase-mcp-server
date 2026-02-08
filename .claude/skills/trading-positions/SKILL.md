---
name: trading-positions
description: "Phase 2: Manage existing positions - SL/TP monitoring, trailing stops, rebalancing, compound, and budget checks."
---

# Position Management (Phase 2)

**Sub-skill of `coinbase-trading`.** Called via `Skill("trading-positions")` each trading cycle.

This skill manages existing positions. It may execute exit orders (SL/TP/trailing/rebalance) but does NOT open new positions.

## Scope

6. Check Stop-Loss / Take-Profit / Trailing Stop
7. Rebalancing Check (stagnant positions)
8. Apply Compound (after profitable exits)
9. Budget Exhaustion Check

**Output**: Updated position states, executed exits (if any), freed capital amount, budget status.

---

## Step 6: Check Stop-Loss / Take-Profit

### Dynamic ATR-Based Thresholds

**Aggressive (Default)**:
- **Take-Profit**: max(2.5%, ATR% x 2.5)
- **Stop-Loss**: clamp(ATR% x 1.5, 2.5%, 10.0%)
- **ATR Period**: 14 candles
- **Min TP**: 2.5%, **Max SL**: 10.0%, **Min SL**: 2.5%

**Conservative**: TP = 3.0%, SL = 5.0% (fixed)
**Scalping**: TP = 1.5%, SL = 2.0% (fixed)

### Positions with Attached Bracket Orders

Market/Limit BUY entries with `attachedOrderConfiguration` have Coinbase-managed SL/TP as primary protection. The bot's check below is a **secondary layer** for:
- **Trailing stop** management (brackets don't trail)
- **SL/TP recalculation** after 24h (cancel old bracket, new values next entry)
- **Positions without brackets** (stop-limit fills, manual trades, legacy positions)

### SL/TP Check Logic

For all open positions:

```
entry_price = position.entry.price
dynamic_tp = position.riskManagement.dynamicTP
dynamic_sl = position.riskManagement.dynamicSL

// Recalculate if position > 24h old:
IF entry_price <= 0:
  -> Log: "Invalid entry_price, using stored values"
  -> SKIP recalculation
ELSE IF ATR(14) < 0.001:
  -> Log: "ATR too low, using default ATR_PERCENT = 2.0"
ELSE:
  ATR_PERCENT = ATR(14) / entry_price x 100

// Calculate TP/SL based on strategy
IF strategy == "aggressive":
  TP_PERCENT = max(2.5, ATR_PERCENT x 2.5)
  SL_PERCENT = clamp(ATR_PERCENT x 1.5, 2.5, 10.0)
ELSE IF strategy == "conservative":
  TP_PERCENT = 3.0
  SL_PERCENT = 5.0
ELSE IF strategy == "scalping":
  TP_PERCENT = 1.5
  SL_PERCENT = 2.0

take_profit_price = entry_price x (1 + TP_PERCENT / 100)
stop_loss_price = entry_price x (1 - SL_PERCENT / 100)
```

### Check and Execute

```
// Priority 1: Stop-Loss
IF current_price <= stop_loss_price:
  -> Immediately sell using Market Order
  -> Log: "Stop-Loss triggered at -[X]% (ATR-based)"

// Priority 2: Take-Profit
IF current_price >= take_profit_price:
  -> Secure profit using Limit Order
  -> Log: "Take-Profit triggered at +[X]% (ATR-based)"
```

### Trailing Stop Check (after SL/TP)

```
// Update highest price
IF current_price > position.riskManagement.trailingStop.highestPrice:
  position.riskManagement.trailingStop.highestPrice = current_price

// Check activation
IF entry_price > 0:
  current_profit_pct = (current_price - entry_price) / entry_price x 100
ELSE:
  -> SKIP trailing stop check
  current_profit_pct = 0

IF current_profit_pct >= 3.0:
  position.riskManagement.trailingStop.active = true
  position.riskManagement.trailingStop.currentStopPrice = highestPrice x 0.985

// Priority 3: Trailing Stop
IF trailingStop.active AND current_price <= trailingStop.currentStopPrice:
  IF current_price >= entry_price x 1.01:  // At least +1%
    -> SELL using Market Order
    -> Log: "Trailing Stop triggered at +[X]% (peak was +[Y]%)"
```

### Trailing Stop Parameters

| Parameter | Value | Reasoning |
|-----------|-------|-----------|
| Activation | 3.0% profit | Enough profit to justify trailing |
| Trail | 1.5% below highest | Tight enough to capture gains |
| Min Lock-In | 1.0% | Ensures fees are covered |

### Exit Priority Order

| Condition | Priority | Action |
|-----------|----------|--------|
| Price <= dynamicSL | 1 (Highest) | SELL - Stop Loss |
| Price >= dynamicTP | 2 | SELL - Take Profit |
| Trailing triggered | 3 | SELL - Trailing Stop |

---

## Step 7: Rebalancing Check

### Force Exit (Prevent Unlimited Stagnation)

```
stagnation_score = (holdingTimeHours / 12) x (1 - abs(unrealizedPnLPercent / 2.0))

IF stagnation_score > 2.0:
  -> FORCE CLOSE (market order)
  -> Reason: "Maximum stagnation threshold exceeded"
  -> SKIP rebalancing (position is closed)

// Examples:
// 24h hold, 0% PnL: (24/12) x (1 - 0/2) = 2.0 (threshold)
// 30h hold, 0.5% PnL: 2.5 x 0.875 = 2.19 (FORCE CLOSE)
// 24h hold, 1.5% PnL: 2.0 x 0.25 = 0.5 (continue)
// 48h hold, 0% PnL: 4.0 x 1.0 = 4.0 (FORCE CLOSE)
```

### Rebalancing Decision

For positions held > 12h with < 3% movement:

```
current_signal = position.analysis.signalStrength
best_alternative = max(all_pairs.filter(not_held AND score > 50).signalStrength)
opportunity_delta = best_alternative.score - current_signal

is_stagnant = holdingTimeHours > 12 AND abs(unrealizedPnLPercent) < 3

IF opportunity_delta > 40 AND is_stagnant AND unrealizedPnLPercent > -2:
  -> SELL current position (market order)
  -> BUY best alternative (limit order preferred)
  -> Log: "Rebalanced {FROM}->{TO}: stagnant {X}h, delta +{Y}"

IF opportunity_delta > 60 AND unrealizedPnLPercent > -2:
  -> REBALANCE (even if not stagnant, urgent opportunity)
```

### Rebalancing Safeguards

- Max 1 rebalance per cycle
- Max 3 rebalances per day
- 4h cooldown between rebalances
- 24h block on recently exited positions (no flip-back)
- High volatility (ATR > 2x) -> increase min delta to 60

---

## Step 8: Apply Compound

After any profitable exit (SL/TP/Trailing/Rebalance):

```
IF netPnL > 0 AND session.compound.enabled AND NOT session.compound.paused:

  // Determine effective rate
  IF session.compound.consecutiveWins >= 3:
    effective_rate = session.compound.rate x 0.5  // 50% -> 25%
  ELSE:
    effective_rate = session.compound.rate

  compoundAmount = netPnL x effective_rate

  IF compoundAmount >= 0.10:
    IF session.budget.remaining + compoundAmount <= session.compound.maxBudget:
      session.budget.remaining += compoundAmount
    ELSE:
      compoundAmount = maxBudget - session.budget.remaining
      session.budget.remaining = maxBudget

    Log compound event to session.compound.compoundEvents[]
    session.compound.totalCompounded += compoundAmount
    Report: "Compounded +{X} EUR -> Budget now {Y} EUR"
```

### Win/Loss Streak Tracking

```
IF trade_result == "WIN":
  session.compound.consecutiveWins++
  session.compound.consecutiveLosses = 0
  IF session.compound.paused AND consecutiveWins >= 2:
    session.compound.paused = false
    Log: "Compound re-enabled after {wins} consecutive wins"

ELSE IF trade_result == "LOSS":
  session.compound.consecutiveLosses++
  session.compound.consecutiveWins = 0
  IF consecutiveLosses >= 2:
    session.compound.paused = true
    Log: "Compound paused after {losses} consecutive losses"
```

### Compound Rules

- Pause after 2 consecutive losses, resume after 2 consecutive wins
- Reduce rate to 25% after 3 consecutive wins (risk control)
- Never compound losses (only positive PnL)
- Manual exits do NOT reset compound streaks

---

## Step 9: Budget Exhaustion Check

Before seeking new entries, verify sufficient budget:

```
min_order_size_eur = 2.00  // Typical Coinbase minimum

IF session.budget.remaining < min_order_size_eur:
  IF hasOpenPositions AND anyPositionEligibleForRebalancing:
    // Rebalancing can free up capital
    SKIP to Phase 3 (Signal Aggregation)
  ELSE:
    Log: "Budget exhausted: {remaining} EUR < minimum {min} EUR"
    EXIT session with status "Budget Exhausted"
    STOP
```

- Minimum order size is asset-specific (check via `get_product`)
- Rebalancing bypasses this check (selling position X to buy Y)
- Only exits if BOTH: insufficient budget AND no rebalanceable positions

---

## Event-Driven Position Monitoring

Use `wait_for_market_event` instead of polling for efficient reaction to market conditions.

### When to Use

| Situation | Tool | Reason |
|-----------|------|--------|
| Waiting for next cycle (no condition) | `sleep` | Simple interval waiting |
| Waiting for stop-loss/take-profit | `wait_for_market_event` | Immediate reaction |
| Waiting for entry signal | `wait_for_market_event` | Buy breakout/dip |
| Waiting for volatility spike | `wait_for_market_event` | Volume/percent change |

### Stop-Loss / Take-Profit Monitoring

```
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "lte", value: stopLossPrice },
      { field: "price", operator: "gte", value: takeProfitPrice }
    ],
    logic: "any"
  }],
  timeout: 55
})
```

### Available Condition Fields

**Ticker fields** (real-time via WebSocket):
- `price`, `volume24h`, `percentChange24h`
- `high24h`, `low24h`, `high52w`, `low52w`
- `bestBid`, `bestAsk`, `bestBidQuantity`, `bestAskQuantity`

**Indicator fields** (computed from candles):
- `rsi` (optional: `period`, `granularity`)
- `macd`, `macd.histogram`, `macd.signal`
- `bollingerBands`, `.upper`, `.lower`, `.bandwidth`, `.percentB`
- `sma`, `ema` (required: `period`)
- `stochastic`, `stochastic.d`

**Operators**: `gt`, `gte`, `lt`, `lte`, `crossAbove`, `crossBelow`

### Best Practices

1. **Minimum condition distance**: Price conditions > 1% from current (or > 0.5x ATR)
2. **Timeout tiers**: 55s (active SL/TP), 120s (passive entry), 240s (low-activity)
3. **Prefer crossAbove/crossBelow** for entry signals (fire once on transition, not every tick)
4. **Keep conditions simple**: Max 5 per subscription, max 10 subscriptions per call

### Response Handling

```
IF response.status == "triggered":
  -> Act immediately
  -> response.triggeredConditions tells which conditions met

ELSE IF response.status == "timeout":
  -> Perform normal analysis
  -> Verify state with get_best_bid_ask (WebSocket packets can be lost)
```

---

## State Operations

### Update Position (Each Cycle)

```
performance.currentPrice = best_bid from API
performance.unrealizedPnL = (current - entry) x size
performance.unrealizedPnLPercent = (current - entry) / entry x 100
performance.holdingTimeHours = hours since entry.time

IF unrealizedPnLPercent > peakPnLPercent:
  performance.peakPnLPercent = unrealizedPnLPercent

IF currentPrice > trailingStop.highestPrice:
  trailingStop.highestPrice = currentPrice

IF unrealizedPnLPercent >= 3.0:
  trailingStop.active = true
  trailingStop.currentStopPrice = highestPrice x 0.985

session.lastUpdated = current timestamp
```

### Close Position

```
historyEntry = {
  id: position.id.replace("pos_", "trade_"),
  pair, side, size, entry, analysis: from position,
  exit: {
    price, time, orderType, fee,
    trigger: "stopLoss" | "takeProfit" | "trailingStop" | "rebalance" | "manual",
    reason: "Dynamic TP hit at +X%"
  },
  result: {
    grossPnL: (exit.price - entry.price) x size,
    netPnL: grossPnL - entry.fee - exit.fee,
    netPnLPercent: netPnL / (entry.price x size) x 100,
    peakPnLPercent, totalFees, holdingTimeHours
  }
}

IF result.netPnL > 0: session.stats.wins += 1
ELSE: session.stats.losses += 1

session.stats.tradesClosed += 1
session.stats.totalFeesPaid += result.totalFees
session.stats.realizedPnL += result.netPnL
session.stats.realizedPnLPercent = realizedPnL / budget.initial x 100
session.budget.remaining += (exit.price x size - exit.fee)

tradeHistory.push(historyEntry)
openPositions.remove(position)
session.lastUpdated = current timestamp
```
