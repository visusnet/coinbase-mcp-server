# Coinbase MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with the Coinbase Advanced Trading API. **This repository includes both the MCP server and a Claude Skill for fully autonomous crypto trading.**

With this project, AI assistants like Claude can not only check account balances, place trades, and view market data, but also execute automated trading strategies end-to-end via the included autonomous trading agent (`/trade` Skill).

---

## ⚠️ WARNING: REAL MONEY TRADING ⚠️

**This MCP server and the included Autonomous Trading Bot will execute real trades on your Coinbase account if you use them with valid API keys. Your actual funds can be bought, sold, or lost automatically.**

> **Never use this software with funds you cannot afford to lose.**
>
> - Always test with `dry-run` mode first.
> - Use read-only or test API keys for development.
> - Automated trading is risky and can result in significant financial loss.

---

## Getting Started

Get from zero to running `/trade 10 EUR from BTC` in 5 minutes.

### 1. Get Coinbase API Credentials

1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project or select an existing one
3. Navigate to **API Keys** → **Create API Key**
4. Select **Trading** permissions (read and trade)
5. Download your credentials:
   - **API Key Name**: `organizations/xxx/apiKeys/yyy`
   - **Private Key**: PEM format (starts with `-----BEGIN EC PRIVATE KEY-----`)

> **Warning**: Save your private key immediately. You won't be able to retrieve it again.

### 2. Clone and Setup

```bash
git clone https://github.com/visusnet/coinbase-mcp-server
cd coinbase-mcp-server
npm install
```

### 3. Create `.env` File

Copy the example and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
COINBASE_API_KEY_NAME=organizations/your-org/apiKeys/your-key-id
COINBASE_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
MHcCAQEEI...your-key-here...
-----END EC PRIVATE KEY-----"
```

### 4. Start the Server

```bash
npm run build
npm start
```

You should see: `Coinbase MCP Server running on http://localhost:3005/mcp`

### 5. Open Claude Code

```bash
claude
```

The MCP server is **automatically configured** (via `.claude/settings.json` in this repo).

### 6. Start Trading

```bash
/trade 10 EUR from BTC dry-run
```

That's it! The trading agent will analyze the market and show you what trades it would make.

Remove `dry-run` to execute real trades.

## Alternative: Use with npx (without cloning)

If you just want to use the MCP server without the `/trade` skill or development setup:

### 1. Install and Run

```bash
npx coinbase-mcp-server
```

### 2. Set Environment Variables

The server requires Coinbase API credentials. Create a `.env` file in your current directory:

```env
COINBASE_API_KEY_NAME=organizations/your-org/apiKeys/your-key-id
COINBASE_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
...your-key...
-----END EC PRIVATE KEY-----"
PORT=3005
```

Or export them in your shell:

```bash
export COINBASE_API_KEY_NAME="organizations/your-org/apiKeys/your-key-id"
export COINBASE_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
...your-key...
-----END EC PRIVATE KEY-----"
export PORT=3005
```

Then start the server:

```bash
npx coinbase-mcp-server
```

### 3. Configure Claude

Add the MCP server to your Claude settings (e.g., `~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "coinbase": {
      "url": "http://localhost:3005/mcp"
    }
  }
}
```

Now you can use all 74 tools (46 Coinbase API + 24 indicators + 2 analysis + 1 market event + 1 market intelligence) and the `/coinbase:assist` prompt in Claude, but without the autonomous `/trade` skill.

## Features

### 74 Tools: Trading, Indicators & Analysis

Full access to the Coinbase Advanced Trading API **plus a fully autonomous trading skill for Claude**:

- **Accounts**: List accounts, get balances
- **Orders**: Create, edit, cancel, preview orders
- **Products**: List trading pairs, get candles (including batch for up to 10 products), order books, market trades, market snapshots
- **Portfolios**: Create, manage, move funds between portfolios
- **Converts**: Currency conversion quotes and execution
- **Futures & Perpetuals**: Position management
- **Public Data**: No-auth endpoints for market data
- **Autonomous Trading Agent (Skill)**: Automates technical/sentiment analysis and trading decisions via `/trade` command in Claude
- **TOON Output Format**: All tools support optional compact format (~35% fewer tokens for list operations)

For a complete list of all trading skill features, see **[SKILL_FEATURES.md](docs/SKILL_FEATURES.md)**.

### Trading Assistant Prompt (`/coinbase:assist`)

A built-in prompt that provides comprehensive guidance for trading on Coinbase:

```bash
/coinbase:assist
```

**What it provides:**

- Complete overview of all available tools and capabilities
- Trading best practices and safety guidelines
- Fee considerations and market context
- Recommended workflow for order creation (always preview first)

### Autonomous Trading Agent (`/trade`)

A built-in Claude command that runs an autonomous trading bot:

```bash
/trade 10 EUR from BTC
/trade 5 EUR dry-run
```

**What it does:**

- Technical analysis: 24 indicators across 6 weighted categories (Momentum 25%, Trend 30%, Volatility 15%, Volume 15%, S/R 10%, Patterns 5%)
- Sentiment analysis (Fear & Greed Index with 7 regions, news search)
- Automatic order execution with preview
- Dynamic ATR-based stop-loss/take-profit
- Attached bracket orders (crash-proof TP/SL via Coinbase API)
- Trailing stop (locks in profits)
- Liquidity check before altcoin entries (spread >0.5%: skip, 0.2-0.5%: reduce to 50%)
- HODL Safe portfolio isolation (protects user holdings via separate portfolio)
- Profit protection (configurable % of gains auto-moved to HODL Safe)
- Event-driven market monitoring (price, volume & indicator conditions)
- Opportunity rebalancing (exit stagnant positions)
- Continuous loop until you stop it

For a complete list of all trading features, see **[SKILL_FEATURES.md](docs/SKILL_FEATURES.md)**.

**Configuration:**

| Setting        | Default                                                                                          | Customizable                                                   |
|----------------|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Strategy       | Aggressive                                                                                       | No                                                             |
| Take-Profit    | ATR-based (min 2.5%)                                                                             | Via ATR                                                        |
| Stop-Loss      | ATR-based (2.5-10%)                                                                              | Via ATR                                                        |
| Trailing Stop  | 1.5% trail after +3%, min lock-in 1.0%                                                           | No                                                             |
| Check Interval | 15 minutes                                                                                       | Yes (`interval=5m`)                                            |
| Profit Protection | 50% of profits moved to HODL Safe                                                            | Yes (choose at session start: 0%, 50%, 100%, or custom)       |
| Rebalancing    | After 12h if <3% move, delta >40, max loss -2%, cooldown 4h, max 3/day                          | Yes (`no-rebalance`, `rebalance-delta=50`, `rebalance-max=2`) |
| Pairs          | All SPOT pairs (USD, EUR, USDT)                                                                  | No                                                             |

**Stop the agent**: Press `Ctrl+C`

---

## Usage Examples

### Natural Language

Just ask Claude:

```bash
"What are my account balances?"
"Show me the current BTC-EUR price"
"Buy 0.001 BTC at market price"
"Get the last 24 hours of ETH-EUR candles"
```

### Trading Agent

```bash
# Dry run (no real trades)
/trade 10 EUR from BTC dry-run

# Real trading with 10 EUR from your BTC
/trade 10 EUR from BTC

# Trade with EUR balance directly
/trade 5 EUR

# Custom interval (check every 5 minutes)
/trade 10 EUR from BTC interval=5m

# Fast trading (every 60 seconds, dry-run)
/trade 5 EUR interval=60s dry-run

# Continue previous session
/trade continue where you left off
```

---

## Development

### Project Structure

```text
coinbase-mcp-server/
├── src/
│   ├── index.ts                 # HTTP server entry point
│   └── server/
│       └── CoinbaseMcpServer.ts # MCP server with 74 tools
├── .claude/
│   ├── settings.json            # MCP server config (auto-loaded)
│   └── commands/
│       └── trade.md             # /trade command definition
├── .env.example                 # Environment template
└── package.json
```

### Scripts

```bash
npm start          # Start production server
npm run start:dev  # Start with hot-reload
npm test           # Run tests
npm run lint       # Check code style
npm run build      # Build for production
npm run inspect    # Open MCP Inspector for debugging
```

### Testing with MCP Inspector

#### Interactive UI

1. Start the server: `npm run start:dev`
2. In another terminal: `npm run inspect`
3. Connect to `http://localhost:3005/mcp`
4. Test any of the 74 tools interactively

#### CLI

Use the MCP Inspector CLI to call tools directly without the browser UI:

```bash
# List all accounts
npx @modelcontextprotocol/inspector --cli node dist/index.js --stdio \
  --method tools/call \
  --tool-name list_accounts

# Get a specific product
npx @modelcontextprotocol/inspector --cli node dist/index.js --stdio \
  --method tools/call \
  --tool-name get_product \
  --tool-arg productId=BTC-EUR
```

The `--stdio` flag tells the server to use stdio transport instead of HTTP, which the inspector CLI requires.

---

## Security

1. **Never commit `.env`** - It's in `.gitignore`
2. **Use read-only keys for testing** - Create separate keys with minimal permissions
3. **Rotate keys regularly**
4. **Monitor API usage** - Check your Coinbase account for unexpected activity

## API Rate Limits

- Public endpoints: 10 requests/second
- Private endpoints: 15 requests/second

## Troubleshooting

| Problem                 | Solution                                                      |
|-------------------------|---------------------------------------------------------------|
| "Authentication failed" | Check API key and private key format (PEM with newlines)     |
| "Server not responding" | Ensure `npm start` is running, check `.env`                  |
| "/trade not found"      | Restart Claude Code to reload commands                        |
| Tools not showing       | Verify `.claude/settings.json` exists, restart Claude         |

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Coinbase Advanced Trade API](https://docs.cloud.coinbase.com/advanced-trade/docs/welcome)
- [Claude Code](https://claude.ai/download)

## Disclaimer

**This software is for educational purposes.** Cryptocurrency trading involves significant risk. The autonomous trading agent can and will lose money.

- Start with small amounts
- Use `dry-run` mode first
- Monitor the agent's decisions
- Never invest more than you can afford to lose

## License

MIT
