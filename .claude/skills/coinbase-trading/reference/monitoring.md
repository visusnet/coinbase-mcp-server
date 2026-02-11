# Examples for Event-Driven Monitoring

**Example: Event-Driven Monitoring (position with attached bracket)**

```
// After analysis, with BTC position open (has attached TP/SL bracket on Coinbase)
// Entry @ 95,000€, ATR(14) ≈ 2.7%
// Bracket: SL @ 87,300€ (8% wide, on Coinbase), TP @ 107,800€ (13.5% wide, on Coinbase)
// Soft: SL @ 91,150€ (4.05% = ATR% × 1.5), TP @ 101,400€ (6.75% = ATR% × 2.5)
// Monitor for soft SL/TP + trailing stop activation

response = wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "lte", value: 91150 },   // Soft SL (4.05% = ATR% × 1.5)
      { field: "price", operator: "gte", value: 97850 }    // Trailing stop activation (3% profit)
    ]
  }],
  timeout: 55
})

IF response.status == "triggered":
  IF price <= 91150:
    → Execute soft stop-loss (market order)
  ELSE:
    → Activate trailing stop logic
ELSE:
  → Perform normal analysis cycle (strategy re-eval, recalc SL/TP if >24h)
```

**Example: Event-Driven SL/TP Monitoring (position without bracket)**

```
// Stop-limit fill or legacy position — no attached bracket, bot manages SL/TP
// Entry @ 95,000€, SL @ 91,200€, TP @ 98,800€

response = wait_for_market_event({
  subscriptions: [{
    productId: "BTC-EUR",
    conditions: [
      { field: "price", operator: "lte", value: 91200 },  // SL
      { field: "price", operator: "gte", value: 98800 }   // TP
    ],
    logic: "any"
  }],
  timeout: 55
})

IF response.status == "triggered":
  IF response.triggeredConditions[0].operator == "lte":
    → Execute STOP-LOSS (Market Order)
  ELSE:
    → Execute TAKE-PROFIT (Limit Order)
ELSE:
  → Perform normal analysis cycle
```

**Benefits of Event-Driven Monitoring:**

| Aspect | Sleep-Polling (15min) | Event-Driven |
|--------|----------------------|--------------|
| SL/TP Detection | Up to 15 minutes late | Within seconds |
| Token Usage | Higher (frequent analysis) | Lower (waits for events) |
| API Calls | Every interval | Only on triggers |
| Reaction Time | Interval-dependent | Near-instant |
