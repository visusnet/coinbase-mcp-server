# Coinbase MCP Server

MCP server providing 46 Coinbase Advanced Trade API tools.

## Commands

```bash
npm run build      # Build project
npm test           # Run tests (100% coverage required)
npm run lint       # Lint code
npm run start:dev  # Development server with auto-reload
npm run inspect    # MCP Inspector (http://localhost:6274)
```

## Architecture

Direct SDK usage, no abstraction layers (YAGNI).

```
src/
├── index.ts                    # Entry point, credentials validation
├── server/
│   └── CoinbaseMcpServer.ts   # MCP server, 46 tools, SDK integration
└── test/
    └── serviceMocks.ts         # Test mocks
```

## Environment

```bash
cp .env.example .env
# Set COINBASE_API_KEY_NAME and COINBASE_PRIVATE_KEY
```

## Guidelines

See `.claude/rules/` for context-specific guidelines:

- `core.md` - Essential standards (always loaded)
- `testing.md` - Test patterns (loaded for *.spec.ts)
- `api.md` - API development (loaded for src/**/*.ts)
- `trading.md` - Trading rules (loaded for trade commands)

## Key Patterns

- **Timestamps**: Most APIs accept ISO 8601, Product Candles requires Unix (use `toUnixTimestamp()`)
- **Error handling**: Wrap SDK calls in try-catch, return consistent MCP error format
- **Testing**: 100% coverage, use `serviceMocks.ts` pattern

## Debugging

```bash
npm run inspect    # MCP Inspector at http://localhost:6274
                   # Connect to http://localhost:3005/mcp
                   # Click "List Tools" to see all 46 tools
```

## Code Quality

```bash
npm run lint && npm run format && npm test  # All checks before commit
```

## Resources

- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guide
- [docs/IMPLEMENTED_TOOLS.md](docs/IMPLEMENTED_TOOLS.md) - All 46 tools
- [Coinbase API Docs](https://docs.cdp.coinbase.com/advanced-trade/)
