# Trading State Schema

Single Source of Truth for `.claude/trading-state.json` structure.

## File Location

`.claude/trading-state.json`

## Complete Structure

```json
{
  "portfolios": {
    "defaultUuid": "abc-123-def-456",
    "hodlSafeUuid": "ghi-789-jkl-012",
    "profitProtectionRate": 50,
    "fundsAllocated": true
  },
  "session": {
    "id": "2026-01-12T13:15:00Z",
    "startTime": "2026-01-12T13:15:00Z",
    "lastUpdated": "2026-01-13T14:32:00Z",
    "cycleCount": 0,
    "stats": {
      "tradesOpened": 2,
      "tradesClosed": 1,
      "wins": 1,
      "losses": 0,
      "totalFeesPaid": 0.08,
      "realizedPnL": 0.25
    },
    "config": {
      "strategy": "aggressive",
      "interval": "15m",
      "dryRun": false,
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
      "strategy": "aggressive",
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
        "dynamicSL": 107.41,
        "dynamicTP": 143.21,
        "bracketSL": 101.00,
        "bracketTP": 148.00,
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
| `session.cycleCount` | number | Cycle counter for re-anchor protocol (starts at 0, incremented each cycle) |
| `session.stats.tradesOpened` | number | Total entries |
| `session.stats.tradesClosed` | number | Total exits |
| `session.stats.wins` | number | Profitable closes |
| `session.stats.losses` | number | Losing closes |
| `session.stats.totalFeesPaid` | number | Cumulative fees (sum in native quote currencies) |
| `session.stats.realizedPnL` | number | Realized P/L (portfolio value delta since session start) |
| `session.config.strategy` | string | Default/fallback strategy: "aggressive" / "conservative" / "scalping". Per-position strategy overrides this. |
| `session.config.interval` | string | "5m" / "15m" / "1h" |
| `session.config.dryRun` | boolean | Dry-run mode active |
| `session.rebalancing.enabled` | boolean | Is rebalancing active (default: true) |
| `session.rebalancing.stagnationHours` | number | Hours to consider position stagnant (default: 12) |
| `session.rebalancing.stagnationThreshold` | number | Max % move to be stagnant (default: 3.0) |
| `session.rebalancing.minOpportunityDelta` | number | Min score delta to trigger (default: 40) |
| `session.rebalancing.minAlternativeScore` | number | Min alternative score (default: 50) |
| `session.rebalancing.maxRebalanceLoss` | number | Max loss to allow rebalance (default: -2.0) |
| `session.rebalancing.cooldownHours` | number | Hours between rebalances (default: 4) |
| `session.rebalancing.maxPerDay` | number | Max daily rebalances (default: 3) |
| `session.rebalancing.totalRebalances` | number | Total rebalances this session |
| `session.rebalancing.lastRebalance` | string | ISO 8601, last rebalance time |
| `session.rebalancing.recentlyExited` | array | Pairs exited in last 24h (no flip-back) |
| `session.rebalancing.rebalanceHistory` | array | History of rebalance events |
| `session.indicatorCache` | object | Cached indicator results by pair and timeframe |
| `session.indicatorCache[pair][timeframe].timestamp` | string | ISO 8601, when cache was updated |
| `session.indicatorCache[pair][timeframe].rsi` | object | RSI indicator result |
| `session.indicatorCache[pair][timeframe].macd` | object | MACD indicator result |
| `session.indicatorCache[pair][timeframe].adx` | object | ADX indicator result |
| `session.indicatorCache[pair][timeframe].scores` | object | Category scores (momentum, trend, etc.) |
| `session.regime.current` | enum | "NORMAL" / "BEAR" / "POST_CAPITULATION" |
| `session.regime.detectedAt` | string/null | ISO 8601, when current regime detected |
| `session.regime.triggerEvent` | string/null | "capitulation_cluster" / "bear_confirmed" / "recovery_complete" / "session_start" |
| `session.regime.capitulationData` | object/null | Null when not POST_CAPITULATION |
| `session.regime.capitulationData.strongSellPairs` | array | Pairs that hit STRONG_SELL (-50) simultaneously |
| `session.regime.capitulationData.fearGreedAtDetection` | number | F&G at detection |
| `session.regime.capitulationData.volumeSpikePairs` | array | Pairs with 3x+ volume |
| `session.regime.capitulationData.bottomTimestamp` | string | ISO 8601, set to `detectedAt` at activation; updated to `now` if conditions worsen (deeper STRONG_SELL or lower F&G) — 72h expiry counts from this |

## Portfolios Object Fields

| Field | Type | Purpose |
|-------|------|---------|
| `portfolios.defaultUuid` | string | UUID of the Default portfolio |
| `portfolios.hodlSafeUuid` | string | UUID of the HODL Safe portfolio |
| `portfolios.profitProtectionRate` | number | Percentage of profits moved to HODL Safe (0-100) |
| `portfolios.fundsAllocated` | boolean | Whether initial fund allocation between Default and HODL Safe is complete |

## Default Portfolio Balance

Wherever "Default portfolio balance" or "available capital" is referenced:

1. Call `get_portfolio(portfolios.defaultUuid)` (one API call per cycle)
2. **Primary**: `breakdown.portfolioBalances.totalCashEquivalentBalance` = available cash
3. **Fallback**: `spotPositions[isCash==true].availableToTradeFiat` if primary is undefined
4. "Available capital" = cash only (crypto in open positions is already committed)

Discover Default UUID via `list_portfolios(portfolio_type=DEFAULT)` at session start, store as `portfolios.defaultUuid`.

## Open Position Object Fields

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique ID: `pos_{date}_{time}_{coin}` |
| `pair` | string | Trading pair, e.g. "SOL-EUR" |
| `side` | enum | "long" (future: "short") |
| `size` | string | Position size |
| `strategy` | enum | Per-position strategy: "aggressive" / "conservative" / "scalping" |
| `entry.price` | number | Entry price (in quote currency) |
| `entry.time` | string | ISO 8601 timestamp |
| `entry.orderType` | enum | "limit" / "market" |
| `entry.fee` | number | Entry fee (in quote currency) |
| `entry.route` | enum | "direct" / "indirect" / "cross-currency" |
| `entry.spread` | number | Spread at entry (%) |
| `entry.liquidityStatus` | enum | "good" / "moderate" |
| `analysis.signalStrength` | number | Final score (0-100) |
| `analysis.technicalScore` | number | Technical score (0-100) |
| `analysis.sentiment` | enum | "bullish" / "neutral" / "bearish" |
| `analysis.reason` | string | Top indicators |
| `analysis.confidence` | enum | "high" / "medium" / "low" |
| `riskManagement.entryATR` | number | ATR at entry |
| `riskManagement.dynamicSL` | number | ATR-based stop-loss price (in quote currency) |
| `riskManagement.dynamicTP` | number | ATR-based take-profit price (in quote currency) |
| `riskManagement.bracketSL` | number | Wide bracket SL price (catastrophic stop on Coinbase) |
| `riskManagement.bracketTP` | number | Wide bracket TP price (strategy-dependent, on Coinbase) |
| `riskManagement.trailingStop.active` | boolean | Is trailing active? |
| `riskManagement.trailingStop.currentStopPrice` | number | Current trail |
| `riskManagement.trailingStop.highestPrice` | number | Peak price |
| `riskManagement.bracketOrderId` | string \| null | Child bracket order ID (from parent.attachedOrderId after fill) |
| `riskManagement.hasBracket` | boolean | Whether an attached bracket (TP/SL) is active on Coinbase |
| `performance.currentPrice` | number | Latest price |
| `performance.unrealizedPnL` | number | Current P/L (in quote currency) |
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
| `exit.price` | number | Exit price (in quote currency) |
| `exit.time` | string | ISO 8601 timestamp |
| `exit.orderType` | enum | "limit" / "market" |
| `exit.fee` | number | Exit fee (in quote currency) |
| `exit.trigger` | enum | "stopLoss" / "takeProfit" / "trailingStop" / "bracketSL" / "bracketTP" / "rebalance" / "manual" |
| `exit.reason` | string | Human-readable reason |
| `analysis.*` | object | Same as openPositions |
| `result.grossPnL` | number | P/L before fees (in quote currency) |
| `result.netPnL` | number | P/L after fees (in quote currency) |
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
| `exitPrice` | number | Exit price for source position (in quote currency) |
| `entryPrice` | number | Entry price for destination position (in quote currency) |
| `holdingTimeHours` | number | How long source position was held |
| `grossPnL` | number | P/L before fees (in quote currency) |
| `exitFee` | number | Fee for exiting source position (in quote currency) |
| `entryFee` | number | Fee for entering destination position (in quote currency) |
| `netPnL` | number | P/L after all fees (in quote currency) |
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
- `exit.trigger`: "stopLoss" | "takeProfit" | "trailingStop" | "rebalance" | "bracketSL" | "bracketTP" | "manual"
- `rebalancingHistory[].reason`: "stagnant" | "urgent_delta" | "profitable_delta"
  - `stagnant`: Position stagnant >12h with <3% movement, alternative delta >40
  - `urgent_delta`: Alternative delta >60, regardless of stagnation
  - `profitable_delta`: Position stagnant, profitable (>0%), alternative delta >30
- `session.regime.current`: "NORMAL" | "BEAR" | "POST_CAPITULATION"
- `session.regime.triggerEvent`: "capitulation_cluster" | "bear_confirmed" | "recovery_complete" | "session_start"

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
session.cycleCount = 0
session.stats.* = all 0
session.config.strategy = "aggressive" (default)
session.config.interval = parsed or "15m"
session.config.dryRun = true if "dry-run" in arguments
session.regime = { current: "NORMAL", detectedAt: now, triggerEvent: "session_start", capitulationData: null }
openPositions = []
tradeHistory = [] (or keep existing)

// HODL Safe initialization is handled in session-start.md
// portfolios.* fields (defaultUuid, hodlSafeUuid, profitProtectionRate, fundsAllocated)
// are set during the Safe creation flow in session-start.md
```

**Important**: `/trade reset` preserves `portfolios.*` — only `session.*`, `openPositions`, and `tradeHistory` are reset. The HODL Safe survives a reset.

### Open Position

```
id = "pos_{YYYYMMDD}_{HHMMSS}_{COIN}"
pair = trading pair
side = "long"
strategy = determined by per-pair strategy selection (aggressive/conservative/scalping/post_capitulation_scalp)
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
riskManagement.dynamicSL = calculated soft SL price (bot-managed, ATR-based)
riskManagement.dynamicTP = calculated soft TP price (bot-managed, ATR-based)
riskManagement.bracketSL = calculated bracket SL price (wide catastrophic stop on Coinbase)
riskManagement.bracketTP = calculated bracket TP price (strategy-dependent, on Coinbase)
riskManagement.trailingStop.active = false
riskManagement.trailingStop.currentStopPrice = null
riskManagement.trailingStop.highestPrice = entry price
riskManagement.bracketOrderId = child bracket order ID (from parent.attachedOrderId after fill), else null
riskManagement.hasBracket = true if attachedOrderConfiguration was used, else false

performance.* = null (updated each cycle)

session.stats.tradesOpened += 1
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
// Cancel attached bracket if exit is NOT triggered by the bracket itself
IF riskManagement.hasBracket AND exit.trigger NOT IN ("stopLoss", "takeProfit", "bracketSL", "bracketTP"):
  cancel_orders([riskManagement.bracketOrderId])
  Log: "Cancelled bracket order {bracketOrderId} before {exit.trigger} exit"

historyEntry = {
  id: position.id.replace("pos_", "trade_"),
  pair, side, size, entry, analysis: from position,
  exit: {
    price: execution price,
    time: current timestamp,
    orderType: "limit" or "market",
    fee: fee from response,
    trigger: "stopLoss" | "takeProfit" | "trailingStop" | "rebalance" | "bracketSL" | "bracketTP" | "manual",
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

tradeHistory.push(historyEntry)
openPositions.remove(position)
session.lastUpdated = current timestamp

// Profit Protection (inline after each profitable close)
// Skip rebalance exits — rebalancing is capital reallocation, not realized gains leaving the system
quoteCurrency = position.pair.split("-")[1]
IF result.netPnL > 0 AND exit.trigger != "rebalance" AND portfolios.profitProtectionRate > 0:
  protectAmount = result.netPnL × (portfolios.profitProtectionRate / 100)
  IF protectAmount > 0:
    move_portfolio_funds({
      funds: { value: protectAmount, currency: quoteCurrency },
      sourcePortfolioUuid: portfolios.defaultUuid,
      targetPortfolioUuid: portfolios.hodlSafeUuid
    })
    Log: "Protected {protectAmount} {quoteCurrency} ({portfolios.profitProtectionRate}%) → HODL Safe"
  Error handling: if move fails and error indicates Safe no longer exists, trigger Flow E.
  For all other errors: log error, continue trading. Profit stays in Default.
```

**Legacy state files**: If `realizedPnLPercent` exists in the state file, drop it on next write.
