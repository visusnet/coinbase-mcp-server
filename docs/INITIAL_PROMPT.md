# Initial Project Prompt

This document contains the original prompt used to create the Coinbase MCP Server project.

**Note**: This project was built following the [Building MCP with LLMs guide](https://modelcontextprotocol.io/tutorials/building-mcp-with-llms), using Claude as the development assistant with the full MCP documentation context from [https://modelcontextprotocol.io/llms-full.txt](https://modelcontextprotocol.io/llms-full.txt).

---

Create a Model Context Protocol (MCP) server that provides comprehensive access to the Coinbase Advanced Trading API. The server should allow AI assistants like Claude to interact with Coinbase for trading, market data analysis, and portfolio management.

## Core Requirements

### Technical Stack

- **Node.js**: Use latest LTS (>=24.x)
- **TypeScript**: Use strict mode for type safety
- **MCP SDK**: Use the official Model Context Protocol TypeScript SDK (@modelcontextprotocol/sdk)
- **Coinbase SDK**: Use Coinbase Advanced Trade SDK (@coinbase-sample/advanced-trade-sdk-ts)
- **HTTP Server**: Use Express for serving the MCP endpoint
- **Testing**: Use Jest with comprehensive test coverage
- **Build**: Use appropriate bundler (Rollup, esbuild, or similar)
- **Code Quality**: ESLint + Prettier for consistent code style

## Architecture Principles

Design the server with pragmatic architecture and clear separation of concerns:

1. **Entry Point**: Initialize the server, load environment variables from `.env`, start HTTP server on configured port
2. **MCP Server Layer**: Handle MCP protocol (tool registration, request/response handling, JSON Schema validation), interface directly with Coinbase Advanced Trade SDK services (no intermediate abstraction layers)

Keep the architecture simple and direct:

- Use SDK services directly without unnecessary abstraction layers
- Add intermediate layers only when complexity or requirements demand it
- Dependency injection via constructor for testability
- Comprehensive error handling at MCP layer
- Consistent response formatting for all tools

## Design Philosophy

This project follows principles from "A Philosophy of Software Design" by John Ousterhout, focused on systematically reducing complexity. **Complexity is anything that makes software hard to understand or modify** and is the primary enemy of good software design.

### Core Principles

- **Test-Driven Design**: Use tests to drive design decisions. If something is hard to test, it's probably badly designed. Tests provide feedback on API clarity and usability. Write tests first to clarify requirements and design, then implement to satisfy tests. Refactor design based in order to adhere to these principles as needed. Only then, write the next test.

- **Deep Modules**: Modules should provide significant functionality through simple, minimal interfaces. Large implementation behind small, clear API. Small classes are not inherently a quality metric.

- **Information Hiding**: Hide design decisions, not just data. Everything that could change should be behind an abstraction. APIs must protect against future changes. Consequence: Getters/setters are often a design flaw.

- **Stable Abstractions**: Good abstractions rarely change. Bad abstractions create chain reactions across the codebase. Introduce abstractions sparingly and deliberately - each is an investment and a risk.

- **Fight Complexity Early**: Small design weaknesses grow exponentially. "Refactor later" rarely works. Design is continuous, not a separate phase. Technical debt is real debt with compounding interest.

- **Avoid Configuration Explosion**: Configurability creates hidden complexity through combinatorial state. Only make configurable what truly varies across deployments. Flexibility has a price.

- **Errors Are Part of the Design**: Error handling is not an afterthought - it fundamentally shapes APIs. Exceptions, error codes, and retries must be considered upfront. Good APIs make error handling simple and consistent.

- **Design for Readers, Not Writers**: Code is read 10x more than written. Optimize for understanding, not typing convenience. Clarity beats clevity. Less clever, more obvious.

- **Comments Explain "Why", Not "What"**: Document intention and design decisions, not implementation. The code explains what it does; comments explain why. Good comments reduce cognitive load and are not a code smell.

- **Readability Over Cleverness**: Reduce cognitive load through clear, straightforward code. Avoid obscure language features and clever tricks.

- **Meaningful Names**: Names carry meaning and reduce the need for comments. They are part of the abstraction and should be chosen carefully.

- **Single Responsibility Principle** (correctly understood): A module has one reason to change, not "one small task." Deep modules can be SRP-compliant.

- **Continuous Refactoring**: Clean up and improve continuously. Fight complexity early and consistently rather than accumulating technical debt.

- **Tests as Design Feedback**: Tests force clear APIs. If something is hard to test, it's probably badly designed.

- **Consistency**: Uniform patterns and conventions reduce mental friction and cognitive load across the codebase.

- **YAGNI (You Aren't Gonna Need It)**: Don't add functionality or abstraction until it's actually needed. Every abstraction has a cost. Speculative design creates complexity without proven value. Build what you need now, not what you might need later.

### Application to This Project

- **Deep Modules**: `CoinbaseMcpServer` provides 44 trading tools through simple, consistent MCP interface
- **Information Hiding**: MCP layer hides SDK implementation details from clients; internal service instances are private
- **Stable Abstractions**: MCP tool interfaces remain consistent even as underlying Coinbase SDK evolves
- **Early Complexity Management**: 100% test coverage requirement enforces good design from the start
- **Minimal Configuration**: Only essential environment variables (API credentials, port)
- **Integrated Error Handling**: Consistent error response format across all MCP tools
- **Reader-Focused Design**: Clear naming, comprehensive JSDoc, obvious code flow
- **Intentional Comments**: JSDoc explains design decisions and API quirks (e.g., timestamp conversion), not implementation
- **YAGNI Applied**: No Service/Repository layers until actually needed; direct SDK usage is simpler and sufficient

## Required MCP Tools

Implement comprehensive MCP tools covering all major Coinbase Advanced Trading API capabilities. Reference the [Coinbase Advanced Trade API documentation](https://docs.cdp.coinbase.com/advanced-trade/) for complete endpoint details.

### Tool Categories

**Accounts**

- List all accounts with balances
- Get specific account details

**Orders**

- List orders with filtering
- Get order details
- Create buy/sell orders
- Preview orders before creation
- Cancel orders
- Edit existing orders
- Preview order edits
- Close positions
- Get executed trades (fills)

**Products & Market Data**

- List all tradable products
- Get product details
- Get order books
- Get historical candlestick data
- Get recent market trades
- Get best bid/ask prices

**Public Data (No Authentication)**

- Public versions of product data endpoints
- Server time

**Portfolios**

- List, create, get, edit, delete portfolios
- Move funds between portfolios

**Currency Conversion**

- Create conversion quotes
- Commit conversion trades
- Get conversion details

**Fees**

- Get transaction summary and fee tiers

**Payment Methods**

- List and get payment method details

**Futures**

- List positions, get specific positions
- Balance summary
- Futures sweeps

**Perpetuals**

- List positions, get specific positions
- Portfolio summary and balance

**API Information**

- Get current API key permissions

## Built-in Trading Prompt

Create a built-in prompt that helps users understand how to use the trading tools effectively. It should include:

- Overview of available capabilities
- Trading best practices (preview before creating orders, check balances first, etc.)
- Fee considerations
- Recommended workflows for common tasks

## Critical Requirements

### Authentication

Use environment variables for Coinbase API credentials:

- API Key Name (format: `organizations/xxx/apiKeys/yyy`)
- Private Key (PEM format)
- Optional PORT configuration (default: 3000)

Store credentials in `.env` file, never commit them to version control.

### Error Handling

- Wrap all Coinbase SDK calls in proper error handling
- Return errors in consistent MCP format
- Provide meaningful error messages for debugging

### Response Format

All MCP tools should return responses in the standard MCP format with JSON-serialized content.

### API Quirks

Be aware that some Coinbase endpoints may have specific requirements (e.g., timestamp formats). Handle these appropriately based on the API documentation.

## Testing Requirements

Implement comprehensive testing with Jest:

- Aim for 100% code coverage across all metrics
- Test all MCP tools
- Test error handling and edge cases
- Mock external dependencies (Coinbase SDK)
- Use clear test naming conventions
- Include tests for server initialization, tool invocation, and response formatting

## Code Quality Standards

### TypeScript

- Enable strict mode for maximum type safety
- Avoid `any` types
- Provide explicit return types on public methods
- Follow standard TypeScript conventions

### Code Style

- Use ESLint with TypeScript plugin
- Use Prettier for consistent formatting
- Follow common naming conventions (PascalCase for classes, camelCase for methods, etc.)

### Documentation

- Add JSDoc comments to public APIs
- Document any non-obvious behavior
- Include links to Coinbase API documentation where relevant

## Project Configuration

### Package Configuration

- Project name: `coinbase-mcp-server`
- License: MIT
- Author: Alexander Rose
- Use ES modules (`"type": "module"`)
- Include appropriate scripts: build, start, test, lint, format

### TypeScript Configuration

- Target ES2022
- Strict mode enabled
- Generate declaration files
- Output to dist directory

### Development Tools

- Configure Jest for TypeScript with ESM support
- Set up coverage thresholds (aim for 100%)
- Configure build tool (Rollup or similar)
- Set up ESLint and Prettier

### Claude Code Integration

Create `.claude/settings.json` to automatically connect the MCP server when using Claude Code in this project directory.

## Documentation

### README.md

Create a comprehensive README with:

- Quick start guide (from getting Coinbase credentials to running first trade)
- Installation instructions
- Configuration details
- Usage examples
- Tool overview
- Architecture explanation
- Development instructions

### CONTRIBUTING.md

Include contributor guidelines:

- Setup instructions
- Testing requirements
- Code style
- Commit conventions
- How to add new tools

### LICENSE

Use MIT License with copyright attribution to Alexander Rose.

### Claude Code Memory

Set up `.claude/CLAUDE.md` as project memory for team instructions, and use `.claude/rules/` for modular guidelines on architecture, code style, testing, and workflows.

## Development Experience

### Local Development

- Provide a development mode with hot-reload using `tsx --watch`
- Support MCP Inspector for testing tools interactively
- Use environment variables for configuration

### Express Server

- Create HTTP server listening on configurable port (default: 3000)
- Expose MCP endpoint for Claude Code to connect to
- Use Express with minimal middleware

## Testing & Validation

### MCP Inspector

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) tool to test the server interactively:

- Verify tool registration and schemas
- Test tool invocations with various parameters
- Debug error handling
- Validate response formats

### Integration Testing

Once the server is built:

1. Test with MCP Inspector first
2. Connect to Claude Code and validate basic operations
3. Test error scenarios and edge cases
4. Verify all tools work as expected
5. Check that built-in prompts provide useful guidance

## User Experience

The end result should allow users to:

1. Get Coinbase API credentials
2. Clone the repo and run `npm install`
3. Create `.env` with their credentials
4. Run `npm start`
5. Open Claude Code and immediately start trading

The experience should be seamless - Claude Code should automatically connect to the MCP server and have access to all trading tools.

## Development Approach & Implementation

This project follows the iterative development approach recommended by the MCP documentation:

### Development Principles

1. **Start with core functionality first**: Implement basic account and product data access before complex trading operations
2. **Test each component thoroughly**: Use MCP Inspector to validate each tool before moving to the next
3. **Iterate to add features**: Build up capabilities incrementally rather than all at once
4. **Keep security in mind**: Validate all inputs, handle errors gracefully, never expose credentials
5. **Document well**: Clear JSDoc comments and architectural documentation for future maintenance
6. **Follow MCP specifications carefully**: Adhere to the protocol for resources, tools, and prompts

### Key MCP Features to Implement

- **Tools**: All Coinbase API operations exposed as callable tools
- **Tool Schemas**: Proper JSON Schema validation for all parameters
- **Prompts**: Built-in trading assistant prompt with best practices
- **Error Handling**: Consistent error responses in MCP format
- **Transport**: HTTP/SSE transport for Claude Code integration

### Iteration Plan

1. Set up basic MCP server structure and Express HTTP server
2. Implement account and product listing tools (read-only operations)
3. Add market data tools (candles, order books, trades)
4. Implement order preview and creation (with careful validation)
5. Add portfolio and conversion tools
6. Add futures and perpetuals tools
7. Polish error handling and add comprehensive tests
8. Create documentation and setup guides

## Success Criteria

The project is complete when:

- All major Coinbase Advanced Trading API endpoints are accessible via MCP tools
- Comprehensive test coverage with all tests passing
- TypeScript compiles without errors
- Code passes linting and formatting checks
- MCP Inspector successfully connects and can invoke tools
- Claude Code can execute trades and queries through the server
- Documentation is complete and accurate
- No sensitive data in repository (credentials, API keys, etc.)

The server should be production-ready, well-tested, and easy for other developers to understand and contribute to.

Create a plan first and write it to PLAN.md before starting implementation.
