# Trading State Schema

Single Source of Truth for `.claude/trading-state.json` structure.

## File Location

`.claude/trading-state.json`

## Complete Structure

```json
{
  "session": {
    "id": "2026-01-12T13:15:00Z",
    "startTime": "2026-01-12T13:15:00Z",
    "lastUpdated": "2026-01-13T14:32:00Z",
    "budget": {
      "initial": 9.50,
      "remaining": 0.11,
      "currency": "EUR",
      "source": "BTC",
      "sourceAmount": 0.0001,
      "sourcePrice": 95000
    },
    "stats": {
      "tradesOpened": 2,
      "tradesClosed": 1,
      "wins": 1,
      "losses": 0,
      "totalFeesPaid": 0.08,
      "realizedPnL": 0.25,
      "realizedPnLPercent": 5.0
    },
    "config": {
      "strategy": "aggressive",
      "interval": "15m",
      "dryRun": false
    },
    "compound": {
      "enabled": true,
      "rate": 0.50,
      "maxBudget": 10.00,
      "paused": false,
      "consecutiveWins": 0,
      "consecutiveLosses": 0,
      "totalCompounded": 0.00,
      "compoundEvents": []
    },
    "rebalancing": {
      "enabled": true,
      "stagnationHours": 12,
      "stagnationThreshold": 3.0,
      "minOpportunityDelta": 40,
      "minAlternativeScore": 50,
      "maxRebalanceLoss": -2.0,
      "cooldownHours": 4,
      "maxPerDay": 3,
      "totalRebalances": 0,
      "rebalancesToday": 0,
      "lastRebalance": null,
      "recentlyExited": [],
      "rebalanceHistory": []
    },
    "indicatorCache": {
      "BTC-EUR": {
        "15m": {
          "timestamp": "2026-01-19T10:30:00Z",
          "rsi": { "latestValue": 65, "signal": "neutral" },
          "macd": { "histogram": 120, "signal": "bullish" },
          "adx": { "adx": 28, "pdi": 25, "mdi": 18, "trend": "strong" },
          "scores": {
            "momentum": 55,
            "trend": 70,
            "volatility": 45,
            "volume": 60,
            "final": 58
          }
        }
      }
    }
  },
  "openPositions": [
    {
      "id": "pos_20260112_131758_SOL",
      "pair": "SOL-EUR",
      "side": "long",
      "size": "0.04",
      "entry": {
        "price": 119.34,
        "time": "2026-01-12T13:17:58Z",
        "orderType": "market",
        "fee": 0.03,
        "route": "indirect",
        "spread": 0.15,
        "liquidityStatus": "good"
      },
      "analysis": {
        "signalStrength": 65,
        "technicalScore": 58,
        "sentiment": "bullish",
        "reason": "MACD Golden Cross + RSI oversold (28)",
        "confidence": "medium"
      },
      "riskManagement": {
        "entryATR": 9.55,
        "dynamicSL": 101.44,
        "dynamicTP": 142.13,
        "trailingStop": {
          "active": false,
          "currentStopPrice": null,
          "highestPrice": 119.34
        }
      },
      "performance": {
        "currentPrice": null,
        "unrealizedPnL": null,
        "unrealizedPnLPercent": null,
        "peakPnLPercent": 0,
        "holdingTimeHours": null
      },
      "rebalancing": {
        "eligible": true,
        "stagnantSince": null,
        "bestAlternative": null,
        "rebalanceCount": 0
      }
    }
  ],
  "tradeHistory": [
    {
      "id": "trade_20260112_120000_BTC",
      "pair": "BTC-EUR",
      "side": "long",
      "size": "0.0001",
      "entry": {
        "price": 95000,
        "time": "2026-01-12T12:00:00Z",
        "orderType": "limit",
        "fee": 0.04,
        "route": "direct"
      },
      "exit": {
        "price": 97500,
        "time": "2026-01-12T13:15:00Z",
        "orderType": "limit",
        "fee": 0.04,
        "trigger": "takeProfit",
        "reason": "Dynamic TP hit at +2.6%"
      },
      "analysis": {
        "signalStrength": 72,
        "reason": "Strong uptrend + RSI divergence"
      },
      "result": {
        "grossPnL": 0.25,
        "netPnL": 0.17,
        "netPnLPercent": 1.8,
        "peakPnLPercent": 3.2,
        "totalFees": 0.08,
        "holdingTimeHours": 1.25
      }
    }
  ]
}
```

## Session Object Fields

| Field | Type | Purpose |
|-------|------|---------|
| `session.id` | string | Unique session identifier (= startTime) |
| `session.startTime` | string | ISO 8601 timestamp |
| `session.lastUpdated` | string | ISO 8601, last state change |
| `session.budget.initial` | number | Starting budget in EUR (converted if needed) |
| `session.budget.remaining` | number | Available budget in EUR |
| `session.budget.currency` | string | Always "EUR" (accounting currency) |
| `session.budget.source` | string | Funding source ("EUR", "BTC", etc.) |
| `session.budget.sourceAmount` | number? | Original amount if non-EUR source (e.g., 0.0001 BTC) |
| `session.budget.sourcePrice` | number? | Conversion rate if non-EUR source (e.g., 95000 EUR/BTC) |
| `session.stats.tradesOpened` | number | Total entries |
| `session.stats.tradesClosed` | number | Total exits |
| `session.stats.wins` | number | Profitable closes |
| `session.stats.losses` | number | Losing closes |
| `session.stats.totalFeesPaid` | number | Cumulative fees (EUR) |
| `session.stats.realizedPnL` | number | Realized P/L (EUR) |
| `session.stats.realizedPnLPercent` | number | Realized P/L (%) |
| `session.config.strategy` | string | "aggressive" / "conservative" |
| `session.config.interval` | string | "5m" / "15m" / "1h" |
| `session.config.dryRun` | boolean | Dry-run mode active |
| `session.compound.enabled` | boolean | Is compound mode active (default: true) |
| `session.compound.rate` | number | Reinvestment rate (0.0-1.0, default: 0.50) |
| `session.compound.maxBudget` | number | Budget cap (default: 2× initial) |
| `session.compound.paused` | boolean | Is compound paused due to losses (default: false) |
| `session.compound.consecutiveWins` | number | Current consecutive win streak |
| `session.compound.consecutiveLosses` | number | Current consecutive loss streak |
| `session.compound.totalCompounded` | number | Total amount reinvested (EUR) |
| `session.compound.compoundEvents` | array | History of compound actions |
| `session.rebalancing.enabled` | boolean | Is rebalancing active (default: true) |
| `session.rebalancing.stagnationHours` | number | Hours to consider position stagnant (default: 12) |
| `session.rebalancing.stagnationThreshold` | number | Max % move to be stagnant (default: 3.0) |
| `session.rebalancing.minOpportunityDelta` | number | Min score delta to trigger (default: 40) |
| `session.rebalancing.minAlternativeScore` | number | Min alternative score (default: 50) |
| `session.rebalancing.maxRebalanceLoss` | number | Max loss to allow rebalance (default: -2.0) |
| `session.rebalancing.cooldownHours` | number | Hours between rebalances (default: 4) |
| `session.rebalancing.maxPerDay` | number | Max daily rebalances (default: 3) |
| `session.rebalancing.totalRebalances` | number | Total rebalances this session |
| `session.rebalancing.rebalancesToday` | number | Rebalances today |
| `session.rebalancing.lastRebalance` | string | ISO 8601, last rebalance time |
| `session.rebalancing.recentlyExited` | array | Pairs exited in last 24h (no flip-back) |
| `session.rebalancing.rebalanceHistory` | array | History of rebalance events |
| `session.indicatorCache` | object | Cached indicator results by pair and timeframe |
| `session.indicatorCache[pair][timeframe].timestamp` | string | ISO 8601, when cache was updated |
| `session.indicatorCache[pair][timeframe].rsi` | object | RSI indicator result |
| `session.indicatorCache[pair][timeframe].macd` | object | MACD indicator result |
| `session.indicatorCache[pair][timeframe].adx` | object | ADX indicator result |
| `session.indicatorCache[pair][timeframe].scores` | object | Category scores (momentum, trend, etc.) |

## Open Position Object Fields

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique ID: `pos_{date}_{time}_{coin}` |
| `pair` | string | Trading pair, e.g. "SOL-EUR" |
| `side` | enum | "long" (future: "short") |
| `size` | string | Position size |
| `entry.price` | number | Entry price (EUR) |
| `entry.time` | string | ISO 8601 timestamp |
| `entry.orderType` | enum | "limit" / "market" |
| `entry.fee` | number | Entry fee (EUR) |
| `entry.route` | enum | "direct" / "indirect" |
| `entry.spread` | number | Spread at entry (%) |
| `entry.liquidityStatus` | enum | "good" / "moderate" |
| `analysis.signalStrength` | number | Final score (0-100) |
| `analysis.technicalScore` | number | Technical score (0-100) |
| `analysis.sentiment` | enum | "bullish" / "neutral" / "bearish" |
| `analysis.reason` | string | Top indicators |
| `analysis.confidence` | enum | "high" / "medium" / "low" |
| `riskManagement.entryATR` | number | ATR at entry |
| `riskManagement.dynamicSL` | number | ATR-based stop-loss price (EUR) |
| `riskManagement.dynamicTP` | number | ATR-based take-profit price (EUR) |
| `riskManagement.trailingStop.active` | boolean | Is trailing active? |
| `riskManagement.trailingStop.currentStopPrice` | number | Current trail |
| `riskManagement.trailingStop.highestPrice` | number | Peak price |
| `performance.currentPrice` | number | Latest price |
| `performance.unrealizedPnL` | number | Current P/L (EUR) |
| `performance.unrealizedPnLPercent` | number | Current P/L (%) |
| `performance.peakPnLPercent` | number | Best P/L achieved |
| `performance.holdingTimeHours` | number | Hours since entry |
| `rebalancing.eligible` | boolean | Is position eligible for rebalancing |
| `rebalancing.stagnantSince` | string | ISO 8601, when stagnation began |
| `rebalancing.bestAlternative` | object | Current best alternative {pair, score, delta} |
| `rebalancing.rebalanceCount` | number | Times this position was rebalanced into |

## Trade History Object Fields

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique ID: `trade_{date}_{time}_{coin}` |
| `pair` | string | Trading pair |
| `side` | enum | "long" |
| `size` | string | Position size |
| `entry.*` | object | Same as openPositions |
| `exit.price` | number | Exit price (EUR) |
| `exit.time` | string | ISO 8601 timestamp |
| `exit.orderType` | enum | "limit" / "market" |
| `exit.fee` | number | Exit fee (EUR) |
| `exit.trigger` | enum | "stopLoss" / "takeProfit" / "trailingStop" / "manual" |
| `exit.reason` | string | Human-readable reason |
| `analysis.*` | object | Same as openPositions |
| `result.grossPnL` | number | P/L before fees (EUR) |
| `result.netPnL` | number | P/L after fees (EUR) |
| `result.netPnLPercent` | number | Net P/L (%) |
| `result.peakPnLPercent` | number | Best P/L before exit |
| `result.totalFees` | number | Entry + exit fees |
| `result.holdingTimeHours` | number | Total hold duration |

## Rebalancing History Entry Fields

Each entry in `session.rebalancing.rebalanceHistory[]` has the following structure:

| Field | Type | Purpose |
|-------|------|---------|
| `timestamp` | string | ISO 8601, when rebalancing occurred |
| `from` | string | Source trading pair (e.g., "BTC-EUR") |
| `to` | string | Destination trading pair (e.g., "ETH-EUR") |
| `reason` | enum | Trigger reason (see Rebalancing Reason Enum below) |
| `exitPrice` | number | Exit price for source position (EUR) |
| `entryPrice` | number | Entry price for destination position (EUR) |
| `holdingTimeHours` | number | How long source position was held |
| `grossPnL` | number | P/L before fees (EUR) |
| `exitFee` | number | Fee for exiting source position (EUR) |
| `entryFee` | number | Fee for entering destination position (EUR) |
| `netPnL` | number | P/L after all fees (EUR) |
| `signalDelta` | number | Score difference (destination - source) |
| `sourceScore` | number | Signal score of exited position (0-100) |
| `destinationScore` | number | Signal score of new position (0-100) |
| `stagnationHours` | number | Hours source was stagnant (null if not stagnant) |

**Example Entry**:

```json
{
  "timestamp": "2026-01-12T15:30:00Z",
  "from": "SOL-EUR",
  "to": "AVAX-EUR",
  "reason": "stagnant",
  "exitPrice": 121.50,
  "entryPrice": 38.20,
  "holdingTimeHours": 18.5,
  "grossPnL": 1.20,
  "exitFee": 0.04,
  "entryFee": 0.04,
  "netPnL": 1.12,
  "signalDelta": 53,
  "sourceScore": 25,
  "destinationScore": 78,
  "stagnationHours": 18.5
}
```

## Enums

- `entry.orderType`: "limit" | "market"
- `entry.route`: "direct" | "indirect"
- `entry.liquidityStatus`: "good" | "moderate" | "skipped"
- `analysis.confidence`: "high" | "medium" | "low"
- `analysis.sentiment`: "bullish" | "neutral" | "bearish"
- `exit.trigger`: "stopLoss" | "takeProfit" | "trailingStop" | "rebalance" | "manual"
- `rebalancingHistory[].reason`: "stagnant" | "urgent_delta" | "profitable_delta"
  - `stagnant`: Position stagnant >12h with <3% movement, alternative delta >40
  - `urgent_delta`: Alternative delta >60, regardless of stagnation
  - `profitable_delta`: Position stagnant, profitable (>0%), alternative delta >30

## State Validation Rules

The following validation rules MUST be enforced to maintain state consistency, especially during session resume and edge cases:

### Position Performance Validation

```
VALIDATE on every position update:
  position.performance.peakPnLPercent >= position.performance.unrealizedPnLPercent

IF violation detected:
  Log warning: "Peak PnL inconsistency detected for {pair}"
  position.performance.peakPnLPercent = position.performance.unrealizedPnLPercent
  REASON: Peak can never be lower than current, reset to current value
```

### Session Resume Timestamp Validation

```
VALIDATE on session resume (not fresh start):
  current_time = now()
  time_since_last_update = current_time - session.lastUpdated

  // Cooldown validation
  IF session.rebalancing.lastRebalance != null:
    hours_since_rebalance = (current_time - session.rebalancing.lastRebalance) / 3600

    IF hours_since_rebalance > 24:
      // More than 1 day passed, reset cooldown and daily counter
      session.rebalancing.rebalancesToday = 0
      Log: "Session resume: Rebalancing cooldown reset (24h+ elapsed)"

    IF hours_since_rebalance > session.rebalancing.cooldownHours:
      Log: "Session resume: Cooldown period expired ({hours_since_rebalance}h elapsed)"

  // Stagnation timer validation
  FOR EACH position IN openPositions:
    IF position.rebalancing.stagnantSince != null:
      hours_stagnant = (current_time - position.rebalancing.stagnantSince) / 3600

      IF hours_stagnant > 48:
        Log warning: "{pair} stagnant for {hours_stagnant}h (resume detected)"
        // Stagnation counter preserved, will be handled by rebalancing logic
```

### Compound State on Manual Actions

```
RULE: Manual exits do NOT reset compound streaks

ON position closed with trigger = "manual":
  // Preserve compound state
  session.compound.consecutiveWins = unchanged
  session.compound.consecutiveLosses = unchanged
  session.compound.paused = unchanged

  Log: "Manual exit: Compound state preserved (streaks: {wins}W/{losses}L)"
  REASON: Manual interventions bypass strategy, should not affect automated compound logic

EXCEPTION: Manual session termination
ON session manually stopped:
  // Reset compound state for next session
  session.compound.consecutiveWins = 0
  session.compound.consecutiveLosses = 0
  session.compound.paused = false
  Log: "Session terminated: Compound state reset for next session"
```

### Budget Consistency Validation

```
VALIDATE after every trade:
  calculated_remaining = session.budget.initial
                       + session.stats.realizedPnL
                       - session.stats.totalFeesPaid
                       - SUM(openPositions[].entry.price × openPositions[].size + openPositions[].entry.fee)

  difference = ABS(calculated_remaining - session.budget.remaining)

  IF difference > 0.01:  // Tolerance for rounding
    Log error: "Budget inconsistency detected: {difference}€ mismatch"
    Log detail: "Expected: {calculated_remaining}€, Actual: {session.budget.remaining}€"
    // DO NOT auto-correct, flag for investigation
    ALERT: Manual review required
```

### Division by Zero Protection

```
VALIDATE before all division operations:

// Spread calculation
IF best_bid <= 0 OR best_ask <= 0 OR mid_price <= 0:
  Log error: "Invalid price data for spread: bid={best_bid}, ask={best_ask}"
  SKIP liquidity check
  result = "price_data_invalid"

// ATR-based calculations
IF entry_atr <= 0:
  Log error: "Invalid ATR value: {entry_atr}"
  FALLBACK to percentage-based SL/TP (2%/3% from strategies.md)

// PnL calculations
IF entry_price <= 0:
  Log error: "Invalid entry price: {entry_price}"
  SKIP trade (critical error)
```

## Operations

### Initialize Session

```
session.id = current timestamp
session.startTime = current timestamp
session.lastUpdated = current timestamp

// Budget initialization with non-EUR source handling
budget_amount = parsed from arguments (e.g., "10 EUR" or "0.0001 BTC")
source_currency = parsed from arguments (e.g., "EUR", "BTC")

IF source_currency != "EUR":
  // Convert non-EUR funding source to EUR at session start
  source_balance = budget_amount  // e.g., 0.0001 BTC
  current_price = get current EUR price for source (e.g., BTC-EUR = 95000)
  eur_equivalent = source_balance × current_price  // 0.0001 × 95000 = 9.50 EUR

  session.budget.initial = eur_equivalent
  session.budget.remaining = eur_equivalent
  session.budget.currency = "EUR"  // All accounting in EUR
  session.budget.source = source_currency  // Track original source
  session.budget.sourceAmount = source_balance  // Track original amount
  session.budget.sourcePrice = current_price  // Track conversion rate

  Log: "Budget: {eur_equivalent}€ (from {source_balance} {source_currency} @ {current_price}€)"
ELSE:
  // EUR source: direct assignment
  session.budget.initial = budget_amount
  session.budget.remaining = budget_amount
  session.budget.currency = "EUR"
  session.budget.source = "EUR"

session.stats.* = all 0
session.config.strategy = "aggressive" (default)
session.config.interval = parsed or "15m"
session.config.dryRun = true if "dry-run" in arguments
openPositions = []
tradeHistory = [] (or keep existing)
```

**Note**: All budget tracking is in EUR regardless of source. Non-EUR sources are
converted to EUR at session start and tracked in sourceAmount/sourcePrice fields.

### Open Position

```
id = "pos_{YYYYMMDD}_{HHMMSS}_{COIN}"
pair = trading pair
side = "long"
size = calculated position size

entry.price = execution price
entry.time = current timestamp
entry.orderType = "limit" or "market"
entry.fee = fee from order response
entry.route = "direct" or "indirect"
entry.spread = calculated spread
entry.liquidityStatus = "good" or "moderate"

analysis.signalStrength = final score (0-100)
analysis.technicalScore = technical score
analysis.sentiment = "bullish" / "neutral" / "bearish"
analysis.reason = "MACD Golden Cross + RSI < 30"
analysis.confidence = "high" (>70) / "medium" (40-70) / "low" (<40)

riskManagement.entryATR = ATR(14) at entry
riskManagement.dynamicSL = calculated SL price (ATR-based)
riskManagement.dynamicTP = calculated TP price (ATR-based)
riskManagement.trailingStop.active = false
riskManagement.trailingStop.currentStopPrice = null
riskManagement.trailingStop.highestPrice = entry price

performance.* = null (updated each cycle)

session.stats.tradesOpened += 1
session.budget.remaining -= (size × price + fee)
session.lastUpdated = current timestamp
```

### Update Position (Each Cycle)

```
performance.currentPrice = best_bid from API
performance.unrealizedPnL = (current - entry) × size
performance.unrealizedPnLPercent = (current - entry) / entry × 100
performance.holdingTimeHours = hours since entry.time

IF unrealizedPnLPercent > peakPnLPercent:
  performance.peakPnLPercent = unrealizedPnLPercent

IF currentPrice > trailingStop.highestPrice:
  trailingStop.highestPrice = currentPrice

IF unrealizedPnLPercent >= 3.0:
  trailingStop.active = true
  trailingStop.currentStopPrice = highestPrice × 0.985

session.lastUpdated = current timestamp
```

### Close Position

```
historyEntry = {
  id: position.id.replace("pos_", "trade_"),
  pair, side, size, entry, analysis: from position,
  exit: {
    price: execution price,
    time: current timestamp,
    orderType: "limit" or "market",
    fee: fee from response,
    trigger: "stopLoss" | "takeProfit" | "trailingStop" | "manual",
    reason: "Dynamic TP hit at +X%"
  },
  result: {
    grossPnL: (exit.price - entry.price) × size,
    netPnL: grossPnL - entry.fee - exit.fee,
    netPnLPercent: netPnL / (entry.price × size) × 100,
    peakPnLPercent: performance.peakPnLPercent,
    totalFees: entry.fee + exit.fee,
    holdingTimeHours: performance.holdingTimeHours
  }
}

IF result.netPnL > 0: session.stats.wins += 1
ELSE: session.stats.losses += 1

session.stats.tradesClosed += 1
session.stats.totalFeesPaid += result.totalFees
session.stats.realizedPnL += result.netPnL
session.stats.realizedPnLPercent = realizedPnL / budget.initial × 100
session.budget.remaining += (exit.price × size - exit.fee)

tradeHistory.push(historyEntry)
openPositions.remove(position)
session.lastUpdated = current timestamp
```
