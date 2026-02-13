# Coinbase MCP Server

MCP server with 74 tools (46 Coinbase Advanced Trade API + 24 technical indicators + 2 analysis tools + 1 event tool + 1 market intelligence).

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
├── index.ts                              # Entry point, credentials validation
├── logger.ts                             # Pino logger configuration
├── server/
│   ├── CoinbaseMcpServer.ts              # MCP server, tools, SDK integration
│   ├── services/
│   │   ├── common.request.ts             # Shared request schemas
│   │   ├── common.response.ts            # Shared response schemas
│   │   ├── schema.helpers.ts             # Transform helpers (stringToNumber, etc.)
│   │   ├── {Service}.ts                  # Service implementation
│   │   ├── {Service}.request.ts          # Request schemas
│   │   ├── {Service}.response.ts         # Response schemas
│   │   └── {Service}.types.ts            # Enums and shared types
│   ├── tools/
│   │   └── {Domain}ToolRegistry.ts       # Tool registration by domain
│   ├── indicators/                       # Manual indicator implementations
│   │   └── *.ts                          # Helper functions (chartPatterns.ts, etc.)
│   └── websocket/                        # WebSocket for real-time market data
│       ├── WebSocketConnection.ts        # Reusable WebSocket primitive
│       └── WebSocketConnection.constants.ts  # WebSocket configuration constants
└── test/
    ├── serviceMocks.ts                   # Service mocks
    └── loggerMock.ts                     # Logger mock helper
```

## Environment

```bash
cp .env.example .env
# Set COINBASE_API_KEY_NAME and COINBASE_PRIVATE_KEY
```

## Guidelines

See `.claude/rules/` for context-specific guidelines:

- `core.md` - Essential standards (always loaded)
- `zod.md` - Zod schema patterns (loaded for src/**/*.ts)
- `testing.md` - Test patterns (loaded for *.spec.ts)
- `api.md` - API development (loaded for src/**/*.ts)
- `indicators.md` - Indicator tools (loaded for TechnicalIndicatorsService.ts)
- `trading.md` - Trading rules (loaded for trade commands)

## Key Patterns

- **Timestamps**: Most APIs accept ISO 8601, Product Candles requires Unix (use `isoToUnix` from schema.helpers.ts)
- **Error handling**: Wrap SDK calls in try-catch, return consistent MCP error format
- **Testing**: 100% coverage, use `serviceMocks.ts` pattern
- **Schemas**: Split into `.request.ts` and `.response.ts` files; all types use `z.output<typeof ...>`
- **Descriptions**: Every schema and property must have `.describe()` for MCP documentation

## Debugging

```bash
npm run inspect    # MCP Inspector at http://localhost:6274
                   # Connect to http://localhost:3005/mcp
                   # Click "List Tools" to see all 74 tools
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
- [docs/IMPLEMENTED_TOOLS.md](docs/IMPLEMENTED_TOOLS.md) - All 74 tools
- [Coinbase API Docs](https://docs.cdp.coinbase.com/advanced-trade/)
