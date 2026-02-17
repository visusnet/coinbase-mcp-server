# Indicator Interpretations

Quick-reference scoring guide for each MCP indicator tool. Use these interpretations when scoring pairs in Phase 1, Step 4.

See [indicators.md](indicators.md) for detailed tool documentation and [strategies.md](strategies.md) for category weights and aggregation.

---

## Momentum Indicators

```
rsi = calculate_rsi(candles, period=14)
→ rsi.latestValue < 30: BUY (+2), > 70: SELL (-2)

rsi_div = detect_rsi_divergence(candles)
→ rsi_div.hasBullishDivergence: +3, hasBearishDivergence: -3

stoch = calculate_stochastic(candles)
→ stoch.latestValue.k < 20 && stoch.latestValue.k > stoch.latestValue.d: BUY (+2)
// 6H timeframe regime note:
// NORMAL: 6H stoch > 80 / RSI > 70 = overbought exhaustion (-2)
// POST_CAPITULATION: 6H overbought after crash = recovery signal, not exhaustion.
//   POST_CAPITULATION regime skips 6H filter entirely.

williams = calculate_williams_r(candles)
→ williams.latestValue < -80: BUY (+1), > -20: SELL (-1)

cci = calculate_cci(candles)
→ cci.latestValue < -100: BUY (+2), > +100: SELL (-2)

roc = calculate_roc(candles)
→ roc.latestValue crosses 0 upward: BUY (+2)
```

## Trend Indicators

```
macd = calculate_macd(candles)
→ macd.latestValue.histogram > 0 && macd.latestValue.MACD > macd.latestValue.signal: BUY (+2)
→ Golden cross (MACD crosses signal from below): +3

ema_9 = calculate_ema(candles, period=9)
ema_21 = calculate_ema(candles, period=21)
ema_50 = calculate_ema(candles, period=50)
→ ema_9.latestValue > ema_21.latestValue > ema_50.latestValue: Uptrend (+2)

adx = calculate_adx(candles)
→ adx.latestValue.adx > 25: Strong trend (confirms signals)
→ adx.latestValue.pdi > adx.latestValue.mdi: Bullish (+2)
// Regime-aware:
// NORMAL/BEAR: ADX < 20 = no trade
// POST_CAPITULATION: ADX < 20 is EXPECTED at bottoms.
//   Check: ADX rising (current > previous) AND +DI > -DI = new trend forming (+1)

psar = calculate_psar(candles)
→ price > psar.latestValue: Uptrend (+1)
→ SAR flip: ±2

ichimoku = calculate_ichimoku_cloud(candles)
→ price > ichimoku.latestValue.spanA && price > ichimoku.latestValue.spanB: Bullish (+1)
→ ichimoku.latestValue.conversion crosses ichimoku.latestValue.base above cloud: +3
```

## Volatility Indicators

```
bb = calculate_bollinger_bands(candles)
→ bb.latestValue.pb < 0: Oversold, BUY (+2)
→ bb.latestValue.pb > 1: Overbought, SELL (-2)
→ bb.latestValue.bandwidth: Volatility measure (low = squeeze, high = expansion)

atr = calculate_atr(candles)
→ Use for position sizing: High ATR = smaller position

keltner = calculate_keltner_channels(candles)
→ price < keltner.latestValue.lower: BUY (+1)
→ price > keltner.latestValue.upper: SELL (-1)
```

## Volume Indicators

```
obv = calculate_obv(candles)
→ OBV trend diverges from price: ±2

mfi = calculate_mfi(candles)
→ mfi.latestValue < 20: BUY (+2), > 80: SELL (-2)

vwap = calculate_vwap(candles)
→ price > vwap.latestValue: Bullish bias (+1)

volume_profile = calculate_volume_profile(candles)
→ price near volume_profile.pointOfControl: Strong support/resistance
```

## Support/Resistance

```
pivots = calculate_pivot_points(candles, type="standard")
→ price bounces off pivots.support1: BUY (+2)
→ price rejected at pivots.resistance1: SELL (-2)

fib = calculate_fibonacci_retracement(swingLow, swingHigh)
→ price at fib.levels[4].price (61.8%): Strong level (±2)
```

## Patterns

```
candle_patterns = detect_candlestick_patterns(candles)
→ candle_patterns.bullish == true: Overall bullish bias (+2)
→ candle_patterns.bearish == true: Overall bearish bias (-2)
→ Check candle_patterns.detectedPatterns for specific patterns (e.g., ["Hammer", "Morning Star"])

chart_patterns = detect_chart_patterns(candles)
→ Bullish patterns (double_bottom, inverse_head_and_shoulders): +3
→ Bearish patterns (double_top, head_and_shoulders): -3
```
