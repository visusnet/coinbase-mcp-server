# Skill Improvement Topics

Identified from a 5-hour autonomous trading session on 2026-02-07 (BTC crash from 93k to 51k, bounce to 58k, consolidation at 58,400-59,000).

These are gaps in `.claude/skills/coinbase-trading/` that need to be designed and added.

## 1. Session Resume Workflow

**Problem**: SKILL.md defines "Initialize Session" (fresh start) but has no "Resume Session" workflow. Every session starts with `/trade continue where you left off`, but the agent has to improvise: read state file, guess at open positions, re-derive SL/TP levels.

**What happened**: The state file wasn't updated (3 trades missing), so the agent had no idea about open positions. Even if the state file had been correct, there's no documented procedure for: validating positions against actual holdings (`list_accounts`), recalculating SL/TP if ATR has changed, checking if any SL/TP was missed while offline, or handling stale `indicatorCache`.

**What's needed**: A "Resume Session" section in SKILL.md with steps: (1) read `trading-state.json`, (2) call `list_accounts` to validate open positions still exist, (3) recalculate SL/TP with current ATR if position > 24h old, (4) check if price moved past SL/TP while offline (missed exit), (5) clear stale `indicatorCache`, (6) update `session.lastUpdated`, (7) continue to Phase 1.

**Files to change**: SKILL.md (add Resume Session section), state-schema.md (add `session.resumeCount` field).

---

## 2. Pair Screening / Selection

**Problem**: SKILL.md says "Allowed Pairs: All EUR trading pairs" but never defines HOW to choose which pairs to analyze each cycle. Today we manually picked BTC-EUR and DOGE-EUR. The skill should have a systematic screening process.

**What happened**: With 50+ EUR pairs on Coinbase, analyzing all of them every cycle is impractical (context and API cost). The agent needs a fast screening step to identify the top 5-8 candidates, then deep-analyze only those.

**What's needed**: A "Pair Screening" step at the start of Phase 1 using `analyze_technical_indicators_batch` with a lightweight indicator set (RSI, MACD, ADX, VWAP) across the top liquid EUR pairs. Rank by signal strength, deep-analyze the top 3-5. Always include pairs with open positions.

**Screening criteria**: Minimum 24h volume threshold (skip illiquid pairs), exclude pairs with spread > 0.5%, prefer pairs where the agent has historical data in `indicatorCache`.

**Files to change**: SKILL.md (add screening step to Phase 1, before step 2 "Collect Market Data").

---

## 3. Session Drawdown Limit

**Problem**: The skill has per-trade risk limits (2% max risk per trade, 10% max SL) but no per-session circuit breaker. If the bot hits a losing streak, nothing stops it from continuing to trade and depleting the budget.

**What happened**: The previous session had 1W/3L with -7.6% realized PnL. There was no mechanism to pause trading, reduce position sizes, or alert the user. The bot would have continued until the budget was exhausted.

**What's needed**: A session drawdown limit that triggers protective actions:
- **Warning** at -10% session PnL: reduce position sizes to 50%
- **Pause** at -15% session PnL: stop opening new positions, only manage existing (SL/TP)
- **Stop** at -20% session PnL: close all positions, halt session, alert user
- Reset drawdown tracking on new session start
- Track `session.stats.maxDrawdownPercent` (peak-to-trough)

**Files to change**: SKILL.md (add drawdown checks after step 7a), state-schema.md (add `session.stats.maxDrawdownPercent`, `session.stats.drawdownAction`), strategies.md (add drawdown thresholds per strategy).

---

## 4. Scaling In

**Problem**: SKILL.md only documents single-entry trades (full position at once). Today's best approach was splitting the entry: 50% at market on initial signal, 50% via stop-limit for breakout confirmation. This isn't documented.

**What happened**: We bought 0.00008349 BTC at market (59,145) and later placed a stop-limit for 0.0002 BTC at 59,200. The split entry reduced risk on the first tranche and only added the second when the breakout confirmed. The state schema doesn't support tracking multiple entries for the same pair as a single position.

**What's needed**: A "Scale-In" strategy section in SKILL.md:
- When to scale in: high-conviction setups with unclear timing (post-crash, breakout pending)
- Split: 50% at first signal, 50% on confirmation (pullback to support or breakout)
- State tracking: average entry price, multiple entry records per position
- Max scale-in entries: 2-3 per position
- Each tranche must independently meet minimum order size

**Files to change**: SKILL.md (add scale-in section), state-schema.md (change `entry` from single object to support multiple tranches with `averageEntryPrice`).

---

## 5. Sentiment Refresh Cadence

**Problem**: SKILL.md says "consider market sentiment before significant trades" and Phase 1 includes sentiment analysis, but there's no guidance on how often to refresh it during a long session. Fear & Greed index and news sentiment change throughout the day.

**What happened**: During the 5-hour session, sentiment was checked once at the start and never refreshed. The crash itself was a major sentiment event that should have triggered a re-check. News headlines about the crash could have provided valuable context (reason for crash, institutional response, etc.).

**What's needed**: Sentiment refresh rules:
- **Routine**: Re-check Fear & Greed index every 2 hours
- **Event-triggered**: Re-check after any price move > 5% in either direction
- **Pre-trade**: Always check `get_news_sentiment` before opening a new position
- **Cache**: Store last sentiment check timestamp and result in `session.indicatorCache`
- **Staleness**: If sentiment data is > 3 hours old, treat as "unknown" (don't use as signal modifier)

**Files to change**: SKILL.md (add cadence rules to sentiment analysis section), state-schema.md (add `session.sentiment.lastChecked`, `session.sentiment.fearGreedIndex`, `session.sentiment.newsResult`).

---

## 6. Event Monitoring Best Practices

**Problem**: `wait_for_market_event` is powerful but the skill doesn't document best practices for using it effectively. Today we learned painful lessons about condition configuration.

**What happened**:
- **Too-tight conditions cause noise**: Setting VWAP-based conditions with ~50 EUR thresholds caused the observer agent to trigger on every tiny oscillation, flooding the team with false alerts.
- **Timeout selection matters**: 55s is good for active SL/TP monitoring. For passive "wait for opportunity" scenarios, 120-240s reduces API calls without sacrificing reaction time.
- **Condition spacing**: SL and TP conditions should be at least 1% from current price to avoid noise triggers during normal volatility.
- **Multiple subscriptions**: Can monitor BTC-EUR and DOGE-EUR simultaneously in one call, but each subscription's conditions are OR'd independently.

**What's needed**: A "Best Practices" subsection in the Event-Driven Monitoring section:
- Minimum condition distance: price conditions should be > 1% from current price (or > 0.5x ATR)
- Timeout guidelines: 55s for active SL/TP, 120s for passive monitoring, 240s for low-activity periods
- Avoid VWAP-proximity conditions (too noisy during consolidation)
- Prefer `crossAbove`/`crossBelow` over `gt`/`lt` for entry signals (only triggers on transition, not while price is above/below)
- Combine ticker + indicator conditions for higher-quality signals
- Max 5 conditions per subscription, max 10 subscriptions per call

**Files to change**: SKILL.md (add best practices subsection after the indicator condition examples).
