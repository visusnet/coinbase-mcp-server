# Coinbase MCP Server

MCP server with 57 tools (46 Coinbase Advanced Trade API + 11 technical indicators).

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
├── index.ts                         # Entry point, credentials validation
├── server/
│   ├── CoinbaseMcpServer.ts         # MCP server, tools, SDK integration
│   ├── TechnicalIndicatorsService.ts # Technical indicator calculations
│   └── indicators/                   # Manual indicator implementations
│       └── *.ts                      # Helper functions (e.g., chartPatterns.ts)
└── test/
    └── serviceMocks.ts               # Test mocks
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
- `indicators.md` - Indicator tools (loaded for TechnicalIndicatorsService.ts)
- `trading.md` - Trading rules (loaded for trade commands)

## Key Patterns

- **Timestamps**: Most APIs accept ISO 8601, Product Candles requires Unix (use `toUnixTimestamp()`)
- **Error handling**: Wrap SDK calls in try-catch, return consistent MCP error format
- **Testing**: 100% coverage, use `serviceMocks.ts` pattern

## Debugging

```bash
npm run inspect    # MCP Inspector at http://localhost:6274
                   # Connect to http://localhost:3005/mcp
                   # Click "List Tools" to see all 57 tools
```

## Code Quality

```bash
npm run format        # Format code
npm run lint          # Lint check
npm run test:types    # TypeScript type check
npm run knip          # Unused exports/dependencies
npm run test:coverage # Tests with 100% coverage
```

## Resources

- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guide
- [docs/IMPLEMENTED_TOOLS.md](docs/IMPLEMENTED_TOOLS.md) - All 57 tools
- [Coinbase API Docs](https://docs.cdp.coinbase.com/advanced-trade/)
