# Output Format Specification

Structured, compact report format for trading cycle output.

## Design Principles

- **Decision & Action First**: Signal and action shown prominently at top
- **Fixed Structure**: Same sections in same order every cycle
- **Emoji Indicators**: Visual signal cues for quick scanning
- **Bold Headlines**: Use markdown `**bold**` with +3 extra `━` to compensate

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
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CYCLE {N} │ {YYYY-MM-DD HH:MM} UTC                          ┃
┃  {EMOJI}  {SIGNAL} │ {POSITION_STATUS}                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **RANKINGS** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  {EMOJI}  #{RANK}  {PAIR}   {SCORE}%   {KEY_REASON}          ┃
┃  ...                                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **SPOTLIGHT: {PAIR}** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Price: €{PRICE} ({CHANGE}% 24h)                             ┃
┃  Momentum    {RSI} • {MFI} • {STOCH}                         ┃
┃  Trend       {MACD} • {EMA_STATUS} • {ADX}                   ┃
┃  Patterns    {DETECTED_PATTERNS}                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **RATIONALE** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  {2-5 sentences explaining the decision reasoning}           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **ACTION** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  {ACTION_DESCRIPTION or "None"}                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **SESSION** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Budget: €{BUDGET} │ PnL: {PNL}% │ W/L: {W}/{L} │ Next: {T}  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Section Details

1. **Header Box**: Cycle number, UTC timestamp, signal emoji + text, position status
2. **RANKINGS**: All analyzed pairs ranked by score, with emoji indicator and key reason
3. **SPOTLIGHT**: Detailed breakdown of the best opportunity (or current position if held)
4. **RATIONALE**: 2-5 sentence prose explaining reasoning (why HOLD, why not BUY, etc.)
5. **ACTION**: What was executed this cycle (or "None")
6. **SESSION**: Budget remaining, session PnL, win/loss record, time until next cycle

## Example Output

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CYCLE 5 │ 2026-02-04 20:53 UTC                              ┃
┃  ⏸️  HOLD │ No positions                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **RANKINGS** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🟢  #1  ATOM-EUR   +33%   MFI oversold + Tweezer Bottom     ┃
┃  🟡  #2  LTC-EUR    +11%   OBV rising                        ┃
┃  🟡  #3  ETH-EUR    -11%   Hidden bullish divergence         ┃
┃  🔴  #4  BTC-EUR    -20%   Bearish trend                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **SPOTLIGHT: ATOM-EUR** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Price: €1.70 (+2.0% 24h)                                    ┃
┃  Momentum    RSI 43.5 • MFI 18.7 🔥 • Stoch 62.9             ┃
┃  Trend       MACD -0.006 • EMA bullish • ADX 23.0            ┃
┃  Patterns    Tweezer Bottom, Doji                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **RATIONALE** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ATOM is the standout with oversold MFI and bullish reversal ┃
┃  patterns, but +33% falls short of the +40% threshold.       ┃
┃  Waiting for signal strength or sentiment to improve.        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **ACTION** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  None                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ **SESSION** ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Budget: €9.24 │ PnL: -7.60% │ W/L: 1/3 │ Next: 10 min       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

## Formatting Notes

- Use `•` (bullet) as separator between indicator values
- Mark notable values with 🔥 (e.g., MFI < 20, RSI < 30)
- Keep RATIONALE to 2-5 lines
- Emojis at line start to avoid alignment issues
- Add +3 extra `━` after `**bold**` headlines to compensate for invisible markdown markers

## Box Alignment Rules

**CRITICAL**: Every content line must have exactly 62 visible characters between the `┃` markers.

```
┃<-- 62 characters of content here, padded with spaces -->┃
```

**Counting rules**:
- Box outer width: 64 characters (62 content + 2 for `┃` markers)
- Each `┃` counts as 1 character
- Emojis count as 2 characters each (🟡, 🔥, ⏸️, etc.)
- All other characters count as 1

**Padding procedure**:
1. Write the content (e.g., `  🟡  #1  ATOM-EUR   +22%   MFI oversold`)
2. Count: 2 spaces + 2 (emoji) + content length
3. Pad with spaces until total = 62
4. Add closing `┃`

**Example calculation**:
```
┃  🟡  #1  ATOM-EUR   +22%   MFI 2.8 🔥 extreme oversold       ┃
  ^^                                  ^^                     ^^^
  2 + 2(emoji) + 38 chars + 2(emoji) + 18 chars + 0 spaces = 62 ✗

Correct:
┃  🟡  #1  ATOM-EUR   +22%   MFI 2.8 🔥 extreme oversold       ┃
```

**Never** leave extra spaces before the closing `┃` — pad to exactly 62.
