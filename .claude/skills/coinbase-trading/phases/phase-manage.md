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

## Step 7: Strategy Re-evaluation

For each open position, re-evaluate the strategy based on current market conditions:

```
FOR EACH position in openPositions:
  // Fetch current indicators (already available from Phase 1 deep analysis)
  adx = position's ADX(14) from 15m candles
  adx_prev = previous cycle's ADX (from indicatorCache)
  macd_hist = current MACD histogram
  macd_hist_prev = previous cycle's MACD histogram
  htf_bullish_count = count of bullish HTFs (1h, 6h, daily where MACD > signal AND price > EMA21)
  obv = current OBV
  obv_sma = SMA(OBV, 10)
  rsi = current RSI
  bb_width = current Bollinger Band width
  bb_width_sma = SMA(BB_width, 20)
  bb_lower = lower Bollinger Band
  stoch_k = Stochastic %K
  volume = current volume
  volume_sma = SMA(volume, 20)
  current_price = get_best_bid_ask(pair).price

  // Priority chain — first match wins
  // Regime override — highest priority
  IF session.regime.current == "POST_CAPITULATION":
    new_strategy = "post_capitulation_scalp"
    // Skip normal strategy selection

  // Forced re-eval when regime expired but position still on post_cap
  ELSE IF position.strategy == "post_capitulation_scalp"
          AND session.regime.current != "POST_CAPITULATION":
    // Regime expired — force re-evaluate using normal priority chain
    // Do NOT fall back to post_capitulation_scalp as default
    → Run normal strategy selection (aggressive/conservative/scalping)
    → Log: "POST_CAP expired: re-evaluating {pair} strategy"

  ELSE IF adx > 25 AND adx > adx_prev AND macd_hist > macd_hist_prev
     AND htf_bullish_count >= 2 AND obv > obv_sma AND 40 <= rsi <= 70:
    new_strategy = "aggressive"
  ELSE IF adx < 25 AND adx <= adx_prev AND bb_width < bb_width_sma
     AND current_price < bb_lower + 0.2 * bb_width
     AND (stoch_k < 20 OR rsi < 30) AND volume < volume_sma:
    new_strategy = "scalping"
  ELSE IF adx >= 20:
    new_strategy = "conservative"
  ELSE:
    new_strategy = position.strategy  // no change

  IF new_strategy != position.strategy:
    old_strategy = position.strategy
    entry_price = position.entry.price

    // Recalculate bracket with new strategy
    ATR_PERCENT = ATR(14) / entry_price * 100
    bracket_sl_pct = clamp(ATR_PERCENT * 3, 8.0, 12.0)
    bracket_sl_price = entry_price * (1 - bracket_sl_pct / 100)

    IF new_strategy == "post_capitulation_scalp":
      fees = get_transaction_summary()
      round_trip_fees = fees.taker_fee_rate * 2 + 0.003
      bracket_tp_pct = max(8.0, round_trip_fees * 4)
    ELSE IF new_strategy == "scalping":
      fees = get_transaction_summary()
      round_trip_fees = fees.taker_fee_rate * 2 + 0.003
      bracket_tp_pct = round_trip_fees * 2
    ELSE IF new_strategy == "aggressive":
      bracket_tp_pct = max(10.0, ATR_PERCENT * 5)
    ELSE:
      bracket_tp_pct = 3.0
    bracket_tp_price = entry_price * (1 + bracket_tp_pct / 100)

    // Update bracket on Coinbase (child order — parent already filled)
    edit_order({
      orderId: position.riskManagement.bracketOrderId,
      price: bracket_tp_price,
      size: position.size,
      stopPrice: bracket_sl_price
    })

    // Recalculate soft SL/TP per new strategy
    IF new_strategy == "post_capitulation_scalp":
      soft_tp_pct = 4.5; soft_sl_pct = 2.5
    ELSE IF new_strategy == "aggressive":
      soft_tp_pct = max(2.5, ATR_PERCENT * 2.5)
      soft_sl_pct = clamp(ATR_PERCENT * 1.5, 2.5, 10.0)
    ELSE IF new_strategy == "conservative":
      soft_tp_pct = 3.0; soft_sl_pct = 5.0
    ELSE:  // scalping
      soft_tp_pct = 1.5; soft_sl_pct = 2.0

    // Save old values before overwriting
    old_bracket_sl = position.riskManagement.bracketSL
    old_bracket_tp = position.riskManagement.bracketTP
    old_soft_sl = position.riskManagement.dynamicSL
    old_soft_tp = position.riskManagement.dynamicTP

    // Update state
    position.strategy = new_strategy
    position.riskManagement.bracketSL = bracket_sl_price
    position.riskManagement.bracketTP = bracket_tp_price
    position.riskManagement.dynamicSL = entry_price * (1 - soft_sl_pct / 100)
    position.riskManagement.dynamicTP = entry_price * (1 + soft_tp_pct / 100)

    Log: "Strategy switch {pair}: {old_strategy} → {new_strategy}"
    Log: "  Bracket: SL {old_bracket_sl} → {bracket_sl_price}, TP {old_bracket_tp} → {bracket_tp_price}"
    Log: "  Soft: SL {old_soft_sl} → {dynamicSL}, TP {old_soft_tp} → {dynamicTP}"
```

---

## Step 8: Check Stop-Loss / Take-Profit

**Positions with attached bracket orders** (`riskManagement.hasBracket == true`):
The bot manages soft SL/TP as the **primary** exit mechanism (inner layer). The attached bracket on Coinbase is a **wide catastrophic stop** (outer layer) that only fires if the bot is offline. The bot's SL/TP check below handles:
- **Soft SL/TP monitoring** — tighter thresholds than the bracket, checked each cycle
- **Trailing stop** management (attached brackets don't trail)
- **SL/TP recalculation** after 24h with fresh ATR (update both soft thresholds and bracket via `edit_order`)
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

// Calculate TP/SL based on per-position strategy (set at entry, updated by Step 7)
IF position.strategy == "post_capitulation_scalp":
  TP_PERCENT = 4.5  // Fixed 4.5%
  SL_PERCENT = 2.5  // Fixed 2.5%

ELSE IF position.strategy == "aggressive":
  TP_PERCENT = max(2.5, ATR_PERCENT × 2.5)  // 2.5× ATR, floor at 2.5%
  SL_PERCENT = clamp(ATR_PERCENT × 1.5, 2.5, 10.0)  // 1.5× ATR, 2.5-10%

ELSE IF position.strategy == "conservative":
  TP_PERCENT = 3.0  // Fixed 3%
  SL_PERCENT = 5.0  // Fixed 5%

ELSE IF position.strategy == "scalping":
  TP_PERCENT = 1.5  // Fixed 1.5%
  SL_PERCENT = 2.0  // Fixed 2.0%

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

## Step 9: Rebalancing Check

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

// Rebalancing decision (first match wins)
IF opportunity_delta > 60 AND unrealizedPnLPercent > -2:
  → reason = "urgent_delta"

ELSE IF opportunity_delta > 40 AND is_stagnant AND unrealizedPnLPercent > -2:
  → reason = "stagnant"

ELSE IF opportunity_delta > 30 AND is_stagnant AND unrealizedPnLPercent > 0:
  → reason = "profitable_delta"

IF reason:
  → SELL current position (market order, exit.trigger = "rebalance")
  → Bracket cancelled automatically by the Close Position operation
  →   (see state-schema.md: cancel bracket when exit.trigger NOT IN stopLoss/takeProfit/bracketSL/bracketTP)
  → BUY best alternative (limit order preferred)
  → Log: "Rebalanced {FROM}→{TO}: {reason}, {X}h held, delta +{Y}"
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

