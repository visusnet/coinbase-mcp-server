# Phase 5: Retrospective & Adaptation (Steps 17-19)

After reporting, perform a deep retrospective to learn from recent market behavior and refine future decisions. This runs every cycle — the learning loop is as important as the trade itself.

Read analysis/retrospective.md before starting to build on prior insights.

## 17. Review

- Read analysis/retrospective.md (Current Beliefs + recent log entries)
- Review the last cycle's trades, skipped signals, and price movements using MCP tools (candles, trades, indicators)
- Compare what happened vs. what was expected — identify:
  - False signals (entered but shouldn't have)
  - Missed opportunities (skipped but should have entered)
  - SL/TP calibration (stopped out too early or left profit on table)
  - Indicator reliability (which indicators were predictive vs. noisy)

## 18. Adapt

Based on findings, formulate specific parameter hints for future cycles:

- **Asset-specific**: e.g., "DOGE: require RSI < 25 (not 30), skip if 24h volume < $500M — prone to false breakouts in low volume"
- **Indicator tuning**: e.g., "EMA crossovers on 1H unreliable for ALTs under $1B mcap — use 4H minimum"
- **SL/TP adjustments**: e.g., "BTC soft SL too tight at ATR×1.5 during high-volatility regimes — use ATR×2.0 when ATR% > 4%"
- **Pattern recognition**: e.g., "Three consecutive no-action cycles followed by a breakout — consider lowering entry threshold after prolonged consolidation"

These are not hard rules — they are learned heuristics that inform judgment. Override them when current data contradicts them.

## 19. Document

Update analysis/retrospective.md with two sections:

**Current Beliefs** (top of file, max 30 lines): A living summary of active parameter hints and market observations. Update every cycle — replace outdated beliefs, strengthen confirmed ones. When disproving a belief, move it to the log marked as `[DISPROVEN]` with the reason — never silently delete it.

**Log** (below, chronological, newest first): One entry per cycle with:
- Date/time and cycle number
- Key observations (1-3 bullet points)
- Any new, updated, or disproven parameter hints
- Trades taken and their outcome context

Before adding a new belief to Current Beliefs, scan the log for prior `[DISPROVEN]` entries on the same topic. If found, either justify why conditions have changed or do not re-add it.

Keep log entries concise (3-5 lines each). Prune entries older than 48 hours unless they contain `[DISPROVEN]` markers or insights still reflected in Current Beliefs.
