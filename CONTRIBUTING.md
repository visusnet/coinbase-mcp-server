# Contributing to Coinbase MCP Server

Thank you for your interest in contributing! This project welcomes contributions from everyone.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/coinbase-mcp-server.git
   cd coinbase-mcp-server
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Set up your environment**:

   ```bash
   cp .env.example .env
   # Add your Coinbase API credentials to .env
   ```

## Development Workflow

### Running the Server

```bash
npm run start:dev    # Development mode with hot-reload
npm start            # Production mode
npm run inspect      # Debug with MCP Inspector
```

### Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

**We aim for 100% test coverage.** Please add tests for any new features or bug fixes.

### Code Quality

```bash
npm run lint         # Check code style
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run test:types   # Check TypeScript types
npm run knip         # Check for dependency issues
```

Before submitting a PR, ensure:

- ✅ All tests pass (`npm test`)
- ✅ Test coverage is maintained at 100% (`npm run test:coverage`)
- ✅ No dependency issues (`npm run knip`)
- ✅ Code is formatted (`npm run format`)
- ✅ No linting errors (`npm run lint`)
- ✅ TypeScript compiles (`npm run test:types`)

## Making Changes

1. **Create a branch** for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project structure:
   - `src/server/CoinbaseMcpServer.ts` - Main server implementation
   - `src/server/CoinbaseMcpServer.spec.ts` - Server tests
   - `src/index.ts` - Entry point

3. **Write tests** for your changes
   - Add unit tests in corresponding `.spec.ts` files
   - Use existing tests as examples
   - Mock external dependencies (see `src/test/serviceMocks.ts`)

4. **Update documentation** if needed:
   - Update README.md for user-facing changes
   - Update tool descriptions if adding new MCP tools

5. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test changes
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

6. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** on GitHub

## Pull Request Guidelines

- **Keep PRs focused** - One feature/fix per PR
- **Write clear descriptions** - Explain what and why
- **Include tests** - PRs without tests may not be merged
- **Update documentation** - Keep README and comments current
- **Ensure CI passes** - All automated checks must pass

## Adding New MCP Tools

When adding new tools to interact with Coinbase API:

1. **Register the tool** in `registerToolsForServer()`:

   ```typescript
   server.registerTool(
     'tool_name',
     {
       title: 'Tool Title',
       description: 'Clear description of what it does',
       inputSchema: {
         param: z.string().describe('Parameter description'),
       },
     },
     this.call(this.service.method.bind(this.service)),
   );
   ```

2. **Add tests** in `CoinbaseMcpServer.spec.ts`:
   - Test successful calls
   - Test error handling
   - Mock the service response

3. **Update the prompt** in `registerPromptsForServer()` to include the new tool

4. **Document in README.md** under the Features section

## Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Follow existing configuration
- **Prettier** - Auto-formatting on save
- **Naming conventions**:
  - camelCase for variables and functions
  - PascalCase for classes and types
  - UPPER_CASE for constants

## Questions or Issues?

- Open an issue on GitHub for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
