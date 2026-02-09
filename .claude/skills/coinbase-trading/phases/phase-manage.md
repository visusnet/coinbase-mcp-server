# Phase 2: Manage Existing Positions

This file is read by the orchestrator when `openPositions.length > 0`.
It covers: SL/TP management, trailing stops, rebalancing, and profit protection.

---

## Opportunity Rebalancing Configuration

Automatically exit stagnant positions for better opportunities:

- **Rebalance Enabled**: true (disable with "no-rebalance" argument)
- **Stagnation Hours**: 12h (position age to consider stagnant)
- **Stagnation Threshold**: 3% (max move to be "stagnant")
- **Min Opportunity Delta**: 40 (score difference to trigger)
- **Min Alternative Score**: 50 (minimum score for alternative)
- **Max Rebalance Loss**: -2% (never rebalance if losing more)
- **Cooldown**: 4h between rebalances
- **Max per Day**: 3 rebalances
- **Flip-Back Block**: 24h (don't rebalance back to recently exited position)

**Arguments**:

- `no-rebalance` → Disable rebalancing
- `rebalance-delta=50` → Custom delta threshold
- `rebalance-max=2` → Max rebalances per day

**Edge Cases**:

- Multiple positions eligible → Highest delta first, max 1 per cycle
- High volatility (ATR > 2×) → Increase min delta to 60
- No good alternatives (all < 50%) → HOLD

---

## Step 6: Check Stop-Loss / Take-Profit

**Positions with attached bracket orders** (`riskManagement.hasBracket == true`):
Coinbase handles the basic SL/TP automatically — the attached bracket is the primary protection. The bot's SL/TP check below serves as a **secondary layer** for:
- **Trailing stop** management (attached brackets don't trail)
- **SL/TP recalculation** after 24h: cancel old bracket via `cancel_orders([riskManagement.bracketOrderId])`, set `riskManagement.hasBracket = false`, then manage SL/TP via the bot's own monitoring
- **Positions without brackets** (`riskManagement.hasBracket == false`): stop-limit fills, manual trades, or pre-existing positions from earlier sessions

For all open positions, use dynamic ATR-based thresholds:

```json
// Use stored values from position entry
entry_price = position.entry.price
entry_atr = position.riskManagement.entryATR
dynamic_tp = position.riskManagement.dynamicTP
dynamic_sl = position.riskManagement.dynamicSL

// Or recalculate if position > 24h old (with validation):
IF entry_price <= 0:
  → Log: "Invalid entry_price: {entry_price}, using stored values"
  → Use position.riskManagement.dynamicTP/SL
  → SKIP recalculation
ELSE IF ATR(14) < 0.001:
  → Log: "ATR too low: {atr}, insufficient volatility data"
  → Use default: ATR_PERCENT = 2.0
ELSE:
  ATR_PERCENT = ATR(14) / entry_price × 100

// Calculate TP/SL based on strategy
IF session.config.strategy == "aggressive":
  TP_PERCENT = max(2.5, ATR_PERCENT × 2.5)  // 2.5× ATR, floor at 2.5%
  SL_PERCENT = clamp(ATR_PERCENT × 1.5, 2.5, 10.0)  // 1.5× ATR, 2.5-10%

ELSE IF session.config.strategy == "conservative":
  TP_PERCENT = 3.0  // Fixed 3%
  SL_PERCENT = 5.0  // Fixed 5%

ELSE IF session.config.strategy == "scalping":
  TP_PERCENT = 1.5  // Fixed 1.5%
  SL_PERCENT = 2.0  // Fixed 2.0%

ELSE:
  // Default to aggressive if strategy not recognized
  TP_PERCENT = max(2.5, ATR_PERCENT × 2.5)
  SL_PERCENT = clamp(ATR_PERCENT × 1.5, 2.5, 10.0)

take_profit_price = entry_price × (1 + TP_PERCENT / 100)
stop_loss_price = entry_price × (1 - SL_PERCENT / 100)
```

**Check and Execute**:

```
// Priority 1: Stop-Loss
IF current_price <= stop_loss_price:
  → Immediately sell (STOP-LOSS) using Market Order
  → Log: "Stop-Loss triggered at -[X]% (ATR-based)"

// Priority 2: Take-Profit
IF current_price >= take_profit_price:
  → Secure profit (TAKE-PROFIT) using Limit Order
  → Log: "Take-Profit triggered at +[X]% (ATR-based)"
```

**Trailing Stop Check** (after SL/TP check):

```json
// Update highest price
IF current_price > position.riskManagement.trailingStop.highestPrice:
  position.riskManagement.trailingStop.highestPrice = current_price

// Check activation (with validation)
IF entry_price > 0:
  current_profit_pct = (current_price - entry_price) / entry_price × 100
ELSE:
  → Log: "Invalid entry_price for trailing stop: {entry_price}"
  → SKIP trailing stop check
  → current_profit_pct = 0

IF current_profit_pct >= 3.0:
  position.riskManagement.trailingStop.active = true
  position.riskManagement.trailingStop.currentStopPrice = position.riskManagement.trailingStop.highestPrice × 0.985

// Priority 3: Trailing Stop
IF position.riskManagement.trailingStop.active AND current_price <= position.riskManagement.trailingStop.currentStopPrice:
  // Ensure minimum profit (covers fees)
  IF current_price >= entry_price × 1.01:  // At least +1%
    → SELL (Trailing Stop) using Market Order
    → Log: "Trailing Stop triggered at +[X]% (peak was +[Y]%)"
```

**Report Section**:

```
Position: SOL-EUR
  Entry: 119.34 EUR
  Current: 125.00 EUR (+4.7%)
  Highest: 128.50 EUR (+7.7%)
  ATR(14): 8.0%
  Dynamic TP: 143.21 EUR (+20.0%)
  Dynamic SL: 107.41 EUR (-10.0% capped)
  Trailing Stop: ACTIVE at 126.57 EUR
  Status: TRAILING (stop rising with price)
```

---

## Step 7: Rebalancing Check

For positions held > 12h with < 3% movement:

```json
// Force Exit Check (prevent unlimited stagnation)
stagnation_score = (holdingTimeHours / 12) × (1 - abs(unrealizedPnLPercent / 2.0))

IF stagnation_score > 2.0:
  → FORCE CLOSE (market order, exit.trigger = "rebalance")
  → Reason: "Maximum stagnation threshold exceeded"
  → Log: "Force closed {PAIR} after {hours}h: stagnation_score={score}, PnL={pnl}%"
  → SKIP to next cycle (no rebalancing, position is closed)

// Example scenarios:
// - 24h hold, 0% PnL: (24/12) × (1 - 0/2) = 2.0 × 1.0 = 2.0 (threshold)
// - 30h hold, 0.5% PnL: (30/12) × (1 - 0.25) = 2.5 × 0.875 = 2.19 (FORCE CLOSE)
// - 24h hold, 1.5% PnL: (24/12) × (1 - 0.75) = 2.0 × 0.25 = 0.5 (continue)
// - 36h hold, -1% PnL: (36/12) × (1 - 0.5) = 3.0 × 0.5 = 1.5 (continue, try rebalance)
// - 48h hold, 0% PnL: (48/12) × (1 - 0) = 4.0 × 1.0 = 4.0 (FORCE CLOSE)

// Calculate opportunity delta
current_signal = position.analysis.signalStrength
best_alternative = max(all_pairs.filter(not_held AND score > 50).signalStrength)
opportunity_delta = best_alternative.score - current_signal

// Stagnation check
is_stagnant = holdingTimeHours > 12 AND abs(unrealizedPnLPercent) < 3

// Rebalancing decision
IF opportunity_delta > 40 AND is_stagnant AND unrealizedPnLPercent > -2:
  → SELL current position (market order, exit.trigger = "rebalance")
  → BUY best alternative (limit order preferred)
  → Log: "Rebalanced {FROM}→{TO}: stagnant {X}h, delta +{Y}"

IF opportunity_delta > 60 AND unrealizedPnLPercent > -2:
  → REBALANCE (even if not stagnant, urgent opportunity, exit.trigger = "rebalance")
```

**Safeguards**:

- Max 1 rebalance per cycle
- Max 3 rebalances per day
- 4h cooldown between rebalances
- 24h block on recently exited positions (no flip-back)
- High volatility → increase min delta to 60

**Report Section (Rebalancing)**:

```
═══════════════════════════════════════════════════════════════
                 REBALANCING ANALYSIS
═══════════════════════════════════════════════════════════════
Position: SOL-EUR (18h, +1.2%)
  Status: STAGNANT
  Current Signal: 25%
  Best Alternative: ETH-EUR (78%)
  Opportunity Delta: +53
  Recommendation: REBALANCE ✓

Today's Rebalances: 1/3
Last Rebalance: 4h ago (cooldown OK)
═══════════════════════════════════════════════════════════════
```

---

