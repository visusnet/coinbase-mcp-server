# Core Standards

Essential standards that apply to all code in this project.

## TypeScript
- Strict mode enabled
- No `any` or `unknown` types - use proper types
- Explicit return types on public methods
- Explicit access modifiers (`public`, `private`, `protected`)
- Use `readonly` for immutable properties
- Prefer `const` over `let` where possible
- Avoid raw promises (use `async`/`await`)
- ES modules (import/export), not CommonJS

## Code Style
- Classes: PascalCase (`CoinbaseMcpServer`)
- Methods: camelCase (`listAccounts()`)
- Constants: SCREAMING_SNAKE_CASE (`DEFAULT_PORT`)

## Design Principles
- **YAGNI**: No abstraction until needed
- **Deep Modules**: Simple interface, significant functionality
- **Information Hiding**: Hide design decisions, not just data
- **Fight Complexity Early**: Small weaknesses grow exponentially
- **Design for Readers**: Code is read 10x more than written
- **Readability Over Cleverness**: Reduce cognitive load
- **Comments explain "why"**, not what
- **Consistency**: Uniform patterns reduce friction

## File Organization

- One class per file
- File name matches class name
- Index files (`index.ts`) for clean imports
- Tests colocated next to source files (`.spec.ts`)

## Error Handling
- Never swallow errors
- Wrap SDK calls in try-catch
- Meaningful error messages with context
- Validate inputs before expensive operations
- Consistent MCP error format

## Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Run tests before commit
- 100% coverage required

## Security Best Practices
- **Never log credentials**: Filter API keys from all logs
- **Validate all inputs**: Use Zod schema validation
- **Environment variables**: Store secrets in `.env`, never hardcode
- **No credentials in repository**: `.env` in `.gitignore`

## Common Pitfalls
1. Forgetting tests → Always maintain 100% coverage
2. Not handling errors → Wrap all SDK calls in try-catch
3. Hardcoding values → Use environment variables or constants
4. Ignoring TypeScript errors → Never use `@ts-ignore`
5. Inconsistent responses → Follow MCP error/response format
