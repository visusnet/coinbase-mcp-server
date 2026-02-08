---
name: trading-execution
description: "Phase 3: Signal aggregation, position sizing, fee analysis, liquidity check, and order execution."
---

# Trade Execution (Phase 3)

**Sub-skill of `coinbase-trading`.** Called via `Skill("trading-execution")` each trading cycle.

This skill evaluates whether to open new positions and executes orders. Uses analysis data from Phase 1 and freed capital from Phase 2.

## Scope

10. Signal Aggregation (combine technical + sentiment into decision)
11. Volatility-Based Position Sizing
12. Fee & Profit Threshold Check
13. Pre-Trade Liquidity Check
14. Execute Order (market, limit, stop-limit)

**Output**: Executed trades (if any), updated state file.

---

## Step 10: Signal Aggregation

### Strategy-Specific Signal Thresholds

| Strategy | Min BUY Score | Min SELL Score | Min Categories | ADX Threshold |
|----------|---------------|----------------|----------------|---------------|
| Aggressive | +40% | -40% | 2+ | > 20 |
| Conservative | +60% | -60% | 3+ | > 25 |
| Scalping | +40% | -40% | 2+ (momentum focus) | > 20 |

### Technical Score -> Signal Decision

| Score Range | Signal | Action |
|-------------|--------|--------|
| > +60% | Strong BUY | **BUY** (full position) |
| +40% to +60% | BUY | **BUY** (75% position) |
| +20% to +40% | Weak BUY | BUY if sentiment bullish |
| -20% to +20% | Neutral | **HOLD** |
| -40% to -20% | Weak SELL | SELL if sentiment bearish |
| -60% to -40% | SELL | **SELL** (75% position) |
| < -60% | Strong SELL | **SELL** (full position) |

### Combine with Sentiment

| Technical | Sentiment | Final Decision |
|-----------|-----------|----------------|
| Strong BUY | Bullish/Neutral | **EXECUTE BUY** |
| Strong BUY | Bearish | BUY (reduced size) |
| BUY | Bullish/Neutral | **EXECUTE BUY** |
| BUY | Bearish | HOLD (conflict) |
| Weak BUY | Bullish | **EXECUTE BUY** |
| Weak BUY | Neutral/Bearish | HOLD |
| SELL | Bearish/Neutral | **EXECUTE SELL** |
| SELL | Bullish | HOLD (conflict) |
| Strong SELL | Any | **EXECUTE SELL** |

### Multi-Timeframe Alignment Filter

Apply BEFORE executing trades:

```
// For BUY signals (score > +40):
IF trend_daily == "bearish" OR trend_6h == "bearish":
  signal_strength = signal_strength x 0.3  // Reduce by 70%
  Log: "BUY signal rejected: conflicts with higher timeframe trend"

ELSE IF trend_1h == "bearish":
  signal_strength = signal_strength x 0.7  // Reduce by 30%

ELSE IF trend_daily == "bullish" AND trend_6h == "bullish":
  Log: "BUY signal CONFIRMED: aligned with higher timeframes"

// For SELL signals (score < -40):
IF trend_daily == "bullish" OR trend_6h == "bullish":
  signal_strength = signal_strength x 0.3  // Reduce by 70%

ELSE IF trend_1h == "bullish":
  signal_strength = signal_strength x 0.7  // Reduce by 30%

ELSE IF trend_daily == "bearish" AND trend_6h == "bearish":
  Log: "SELL signal CONFIRMED: aligned with higher timeframes"
```

**Ideal Entry Scenarios**:
- **BUY**: Daily bullish + 6h bullish + 1h pullback -> Strong BUY on 15m reversal
- **SELL**: Daily bearish + 6h bearish + 1h rally -> Strong SELL on 15m reversal

### Trade Filters (do NOT trade if)

- ADX < 20 (no clear trend)
- Conflicting signals between categories
- ATR > 3x average (extreme volatility)
- Volume below average
- Higher timeframe trend conflicts (reduced by 70%)

### False Breakout Prevention

Before entering on a breakout, require confirmation:
1. **Time**: Price holds above/below level for 15 min (one candle close beyond)
2. **RSI**: > 40 for bullish breakouts, < 60 for bearish
3. **Volume**: Breakout candle volume above 20-period average
4. **Prefer stop-limit entries**: Let the market prove itself

**Signs of false breakout**: Long wick reversal, declining volume, RSI already overbought, higher timeframe conflict.

---

## Step 11: Volatility-Based Position Sizing

```
// Step 1: Base position from signal strength
IF signal_strength > 60: base_position_pct = 100  // Full
ELSE IF signal_strength >= 40: base_position_pct = 75
ELSE IF signal_strength >= 20: base_position_pct = 50
ELSE: -> SKIP trade (too weak)

// Step 2: ATR volatility adjustment
current_atr = ATR(14)
atr_average = 14-day moving average of ATR(14)
IF atr_average <= 0: atr_ratio = 1.0
ELSE: atr_ratio = current_atr / atr_average

// Step 3: Volatility multiplier
IF atr_ratio < 1.0: volatility_multiplier = 1.10    // Low vol: +10%
ELSE IF atr_ratio <= 2.0: volatility_multiplier = 0.90  // Normal: -10%
ELSE: volatility_multiplier = 0.50                   // High vol: -50%

// Step 4: Final position size
final_position_pct = base_position_pct x volatility_multiplier

// Step 5: Exposure limits
// Max exposure per asset: 33% of budget
// Max simultaneous positions: 3
// Max risk per trade: 2% of total portfolio
//   risk = position_size x (SL_distance / entry_price)
//   IF risk > 2% of initial budget: reduce position size

final_position_size_eur = session.budget.remaining x (final_position_pct / 100)

Log: "Position: {base}% (signal) x {mult} (ATR {ratio}x) = {final}% ({eur} EUR)"
```

---

## Step 12: Fee & Profit Threshold Check

Call `get_transaction_summary` and calculate:

### Stage 1: Initial Check (Optimistic - Limit Order fees)

```
maker_fee = fee_tier.maker_fee_rate
taker_fee = fee_tier.taker_fee_rate

// Signal strength determines likely order type
IF signal_strength > 70: entry_fee = taker_fee  // Market order
ELSE: entry_fee = maker_fee                      // Limit order

exit_fee = taker_fee  // Exits typically market orders

round_trip_fee = entry_fee + exit_fee
slippage_buffer = 0.003  // 0.3%

MIN_PROFIT_DIRECT = (round_trip_fee + slippage_buffer) x 2
MIN_PROFIT_INDIRECT = (round_trip_fee + slippage_buffer) x 4

IF expected_move < MIN_PROFIT:
  -> Log: "Trade unprofitable: expected {X}% < required {Y}%"
  -> SKIP trade
```

### Stage 2: Fallback Re-Check (if Limit Order times out)

```
// Re-calculate with Market Order fees
entry_fee_market = taker_fee
round_trip_fee_market = entry_fee_market + exit_fee
MIN_PROFIT_FALLBACK = (round_trip_fee_market + slippage) x 2

IF expected_move < MIN_PROFIT_FALLBACK:
  -> Cancel limit order, SKIP fallback
ELSE:
  -> Proceed with Market Order fallback
```

---

## Step 13: Pre-Trade Liquidity Check

For altcoin market order entries only (skip for BTC-EUR, ETH-EUR, limit orders, exits):

```
// Get order book
book = get_product_book(pair)

// Validate data
IF best_bid <= 0 OR best_ask <= 0:
  -> SKIP trade, Log: "Invalid order book data"

mid_price = (best_ask + best_bid) / 2
spread = (best_ask - best_bid) / max(mid_price, 0.0001)

IF spread > 10.0:
  -> SKIP trade, Log: "Suspicious spread (likely data error)"

// Decision
IF spread > 0.5%: -> SKIP trade, "Spread too high: {X}%"
IF spread 0.2% - 0.5%: -> Reduce position to 50%
IF spread < 0.2%: -> Full position allowed
```

Store `entrySpread` and `liquidityStatus` in position.

---

## Step 14: Execute Order

### Order Type Selection

| Condition | Order Type | Attached TP/SL | Reason |
|-----------|------------|----------------|--------|
| Signal > 70% (Strong) | Market (IOC) | Yes | Speed priority |
| Signal 40-70%, past key level | Limit (GTD, 120s) | Yes | Lower fees |
| Signal 40-70%, consolidating | Stop-Limit (GTD, 2 cycles) | No | Breakout confirmation |
| Signal < 40% | No Trade | - | - |
| SL/TP execution | Market (IOC) | - | Must exit immediately |

### Attached TP/SL (Market and Limit BUY entries)

All Market and Limit BUY entries must include `attachedOrderConfiguration`:

```
attachedOrderConfiguration: {
  triggerBracketGtc: {
    limitPrice: take_profit_price,
    stopTriggerPrice: stop_loss_price
  }
}
// Size inherited from parent order -- do NOT specify size
// OCO: when either triggers, the other cancels automatically
```

This creates crash-proof TP/SL on Coinbase's side. Stop-limit entries do NOT support attached TP/SL (Coinbase limitation).

### For BUY (Limit Order)

```
1. get_best_bid_ask -> current price
2. limit_price = best_ask x 1.0005
3. preview_order with limitLimitGtd, endTime=now+120s, postOnly=true, attachedOrderConfiguration
4. If preview OK -> create_order
5. Wait 120 seconds
6. get_order -> check fill status:

IF FILLED:
  -> Continue (attached TP/SL bracket now active)

ELSE IF PARTIALLY_FILLED:
  filled_size = order.filled_size
  remaining = intended_size - filled_size
  IF remaining >= min_order_size AND expected_move >= MIN_PROFIT_FALLBACK:
    -> Cancel limit, place Market Order for remaining (with attached bracket)
  ELSE:
    -> Accept partial fill, cancel order

ELSE IF EXPIRED:
  IF expected_move >= MIN_PROFIT_FALLBACK:
    -> Place Market Order for full size (with attached bracket)
  ELSE:
    -> SKIP fallback

7. Record position, save state
```

### For BUY (Market Order - Strong Signal)

```
1. preview_order (Market, BUY, with attachedOrderConfiguration)
2. If preview OK -> create_order
3. Record position, attached bracket now active
4. Save state
```

### Stop-Limit Entry (Breakout Confirmation)

**When to use** (ALL must be true):
- Signal score 40-70% (moderate)
- Price consolidating near key level (resistance, VWAP, EMA, pivot)
- ADX < 25 (no strong trend yet)

**When NOT to use**:
- Signal > 70% (enter now)
- Price already broke key level
- ADX > 25 with aligned trend

```
key_level = nearest resistance or consolidation ceiling
stop_price = key_level x 1.002   // 0.2% above level
limit_price = stop_price x 1.003  // 0.3% buffer

create_order({
  side: "BUY",
  productId: pair,
  orderConfiguration: {
    stopLimitStopLimitGtd: {
      baseSize: size,
      stopPrice: stop_price,
      limitPrice: limit_price,
      stopDirection: "STOP_DIRECTION_STOP_UP",
      endTime: now + 2 x interval  // GTD auto-expires
    }
  }
  // No attachedOrderConfiguration (not supported for stop-limit)
})

// Managing stop-limit orders:
IF EXPIRED: Re-evaluate (new level? signal dropped? price moved away?)
IF FILLED: Treat as normal entry, set SL/TP via wait_for_market_event
```

### Route Selection

```
1. list_products -> check if direct pair exists (e.g., BTC-SOL)
2. IF direct pair with sufficient liquidity:
   -> Use direct, MIN_PROFIT = MIN_PROFIT_DIRECT
3. ELSE:
   -> Indirect route (BTC -> EUR -> SOL)
   -> MIN_PROFIT = MIN_PROFIT_INDIRECT
```

### For SELL (open position)

```
1. Take-Profit: Limit Order (limitLimitGtc, postOnly=true)
2. Stop-Loss: Market Order (immediate execution)
3. preview_order -> create_order
4. Calculate and log profit/loss (gross and net after fees)
5. Update state file (compound applied in Step 8)
```

### State Operation: Open Position

```
id = "pos_{YYYYMMDD}_{HHMMSS}_{COIN}"
pair, side = "long", size = calculated

entry.price = execution price
entry.time = current timestamp
entry.orderType = "limit" | "market"
entry.fee = fee from order response
entry.route = "direct" | "indirect"
entry.spread = calculated spread
entry.liquidityStatus = "good" | "moderate"

analysis.signalStrength = final score (0-100)
analysis.technicalScore = technical score
analysis.sentiment = "bullish" | "neutral" | "bearish"
analysis.reason = "MACD Golden Cross + RSI < 30"
analysis.confidence = "high" (>70) | "medium" (40-70) | "low" (<40)

riskManagement.entryATR = ATR(14)
riskManagement.dynamicSL = calculated SL price
riskManagement.dynamicTP = calculated TP price
riskManagement.trailingStop.active = false
riskManagement.trailingStop.currentStopPrice = null
riskManagement.trailingStop.highestPrice = entry price

performance.* = null (updated each cycle)

session.stats.tradesOpened += 1
session.budget.remaining -= (size x price + fee)
session.lastUpdated = current timestamp
```

---

## Post-Crash Opportunity Playbook

Activate when `percentChange24h` < -15% on BTC or ETH, or multiple assets down > 10%.

### Adaptation Rules

1. **Anchor to 1H timeframe** -- 15m produces noise during extreme volatility
2. **Look for oversold bounces** -- Use `wait_for_market_event`:
   ```
   conditions: [
     { field: "rsi", operator: "crossAbove", value: 30, granularity: "ONE_HOUR" },
     { field: "macd.histogram", operator: "crossAbove", value: 0, granularity: "ONE_HOUR" }
   ],
   logic: "any"
   ```
3. **Confirm the bounce** -- Price reclaims VWAP, 1H MACD histogram positive, volume increases
4. **Use stop-limit entries** -- Above consolidation resistance
5. **Reduce position sizes** -- 50% of normal
6. **Tighten stops** -- 1x ATR instead of 1.5x ATR
7. **Take partial profits early** -- 50% at 1.5x ATR, rest with trailing stop

### What NOT to Do

- Don't catch the exact bottom -- wait for confirmation
- Don't use 100% budget on first entry -- scale in
- Don't ignore higher timeframe trend -- daily bearish means bounce may fail
