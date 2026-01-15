---
paths:
  - ".claude/commands/trade*"
  - ".claude/skills/coinbase-trading/**"
---
# Trading Rules

## Critical Rules
1. **NEVER exceed budget** - Parse from arguments
2. **ALWAYS preview_order before create_order**
3. **Stop-loss is SACRED** (ATR-based, min 3%, max 15%) - Execute immediately
4. **When uncertain: DO NOT trade**
5. **Fees must be considered** - Round-trip ~1.5%

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

## Interval Parsing
- `interval=5m` → sleep 300
- `interval=15m` → sleep 900 (default)
- `interval=30m` → sleep 1800
- `interval=1h` → sleep 3600

## Dry-Run Mode
If "dry-run" in arguments: analyze but don't execute orders.
