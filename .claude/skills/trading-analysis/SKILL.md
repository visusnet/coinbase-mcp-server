---
name: trading-analysis
description: "Phase 1: Market data collection, technical indicator analysis, and sentiment analysis for the autonomous trading agent."
---

# Trading Analysis (Phase 1)

**Sub-skill of `coinbase-trading`.** Called via `Skill("trading-analysis")` each trading cycle.

This skill performs data collection and analysis. It does NOT execute trades.

## Scope

1. Check Portfolio Status
2. Pair Screening (batch analysis of all EUR pairs)
3. Collect Market Data (multi-timeframe for watch list)
4. Technical Analysis (24 indicators with signal scoring)
5. Sentiment Analysis (Fear & Greed + news)

**Output**: Scored pairs with signals, sentiment classification, and multi-timeframe trend data. Report findings inline so the orchestrator and subsequent sub-skills can use them.

---

## Integrated Analysis Tool (Recommended)

For efficiency, use `analyze_technical_indicators` to fetch candles and compute all indicators in one call:

```
result = analyze_technical_indicators(
  productId="BTC-EUR",
  granularity="ONE_HOUR",
  candleCount=100,
  indicators=[
    // Momentum (7)
    "rsi", "macd", "stochastic", "adx", "cci", "williams_r", "roc",
    // Trend (4)
    "sma", "ema", "ichimoku", "psar",
    // Volatility (3)
    "bollinger_bands", "atr", "keltner",
    // Volume (4)
    "obv", "mfi", "vwap", "volume_profile",
    // Patterns (4)
    "candlestick_patterns", "rsi_divergence", "chart_patterns", "swing_points",
    // Support/Resistance (2)
    "pivot_points", "fibonacci"
  ]
)
```

**Output includes**:
- `price`: Current, open, high, low, 24h change
- `indicators`: Computed values for each requested indicator
- `signal`: Aggregated score (-100 to +100), direction (BUY/SELL/HOLD), confidence (HIGH/MEDIUM/LOW)

This reduces context by ~90-95% compared to calling individual tools.

### Batch Analysis (Multi-Pair Scanning)

For scanning multiple pairs simultaneously, use `analyze_technical_indicators_batch`:

```
result = analyze_technical_indicators_batch(
  requests=[
    { productId: "BTC-EUR", granularity: "FIFTEEN_MINUTE", candleCount: 100,
      indicators: ["rsi", "macd", "bollinger_bands", "adx", "vwap", "stochastic"] },
    { productId: "DOGE-EUR", granularity: "FIFTEEN_MINUTE", candleCount: 100,
      indicators: ["rsi", "macd", "bollinger_bands", "adx", "vwap", "stochastic"] }
  ]
)
```

Returns results for all pairs in a single call. Use this for pair screening.

---

## Step 1: Check Portfolio Status

Call `list_accounts` and determine:

- Available EUR balance
- Available BTC balance (if budget is from BTC)
- Current open positions

---

## Step 2: Pair Screening

Systematically select which pairs to analyze instead of picking manually.

**Stage 1 -- Batch Screen (all EUR pairs):**

```
pairs = list_products(type="SPOT") -> filter EUR quote currency
results = analyze_technical_indicators_batch(
  requests: pairs.map(p => ({
    productId: p.product_id,
    granularity: "FIFTEEN_MINUTE",
    candleCount: 100,
    indicators: ["rsi", "macd", "adx", "vwap", "bollinger_bands", "stochastic"]
  })),
  format: "toon"
)
```

**Stage 2 -- Select Watch List:**

```
watch_list = []

// Top 5-8 BUY candidates by signal score
candidates = results.sort_by(signal.score, descending).take(8)
watch_list.add(candidates)

// ALWAYS include pairs with open positions (for SL/TP management)
FOR EACH position in openPositions:
  IF position.pair NOT IN watch_list:
    watch_list.add(position.pair)

Log: "Watch list ({N} pairs): {pair1}, {pair2}, ..."
```

The watch list is rebuilt every cycle from fresh batch data. Only open positions are guaranteed a spot regardless of score.

---

## Step 3: Collect Market Data

For the watch list pairs, fetch multi-timeframe candles:

| Timeframe | Candles | Purpose |
|-----------|---------|---------|
| 15 min | 100 | Entry/Exit timing, primary signals |
| 1 hour | 100 | Short-term trend confirmation |
| 6 hour | 60 | Medium-term trend confirmation |
| Daily | 30 | Long-term trend confirmation |

```
candles_15m = get_product_candles(pair, FIFTEEN_MINUTE, 100)
candles_1h = get_product_candles(pair, ONE_HOUR, 100)
candles_6h = get_product_candles(pair, SIX_HOUR, 60)
candles_daily = get_product_candles(pair, ONE_DAY, 30)
current_price = get_best_bid_ask(pair)
```

---

## Step 4: Technical Analysis

For each pair, call MCP indicator tools and score the results.

### Signal Categories & Weights

| Category | Indicators | Weight |
|----------|------------|--------|
| **Momentum** | RSI, Stochastic, Williams %R, ROC, CCI | 25% |
| **Trend** | MACD, EMA Crossovers, ADX, Parabolic SAR, Ichimoku | 30% |
| **Volatility** | Bollinger Bands, ATR, Keltner Channels | 15% |
| **Volume** | OBV, MFI, VWAP, Volume Profile | 15% |
| **Support/Resistance** | Pivot Points, Fibonacci | 10% |
| **Patterns** | Candlesticks, Chart Patterns | 5% |

### Signal Scoring (-3 to +3 per indicator)

| Score | Meaning |
|-------|---------|
| +3 | Strong BUY |
| +2 | BUY |
| +1 | Weak BUY |
| 0 | Neutral |
| -1 | Weak SELL |
| -2 | SELL |
| -3 | Strong SELL |

### Momentum Indicators

```
rsi = calculate_rsi(candles, period=14)
  < 30: BUY (+2), < 40: Weak BUY (+1), > 60: Weak SELL (-1), > 70: SELL (-2)

rsi_div = detect_rsi_divergence(candles)
  hasBullishDivergence: +3, hasBearishDivergence: -3

stoch = calculate_stochastic(candles)
  k < 20 AND k > d: BUY (+2), k > 80 AND k < d: SELL (-2)
  k < 20: Weak BUY (+1), k > 80: Weak SELL (-1)

williams = calculate_williams_r(candles)
  < -80: BUY (+1), > -20: SELL (-1)

cci = calculate_cci(candles)
  < -100: BUY (+2), > +100: SELL (-2)
  crosses -100 from below: Strong BUY (+3), crosses +100 from above: Strong SELL (-3)

roc = calculate_roc(candles)
  crosses zero upward: BUY (+2), crosses zero downward: SELL (-2)
```

### Trend Indicators

```
macd = calculate_macd(candles)
  MACD > signal + positive histogram: BUY (+2)
  MACD < signal + negative histogram: SELL (-2)
  Golden cross (MACD crosses signal from below): +3
  Death cross: -3

ema_9 = calculate_ema(candles, period=9)
ema_21 = calculate_ema(candles, period=21)
ema_50 = calculate_ema(candles, period=50)
  ema_9 > ema_21 > ema_50: Uptrend (+2)
  ema_9 < ema_21 < ema_50: Downtrend (-2)
  EMA(50) crosses above EMA(200) (Golden Cross): +3
  EMA(50) crosses below EMA(200) (Death Cross): -3

adx = calculate_adx(candles)
  adx > 25: Strong trend (confirms signals)
  adx < 20: Weak trend (avoid trading)
  pdi > mdi with adx > 25: BUY (+2)
  mdi > pdi with adx > 25: SELL (-2)

psar = calculate_psar(candles)
  price > psar: Uptrend (+1)
  SAR flip from above to below: +2
  SAR flip from below to above: -2

ichimoku = calculate_ichimoku_cloud(candles)
  price > spanA AND > spanB: Bullish (+1)
  conversion crosses base upward above cloud: Strong BUY (+3)
  conversion crosses base downward below cloud: Strong SELL (-3)
```

### Volatility Indicators

```
bb = calculate_bollinger_bands(candles)
  pb < 0: Oversold BUY (+2), pb > 1: Overbought SELL (-2)
  Price crosses middle upward: +1, downward: -1
  Low bandwidth = squeeze (breakout imminent)

atr = calculate_atr(candles)
  Use for position sizing: High ATR = smaller position
  ATR > 2x average: -1 to signals (high risk)

keltner = calculate_keltner_channels(candles)
  price < lower: BUY (+1), price > upper: SELL (-1)
```

### Volume Indicators

```
obv = calculate_obv(candles)
  OBV rising with price falling: Bullish divergence (+2)
  OBV falling with price rising: Bearish divergence (-2)
  OBV confirms price trend: +1

mfi = calculate_mfi(candles)
  < 20: BUY (+2), > 80: SELL (-2)

vwap = calculate_vwap(candles)
  price > vwap: Bullish (+1), price < vwap: Bearish (-1)

volume_profile = calculate_volume_profile(candles)
  price near pointOfControl: Strong S/R level
  price above valueAreaHigh: Bullish (+1)
  price below valueAreaLow: Bearish (-1)
```

### Support/Resistance

```
pivots = calculate_pivot_points(candles, type="standard")
  price bounces off support1/2: BUY (+2)
  price rejected at resistance1/2: SELL (-2)

fib = calculate_fibonacci_retracement(swingLow, swingHigh)
  price at 61.8% retracement: Strong level (+/-2)
  Use detect_swing_points to get swing high/low for Fibonacci
```

### Patterns

```
candle_patterns = detect_candlestick_patterns(candles)
  bullish == true: +2, bearish == true: -2
  Specific: Hammer, Morning Star, Bullish Engulfing: +2 to +3
  Specific: Shooting Star, Evening Star, Bearish Engulfing: -2 to -3

chart_patterns = detect_chart_patterns(candles)
  double_bottom, inverse_head_and_shoulders: +3
  double_top, head_and_shoulders: -3
  volumeConfirmed: true adds +1
```

### Null-Safety

Many MCP tools return `latestValue: null` when insufficient data. Always check for null before using values.

### Risk Assessment

Check the `risk` field from technical analysis:

| Risk Level | Action |
|------------|--------|
| `low` / `moderate` | Normal position sizing |
| `high` | Reduce position by 50% |
| `extreme` | Skip trade or use 25% |

Also check: `maxDrawdown` > 30%, `var95` > 5%, `sharpeRatio` < 0.

### Calculate Weighted Score

```
// Step 1: Normalize each category score (0-100) to weighted contribution
momentum_weighted = (momentum_score / 100) x 25
trend_weighted = (trend_score / 100) x 30
volatility_weighted = (volatility_score / 100) x 15
volume_weighted = (volume_score / 100) x 15
sr_weighted = (sr_score / 100) x 10
patterns_weighted = (patterns_score / 100) x 5

// Step 2: Sum all weighted contributions (result: 0-100 range)
Final_Score = momentum_weighted + trend_weighted + volatility_weighted
            + volume_weighted + sr_weighted + patterns_weighted
```

### Multi-Timeframe Trend Analysis

After calculating indicators on the primary 15m timeframe, determine trend for higher timeframes:

```
// For each higher timeframe (1h, 6h, daily):
// 1. Calculate MACD (12, 26, 9)
// 2. Calculate EMA alignment (EMA9 > EMA21 > EMA50)
// 3. Calculate ADX (14) with +DI/-DI

IF MACD > Signal AND EMA(9) > EMA(21) > EMA(50) AND +DI > -DI:
  trend = "bullish"
ELSE IF MACD < Signal AND EMA(9) < EMA(21) < EMA(50) AND -DI > +DI:
  trend = "bearish"
ELSE:
  trend = "neutral"

// Store for each timeframe:
trend_1h = calculate_trend(candles_1h)
trend_6h = calculate_trend(candles_6h)
trend_daily = calculate_trend(candles_daily)
```

**Example Output**:

```
BTC-EUR Trend Analysis:
  15m: MACD bullish, EMA aligned up, RSI 65
  1h: BULLISH (MACD +120, EMA 9>21>50, +DI>-DI)
  6h: BULLISH (MACD +80, EMA aligned, ADX 28)
  Daily: NEUTRAL (MACD near zero, sideways)
```

---

## Step 5: Sentiment Analysis

Check sentiment **every cycle**. Results feed into signal aggregation (Phase 3).

**Source 1 -- Fear & Greed Index (global macro):**

Search for "crypto fear greed index today" via web search.

| Range | Interpretation | Modifier |
|-------|----------------|----------|
| 0-10 | Extreme Fear | Contrarian BUY (+2) |
| 10-25 | Fear | BUY bias (+1) |
| 25-45 | Slight Fear | Slight BUY (+0.5) |
| 45-55 | Neutral | No signal (0) |
| 55-75 | Slight Greed | Slight SELL (-0.5) |
| 75-90 | Greed | SELL bias (-1) |
| 90-100 | Extreme Greed | Contrarian SELL (-2) |

**Source 2 -- News Sentiment (per-pair context):**

Call `get_news_sentiment` for the top BUY candidates from Step 2.

- Strongly positive news: reinforces BUY signal
- Strongly negative news: reduces confidence (negative modifier)
- Use news to distinguish crash types (systemic risk vs. temporary liquidation)

**Overall Sentiment Classification:**

| Fear & Greed | News Sentiment | Classification |
|-------------|----------------|----------------|
| Fear/Extreme Fear | Positive or neutral | **Bullish** |
| Neutral | Positive | **Bullish** |
| Neutral | Neutral | **Neutral** |
| Neutral | Negative | **Bearish** |
| Greed/Extreme Greed | Negative or neutral | **Bearish** |
| Conflicting | -- | **Neutral** (signals cancel out) |

---

## Available MCP Indicator Tools Reference

24 technical indicator tools are available. **Always use these instead of manual calculation:**

**Momentum:** `calculate_rsi`, `calculate_stochastic`, `calculate_williams_r`, `calculate_cci`, `calculate_roc`, `detect_rsi_divergence`

**Trend:** `calculate_sma`, `calculate_macd`, `calculate_ema`, `calculate_adx`, `calculate_psar`, `calculate_ichimoku_cloud`

**Volatility:** `calculate_bollinger_bands`, `calculate_atr`, `calculate_keltner_channels`

**Volume:** `calculate_obv`, `calculate_mfi`, `calculate_vwap`, `calculate_volume_profile`

**Support/Resistance:** `calculate_pivot_points`, `calculate_fibonacci_retracement`, `detect_swing_points`

**Patterns:** `detect_candlestick_patterns`, `detect_chart_patterns`

**Market Events:** `wait_for_market_event`

**Market Intelligence:** `get_news_sentiment`
