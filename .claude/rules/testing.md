---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
---
# Testing Standards

## Coverage

- **100% required**: Statements, Branches, Functions, Lines
- Coverage is a design tool, not just a metric
- istanbul ignore comments are strictly prohibited. Instead of ignoring uncoverable branches, the right approach is to analyze WHY they couldn't be covered and remove dead code entirely. If it's truly impossible to cover, we should refactor to make it testable or reconsider the design.

## Test Structure

- **Naming**: `should <behavior> when <condition>`
- **AAA pattern**: Arrange, Act, Assert clearly separated
- **Mock externals**: Use `serviceMocks.ts` pattern

## Commands

```bash
npm test                     # Run all tests
npm run test:coverage        # With coverage
npm test -- --watch          # Watch mode
npm test -- <file>.spec.ts   # Specific file
```

## Mock Pattern

```typescript
import { createMockCoinbaseService } from '../test/serviceMocks';
const mockService = createMockCoinbaseService();
const server = new CoinbaseMcpServer(mockService);
```

## Test Edge Cases

- Invalid inputs
- Error paths (SDK throws)
- Boundary values
- Response format consistency
