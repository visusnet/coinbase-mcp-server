# Portfolio Status

Display a compact portfolio status report with minimal token overhead.

## Output Format

Use this EXACT format template (no deviation, no explanatory text before/after):

```
═══════════════════════════════════════════════════════════
                    PORTFOLIO STATUS
═══════════════════════════════════════════════════════════

💰 BALANCES
───────────────────────────────────────────────────────────
  EUR:    €{balance}
  {COIN}:  {amount} (~€{value})
  ─────────────────────────────
  TOTAL:  ~€{total}

📊 OPEN POSITIONS
───────────────────────────────────────────────────────────
  {PAIR} │ LONG │ Entry: €{entry} │ Current: €{current}
         │ Size: {size} │ P/L: {pnl} ({pnl_pct}%)
         │ SL: €{sl} │ TP: €{tp} │ Trail: {trail_status}

📈 SESSION STATS
───────────────────────────────────────────────────────────
  Started:     {start_time} UTC
  Trades:      {total} ({wins}W / {losses}L)
  Win Rate:    {win_rate}%
  Net P/L:     {net_pnl} ({net_pnl_pct}%)
  Fees Paid:   €{fees}

⏰ Updated: {timestamp} UTC
═══════════════════════════════════════════════════════════
```

## Required Steps

1. **Get Balances**: Call `mcp_coinbase_list_accounts`
2. **Get Prices**: Call `mcp_coinbase_get_best_bid_ask` for held assets
3. **Read State**: Per [state-schema.md](../skills/coinbase-trading/state-schema.md):
   - Session stats: `session.stats.*`
   - Budget: `session.budget.*`
   - Open positions: `openPositions[]`
   - Exit levels: `openPositions[].riskManagement.*`
4. **Format Output**: Use template above

## Output Rules

- Round EUR to 2 decimals
- Round crypto to 8 decimals
- Show P/L in both absolute (€) and percentage
- Show all exit levels (SL, TP, Trail status)
- Trail status: Show price if active, "inactive" if not
- If no positions: Show "None"
- If no session: Show "No active trading session"
- If state file is >24 hours old: Add warning "⚠️ State file is {age} old - may be outdated"

## Error Handling

If API calls fail, show:

```
═══════════════════════════════════════════════════════════
                    PORTFOLIO STATUS
═══════════════════════════════════════════════════════════
⚠️  Error fetching data: {error_message}
    Last known state from: {last_update} UTC
═══════════════════════════════════════════════════════════
```
