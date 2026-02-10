# Session Start

Before entering the workflow, determine whether to start fresh or resume an existing session.

## Decision Logic

```
ON /trade invocation:

IF "reset" argument provided:
  → Backup trading-state.json to trading-state.backup-{YYYY-MM-DD}.json
  → FRESH START (Flow A)

ELSE IF trading-state.json exists:

  IF trading-state.json has portfolios.hodlSafeUuid:
    → Check if HODL Safe still exists via list_portfolios
    → IF not found: SAFE DELETED (Flow E)
    → IF found AND portfolios.fundsAllocated == false: RESUME SETUP (Flow F)
    → IF found AND portfolios.fundsAllocated == true: WARM START (Flow B)

  ELSE IF trading-state.json has session.budget (legacy):
    → MIGRATION (Flow C)

  ELSE:
    → SAFE MISSING (Flow D)

ELSE (no state file):

  IF budget argument provided:
    → FRESH START (Flow A)

  ELSE (no budget argument):
    → SAFE MISSING (Flow D)
```

## Flow A: Fresh Start

User runs `/trade 10 EUR from BTC` (also valid: `/trade 100 USD from BTC`, `/trade 50 USDT`):

> **Note**: EUR, USD, and USDT are all valid quote currencies for the budget. The quote currency determines the initial cash currency and which pairs are direct routes.

1. Parse budget argument (amount, source currency)
2. list_portfolios → discover Default UUID
   IF a portfolio named "HODL Safe" already exists:
     → Ask user: "A portfolio named 'HODL Safe' already exists.
       (A) Use it as your HODL Safe
       (B) Create a new portfolio with a different name"
     → If (A): use its UUID as hodlSafeUuid, skip step 5
     → If (B): ask for name, use that name in step 5
3. list_accounts → get all current holdings
4. If source != quote currency: get_product("{SOURCE}-{QUOTE}") → get current price, calculate equivalent in quote currency
5. create_portfolio("HODL Safe") → get UUID (skip if adopted existing in step 2)
6. Save to state IMMEDIATELY: portfolios.defaultUuid, portfolios.hodlSafeUuid, portfolios.fundsAllocated = false
7. Ask profit protection question:
   - Keep all profits for trading (profitProtectionRate: 0)
   - Move 50% of profits to HODL Safe (recommended) (profitProtectionRate: 50)
   - Move all profits to HODL Safe — trading capital will only shrink over time since profits leave but losses stay (profitProtectionRate: 100)
   - Custom percentage (profitProtectionRate: user-specified)
8. Save portfolios.profitProtectionRate to state
9. For each asset with non-zero available_balance in Default:
   - If asset is the budget source: calculate amount to keep (budget equivalent in quote currency / current price), round using base_increment from get_product, move the rest to Safe
   - If asset is anything else: move entire balance to Safe
10. Set portfolios.fundsAllocated = true, save state
11. Initialize session fields (see state-schema.md → Initialize Session)
12. Begin trading

## Flow B: Warm Start

1. Load state file, verify portfolios.hodlSafeUuid
2. list_portfolios → find Safe by UUID
3. If Safe found: continue
4. If budget parameter provided: ignore it, inform user:
   "HODL Safe is active. Your trading capital is whatever's in the Default portfolio. To adjust, move funds between portfolios via the Coinbase website."
5. Reconcile positions with reality (same as current Step 2-5 in resume)
6. Resume trading

## Flow C: Migration (Legacy State)

Legacy state file has session.budget but no portfolios:

1. list_portfolios → discover Default UUID, check for existing "HODL Safe" (same name-conflict handling as Flow A step 2)
2. Inform user: "Migrating to HODL Safe portfolio isolation."
3. create_portfolio("HODL Safe") → get UUID (skip if adopted existing in step 1)
4. Save to state IMMEDIATELY: portfolios.defaultUuid, portfolios.hodlSafeUuid, portfolios.fundsAllocated = false
5. Ask profit protection question (same 4 options as Flow A)
6. Save portfolios.profitProtectionRate to state
7. list_accounts → get all current holdings (use available_balance, not total)
8. Identify assets that should remain in Default portfolio:
   - For each open position: keep_in_default[asset] += position.size
   - Cash to keep: min(session.budget.remaining, actual available balance in quote currency)
   - For each asset: move_amount = available_balance - keep_in_default[asset]
   - Round move amounts using base_increment from get_product
9. Show user a migration plan table:
   | Asset | Available | Stays in Default | Moves to Safe |
   User confirms, adjusts, or cancels before any moves execute
10. Execute per-currency move_portfolio_funds calls (one per asset)
11. Set portfolios.fundsAllocated = true
12. Migrate state file:
    - Remove session.budget
    - Remove session.compound
    - Drop realizedPnLPercent
13. Resume trading

## Flow D: Safe Missing (No Legacy Budget)

No HODL Safe found, no legacy budget configuration:

1. Inform user: "No HODL Safe found and no budget configuration."
2. list_accounts → show current holdings
3. Ask user:
   (A) Create HODL Safe — choose which funds to protect and which to trade with
       → User specifies budget (e.g., "10 EUR from BTC")
       → Execute Flow A steps 2-12
   (B) Create HODL Safe — keep all funds in Default for trading
       → create_portfolio("HODL Safe") with empty contents (apply same name-conflict handling as Flow A step 2)
       → Ask profit protection question
       → Save portfolios.* to state (fundsAllocated = true, no moves needed)
       → Begin trading

## Flow E: Safe Deleted Externally

State file has portfolios.hodlSafeUuid but list_portfolios doesn't find it:

1. Warn user: "HODL Safe portfolio was deleted externally (UUID: {uuid})."
2. Clear portfolios from state file
3. Follow Flow D resolution

## Flow F: Resume Interrupted Setup

State file has portfolios.hodlSafeUuid and portfolios.fundsAllocated == false:

1. Inform user: "Previous HODL Safe setup was interrupted. HODL Safe exists but fund allocation is incomplete."
2. list_accounts → show current holdings in Default
3. Ask user: "How much capital do you want to trade with? The rest will be moved to HODL Safe."
   - User specifies budget (e.g., "10 EUR from BTC") — same as Flow A
4. Execute Flow A steps 3-10 (list holdings, calculate moves, execute moves, set fundsAllocated = true)
5. Resume trading (Flow B)

## Resume Session

When resuming, reconcile state with reality before trading:

**Step 1: Load State**

Read `trading-state.json`, parse and validate structure.

**Step 2: Reconcile Positions with Reality**

<reasoning>
With HODL Safe isolation, everything in the Default portfolio belongs to the bot.
Position reconciliation verifies that state file positions match actual balances.
Untracked assets in Default should be adopted as managed positions:
  - Look up entry price via list_fills or list_orders
  - If no fill history found, use current market price as entry
  - Apply standard SL/TP/trailing based on current analysis
</reasoning>

```
Call list_accounts → get actual balances
Call list_orders(status="OPEN") → get pending orders (stop-limits, unfilled limits)

FOR EACH position in state.openPositions:
  asset = position.pair.split("-")[0]  // e.g., "BTC" from "BTC-EUR"
  actual_balance = accounts[asset].available_balance

  IF actual_balance >= position.size:
    → Position CONFIRMED

  ELSE IF actual_balance > 0 BUT < position.size:
    → Position PARTIAL — update size to actual_balance
    → Log: "Position {pair} reduced: state={old_size}, actual={actual_balance}"

  ELSE (balance is 0):
    IF position.riskManagement.bracketOrderId:
      → Defer to Step 2.5 — bracket may have fired, need order status to classify
      → Log: "Position {pair} balance=0, deferring to bracket reconciliation"
    ELSE:
      → Position GONE — likely sold while offline (manual or filled SL)
      → Check list_orders for matching fills since session.lastUpdated
      → Move to tradeHistory with trigger="unknown_offline_exit"
      → Log: "Position {pair} no longer held — moved to history"

FOR EACH open order NOT tracked in state:
  → Log: "Untracked open order found: {orderId} {side} {pair}"
  → Adopt as managed position (everything in Default belongs to the bot)
  → Look up entry price via list_fills or list_orders, fallback to current price
```

**Step 2.5: Bracket Reconciliation**

For each confirmed position, verify the bracket order is still active:

```
FOR EACH position in state.openPositions (confirmed in Step 2):
  IF position.riskManagement.bracketOrderId:
    order = get_order(position.riskManagement.bracketOrderId)

    IF order.status == "FILLED":
      // Bracket fired while offline — position was closed by Coinbase
      // Determine if SL or TP fired based on fill price
      fill_price = order.average_filled_price
      IF fill_price <= position.riskManagement.bracketSL * 1.01:
        trigger = "bracketSL"
        reason = "Bracket SL fired while offline at {fill_price}"
      ELSE:
        trigger = "bracketTP"
        reason = "Bracket TP fired while offline at {fill_price}"
      → Move position to tradeHistory with exit.trigger = trigger
      → Log: "{reason}"

    ELSE IF order.status == "CANCELLED":
      // Bracket was cancelled (crash during update? manual cancellation?)
      → Log: "⚠ Bracket cancelled for {pair} — re-placing immediately"
      // Recalculate and place new bracket
      ATR_PERCENT = ATR(14) / position.entry.price * 100
      bracket_sl_pct = clamp(ATR_PERCENT * 3, 8.0, 12.0)
      // ... (use position.strategy for TP calculation)
      → Place new bracket via create_order (SELL triggerBracketGtc)
      → Update position.riskManagement.bracketOrderId

    ELSE IF order.status == "OPEN":
      // Bracket intact — verify prices match state
      IF order prices differ from state:
        → Log: "Bracket price mismatch — updating state to match Coinbase"
        → Update position.riskManagement.bracketSL/TP to match order

  ELSE IF position.riskManagement.hasBracket == false:
    // Position has no bracket — place one immediately
    → Log: "⚠ No bracket for {pair} — placing bracket"
    → Calculate and place bracket
    → Update state
```

**Step 3: Check Missed SL/TP** (for each confirmed position)

<reasoning>
SL breach while offline + still underwater = close immediately. The position failed and hasn't recovered — continuing to hold is wishful thinking. SL breach while offline + price recovered = recalculate SL/TP with fresh ATR and keep. Closing a profitable position because of a historical dip wastes real money. The breach is still logged as important risk context. Missed TP is always a "keep and re-optimize" — the money is still there, just set new targets.
</reasoning>

```
Get current price via get_best_bid_ask(pair)
Fetch candles since session.lastUpdated (to see price range while offline)
offline_low = min(candle lows since lastUpdated)
offline_high = max(candle highs since lastUpdated)

IF offline_low < position.riskManagement.dynamicSL:
  → SL was BREACHED while offline
  → Log: "⚠ SL breach for {pair}: SL={dynamicSL}, offline low={offline_low}"

  IF current_price < position.entry.price:
    → Still underwater — execute exit NOW (market order)
  ELSE:
    → Price recovered — recalculate SL/TP with fresh ATR
    → KEEP position with updated risk levels

ELSE IF offline_high > position.riskManagement.dynamicTP:
  → TP was BREACHED while offline (missed profit)
  → Recalculate SL/TP with fresh ATR
  → KEEP position

IF position held > 24h:
  → Recalculate SL/TP with current ATR regardless of breach
```

<reasoning>
ATR changes over time. A position entered during high volatility may have a 10% SL, but if volatility has normalized, that SL is too loose. Recalculating after 24h keeps risk management aligned with current market conditions.
</reasoning>

**Step 4: Clear Stale Cache**

Delete `indicatorCache` entries older than 1 hour.

<reasoning>
Indicator values from hours ago are misleading. Stale RSI or MACD values could cause the bot to skip a good entry or hold a bad position. Fresh data costs one API call — cheap insurance.
</reasoning>

**Step 5: Update and Continue**

```
session.lastUpdated = now()
Log resume summary: "{N} positions confirmed, {M} gone, {K} SL/TP breaches"
→ Continue to Phase 1
```
