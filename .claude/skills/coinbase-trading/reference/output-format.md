# Output Format Specification

Structured, compact report format for trading cycle output using markdown tables.

## Design Principles

- **Decision & Action First**: Signal and action shown prominently at top
- **Fixed Structure**: Same sections in same order every cycle
- **Emoji Indicators**: Visual signal cues for quick scanning
- **Markdown Tables**: Reliable alignment without manual padding

## Emoji Legend

| Emoji | Meaning |
|-------|---------|
| 🟢 | BUY signal (score ≥ +40%) |
| 🔴 | SELL signal (score ≤ -40%) |
| 🟡 | HOLD (weak/neutral signal) |
| ⏸️ | WAITING (no positions) |
| 🔥 | Notable indicator value |

## Report Template

```
### {EMOJI} CYCLE {N} · {YYYY-MM-DD HH:MM} UTC · {SIGNAL} · [{REGIME}] · {POSITION_STATUS}

#### Rankings

| # | Pair | Score | Key Reason |
|---|------|-------|------------|
| {EMOJI} 1 | {PAIR} | {SCORE}% | {KEY_REASON} |
| ... | | | |

#### Spotlight: {PAIR} · {PRICE} ({CHANGE}% 24h)

| Category | Details |
|----------|---------|
| Momentum | RSI {RSI} · MFI {MFI} · Stoch {STOCH} |
| Trend | MACD {MACD} · EMA {EMA_STATUS} · ADX {ADX} |
| Patterns | {DETECTED_PATTERNS} |

#### Rationale

{2-5 sentences explaining the decision reasoning}

#### Action

{ACTION_DESCRIPTION or "None"}

#### Session

| Capital | PnL | W/L | Next |
|---------|-----|-----|------|
| {CAPITAL} | {PNL} | {W}/{L} | {T} |
```

## Section Details

1. **Header**: H3 with cycle number, UTC timestamp, signal emoji + text, regime tag, position status — all on one line
   - `[NORMAL]` — Standard rules
   - `[BEAR]` — Bear market, reduced confidence
   - `[POST_CAP]` — Post-capitulation recovery mode (relaxed entry rules)
2. **RANKINGS**: Table of all analyzed pairs ranked by score, with emoji indicator and key reason
3. **SPOTLIGHT**: H4 with pair, price, and 24h change; table with indicator categories
4. **RATIONALE**: 2-5 sentence prose explaining reasoning (why HOLD, why not BUY, etc.)
5. **ACTION**: What was executed this cycle (or "None")
6. **SESSION**: Table with available capital (Default portfolio), session PnL, win/loss record, time until next cycle

## Example Output

### ⏸️ CYCLE 5 · 2026-02-04 20:53 UTC · HOLD · [NORMAL] · No positions

#### Rankings

| # | Pair | Score | Key Reason |
|---|------|-------|------------|
| 🟢 1 | ATOM-EUR | +33% | MFI oversold + Tweezer Bottom |
| 🟡 2 | LTC-EUR | +11% | OBV rising |
| 🟡 3 | ETH-EUR | -11% | Hidden bullish divergence |
| 🔴 4 | BTC-EUR | -20% | Bearish trend |

#### Spotlight: ATOM-EUR · €1.70 (+2.0% 24h)

| Category | Details |
|----------|---------|
| Momentum | RSI 43.5 · MFI 18.7 🔥 · Stoch 62.9 |
| Trend | MACD -0.006 · EMA bullish · ADX 23.0 |
| Patterns | Tweezer Bottom, Doji |

#### Rationale

ATOM is the standout with oversold MFI and bullish reversal patterns, but +33% falls short of the +40% threshold. Waiting for signal strength or sentiment to improve.

#### Action

None

#### Session

| Capital | PnL | W/L | Next |
|---------|-----|-----|------|
| $9.24 | -$0.76 | 1/3 | 10 min |

## Formatting Notes

- Use `·` (middle dot) as separator between indicator values within table cells
- Mark notable values with 🔥 (e.g., MFI < 20, RSI < 30)
- Keep RATIONALE to 2-5 lines
- No manual padding or character counting needed — tables handle alignment
