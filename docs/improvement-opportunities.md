# Trading Strategy Improvement Opportunities

Based on analysis of 7 trades (1W/6L) from 2026-01-12 to 2026-02-10.

## Context

- **Strategy**: Aggressive, 15m interval, ATR-based SL/TP
- **Fee tier**: Intro 1 (0.6% maker / 1.2% taker)
- **Capital**: ~31 EUR
- **Key pattern**: 3 consecutive bracket SL whipsaws (BTC, LTC, ALGO) where price recovered after stop-loss fill

---

## A. Wider Bracket SL as Catastrophic Stop

**Problem**: Attached bracket SL at `ATR% x 1.5` (typically 2.5-3%) is too tight for overnight holds. Normal volatility wicks sweep the level and Coinbase executes the bracket instantly — no time filter, no close-below confirmation. All 3 recent whipsaws would have recovered if the SL had been wider.

**Proposed Change**: Set attached bracket SL wider (e.g., `ATR% x 2.5` or fixed 5-6%) as a catastrophic safety net. The bot manages a tighter "soft SL" during active monitoring via `wait_for_event`. When the bot sleeps (overnight), only the wide bracket protects.

**Trade-off**: Larger max loss per trade (5-6% vs 2.5-3%), but fewer whipsaws. Two of the three whipsawed trades would have recovered to profit or breakeven.

**Impact**: High

---

## B. Market Regime Filter

**Problem**: Entering during an active selloff (multiple pairs down 2-5% in 24h) is catching a falling knife. Both LTC and ALGO were entered on a Sunday night while the broad market was already selling off — the 15m oversold bounce was just a pause before the next leg down.

**Proposed Change**: Before entering, check median 24h change across top pairs. If median < -2%, classify as "active selloff" and either:
- Skip entries entirely, or
- Require stronger signal threshold (+60 instead of +40)

**Trade-off**: Misses genuine V-shaped reversal entries during selloffs, but avoids the more common scenario of entering too early.

**Impact**: High

---

## C. Time-of-Day Awareness

**Problem**: Entries at 23:00 UTC Sunday = low liquidity, wider spreads, overnight risk with no active bot monitoring. Positions opened late at night sit for hours with only the static bracket as protection.

**Proposed Change**: If outside peak hours (roughly 08:00-22:00 UTC), either avoid new entries or require higher conviction (+60 signal threshold). Existing positions can still be managed.

**Trade-off**: Reduces available trading hours. May miss overnight opportunities in fast-moving markets.

**Impact**: Medium

---

## D. Higher Entry Threshold in Bearish Conditions

**Problem**: Both overnight losses scored 50 (technical) with medium confidence — the minimum viable signal. Medium-confidence entries in a bearish market regime produce mostly losses. The win rate (14%) is far below the required breakeven rate (37.5%) for the current R:R ratio.

**Proposed Change**: Raise minimum signal from +40 to +55 or +60 when:
- F&G index < 20 (fear/extreme fear)
- Majority of pairs are in SELL/STRONG_SELL territory
- Higher timeframes are bearish

**Trade-off**: Fewer trades overall. In strong bear markets, may go days without entries.

**Impact**: Medium

---

## E. Fee-Aware Minimum Take-Profit

**Problem**: At 2.4% round-trip fees (market buy + bracket SL fill), a 2.5% TP floor barely breaks even. The one winning trade (AAVE, +3.58% gross) netted only +1.19% after fees. Fees account for 62% of all losses across the session.

**Proposed Change**: Set minimum TP to at least `round_trip_fees x 3` (~7.2% at current tier). Only enter trades with enough expected upside to produce meaningful profit after fees. As volume increases and fee tiers drop, this threshold automatically tightens.

**Trade-off**: Requires larger price moves to hit TP. May hold positions longer, increasing exposure to reversals. Could be paired with trailing stop to capture partial moves.

**Impact**: Medium

---

## Summary

| Opportunity | Impact | Addresses |
|-------------|--------|-----------|
| A. Wider bracket SL | High | Whipsaw stops |
| B. Market regime filter | High | Entering during selloffs |
| C. Time-of-day awareness | Medium | Overnight risk |
| D. Higher threshold in bear | Medium | Low win rate |
| E. Fee-aware minimum TP | Medium | Fee drag |

Highest-priority changes: **A** and **B** — they directly address the two most frequent causes of losses (whipsawed stops and entering during active selloffs).
