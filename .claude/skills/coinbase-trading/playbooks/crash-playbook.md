# Post-Crash Opportunity Playbook

Crashes create dislocated prices and high-conviction entry opportunities. When a major crash is detected, adapt the approach to capitalize on the recovery.

**Crash Detection:**
- `percentChange24h` < -15% on BTC or ETH → activate crash playbook
- Multiple assets down > 10% simultaneously → market-wide crash
- Check via `get_best_bid_ask` or `wait_for_event` with `percentChange24h` condition

**Adaptation Rules:**

1. **Anchor to 1H timeframe** — During extreme volatility, 15m indicators produce noise. Use 1H as the primary signal timeframe; 15m only for entry timing.

2. **Look for oversold bounces** — Crashes push RSI, MFI, and Stochastic into deep oversold territory. Use `wait_for_event` with indicator conditions to detect recoveries:
   ```
   conditions: [
     { field: "rsi", operator: "crossAbove", value: 30, granularity: "ONE_HOUR" },
     { field: "macd.histogram", operator: "crossAbove", value: 0, granularity: "ONE_HOUR" }
   ],
   logic: "any"
   ```

3. **Confirm the bounce** — Don't buy the first green candle. Wait for:
   - Price reclaims VWAP (bullish bias confirmed)
   - 1H MACD histogram turns positive
   - Volume increases on the bounce (not just low-volume relief)

4. **Use stop-limit entries** — Set stop-limit buy orders above consolidation resistance. Let the market prove the breakout before entering.

5. **Reduce position sizes** — Use 50% of normal sizing. ATR will be elevated, so ATR-based sizing already adjusts, but add an extra reduction because post-crash reversals are common.

6. **Tighten stops** — Use 1× ATR instead of 1.5× ATR for stop-loss. Post-crash environments are unpredictable; cut losses faster.

7. **Take partial profits early** — Consider taking 50% at 1.5× ATR and letting the rest ride with a trailing stop. Post-crash bounces can be sharp but short-lived.

**What NOT to do:**
- Don't try to catch the exact bottom — wait for confirmation
- Don't use 100% of available capital on first entry — scale in
- Don't ignore higher timeframe trend — if daily is still bearish, the bounce may fail

---

## Recovery Phase (Post-Capitulation)

After crash stabilizes and first recovery signals appear, the bot transitions to POST_CAPITULATION regime (see SKILL.md Step 6).

**Key recovery rules:**

1. **Entry windows are short-lived** — STRONG_BUY signals last 1-2 cycles before stochastic normalizes. Price continues rising. Act on first +33 BUY after capitulation.

2. **6H overbought = recovery, not exhaustion** — After a crash, 6H RSI/stoch being overbought means prices recovering from extreme lows. POST_CAPITULATION skips 6H filter entirely.

3. **STRONG_SELL cluster was the buy signal** — 3+ pairs at -50 simultaneously with volume spikes = capitulation bottom. First pair flipping to BUY (+33) within 1-3 cycles = entry candidate.

4. **Don't wait for ADX > 20** — Bottoms = trend exhaustion = low ADX (10-14). Check ADX direction (rising) + (+DI > -DI) instead.

5. **Volume 3x+ confirms capitulation** — Forced liquidation selling, not organic decline.

**POST_CAPITULATION expires** after 72h or when F&G > 40. Falls back to BEAR, not NORMAL.

**Precedence**: Once POST_CAPITULATION is active, the `post_capitulation_scalp` strategy parameters (4.5% TP, 2.5% SL fixed, defined in phase-enter.md and strategies.md) supersede the general crash playbook rules above (1x ATR stops, 50% sizing). The crash playbook's initial response rules apply only during crash detection, before POST_CAPITULATION is confirmed in Step 6.

**What NOT to do during recovery:**
- Don't apply 6H MTF filter (structurally unfillable for months after major crash)
- Don't require ADX > 20 (bottoms have low ADX by definition)
- Don't dismiss fading STRONG_BUY signals (they're short-lived entry windows, not traps)
- Don't read STRONG_SELL cluster as "bear deepening" (it's capitulation = bottom)
