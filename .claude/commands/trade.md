# Autonomous Trading Agent

Start the autonomous trading agent with the coinbase-trading skill.

## Arguments

- **Budget**: $ARGUMENTS (e.g., "10 EUR from BTC" or "5 EUR")
- **Interval**: $ARGUMENTS (e.g., "interval=5m", default: 15m)
- **Dry-run**: Add "dry-run" to analyze without executing

## Examples

```
/trade 10 EUR
/trade 5 EUR from BTC interval=5m
/trade 20 EUR interval=1h dry-run
```

The skill handles the complete workflow automatically.
