---
paths:
  - ".claude/commands/trade*"
  - ".claude/skills/coinbase-trading/**"
---
# Trading Rules

## Critical Rules

1. **NEVER exceed budget** - Parse from arguments
2. **NEVER touch assets outside the budget** - The budget defines the TOTAL amount the bot can use. All other holdings are OFF LIMITS. If budget is "10 EUR from BTC" and you hold 50 EUR in BTC, only 10 EUR equivalent may be traded. The remaining 40 EUR in BTC and ALL other assets (DOGE, SHIB, XLM, EUR cash, etc.) MUST stay untouched unless they are part of an open position managed by this session.
3. **ALWAYS preview_order before create_order**
4. **Stop-loss is SACRED** (ATR-based, min 3%, max 15%) - Execute immediately
5. **When uncertain: DO NOT trade**
6. **Fees must be considered** - Round-trip ~1.5%

## Order Workflow

```
1. list_accounts → Check balance
2. get_product_candles → Technical data
3. get_best_bid_ask → Current price
4. preview_order → Verify parameters
5. create_order → Execute
6. Update state file
```

## State Persistence

**File**: `.claude/trading-state.json`

**Schema**: See [state-schema.md](../skills/coinbase-trading/state-schema.md) for complete structure.

**Workflow**:

- Load at start of `/trade` session
- Save after each trade (entry/exit)
- Update `session.lastUpdated` on each cycle

**Non-negotiable**: State persistence applies regardless of execution mode (direct skill, team, background agent). Every trade MUST be recorded to `trading-state.json` immediately after execution. Skipping state updates means the next session starts with stale data — positions become invisible, budget tracking breaks, and trade history is lost.

## Interval Parsing

- `interval=5m` → sleep 300
- `interval=15m` → sleep 900 (default)
- `interval=30m` → sleep 1800
- `interval=1h` → sleep 3600

## Post-Compaction Recovery

After context compaction (auto or manual), you MUST re-read these files before continuing to trade:

1. `.claude/skills/coinbase-trading/SKILL.md` — Your complete workflow (4 phases), order types, risk management, crash playbook
2. `.claude/skills/coinbase-trading/strategies.md` — Signal scoring, strategy configs, false breakout rules
3. `.claude/trading-state.json` — Current positions, budget, trade history

Do NOT rely on memory after compaction. Re-read the files. Context drift causes rule violations.

## Dry-Run Mode

If "dry-run" in arguments: analyze but don't execute orders.
