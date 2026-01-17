# Developer Experience Analysis

## Executive Summary

The coinbase-mcp-server project demonstrates a **strong focus on developer experience** with excellent documentation, comprehensive tooling, and thoughtful workflow design. The project excels in setup simplicity, development workflow automation, and debugging capabilities. However, there are opportunities to improve error messages, CLI discoverability, and first-run experience guidance.

### Key Strengths

- **Exceptional setup process**: 5-minute promise from zero to first trade is achievable
- **Outstanding documentation**: README, CONTRIBUTING, CLAUDE.md provide comprehensive coverage
- **Excellent development tooling**: Hot-reload, MCP Inspector, comprehensive test suite
- **Strong quality gates**: 100% test coverage requirement, lint, format, type-checking
- **Auto-configuration**: .claude/settings.json eliminates manual MCP setup
- **Clear architectural guidance**: YAGNI principle, deep modules, minimal abstraction

### Key Concerns

- **Error messages lack actionable guidance**: Missing "next steps" and troubleshooting links
- **No interactive CLI help**: Cannot run `npm start --help` or discover commands easily
- **Missing validation feedback**: .env validation happens only at startup, not during creation
- **No first-run wizard**: Users must manually edit .env without guided assistance
- **Limited debugging output**: Production mode has minimal logging for troubleshooting
- **No health check endpoint**: Cannot verify server is running and configured correctly

### Overall Assessment

**Rating: 4.2/5** - The project provides an excellent developer experience for users familiar with Node.js ecosystems and MCP servers. With targeted improvements to error handling, CLI discoverability, and first-run experience, this could easily achieve 4.5+/5.

---

## Project Assessment

### General Evaluation

The coinbase-mcp-server demonstrates **mature engineering practices** with a focus on simplicity and maintainability. The codebase follows modern TypeScript best practices, uses industry-standard tooling (Jest, ESLint, Prettier, Rollup), and maintains excellent documentation discipline.

**Maturity Indicators:**
- Well-defined project structure with clear separation of concerns
- Comprehensive test coverage (100% requirement)
- Multiple quality gates (lint, format, type-check, knip)
- Conventional commits and clear contribution guidelines
- Auto-configuration for target environment (Claude Code)
- Production-ready build pipeline

**Areas for Growth:**
- Runtime error handling and user feedback
- Interactive tooling and CLI experience
- Observability and debugging in production
- First-time user onboarding flow

### Comparison to Industry Standards

| Aspect | This Project | Industry Standard | Assessment |
|--------|--------------|-------------------|------------|
| **Documentation** | Excellent (README, CONTRIBUTING, CLAUDE.md) | Good (README, basic docs) | **Exceeds** ✓ |
| **Setup Time** | ~5 minutes | ~10-15 minutes | **Exceeds** ✓ |
| **Development Scripts** | Comprehensive (12+ scripts) | Adequate (5-7 scripts) | **Exceeds** ✓ |
| **Hot Reload** | Yes (tsx --watch) | Often missing | **Exceeds** ✓ |
| **Test Coverage** | 100% required | 80%+ typical | **Exceeds** ✓ |
| **Error Messages** | Basic | Actionable with links | **Below** ✗ |
| **CLI Help** | None | --help flags | **Below** ✗ |
| **Health Checks** | None | /health endpoint | **Below** ✗ |
| **Logging** | Minimal | Structured logging | **Below** ✗ |
| **First-Run UX** | Manual .env edit | Interactive wizard | **Below** ✗ |

### Overall Rating: 4.2/5

**Justification:**
- **+1.0** for exceptional documentation and setup clarity
- **+1.0** for comprehensive development tooling and hot-reload
- **+1.0** for quality gates and testing discipline
- **+0.7** for auto-configuration and thoughtful architecture
- **+0.5** for MCP Inspector integration and debugging tools
- **-0.5** for missing CLI help and command discoverability
- **-0.3** for basic error messages lacking guidance
- **-0.2** for missing health checks and structured logging

The project excels in areas that impact daily development productivity but has room for improvement in runtime user experience and error recovery.

---

## Findings

### 1. Error Messages Lack Actionable Guidance

**Severity:** High

**Problem:**

Current error messages provide minimal context and no guidance for resolution:

```typescript
// src/index.ts line 12-16
if (!apiKeyName || !privateKey) {
  console.error(
    'Error: COINBASE_API_KEY_NAME and COINBASE_PRIVATE_KEY environment variables must be set',
  );
  process.exit(1);
}
```

**Issues:**
- No indication of *where* to set these variables (.env file, export command)
- No link to setup documentation or .env.example
- No validation of credential *format* (PEM structure, key name pattern)
- Generic console.error doesn't stand out in terminal output
- No exit code differentiation (always exits with 1)
- Error appears after user has already invested time in npm install
- No suggestion to check if .env file exists or has correct syntax

**Impact on Developer Experience:**
- First-time users get stuck and must search documentation
- No clear "next step" - frustrating user experience
- Difficult to distinguish between "missing .env" vs "wrong format" vs "empty values"
- No feedback loop for iterative problem solving

**Options:**

**Option 1: Enhanced Console Error Messages**
```typescript
if (!apiKeyName || !privateKey) {
  console.error('\n❌ Configuration Error: Missing Coinbase API Credentials\n');
  console.error('Required environment variables:');
  console.error('  - COINBASE_API_KEY_NAME');
  console.error('  - COINBASE_PRIVATE_KEY\n');
  console.error('How to fix:');
  console.error('  1. Copy .env.example to .env:');
  console.error('     cp .env.example .env');
  console.error('  2. Add your credentials to .env');
  console.error('  3. Get credentials: https://portal.cdp.coinbase.com/\n');
  console.error('See README.md "Getting Started" section for detailed instructions.\n');
  process.exit(1);
}
```
*Pros:* Simple, no dependencies, immediate improvement
*Cons:* Still text-based, no validation of credential format

**Option 2: Dedicated Error Class with Structured Output**
```typescript
class ConfigurationError extends Error {
  constructor(
    message: string,
    public details: string[],
    public docsUrl: string
  ) {
    super(message);
  }

  print(): void {
    console.error('\n❌', this.message);
    this.details.forEach(d => console.error('  -', d));
    console.error('\n📚 Documentation:', this.docsUrl, '\n');
  }
}
```
*Pros:* Reusable, testable, consistent error formatting
*Cons:* Requires refactoring, overkill for startup validation

**Option 3: Interactive Validation with Chalk/Colors**
```typescript
import chalk from 'chalk';

if (!apiKeyName || !privateKey) {
  console.error(chalk.red.bold('\n✖ Missing API Credentials\n'));
  console.error(chalk.yellow('Expected:'));
  console.error(chalk.gray('  COINBASE_API_KEY_NAME=organizations/.../apiKeys/...'));
  console.error(chalk.gray('  COINBASE_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----...'));

  console.error(chalk.yellow('\nQuick fix:'));
  console.error(chalk.cyan('  cp .env.example .env'));
  console.error(chalk.cyan('  # Edit .env with your credentials'));

  console.error(chalk.yellow('\nGet credentials:'));
  console.error(chalk.blue.underline('  https://portal.cdp.coinbase.com/'));
  console.error('');
  process.exit(1);
}
```
*Pros:* Visual hierarchy, color-coded severity, professional appearance
*Cons:* Adds chalk dependency (lightweight: 5KB)

**Recommended Option: Option 3 - Interactive Validation with Chalk**

**Rationale:**
- Provides the most significant UX improvement with minimal cost
- Chalk is industry-standard (100M+ weekly downloads), tiny size
- Colors significantly improve scannability in terminal output
- Sets precedent for better error handling throughout the codebase
- Can be extended to validate credential *format* (e.g., PEM structure, key pattern)
- Aligns with modern CLI tool expectations (Vite, Next.js, etc. all use colors)
- Professional appearance builds user confidence in the tool

**Additional Validation to Add:**
```typescript
// Validate API key format
if (apiKeyName && !apiKeyName.startsWith('organizations/')) {
  console.error(chalk.red('Invalid API key format'));
  console.error(chalk.gray('Expected: organizations/{org-id}/apiKeys/{key-id}'));
  process.exit(1);
}

// Validate PEM format
if (privateKey && !privateKey.includes('BEGIN EC PRIVATE KEY')) {
  console.error(chalk.red('Invalid private key format'));
  console.error(chalk.gray('Expected PEM format starting with:'));
  console.error(chalk.gray('-----BEGIN EC PRIVATE KEY-----'));
  process.exit(1);
}
```

---

### 2. No CLI Help or Command Discoverability

**Severity:** High

**Problem:**

The project provides no interactive help system:

```bash
$ npm start --help
# Just starts the server, ignores --help flag

$ coinbase-mcp-server --help
# No response, server starts anyway

$ npm run
# Shows all scripts but no descriptions of what they do
```

**Current State:**
- No `--help` flag support
- No `--version` flag support
- No command listing or description
- package.json scripts have no descriptions
- Users must read README to discover what commands do
- No inline documentation for CLI usage

**Developer Impact:**
- Cannot quickly check available commands without opening files
- No way to verify correct version is installed
- Difficult to remember what each npm script does
- Cognitive load: must memorize or reference docs constantly
- Poor experience for CI/CD setup (can't verify installation)

**Options:**

**Option 1: Minimal --help Flag in index.ts**
```typescript
#!/usr/bin/env node
import { CoinbaseMcpServer } from './server/CoinbaseMcpServer.js';
import { config } from 'dotenv';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Coinbase MCP Server v1.0.0

Usage:
  coinbase-mcp-server [options]

Options:
  --help, -h      Show this help message
  --version, -v   Show version number

Environment Variables:
  COINBASE_API_KEY_NAME    Your Coinbase API key
  COINBASE_PRIVATE_KEY     Your Coinbase private key (PEM format)
  PORT                     Server port (default: 3000)

Examples:
  coinbase-mcp-server
  PORT=3005 coinbase-mcp-server

Documentation: https://github.com/visusnet/coinbase-mcp-server
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('1.0.0');
  process.exit(0);
}

// ... rest of existing code
```
*Pros:* Simple, immediate, no dependencies
*Cons:* Limited functionality, just static text

**Option 2: Enhanced package.json Scripts with Descriptions**
```json
{
  "scripts": {
    "build": "rollup -c # Build project for production",
    "start": "node dist/index.js # Start production server (requires build first)",
    "start:dev": "tsx --watch src/index.ts # Start development server with hot-reload",
    "inspect": "CLIENT_PORT=3000 npx @modelcontextprotocol/inspector@latest --config mcp.json # Open MCP Inspector for debugging",
    "test": "jest # Run all tests (100% coverage required)",
    "lint": "eslint src/ # Check code style",
    "format": "prettier --write src/ # Format code"
  }
}
```
*Pros:* Improves npm run output, zero code changes
*Cons:* Inline comments in JSON may not work in all npm versions, non-standard

**Option 3: Commander.js for Full CLI**
```typescript
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const program = new Command();

program
  .name('coinbase-mcp-server')
  .description('MCP server for Coinbase Advanced Trading API')
  .version(pkg.version)
  .option('-p, --port <number>', 'Server port', '3000')
  .option('--log-level <level>', 'Log level (debug|info|warn|error)', 'info')
  .action((options) => {
    const port = parseInt(options.port, 10);
    const server = new CoinbaseMcpServer(apiKeyName, privateKey);
    server.listen(port);
  });

program.parse();
```
*Pros:* Professional CLI, auto-generated help, option parsing, extensible
*Cons:* Adds dependency (commander.js ~50KB), requires refactoring

**Recommended Option: Option 1 + Option 2 (Hybrid)**

**Rationale:**
- **Option 1** provides immediate value with zero dependencies
- **Option 2** improves daily workflow for developers using npm scripts
- Combined approach addresses both production CLI and development workflow
- Can be implemented quickly without architectural changes
- Sets foundation for future Option 3 upgrade if needed

**Implementation Details:**

1. Add --help and --version to src/index.ts (Option 1)
2. Create a SCRIPTS.md file documenting all npm commands:
```markdown
# Available Commands

## Development
- `npm run start:dev` - Start development server with hot-reload (uses tsx)
- `npm run inspect` - Open MCP Inspector at http://localhost:6274

## Production
- `npm run build` - Build project (outputs to dist/)
- `npm start` - Start production server (requires build first)

## Testing
- `npm test` - Run all tests (requires 100% coverage to pass)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

## Code Quality
- `npm run lint` - Check code style (ESLint)
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code (Prettier)
- `npm run test:types` - Type-check TypeScript
- `npm run knip` - Check for unused dependencies
```

3. Reference SCRIPTS.md from README and CONTRIBUTING.md
4. Add to README's "Getting Started" section:
```markdown
> **Tip:** Run `coinbase-mcp-server --help` for CLI options
> or see SCRIPTS.md for all available npm commands.
```

---

### 3. Missing .env Validation and First-Run Experience

**Severity:** High

**Problem:**

The .env file setup is entirely manual with no validation or guidance:

**Current Flow:**
1. User runs `cp .env.example .env` (if they read the docs)
2. User manually edits .env in text editor
3. User runs `npm start`
4. If credentials wrong → cryptic error from Coinbase SDK
5. User guesses what's wrong, edits .env, repeats

**Issues:**
- No validation that .env file exists before startup
- No validation that required fields are non-empty
- No validation of credential format (PEM structure, key pattern)
- No helpful error if .env is malformed (syntax error)
- No indication if .env exists but has placeholder values
- No interactive creation flow
- No verification step ("test credentials before saving")

**Real-World Pain Points:**
```
❌ User copies .env.example, forgets to fill it in → cryptic "auth failed"
❌ User pastes key without quotes → dotenv parses newlines wrong
❌ User has extra spaces in API key → silent auth failure
❌ User typos filename as .env.local → "missing vars" error
❌ User forgets to replace "YOUR_KEY_HERE" → obvious but uncaught
```

**Options:**

**Option 1: Pre-Flight .env Validator**
```typescript
// Add to src/index.ts before main()
function validateEnvFile() {
  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    console.error('❌ No .env file found');
    console.error('Run: cp .env.example .env');
    console.error('Then edit .env with your credentials\n');
    process.exit(1);
  }

  const envContent = readFileSync(envPath, 'utf-8');

  if (envContent.includes('YOUR_PRIVATE_KEY_HERE')) {
    console.error('❌ .env file still contains placeholder values');
    console.error('Edit .env and replace YOUR_PRIVATE_KEY_HERE\n');
    process.exit(1);
  }

  // More validations...
}
```
*Pros:* Catches common mistakes early, no dependencies
*Cons:* Still manual editing flow, just better errors

**Option 2: Interactive Setup Script**
```typescript
// scripts/setup.ts
import inquirer from 'inquirer';
import { writeFileSync } from 'fs';

async function setup() {
  console.log('🚀 Coinbase MCP Server Setup\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKeyName',
      message: 'Coinbase API Key Name:',
      validate: (input) => {
        if (!input.startsWith('organizations/')) {
          return 'Must start with "organizations/"';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'privateKey',
      message: 'Private Key (PEM format):',
      validate: (input) => {
        if (!input.includes('BEGIN EC PRIVATE KEY')) {
          return 'Must be in PEM format';
        }
        return true;
      }
    },
    {
      type: 'number',
      name: 'port',
      message: 'Server port:',
      default: 3000
    }
  ]);

  const envContent = `COINBASE_API_KEY_NAME=${answers.apiKeyName}
COINBASE_PRIVATE_KEY="${answers.privateKey}"
PORT=${answers.port}
`;

  writeFileSync('.env', envContent);
  console.log('✓ .env file created successfully!');
}
```

Add to package.json:
```json
{
  "scripts": {
    "setup": "tsx scripts/setup.ts"
  }
}
```
*Pros:* Best UX, catches errors before file creation, validates format
*Cons:* Adds inquirer dependency (~200KB), requires extra script

**Option 3: Validation Library (Zod + dotenv-safe)**
```typescript
import { z } from 'zod'; // Already in dependencies!
import { config } from 'dotenv';

const envSchema = z.object({
  COINBASE_API_KEY_NAME: z.string()
    .min(1, 'API key name is required')
    .startsWith('organizations/', 'Must start with "organizations/"'),
  COINBASE_PRIVATE_KEY: z.string()
    .min(1, 'Private key is required')
    .includes('BEGIN EC PRIVATE KEY', 'Must be PEM format'),
  PORT: z.string().regex(/^\d+$/, 'Must be a number').optional(),
});

function loadValidatedEnv() {
  config({ quiet: true });

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment Validation Failed:\n');
    result.error.errors.forEach(err => {
      console.error(`  ${err.path[0]}: ${err.message}`);
    });
    console.error('\nEdit your .env file and try again.\n');
    process.exit(1);
  }

  return result.data;
}
```
*Pros:* Uses existing dependency (Zod), type-safe, descriptive errors
*Cons:* Still manual .env editing, no interactive flow

**Recommended Option: Option 3 with Option 1 enhancements**

**Rationale:**
- **Zod is already a dependency** - zero new packages
- Provides type-safe environment variables (DX win)
- Validates format before server starts (fail-fast principle)
- Descriptive error messages guide user to fix
- Can be extended to validate more complex rules
- Aligns with project's existing use of Zod for input validation

**Implementation Plan:**

1. Create `src/env.ts`:
```typescript
import { z } from 'zod';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

const envSchema = z.object({
  COINBASE_API_KEY_NAME: z.string()
    .min(1, 'API key name is required')
    .refine(
      val => val.startsWith('organizations/'),
      'Must start with "organizations/" (e.g., organizations/xxx/apiKeys/yyy)'
    ),
  COINBASE_PRIVATE_KEY: z.string()
    .min(1, 'Private key is required')
    .refine(
      val => val.includes('BEGIN EC PRIVATE KEY') && val.includes('END EC PRIVATE KEY'),
      'Must be in PEM format with BEGIN/END markers'
    ),
  PORT: z.string()
    .regex(/^\d+$/, 'Must be a valid port number')
    .transform(val => parseInt(val, 10))
    .optional()
    .default('3000'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  // Check if .env exists
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    console.error('\n❌ No .env file found\n');
    console.error('Quick start:');
    console.error('  1. cp .env.example .env');
    console.error('  2. Edit .env with your Coinbase credentials');
    console.error('  3. Get credentials: https://portal.cdp.coinbase.com/\n');
    console.error('See README.md for detailed instructions.\n');
    process.exit(1);
  }

  // Load .env
  config({ quiet: true });

  // Validate
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ Invalid .env configuration\n');
    result.error.errors.forEach(err => {
      const field = err.path[0];
      const message = err.message;
      console.error(`  ${field}:`);
      console.error(`    ${message}`);
    });
    console.error('\nEdit your .env file and try again.\n');
    process.exit(1);
  }

  return result.data;
}
```

2. Update `src/index.ts`:
```typescript
#!/usr/bin/env node
import { CoinbaseMcpServer } from './server/CoinbaseMcpServer.js';
import { loadEnv } from './env.js';

function main() {
  const env = loadEnv(); // Handles all validation

  const server = new CoinbaseMcpServer(
    env.COINBASE_API_KEY_NAME,
    env.COINBASE_PRIVATE_KEY
  );
  server.listen(env.PORT);
}

main();
```

**Future Enhancement:** Add `npm run setup` script (Option 2) later if user feedback indicates need for interactive flow.

---

### 4. Minimal Logging and Observability

**Severity:** Medium

**Problem:**

Production server has minimal logging, making troubleshooting difficult:

**Current Logging:**
```typescript
// src/index.ts - Only startup message
console.log(`Coinbase MCP Server listening on port ${port}`);

// src/server/CoinbaseMcpServer.ts - Only errors
console.error('Error handling MCP request:', error);
```

**Missing Information:**
- No request/response logging (can't debug what MCP client sent)
- No timing information (can't identify slow operations)
- No structured logging format (can't parse or filter logs)
- No log levels (can't reduce verbosity in production)
- No correlation IDs (can't trace request through system)
- No SDK error details (Coinbase API errors are swallowed)
- No startup configuration logging (can't verify what server loaded)

**Real-World Scenarios Where This Hurts:**
```
❌ User reports "tool not working" - no logs to diagnose
❌ Server slow - no timing data to identify bottleneck
❌ Authentication fails - can't see what SDK returned
❌ Client sends malformed request - no request logging
❌ Production issue - can't enable debug without restarting
```

**Options:**

**Option 1: Console-Based Structured Logging**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  constructor(private minLevel: LogLevel = 'info') {}

  private log(level: LogLevel, message: string, meta?: object) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.minLevel]) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    console.log(JSON.stringify(entry));
  }

  debug(msg: string, meta?: object) { this.log('debug', msg, meta); }
  info(msg: string, meta?: object) { this.log('info', msg, meta); }
  warn(msg: string, meta?: object) { this.log('warn', msg, meta); }
  error(msg: string, meta?: object) { this.log('error', msg, meta); }
}

// Usage
const logger = new Logger(process.env.LOG_LEVEL as LogLevel);
logger.info('Server started', { port: 3000 });
logger.error('Request failed', { error: err.message, stack: err.stack });
```
*Pros:* Simple, no dependencies, parseable JSON output
*Cons:* Not human-readable in development, basic features only

**Option 2: Pino (High-Performance Logger)**
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty', // Human-readable in dev
    options: { colorize: true }
  }
});

// Usage
logger.info({ port: 3000 }, 'Server started');
logger.error({ err, requestId }, 'Request failed');

// Timing
const start = Date.now();
// ... operation ...
logger.info({ duration: Date.now() - start }, 'Operation complete');
```
*Pros:* Very fast (benchmarked fastest in Node.js), mature, child loggers
*Cons:* Adds pino + pino-pretty dependencies (~500KB)

**Option 3: Winston (Feature-Rich Logger)**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple() // Human-readable
    }),
    new winston.transports.File({
      filename: 'coinbase-mcp.log',
      format: winston.format.json() // Structured
    })
  ]
});
```
*Pros:* Most features (file rotation, multiple transports), widely adopted
*Cons:* Larger (~1.5MB), slower than Pino, more complex

**Recommended Option: Option 2 - Pino**

**Rationale:**
- **Performance**: Critical for MCP server (handles many requests)
- Pino is extremely fast (5-10x faster than Winston in benchmarks)
- Child loggers allow request-scoped logging (correlation IDs)
- pino-pretty provides great DX in development
- Can disable pretty-printing in production for pure JSON
- Industry adoption: Fastify, Nest.js use Pino
- Small footprint for a full-featured logger

**Implementation Example:**

```typescript
// src/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
    }
  } : undefined,
});

// src/index.ts
import { logger } from './logger.js';

function main() {
  const env = loadEnv();
  logger.info({ config: { port: env.PORT } }, 'Starting server');

  const server = new CoinbaseMcpServer(
    env.COINBASE_API_KEY_NAME,
    env.COINBASE_PRIVATE_KEY,
    logger.child({ component: 'mcp-server' }) // Child logger
  );

  server.listen(env.PORT);
  logger.info({ port: env.PORT }, 'Server listening');
}

// src/server/CoinbaseMcpServer.ts
export class CoinbaseMcpServer {
  constructor(
    apiKey: string,
    privateKey: string,
    private logger: Logger = pino() // Accept logger
  ) {
    this.logger.debug('Initializing MCP server');
  }

  private async handleRequest(req: Request) {
    const requestId = randomUUID();
    const reqLogger = this.logger.child({ requestId });

    reqLogger.info({ method: req.method, url: req.url }, 'Request received');

    try {
      const start = Date.now();
      const result = await this.processRequest(req);
      reqLogger.info({ duration: Date.now() - start }, 'Request completed');
      return result;
    } catch (err) {
      reqLogger.error({ err }, 'Request failed');
      throw err;
    }
  }
}
```

**Key Logging Points to Add:**
1. Server startup (port, config loaded)
2. Each MCP request (tool name, params, duration)
3. SDK calls to Coinbase (endpoint, duration, errors)
4. Validation failures (what was invalid)
5. Server shutdown (graceful)

---

### 5. No Health Check Endpoint

**Severity:** Medium

**Problem:**

The server provides no way to verify it's running and healthy:

**Current State:**
- Only endpoint is POST /mcp (MCP protocol)
- GET /mcp returns 405 Method Not Allowed
- No /health or /ping endpoint
- No way to verify credentials without making a real API call
- No readiness probe for Kubernetes/Docker deployments
- Cannot distinguish "server down" from "server unhealthy"

**Impact:**
- CI/CD: Cannot verify deployment succeeded
- Monitoring: Cannot set up health checks (Datadog, New Relic, etc.)
- Development: Must test with real MCP client to verify server works
- Debugging: Cannot quickly check "is server responding?"
- Docker: No HEALTHCHECK instruction possible
- Users: Cannot verify setup worked before configuring MCP client

**Options:**

**Option 1: Basic Ping Endpoint**
```typescript
// src/server/CoinbaseMcpServer.ts
private setupRoutes(): void {
  // Existing routes...

  this.app.get('/ping', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}
```
*Pros:* Simplest, provides basic "server is running" check
*Cons:* Doesn't verify credentials or Coinbase API connectivity

**Option 2: Health Endpoint with Dependency Checks**
```typescript
this.app.get('/health', async (_req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      server: 'ok',
      credentials: 'unknown',
      coinbase_api: 'unknown',
    }
  };

  // Optional: Verify credentials (not recommended - slow)
  // Could cache result for N minutes

  res.json(health);
});
```
*Pros:* More informative, can add API check
*Cons:* Complexity increases, potential for slow response

**Option 3: Separate /health and /ready Endpoints (Kubernetes Pattern)**
```typescript
// Liveness probe - always returns 200 if server is running
this.app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// Readiness probe - checks dependencies
this.app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Quick check: Can we reach Coinbase API?
    await this.publicService.getServerTime(); // No auth required

    res.json({
      status: 'ready',
      checks: {
        coinbase_api: 'ok',
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      checks: {
        coinbase_api: 'error',
      },
      error: err.message,
    });
  }
});
```
*Pros:* Industry standard, separates liveness vs readiness, K8s-friendly
*Cons:* Two endpoints to maintain, /ready might be slow

**Recommended Option: Option 3 - Separate /health and /ready**

**Rationale:**
- **Industry standard**: Kubernetes, Docker, cloud platforms expect this pattern
- `/health` for liveness: "Is the process running?"
- `/ready` for readiness: "Can it serve traffic?"
- Separation allows proper monitoring setup
- `/health` is fast (always returns immediately)
- `/ready` can do actual verification (acceptable if slow)
- Future-proof for containerization
- Enables proper monitoring/alerting setup

**Implementation:**

```typescript
// src/server/CoinbaseMcpServer.ts

private setupRoutes(): void {
  // Liveness probe
  this.app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '1.0.0', // Could import from package.json
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe
  this.app.get('/ready', async (_req: Request, res: Response) => {
    const checks: Record<string, string> = {
      server: 'ok',
    };

    try {
      // Test Coinbase API connectivity (no auth required)
      const startTime = Date.now();
      await this.publicService.getServerTime();
      const duration = Date.now() - startTime;

      checks.coinbase_api = 'ok';
      checks.coinbase_latency_ms = String(duration);

      res.json({
        status: 'ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      checks.coinbase_api = 'error';

      this.logger?.warn({ err }, 'Readiness check failed');

      res.status(503).json({
        status: 'not_ready',
        checks,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Existing MCP routes...
}
```

**Benefits:**
```bash
# Quick check: Is server running?
$ curl http://localhost:3000/health
{"status":"ok","version":"1.0.0","uptime":45.2}

# Deep check: Can it reach Coinbase?
$ curl http://localhost:3000/ready
{"status":"ready","checks":{"coinbase_api":"ok","coinbase_latency_ms":"124"}}

# Use in Dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

# Use in docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 3s
  retries: 3

# Use in Kubernetes
livenessProbe:
  httpGet:
    path: /health
    port: 3000
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
```

---

### 6. Hot-Reload Not Documented in README

**Severity:** Low

**Problem:**

The project has excellent hot-reload via `npm run start:dev`, but this is not mentioned in the README's "Getting Started" section.

**Current Documentation:**
- README says: `npm start` (no hot-reload)
- CONTRIBUTING.md says: `npm run start:dev` (hot-reload)
- New users follow README → use `npm start` → must restart manually on every change
- Frustrating development experience until they discover start:dev

**Impact:**
- New contributors waste time restarting server manually
- README doesn't showcase the excellent DX the project provides
- Misalignment between "quick start" and "best practices"

**Options:**

**Option 1: Mention in README Getting Started**
```markdown
### 4. Start the Server

For production:
```bash
npm start
```

For development (with hot-reload):
```bash
npm run start:dev
```

You should see: `Coinbase MCP Server running on http://localhost:3005/mcp`
```
*Pros:* Simple addition, helps new users
*Cons:* Slightly longer README section

**Option 2: Make start:dev the Default in Getting Started**
```markdown
### 4. Start the Server (Development Mode)

```bash
npm run start:dev
```

The server will start with hot-reload enabled. Any changes to TypeScript files will automatically restart the server.

You should see: `Coinbase MCP Server running on http://localhost:3005/mcp`

> **Note:** For production deployment, use `npm run build && npm start` instead.
```
*Pros:* Optimizes for common case (development), showcases DX
*Cons:* Production users might miss the note

**Option 3: Add Development Workflow Section**
```markdown
## Development Workflow

### Quick Start (Development)
```bash
npm run start:dev    # Auto-reload on file changes
npm run inspect      # Open MCP Inspector (separate terminal)
```

The `start:dev` script uses `tsx --watch` for instant feedback:
- Edit any `.ts` file
- Server restarts automatically
- Test changes immediately in Claude or MCP Inspector

### Production Build
```bash
npm run build        # Compile TypeScript
npm start            # Run compiled code
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full development guide.
```
*Pros:* Comprehensive, covers both workflows, doesn't clutter Getting Started
*Cons:* Adds new section, slightly longer README

**Recommended Option: Option 2**

**Rationale:**
- README is primarily for developers (not production operators)
- Development mode should be the default in Getting Started
- Hot-reload is a significant DX feature worth highlighting
- Production users will read beyond "Getting Started"
- Aligns with how modern tools document (Vite, Next.js default to dev mode)
- Simple note covers production use case

**Additional Enhancement:**
Add to README's "Features" or "Development" section:
```markdown
### Excellent Developer Experience

- **Hot-reload**: Instant feedback with `npm run start:dev` (tsx --watch)
- **MCP Inspector**: Visual debugging at http://localhost:6274
- **Type-safe**: Full TypeScript with strict mode
- **100% test coverage**: Comprehensive test suite with Jest
- **Auto-formatting**: Prettier + ESLint on save
- **Fast feedback**: All checks run in <10 seconds
```

---

### 7. MCP Inspector Not Discoverable

**Severity:** Low

**Problem:**

The MCP Inspector is an excellent debugging tool, but new users might not discover it:

**Current Mentions:**
- README line 278: Listed in "Scripts" section
- README line 282-284: Testing with MCP Inspector subsection
- CONTRIBUTING.md line 35: Listed in commands

**Issues:**
- Not mentioned in "Getting Started" flow
- Not mentioned in "Troubleshooting" section
- Users might try to debug with curl/Postman (wrong approach for MCP)
- No screenshot or visual showing what Inspector provides
- URL (localhost:6274) not obvious until you run it

**Developer Impact:**
- Wasted time trying to manually test MCP protocol
- Miss out on visual tool exploration
- Harder debugging experience than necessary

**Options:**

**Option 1: Add to Getting Started**
```markdown
### 6. Start Trading

```bash
/trade 10 EUR from BTC dry-run
```

That's it! The trading agent will analyze the market and show you what trades it would make.

> **Tip:** Want to explore all 46 tools visually? Run `npm run inspect` and open http://localhost:6274

Remove `dry-run` to execute real trades.
```
*Pros:* Users discover tool during onboarding
*Cons:* Might distract from main getting-started flow

**Option 2: Expand Development Section**
```markdown
### Testing with MCP Inspector

The MCP Inspector provides a visual interface for testing all 46 tools:

1. Start the server: `npm run dev`
2. In another terminal: `npm run inspect`
3. Open your browser to http://localhost:6274
4. Connect to `http://localhost:3005/mcp`
5. Click "List Tools" to see all 46 available tools
6. Test any tool with a visual form (no code needed)

The Inspector is perfect for:
- Exploring available tools without coding
- Testing tool parameters before using in Claude
- Debugging tool responses
- Verifying server configuration
```
*Pros:* Comprehensive, explains value prop, clear steps
*Cons:* Requires expanding existing section

**Option 3: Add Troubleshooting Entry**
```markdown
## Troubleshooting

| Problem                 | Solution                                                      |
|-------------------------|---------------------------------------------------------------|
| "Authentication failed" | Check API key and private key format (PEM with newlines)     |
| "Server not responding" | Ensure `npm start` is running, check `.env`                  |
| "/trade not found"      | Restart Claude Code to reload commands                        |
| Tools not showing       | Verify `.claude/settings.json` exists, restart Claude         |
| Want to test tools      | Run `npm run inspect` → http://localhost:6274                |
```
*Pros:* Discoverability when users need it
*Cons:* Not proactive (user must have a problem first)

**Recommended Option: Combination of Option 2 + Option 3**

**Rationale:**
- Option 2 ensures developers discover the tool during setup
- Option 3 helps users who encounter issues later
- Together they provide proactive + reactive discoverability
- MCP Inspector is valuable enough to deserve prominent placement
- Screenshots would further improve this (but not required)

**Additional Enhancement:**
Consider adding a visual:
```markdown
### MCP Inspector

![MCP Inspector Screenshot](docs/images/mcp-inspector.png)

Visual tool for testing all 46 Coinbase tools without code:
[screenshot showing the Inspector interface]
```

*Note:* Screenshot requires creating docs/images/ and capturing Inspector UI, but significantly improves discoverability and understanding.

---

### 8. No Verification Step After Setup

**Severity:** Low

**Problem:**

After completing setup, users don't know if it worked until they try a command:

**Current Flow:**
1. User sets up .env
2. User runs `npm start`
3. Server says "listening on port 3000"
4. User opens Claude Code
5. User tries a command... does it work? Maybe? Unclear if issue is server, config, or Claude.

**Missing:**
- No "setup verification" step
- No smoke test command
- No way to confirm "credentials are valid"
- No way to test "server is reachable from Claude"
- Uncertainty until actual use

**Options:**

**Option 1: Add Verification Command**
```json
// package.json
{
  "scripts": {
    "verify": "tsx scripts/verify.ts"
  }
}

// scripts/verify.ts
import { CoinbaseAdvTradeClient, CoinbaseAdvTradeCredentials } from '@coinbase-sample/advanced-trade-sdk-ts';
import { loadEnv } from '../src/env.js';

async function verify() {
  console.log('🔍 Verifying Coinbase MCP Server setup...\n');

  const env = loadEnv();
  console.log('✓ Environment variables loaded');

  const credentials = new CoinbaseAdvTradeCredentials(
    env.COINBASE_API_KEY_NAME,
    env.COINBASE_PRIVATE_KEY
  );
  const client = new CoinbaseAdvTradeClient(credentials);

  console.log('✓ Credentials parsed');

  try {
    const accounts = await client.accounts.listAccounts();
    console.log('✓ Successfully connected to Coinbase API');
    console.log(`✓ Found ${accounts.accounts?.length || 0} accounts\n`);

    console.log('✅ Setup verified! Your server is ready to use.\n');
    console.log('Next steps:');
    console.log('  1. npm start');
    console.log('  2. claude');
    console.log('  3. /trade 10 EUR from BTC dry-run\n');
  } catch (err) {
    console.log('✗ Failed to connect to Coinbase API\n');
    console.error('Error:', err.message);
    console.log('\nTroubleshooting:');
    console.log('  - Check API key format');
    console.log('  - Verify key has Trading permissions');
    console.log('  - Check https://portal.cdp.coinbase.com/\n');
    process.exit(1);
  }
}

verify();
```

Add to Getting Started:
```markdown
### 3. Verify Setup

Test your credentials:

```bash
npm run verify
```

You should see:
```
✓ Environment variables loaded
✓ Credentials parsed
✓ Successfully connected to Coinbase API
✓ Found 5 accounts

✅ Setup verified! Your server is ready to use.
```

If verification fails, check your .env file.
```
*Pros:* High confidence before starting server, catches auth issues early
*Cons:* Extra script to maintain, extra step in setup

**Option 2: Self-Test on Server Start**
```typescript
// src/index.ts
async function main() {
  const env = loadEnv();

  logger.info('Verifying Coinbase API credentials...');

  try {
    const testClient = new CoinbaseAdvTradeClient(
      new CoinbaseAdvTradeCredentials(env.COINBASE_API_KEY_NAME, env.COINBASE_PRIVATE_KEY)
    );
    await testClient.accounts.listAccounts();
    logger.info('✓ Credentials verified');
  } catch (err) {
    logger.error({ err }, 'Failed to verify credentials');
    logger.error('Check your API key and private key in .env');
    process.exit(1);
  }

  const server = new CoinbaseMcpServer(...);
  server.listen(env.PORT);
}
```
*Pros:* Automatic, no extra steps, fails fast if bad credentials
*Cons:* Adds ~1-2s to startup time, makes every start slower

**Option 3: Add to README Troubleshooting**
```markdown
### Verify Setup

To test your configuration before using Claude:

```bash
# Start server
npm start

# In another terminal, test the health endpoint
curl http://localhost:3000/ready

# Expected response:
{
  "status": "ready",
  "checks": {
    "coinbase_api": "ok"
  }
}
```

If `coinbase_api` shows `"error"`, check your .env credentials.
```
*Pros:* Uses health endpoint (solves two problems), no extra code
*Cons:* Requires user to manually run curl command

**Recommended Option: Option 3 (relies on /ready endpoint from Finding #5)**

**Rationale:**
- **No extra code**: Leverages /ready endpoint we already recommended
- No startup delay (Option 2's problem)
- No extra npm script (Option 1's complexity)
- Teaches users about health endpoint (useful for monitoring later)
- Can be automated in CI/CD or install scripts
- Simpler than Option 1, more user-controlled than Option 2

**Implementation:**
Simply add to README Getting Started section:

```markdown
### 4. Start the Server

```bash
npm start
```

You should see: `Coinbase MCP Server listening on port 3000`

**Verify it's working:**
```bash
curl http://localhost:3000/ready
```

Expected response:
```json
{
  "status": "ready",
  "checks": {
    "server": "ok",
    "coinbase_api": "ok",
    "coinbase_latency_ms": "127"
  }
}
```

If you see `"coinbase_api": "error"`, check your `.env` credentials.
```

**Alternative for non-curl users:**
Add note: "Or open http://localhost:3000/health in your browser"

---

### 9. TypeScript Path Aliases Not Documented

**Severity:** Low

**Problem:**

The project configures TypeScript path aliases but doesn't document them:

```json
// tsconfig.json
"paths": {
  "@server/*": ["server/*"],
  "@test/*": ["test/*"]
}
```

**Issues:**
- Contributors might not know these aliases exist
- No guidance on when to use them vs relative imports
- Aliases not used consistently in codebase (some files use `./server/`, others could use `@server/`)
- Rollup config must mirror tsconfig paths (not documented)

**Current State:**
```typescript
// Most files use relative imports
import { CoinbaseMcpServer } from './server/CoinbaseMcpServer.js';

// Could use alias
import { CoinbaseMcpServer } from '@server/CoinbaseMcpServer.js';
```

**Impact:**
- Inconsistent import styles
- Longer relative paths (`../../server/...`)
- Contributors don't leverage existing tooling

**Options:**

**Option 1: Document in CONTRIBUTING.md**
```markdown
## Code Style

### Import Paths

Use TypeScript path aliases for cleaner imports:

```typescript
// ✓ Preferred
import { CoinbaseMcpServer } from '@server/CoinbaseMcpServer';
import { mockCoinbaseClient } from '@test/serviceMocks';

// ✗ Avoid (when alias available)
import { CoinbaseMcpServer } from '../../server/CoinbaseMcpServer';
```

Configured aliases:
- `@server/*` → `src/server/*`
- `@test/*` → `src/test/*`
```
*Pros:* Documents existing feature, encourages consistent use
*Cons:* Doesn't fix existing inconsistencies

**Option 2: Refactor Codebase to Use Aliases**
```typescript
// Before
import { mockCoinbaseClient } from '../test/serviceMocks';

// After
import { mockCoinbaseClient } from '@test/serviceMocks';
```
*Pros:* Consistent codebase, cleaner imports
*Cons:* Requires refactoring all files, potential for bugs

**Option 3: Remove Path Aliases**
```json
// tsconfig.json - Remove paths config
{
  "compilerOptions": {
    // "paths": { ... } ← Delete this
  }
}
```
*Pros:* Simpler, one less thing to maintain, explicit is better than implicit
*Cons:* Longer relative imports in deep nested files

**Recommended Option: Option 3 - Remove Path Aliases**

**Rationale:**
- **YAGNI principle**: Project doesn't actually use the aliases currently
- Simplicity: Fewer configuration layers to maintain
- Explicit imports are clearer to newcomers
- Relative imports show file structure relationships
- Avoids Rollup/bundler configuration complexity
- Project is small enough that `../../` isn't a real problem
- Reduces "magic" in the codebase (easier onboarding)

**Implementation:**
1. Remove `paths` from tsconfig.json
2. Remove corresponding Rollup alias configuration (if any)
3. Update CLAUDE.md or core.md to state: "Use relative imports (./file, ../dir/file)"

**Alternative:** If path aliases are deemed valuable, implement Option 1 + Option 2, but only if there's consensus that they add value. Currently they seem like over-engineering for a project this size.

---

### 10. Development Scripts Have Inconsistent Names

**Severity:** Low

**Problem:**

The npm scripts follow inconsistent naming patterns:

```json
{
  "start": "node dist/index.js",
  "start:dev": "tsx --watch src/index.ts",   // Uses colon
  "test:coverage": "jest --coverage",        // Uses colon
  "test:watch": "jest --watch",              // Uses colon
  "test:types": "tsc --noEmit",              // Uses colon
  "lint:fix": "eslint src/ --fix",           // Uses colon
  "lint:markdown": "markdownlint-cli2 ...",  // Uses colon
  "lint:markdown:fix": "...",                // Uses double colon
  "format": "prettier --write src/",
  "format:check": "prettier --check .",      // Uses colon
}
```

**Patterns:**
- Primary commands: `test`, `lint`, `format`
- Variants use colon: `test:watch`, `lint:fix`
- Some use double colon: `lint:markdown:fix`
- Inconsistent: `dev` vs `start:dev`

**Impact:**
- Harder to remember command names
- Cognitive load: "Is it `npm run dev` or `npm run start:dev`?"
- Tab completion less predictable
- No clear pattern for "which command does what"

**Options:**

**Option 1: Align with Common Conventions**
```json
{
  "dev": "tsx --watch src/index.ts",         // Common: just "dev"
  "build": "rollup -c",
  "start": "node dist/index.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "format": "prettier --write src/",
  "format:check": "prettier --check .",
}
```
Changes:
- `start:dev` → `dev` (matches Vite, Next.js, etc.)
- Keeps colons for variants (watch, fix, check)

*Pros:* Matches industry conventions, shorter to type, familiar
*Cons:* Breaking change (documentation references `start:dev`)

**Option 2: Standardize on Namespace:Action Pattern**
```json
{
  "start": "node dist/index.js",
  "start:dev": "tsx --watch src/index.ts",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "format": "prettier --write src/",
  "format:check": "prettier --check .",
}
```
*Pros:* Current pattern mostly follows this, minimal changes
*Cons:* `start:dev` is longer than conventional `dev`

**Option 3: Keep As-Is, Document Pattern**
```markdown
# CONTRIBUTING.md

## Available Commands

Commands follow the pattern `<namespace>:<action>:<modifier>`:

- `start` - Production server
- `start:dev` - Development server (hot-reload)
- `test` - Run all tests
- `test:watch` - Run tests in watch mode
- `test:coverage` - Generate coverage report
```
*Pros:* No code changes, just documentation
*Cons:* Doesn't fix the inconsistency

**Recommended Option: Option 1 - Align with Common Conventions**

**Rationale:**
- **Developer expectations**: `npm run dev` is standard across ecosystem
- Shorter to type: `dev` vs `start:dev` (saves keystrokes)
- Matches popular frameworks (Next.js, Vite, Astro, SvelteKit all use `dev`)
- More discoverable: developers try `npm run dev` first
- README already says "for development" - `dev` communicates this clearly

**Implementation:**
1. Change `start:dev` → `dev` in package.json
2. Update README references
3. Update CONTRIBUTING.md references
4. Update CLAUDE.md if mentioned
5. Add note in README: "Previously `npm run start:dev`, now `npm run dev`"

**Migration Note for README:**
```markdown
> **Note:** In v1.x, the development server was `npm run start:dev`.
> This has been simplified to `npm run dev` to match industry conventions.
```

---

## Summary of Recommendations

### High Priority (Implement First)

1. **Enhanced Error Messages** (#1) - Add Chalk for colored, actionable error output
2. **CLI Help Flags** (#2) - Add --help and --version support
3. **Environment Validation** (#3) - Use Zod to validate .env on startup
4. **Structured Logging** (#4) - Integrate Pino for observability
5. **Health Check Endpoints** (#5) - Add /health and /ready endpoints

### Medium Priority

6. **Document Hot-Reload** (#6) - Make start:dev the default in Getting Started
7. **MCP Inspector Visibility** (#7) - Expand documentation + troubleshooting entry
8. **Verification Step** (#8) - Use /ready endpoint for setup verification

### Low Priority (Nice to Have)

9. **Path Aliases** (#9) - Remove unused path aliases for simplicity
10. **Script Naming** (#10) - Rename `start:dev` → `dev` for consistency

### Estimated Implementation Time

- **High Priority**: ~6-8 hours (one focused work session)
- **Medium Priority**: ~2-3 hours (documentation updates)
- **Low Priority**: ~1-2 hours (cleanup)
- **Total**: ~10-13 hours to implement all recommendations

### Expected Impact

**Before Improvements:**
- Setup works but errors are cryptic
- Users get stuck on credential format
- No way to verify setup worked
- Minimal observability for debugging

**After Improvements:**
- Clear, actionable error messages guide users to solutions
- `--help` and `--version` provide instant documentation
- Environment validation catches mistakes before startup
- Health checks enable monitoring and verification
- Structured logs make debugging trivial
- Professional, polished developer experience

**Net Result:** Developer experience goes from "good for those who figure it out" to "excellent for everyone" - significantly reducing time-to-first-success and improving long-term maintainability.
