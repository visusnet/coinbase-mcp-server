# Post-Crash Opportunity Playbook

Crashes create dislocated prices and high-conviction entry opportunities. When a major crash is detected, adapt the approach to capitalize on the recovery.

**Crash Detection:**
- `percentChange24h` < -15% on BTC or ETH → activate crash playbook
- Multiple assets down > 10% simultaneously → market-wide crash
- Check via `get_best_bid_ask` or `wait_for_market_event` with `percentChange24h` condition

**Adaptation Rules:**

1. **Anchor to 1H timeframe** — During extreme volatility, 15m indicators produce noise. Use 1H as the primary signal timeframe; 15m only for entry timing.

2. **Look for oversold bounces** — Crashes push RSI, MFI, and Stochastic into deep oversold territory. Use `wait_for_market_event` with indicator conditions to detect recoveries:
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
