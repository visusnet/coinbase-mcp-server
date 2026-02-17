# Phase 3: New Entries

This file is read when any pair scored above the entry threshold.
- NORMAL/BEAR: +40% aggressive
- POST_CAPITULATION: +33% (relaxed)
Rules marked [POST_CAP] apply only in POST_CAPITULATION regime.
It covers: signal aggregation, position sizing, fee checks, liquidity checks, and order execution.

---

## Fee Optimization Configuration

- **Fee Rates**: Fetched dynamically via `get_transaction_summary` (adapts to volume-based fee tier)
- **Slippage Buffer**: 0.3%
- **Min Profit (Direct)**: `(entry_fee + exit_fee + slippage) × 2` — computed per trade
- **Min Profit (Indirect)**: `(entry_fee + exit_fee + slippage) × 4` — computed per trade
- **Limit Order Timeout**: 120 seconds
- **Prefer Direct Pairs**: Yes (BTC→X instead of BTC→cash→X when available)

## Liquidity Requirements

Check orderbook before altcoin entries:

- **Max Spread**: 0.5% (skip trade if higher)
- **Reduced Position Spread**: 0.2% - 0.5% (use 50% size)
- **Full Position Spread**: < 0.2%
- **Bypass Check**: BTC-USD, BTC-EUR, ETH-USD, ETH-EUR, all limit orders, all exits

---

## Step 11: Signal Aggregation

Combine all signals into a decision.

**Signal Decay Warning**: A +50 STRONG_BUY in the current cycle may be +17 or 0 next cycle. This is NORMAL — stochastic normalizes as price moves away from oversold. Do not interpret signal decay as "the signal was wrong." If filters pass NOW, enter NOW. See `indicator-interpretations.md` for full explanation.

**Strategy-Specific Signal Thresholds**:

Different strategies require different signal strengths:

| Strategy     | Min BUY Score | Min SELL Score | Min Categories Confirming | ADX Threshold |
|--------------|---------------|----------------|---------------------------|---------------|
| Aggressive   | +40%          | -40%           | 2+                        | > 20          |
| Conservative | +60%          | -60%           | 3+                        | > 25          |
| Scalping     | +40%          | -40%           | 2+ (momentum focus)       | > 20          |

**Regime Comparison:**

| Parameter | NORMAL/BEAR | POST_CAPITULATION |
|-----------|-------------|-------------------|
| Min BUY Score | +40% (aggressive) | +33% |
| ADX Filter | ADX > 20 | ADX > 10 AND rising + (+DI > -DI) |
| MTF 6H bearish | signal x 0.3 | No penalty (skip 6H) |
| MTF 1H bearish | signal x 0.7 | signal x 0.7 (unchanged) |
| Max Position | 100% | 50% cumulative across all POST_CAP positions |
| SL/TP | ATR-based | 2.5% SL, 4.5% TP fixed |
| Bracket TP | strategy-dependent | max(8%, round_trip_fees × 4) |

**Per-Pair Strategy Selection:**

Before applying signal thresholds, determine the strategy for this pair based on current conditions:

```
// [POST_CAP] Override: force post-capitulation parameters
IF session.regime.current == "POST_CAPITULATION":
  pair_strategy = "post_capitulation_scalp"

ELSE IF ADX > 25 AND ADX rising AND MACD histogram expanding
   AND htf_bullish_count >= 2 AND OBV > SMA(OBV,10) AND 40 <= RSI <= 70:
  pair_strategy = "aggressive"
ELSE IF ADX < 25 AND ADX declining AND BB_width < SMA(BB_width,20)
   AND price < BB_lower + 0.2 * BB_width
   AND (stochastic_K < 20 OR RSI < 30) AND volume < SMA(volume,20):
  pair_strategy = "scalping"
ELSE IF ADX >= 20:
  pair_strategy = "conservative"
ELSE:
  pair_strategy = session.config.strategy  // fallback to session default
```

Apply the threshold for `pair_strategy` when evaluating signals.

**Calculate Final Technical Score** (normalize to -100% to +100%):

| Score Range  | Signal      | Action                       |
|--------------|-------------|------------------------------|
| > +60%       | Strong BUY  | **BUY** (full position)      |
| +40% to +60% | BUY         | **BUY** (75% position)       |
| +20% to +40% | Weak BUY    | BUY if sentiment bullish     |
| -20% to +20% | Neutral     | **HOLD**                     |
| -40% to -20% | Weak SELL   | SELL if sentiment bearish    |
| -60% to -40% | SELL        | **SELL** (75% position)      |
| < -60%       | Strong SELL | **SELL** (full position)     |

**Combine with Sentiment**:

| Technical   | Sentiment        | Final Decision      |
|-------------|------------------|---------------------|
| Strong BUY  | Bullish/Neutral  | **EXECUTE BUY**     |
| Strong BUY  | Bearish          | BUY (reduced size)  |
| BUY         | Bullish/Neutral  | **EXECUTE BUY**     |
| BUY         | Bearish          | HOLD (conflict)     |
| Weak BUY    | Bullish          | **EXECUTE BUY**     |
| Weak BUY    | Neutral/Bearish  | HOLD                |
| SELL        | Bearish/Neutral  | **EXECUTE SELL**    |
| SELL        | Bullish          | HOLD (conflict)     |
| Strong SELL | Any              | **EXECUTE SELL**    |

**Multi-Timeframe Alignment Filter**:

Apply trend alignment rules BEFORE executing trades:

```
// Rule: Only trade in direction of higher timeframe trend

IF session.regime.current == "POST_CAPITULATION":
  // [POST_CAP] Only require 1H neutral, skip 6H/daily
  IF trend_1h == "bearish":
    signal_strength = signal_strength × 0.7
  // No 6H/daily penalty

ELSE:
  // Existing NORMAL/BEAR logic (unchanged)
  // For BUY signals (score > +40):
  IF signal_15m > 40:  // BUY signal detected

    // Check higher timeframe alignment
    IF trend_daily == "bearish" OR trend_6h == "bearish":
      Log: "BUY signal rejected: conflicts with higher timeframe trend"
      Log: "  Daily: {trend_daily}, 6h: {trend_6h}, 1h: {trend_1h}"
      signal_strength = signal_strength × 0.3  // Reduce by 70%

    ELSE IF trend_1h == "bearish":
      Log: "BUY signal weakened: 1h trend bearish (pullback zone)"
      signal_strength = signal_strength × 0.7  // Reduce by 30%

    ELSE IF trend_daily == "bullish" AND trend_6h == "bullish":
      Log: "BUY signal CONFIRMED: aligned with higher timeframes ✓"
      // No reduction, proceed with full strength

  // For SELL signals (score < -40):
  IF signal_15m < -40:  // SELL signal detected

    // Check higher timeframe alignment
    IF trend_daily == "bullish" OR trend_6h == "bullish":
      Log: "SELL signal rejected: conflicts with higher timeframe trend"
      Log: "  Daily: {trend_daily}, 6h: {trend_6h}, 1h: {trend_1h}"
      signal_strength = signal_strength × 0.3  // Reduce by 70%

    ELSE IF trend_1h == "bullish":
      Log: "SELL signal weakened: 1h trend bullish (rally in downtrend)"
      signal_strength = signal_strength × 0.7  // Reduce by 30%

    ELSE IF trend_daily == "bearish" AND trend_6h == "bearish":
      Log: "SELL signal CONFIRMED: aligned with higher timeframes ✓"
      // No reduction, proceed with full strength
```

**Ideal Entry Scenarios**:

- **BUY**: Daily bullish + 6h bullish + 1h pullback (bearish) → Strong BUY on 15m reversal
- **SELL**: Daily bearish + 6h bearish + 1h rally (bullish) → Strong SELL on 15m reversal

**Trade Filters** (do NOT trade if):

- ADX filter (regime-aware):
  - NORMAL/BEAR: ADX < 20 → no trade
  - POST_CAPITULATION: ADX > 10 AND rising AND (+DI > -DI) → pass
    - "Rising" = current cycle ADX > previous cycle ADX (from indicatorCache)
    - First cycle / post-resume (no cache): compare current ADX vs ADX from 3 candles ago
      in the same dataset. If current > 3-candles-ago, consider "rising".
    - ADX > 10 minimum prevents entry on completely directionless pairs
- Conflicting signals between categories
- ATR > 3× average (extreme volatility)
- Volume below average
- Higher timeframe trend conflicts with signal (reduced by 70%)

See [strategies.md](../reference/strategies.md) for strategy configurations.

---

## Step 12: Apply Volatility-Based Position Sizing

After determining base position size from signal strength, adjust for volatility:

```
// Step 1: Calculate base position size from signal strength (from Step 11)
IF signal_strength > 60:
  base_position_pct = 100  // Full position
ELSE IF signal_strength >= 40:
  base_position_pct = 75   // 75% position
ELSE IF signal_strength >= 20:
  base_position_pct = 50   // 50% position
ELSE:
  → SKIP trade (signal too weak)

// Step 2: Get current ATR and calculate average ATR
current_atr = ATR(14)
atr_average = calculate 14-day moving average of ATR(14)

// Defensive check
IF atr_average <= 0:
  atr_ratio = 1.0  // Default to normal volatility
ELSE:
  atr_ratio = current_atr / atr_average

// Step 3: Apply volatility adjustment
IF atr_ratio < 1.0:
  // Low volatility: increase position
  volatility_multiplier = 1.10  // +10%
ELSE IF atr_ratio <= 2.0:
  // Normal to moderate volatility: reduce slightly
  volatility_multiplier = 0.90  // -10%
ELSE:
  // High volatility: reduce significantly
  volatility_multiplier = 0.50  // -50%

// Step 4: Calculate final position size
final_position_pct = min(100, base_position_pct × volatility_multiplier)

// Regime cap — CUMULATIVE across all POST_CAP positions
IF session.regime.current == "POST_CAPITULATION":
  existing_post_cap_pct = sum of all open positions where strategy == "post_capitulation_scalp"
                          as % of total portfolio value
  remaining_post_cap_budget = max(0, 50 - existing_post_cap_pct)
  final_position_pct = min(remaining_post_cap_budget, final_position_pct)
  IF remaining_post_cap_budget <= 0:
    → Log: "POST_CAP cumulative cap reached (50%). Skipping new entry."
    → Skip this pair

// Step 5: Apply exposure limits (from strategies.md Risk Per Trade section)
// Check ALL limits before finalizing position size:
//
// 1. Max exposure per asset: 33% of available capital
//    - Sum existing positions in same asset + new position
//    - If total > 33%: reduce new position or SKIP
//
// 2. Max risk per trade: 2% of Default portfolio value
//    - Calculate: position_size × (SL_distance / entry_price)
//    - If risk > 2% of available capital: reduce position size
//
// See strategies.md lines 145-149 for complete exposure limit definitions

available_capital = Default portfolio balance (from list_accounts or get_portfolio)
final_position_size = available_capital × (final_position_pct / 100)

Log: "Position: {base_position_pct}% (signal) × {volatility_multiplier} (ATR {atr_ratio:.2f}×) = {final_position_pct}% ({final_position_size} {quote_currency})"
```

**Example Calculations**:

- Strong signal (70%), low volatility (0.8× ATR): 100% × 1.10 = 110% (capped at available capital)
- Medium signal (50%), normal volatility (1.5× ATR): 75% × 0.90 = 67.5%
- Strong signal (70%), high volatility (2.5× ATR): 100% × 0.50 = 50%

---

## Step 13: Check Fees & Profit Threshold

Call `get_transaction_summary` and calculate:

**Stage 1: Initial Check (Optimistic - Limit Order fees)**

```
maker_fee = fee_tier.maker_fee_rate  // e.g., 0.004
taker_fee = fee_tier.taker_fee_rate  // e.g., 0.006

// Signal strength determines likely order type
IF signal_strength > 70:
  // Strong signal → Market order likely
  entry_fee = taker_fee
ELSE:
  // Normal signal → Limit order attempted
  entry_fee = maker_fee

exit_fee = taker_fee  // Exits typically market orders

// Minimum Profit calculation
round_trip_fee = entry_fee + exit_fee
slippage_buffer = 0.003  // 0.3% average slippage

MIN_PROFIT_DIRECT = (round_trip_fee + slippage_buffer) × 2  // ×2 = safety margin
MIN_PROFIT_INDIRECT = (round_trip_fee + slippage_buffer) × 4  // ×4 = 2 legs × 2 safety margin

// Check before trading
IF expected_move < MIN_PROFIT:
  → Log: "Trade unprofitable: expected {expected_move}% < required {MIN_PROFIT}%"
  → SKIP trade
```

**Stage 2: Fallback Re-Check (Conservative - if Limit Order times out)**

```
// At limit order fallback (after 120s timeout)
// Re-calculate with Market Order fees
entry_fee_market = taker_fee
exit_fee = taker_fee
round_trip_fee_market = entry_fee_market + exit_fee
slippage = 0.003

MIN_PROFIT_FALLBACK = (round_trip_fee_market + slippage) × 2  // ~3.0%

IF expected_move < MIN_PROFIT_FALLBACK:
  → Log: "Fallback unprofitable: expected {expected_move}% < required {MIN_PROFIT_FALLBACK}%"
  → Cancel limit order, SKIP fallback
  → Position: None (limit order was not filled)
ELSE:
  → Proceed with Market Order fallback
```

**Fee Report Section**:

```
Fees:
  Your Tier: [Tier Name]
  Maker: [X]%
  Taker: [Y]%
  Route: [Direct/Indirect]
  Round-Trip: [Z]%
  Min Profit Required: [W]%
  Expected Move: [V]% [✓/✗]
```

---

## Step 14: Pre-Trade Liquidity Check

For altcoin market order entries only (skip for major pairs like BTC-USD, BTC-EUR, ETH-USD, ETH-EUR, limit orders, exits):

1. Call `get_product_book` for target pair
2. Calculate spread with validation:

```json
// Defensive validation against invalid data
IF best_bid <= 0 OR best_ask <= 0:
  → SKIP trade
  → Log: "Invalid order book data: bid={bid}, ask={ask}"
  → STOP

mid_price = (best_ask + best_bid) / 2
spread = (best_ask - best_bid) / max(mid_price, 0.0001)

// Sanity check for suspicious spreads
IF spread > 10.0:
  → SKIP trade
  → Log: "Suspicious spread: {spread}% (likely data error)"
  → STOP
```

1. Decision:
   - Spread > 0.5% → SKIP trade, log "Spread too high: {X}%"
   - Spread 0.2% - 0.5% → Reduce position to 50%
   - Spread < 0.2% → Full position allowed
2. Store `entrySpread` and `liquidityStatus` in position

---

## Step 15: Execute Order

When a signal is present and expected profit exceeds MIN_PROFIT threshold (computed in Step 13):

**Order Type Selection**:

| Condition | Order Type | Attached TP/SL | Reason |
|-----------|------------|----------------|--------|
| Signal > 70% (Strong) | Market (IOC) | Yes | Speed is priority, confirmation already strong |
| Signal 40-70%, price already past key level | Limit (GTD, 120s) | Yes | Lower fees, auto-expires if unfilled |
| Signal 40-70%, price consolidating near key level | Stop-Limit (GTD, 2 cycles) | Standalone after fill | Only enter if breakout confirms, auto-expires |
| Signal < 40% | No Trade | - | - |
| SL/TP execution | Market (IOC) | - | Must exit immediately |

**Attached TP/SL (Dual-Layer — Market and Limit BUY entries)**:

All Market and Limit BUY entries include `attachedOrderConfiguration` with **wide bracket** values (catastrophic stop). The bot manages tighter soft SL/TP via `wait_for_event`.

```
// Step 1: Calculate bracket SL (all strategies — wide catastrophic stop)
ATR_PERCENT = ATR(14) / entry_price * 100
bracket_sl_pct = clamp(ATR_PERCENT * 3, 8.0, 12.0)
bracket_sl_price = entry_price * (1 - bracket_sl_pct / 100)

// Step 2: Calculate bracket TP (strategy-dependent)
IF pair_strategy == "post_capitulation_scalp":
  // Bracket TP: wide safety net, well above soft TP
  fees = get_transaction_summary()
  round_trip_fees = fees.taker_fee_rate * 2 + 0.003  // + slippage
  bracket_tp_pct = max(8.0, round_trip_fees * 4)
  // Soft SL/TP: fixed
  soft_sl_pct = 2.5
  soft_tp_pct = 4.5
ELSE IF pair_strategy == "scalping":
  fees = get_transaction_summary()
  round_trip_fees = fees.taker_fee_rate * 2 + 0.003  // + slippage
  bracket_tp_pct = round_trip_fees * 2
ELSE IF pair_strategy == "aggressive":
  bracket_tp_pct = max(10.0, ATR_PERCENT * 5)
ELSE:  // conservative
  bracket_tp_pct = 3.0
bracket_tp_price = entry_price * (1 + bracket_tp_pct / 100)

// Step 3: Calculate soft SL/TP (unchanged — per strategies.md)
// These are monitored by the bot via wait_for_event

// Step 4: Place order with wide bracket
attachedOrderConfiguration: {
  triggerBracketGtc: {
    limitPrice: bracket_tp_price,       // Wide bracket TP
    stopTriggerPrice: bracket_sl_price  // Wide bracket SL (8-12%)
  }
}

// Size is inherited from the parent order — do NOT specify size
// When the parent BUY fills, Coinbase creates a SELL order with TP + SL
// OCO: when either TP or SL triggers, the other cancels automatically
```

After fill, read `parent.attachedOrderId` to get the child bracket order ID. Store as `riskManagement.bracketOrderId`.

Save to state:
- `position.strategy = pair_strategy`
- `position.riskManagement.bracketSL = bracket_sl_price`
- `position.riskManagement.bracketTP = bracket_tp_price`
- `position.riskManagement.dynamicSL = soft_sl_price`
- `position.riskManagement.dynamicTP = soft_tp_price`

The bot monitors soft SL/TP with `wait_for_event` for trailing stops, SL/TP recalculation (after 24h), strategy re-evaluation, and rebalancing. The bracket is the catastrophic fallback — it only fires if the bot is offline.

Stop-limit entries do NOT support `attachedOrderConfiguration` (Coinbase limitation). After a stop-limit fills, the bot immediately places a **standalone sell bracket** to give the position the same Coinbase-level protection as market/limit entries.

**Stop-Limit Entry (Breakout Confirmation)**:

Use stop-limit orders when the signal is moderate but the price hasn't proven itself yet. The order only fills if the price actually reaches the trigger level — protecting against false breakouts.

**When to use stop-limit (ALL must be true):**
- Signal score 40-70% (moderate — not strong enough for immediate entry)
- Price consolidating near a key level (resistance, VWAP, EMA, pivot point)
- ADX < 25 (no strong trend yet — waiting for one to form)

**When NOT to use stop-limit (use market/limit instead):**
- Signal > 70% — confirmation already exists in the indicators, enter now
- Price already broke the key level — a stop-limit behind current price is pointless
- ADX > 25 with trend aligned — the trend is already established, ride it

<reasoning>
The key insight is that stop-limits are for uncertain situations where you want the market to prove itself before committing capital. If you're already confident (strong signal, strong trend, price past the level), a stop-limit just adds delay for no benefit.
</reasoning>

**How to set stop and limit prices:**

```
// Identify the key level (resistance, VWAP, EMA, pivot)
key_level = nearest resistance or consolidation ceiling

// Stop price: just above the key level
stop_price = key_level × 1.002  // 0.2% above level

// Limit price: add slippage buffer above stop
limit_price = stop_price × 1.003  // 0.3% buffer

// Example: Price consolidating below 59,000
// GTD auto-expires after 2 cycles (e.g., 30min for 15m interval)
create_order({
  side: "BUY",
  productId: "BTC-EUR",
  orderConfiguration: {
    stopLimitStopLimitGtd: {
      baseSize: "0.0002",
      stopPrice: "59118",      // 59,000 × 1.002
      limitPrice: "59295",     // 59,118 × 1.003
      stopDirection: "STOP_DIRECTION_STOP_UP",
      endTime: "2026-02-08T01:00:00Z"  // now + 2 × interval
    }
  }
  // No attachedOrderConfiguration — not supported for stop-limit
  // Bot manages SL/TP via wait_for_event after fill
})
```

**Managing stop-limit orders (GTD auto-expires):**

```
// GTD endTime = now + 2 × interval (e.g., 30min for 15min interval)
// The order auto-expires if the breakout doesn't happen — no manual cancel needed

IF stop-limit EXPIRED (status == "EXPIRED"):
  → Re-evaluate: is the setup still valid?
  → IF key level changed (new resistance) → re-place at new level with new GTD
  → IF signal dropped below 40% → skip trade
  → IF price moved away from level (>2% below) → setup invalidated

IF stop-limit FILLED:
  → Treat as normal position entry
  → Set SL/TP based on the fill price (not the original signal price)
  → Place standalone sell bracket immediately:
    ATR_PERCENT = ATR(14) / fill_price * 100
    bracket_sl_pct = clamp(ATR_PERCENT * 3, 8.0, 12.0)
    bracket_sl_price = fill_price * (1 - bracket_sl_pct / 100)
    // bracket TP uses same strategy-dependent formula as attached brackets
    bracket_tp_price = (see "Bracket TP" in strategies.md)
    create_order({
      side: "SELL", productId: pair,
      orderConfiguration: { triggerBracketGtc: {
        baseSize: filled_size,
        limitPrice: bracket_tp_price,
        stopTriggerPrice: bracket_sl_price
      }}
    })
  → Store bracketOrderId, set hasBracket = true
```

**Route Selection**:

```
cash_currency = dominant currency in Default portfolio (from list_accounts)
target_quote = pair's quote currency (e.g., "USD" from "ATOM-USD")

IF cash_currency == target_quote:
  → Direct route, MIN_PROFIT = MIN_PROFIT_DIRECT
ELSE IF convert pair exists (e.g., EUR-USD):
  → Cross-currency route, MIN_PROFIT = MIN_PROFIT_INDIRECT
  → Convert cash → target quote first, then buy target pair
ELSE:
  → Skip (no conversion path)
```

1. Call `list_products` to check if direct pair exists (e.g., BTC-SOL)
2. IF direct pair exists with sufficient liquidity:
   → Use direct pair, MIN_PROFIT = MIN_PROFIT_DIRECT
3. ELSE IF cross-currency conversion available (cash != target quote but convert pair exists):
   → Convert cash to target quote currency first, then buy target pair
   → MIN_PROFIT = MIN_PROFIT_INDIRECT (4x fees+slippage for two trades)
   → Only trade if expected_profit > MIN_PROFIT_INDIRECT
4. ELSE (no direct pair, no conversion path):
   → Skip trade

**For BUY (Limit Order)**:

```

1. Call get_best_bid_ask for current price
2. Calculate limit_price = best_ask × 1.0005 (slightly above)
3. Call preview_order with limitLimitGtd, endTime=now+120s, postOnly=true, attachedOrderConfiguration
4. If preview OK → execute create_order
5. Wait 120 seconds
6. Call get_order to check status
7. Check fill status and handle partial/unfilled:

```

   order_status = get_order(order_id)

   IF order_status == "FILLED":
     → Continue (fully filled, attached TP/SL bracket now active on Coinbase)

   ELSE IF order_status == "PARTIALLY_FILLED":
     filled_size = order.filled_size
     remaining_size = intended_size - filled_size

     IF remaining_size >= min_order_size:
       // Stage 2: Re-check profitability with Market Order fees
       IF expected_move >= MIN_PROFIT_FALLBACK:
         → Cancel original limit order
         → Place Market Order for remaining_size ONLY (with attachedOrderConfiguration)
         → Log: "Partial fill {filled_size}, fallback for {remaining_size}"
       ELSE:
         → Cancel order, accept partial fill only
         → Log: "Partial fill accepted: fallback unprofitable ({expected_move}% < {MIN_PROFIT_FALLBACK}%)"
     ELSE:
       → Accept partial fill, cancel order
       → Log: "Partial fill accepted: {filled_size} (remaining below minimum)"

   ELSE IF order_status == "EXPIRED":
     // GTD auto-expired — no cancel needed
     // Stage 2: Re-check profitability with Market Order fees
     IF expected_move >= MIN_PROFIT_FALLBACK:
       → Place Market Order for full intended_size (with attachedOrderConfiguration)
       → Log: "Limit order expired, fallback to market"
     ELSE:
       → SKIP fallback
       → Log: "Fallback skipped: unprofitable with market fees ({expected_move}% < {MIN_PROFIT_FALLBACK}%)"

```
1. Record position (coin, amount, entry price, orderType)
2. Save state to trading-state.json

```

**For BUY (Market Order - Strong Signal)**:

```

1. Call preview_order (Market Order, BUY, with attachedOrderConfiguration)
2. If preview OK → execute create_order
3. Record position (coin, amount, entry price)
4. Attached TP/SL bracket is now active on Coinbase
5. Save state to trading-state.json

```

**For SELL (open position)**:

```

1. For Take-Profit: Use Limit Order (limitLimitGtc, postOnly=true)
2. For Stop-Loss: Use Market Order (immediate execution)
3. Call preview_order → execute create_order
4. Calculate and log profit/loss (gross and net after fees)
5. Update state file (profit protection is applied after profitable close)

```
