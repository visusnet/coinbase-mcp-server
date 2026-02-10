# wait_for_market_event Usage Guide

Examples, condition fields, operators, and best practices for `wait_for_market_event`.

---

**Soft Stop-Loss / Take-Profit Monitoring (Dual-Layer):**

```
// Monitor the soft (inner) layer — bracket (outer) is on Coinbase
// Soft SL is tighter than bracket SL — bot exits first under normal operation
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "lte", value: softStopLossPrice },   // Soft SL (bot-managed)
      { field: "price", operator: "gte", value: softTakeProfitPrice }  // Soft TP (bot-managed)
    ],
    logic: "any"
  }],
  timeout: 55
})
// Note: bracket SL/TP is wider and handled by Coinbase independently
// The bracket only fires if the bot doesn't act on the soft SL/TP first
```

**Trailing Stop Monitoring:**

```
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "lte", value: trailingStopPrice }
    ]
  }],
  timeout: 55
})
```

**Entry Signal Waiting (Buy the Dip):**

```
wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "crossBelow", value: 60000 },
      { field: "percentChange24h", operator: "lt", value: -5 }
    ],
    logic: "any"
  }],
  timeout: 55
})
```

**Available Condition Fields:**

Ticker fields (real-time via WebSocket):
- `price` - Current price
- `volume24h` - 24-hour volume
- `percentChange24h` - 24-hour percent change
- `high24h` / `low24h` - 24-hour high/low
- `high52w` / `low52w` - 52-week high/low
- `bestBid` / `bestAsk` - Current best bid/ask
- `bestBidQuantity` / `bestAskQuantity` - Order book depth

Indicator fields (computed from candles, updated per candle interval):
- `rsi` - RSI value (optional: `period`, `granularity`)
- `macd` - MACD line (optional: `fastPeriod`, `slowPeriod`, `signalPeriod`, `granularity`)
- `macd.histogram` - MACD histogram
- `macd.signal` - MACD signal line
- `bollingerBands` / `.upper` / `.lower` / `.bandwidth` / `.percentB` (optional: `period`, `stdDev`, `granularity`)
- `sma` - SMA value (required: `period`, optional: `granularity`)
- `ema` - EMA value (required: `period`, optional: `granularity`)
- `stochastic` - Stochastic %K (optional: `kPeriod`, `dPeriod`, `granularity`)
- `stochastic.d` - Stochastic %D signal line

**Available Operators** (all fields):
- `gt`, `gte`, `lt`, `lte` - Standard comparisons
- `crossAbove` - Crosses threshold upward (requires previous value below)
- `crossBelow` - Crosses threshold downward (requires previous value above)

**Indicator Condition Examples:**

```
// Wait for RSI oversold recovery on 15m candles
{ field: "rsi", operator: "crossAbove", value: 30, granularity: "FIFTEEN_MINUTE" }

// Wait for MACD bullish crossover (histogram turns positive) on 1H
{ field: "macd.histogram", operator: "crossAbove", value: 0, granularity: "ONE_HOUR" }

// Wait for price to break above EMA(50) on 15m
{ field: "ema", period: 50, operator: "crossAbove", value: 59000, granularity: "FIFTEEN_MINUTE" }

// Combined: SL price OR RSI oversold recovery
conditions: [
  { field: "price", operator: "lte", value: 57500 },
  { field: "rsi", operator: "crossAbove", value: 30, granularity: "FIFTEEN_MINUTE" }
],
logic: "any"
```

Indicator conditions default to `FIVE_MINUTE` granularity if not specified.

**Best Practices:**

1. **Minimum condition distance**: Price conditions must be > 1% from current price (or > 0.5× ATR).

<reasoning>
Tighter conditions trigger on normal volatility noise, flooding the bot with false positives. During the BTC crash session, VWAP-based conditions with ~50 EUR thresholds caused the observer to trigger on every tiny oscillation.
</reasoning>

2. **Timeout tiers**:
   - **55s** — Active SL/TP monitoring (open positions, need fast reaction)
   - **120s** — Passive entry monitoring (waiting for a breakout or dip)
   - **240s** — Low-activity periods (no positions, no strong signals, just watching)

<reasoning>
Shorter timeouts mean more frequent analysis cycles (more API calls, more context usage). Longer timeouts risk slower reaction to price moves. Match the timeout to urgency: positions at risk need 55s, speculative waiting can afford 240s.

A `status: "timeout"` response does NOT guarantee that conditions are false. It means the tool did not receive matching data from Coinbase within the timeout window — but WebSocket packets can be lost and REST API calls can temporarily fail. If you urgently wait for something (e.g., SL/TP), verify the current state yourself after a timeout by calling `get_best_bid_ask` or the relevant indicator tool.

For very low-activity periods you may want to wait longer than 240s, but that's the technical maximum. Simply restart with the same conditions.
</reasoning>

3. **Prefer `crossAbove`/`crossBelow` for entry signals**: Use `crossAbove`/`crossBelow` instead of `gt`/`lt` when monitoring for entries or indicator transitions.

<reasoning>
`gt`/`lt` fire on every tick while the condition holds — if RSI is above 70, `gt` triggers repeatedly every time the ticker updates. `crossAbove`/`crossBelow` fire once when the value transitions through the threshold, which is what you actually want for signals like RSI oversold recovery or MACD crossover. Use `gt`/`lt` only for hard boundaries (SL/TP price levels) where you care about the current state, not the transition.
</reasoning>

4. **Keep conditions simple**: Max 5 conditions per subscription, max 10 subscriptions per call.

<reasoning>
More conditions means more potential triggers and harder-to-debug behavior. If the bot needs complex multi-indicator logic (e.g., "RSI > 30 AND MACD positive AND price above EMA50"), do that in the analysis cycle where you can log and reason about each factor. Use `wait_for_market_event` for simple trip-wires, not for replicating the full analysis pipeline.
</reasoning>
