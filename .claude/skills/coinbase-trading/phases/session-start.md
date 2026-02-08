# Session Start

Before entering the workflow, determine whether to start fresh or resume an existing session.

## Decision Logic

```
ON /trade invocation:

IF "reset" argument provided:
  → Backup trading-state.json to trading-state.backup-{YYYY-MM-DD}.json
  → FRESH START

ELSE IF trading-state.json exists:

  IF budget argument provided:
    → ASK USER:
      (A) "Resume session, keep current budget"
      (B) "Resume session, update budget to [new amount]"
      (C) "New session with [new amount]"
          → Reset session.stats, session.compound, openPositions
          → Set new budget
          → KEEP tradeHistory (cumulative across sessions)

  ELSE (no budget argument):
    → RESUME SESSION

ELSE (no state file):

  IF budget argument provided:
    → FRESH START with given budget

  ELSE (no budget argument):
    → Call list_accounts to show current holdings
    → ASK USER: "How much budget should I use?"
      - All of [asset]?
      - A specific amount? (e.g., "10 EUR from BTC")
      - Which assets? (show available balances)
    → FRESH START with user's answer
```

<reasoning>
Budget argument + existing state is ambiguous. "/trade 10 EUR from BTC" could mean "start fresh" or "I'm re-typing my original command to continue". Asking removes the ambiguity. "New session" resets session stats but keeps tradeHistory — like turning a new page in the same notebook, not throwing it away. The "reset" argument is the only path that creates a backup because it's the only one that actually deletes data.
</reasoning>

## Fresh Start

See [state-schema.md](../reference/state-schema.md) → "Initialize Session" for the complete fresh start procedure (budget parsing, EUR conversion, field initialization).

## Resume Session

When resuming, reconcile state with reality before trading:

**Step 1: Load State**

Read `trading-state.json`, parse and validate structure.

**Step 2: Reconcile Positions with Reality**

<reasoning>
The bot uses budget-based ownership: it only "owns" what the state file says + anything matching recent orders. Everything else in list_accounts belongs to the user. This respects the sacred budget rule — the bot never touches assets outside its scope. If state is empty, the bot assumes it has no positions, even if the account holds assets.
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
    → Position GONE — likely sold while offline (manual or filled SL)
    → Check list_orders for matching fills since session.lastUpdated
    → Move to tradeHistory with trigger="unknown_offline_exit"
    → Log: "Position {pair} no longer held — moved to history"

FOR EACH open order NOT tracked in state:
  → Log: "Untracked open order found: {orderId} {side} {pair}"
  → Add to state if it matches bot's session context
  → Otherwise ignore (user's manual order)
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
