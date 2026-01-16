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

## Enums

- `entry.orderType`: "limit" | "market"
- `entry.route`: "direct" | "indirect"
- `entry.liquidityStatus`: "good" | "moderate" | "skipped"
- `analysis.confidence`: "high" | "medium" | "low"
- `analysis.sentiment`: "bullish" | "neutral" | "bearish"
- `exit.trigger`: "stopLoss" | "takeProfit" | "trailingStop" | "rebalance" | "manual"

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
