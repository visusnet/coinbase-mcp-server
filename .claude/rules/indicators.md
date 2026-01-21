---
paths:
  - "src/server/TechnicalIndicatorsService.ts"
  - "src/server/indicators/*.ts"
---

# Technical Indicators Development

Guide for adding new MCP indicator tools to the codebase.

## Architecture

- `TechnicalIndicatorsService.ts` - Service containing all indicator methods
- `src/server/indicators/` - Manual implementations (helper functions)
- Library: `@thuantan2060/technicalindicators` (already installed)

## Adding a New Indicator Tool

**Important:** Each tool requires ONE atomic commit. Complete all steps before committing.

### A) Library-based (using technicalindicators)

1. **Add import** in `TechnicalIndicatorsService.ts`
2. **Define interfaces** for input/output types
3. **Implement service method** that calls library function
4. **Register tool** in `CoinbaseMcpServer.ts` with Zod schema
5. **Write tests** for service method and tool integration
6. **Update docs** (see checklist below)
7. **Run checks** (see quality checks below)
8. **Commit** with proper message format

### B) Manual implementation

1. **Create file** `src/server/indicators/<name>.ts`
2. **Export helper functions** and types
3. **Write unit tests** in `<name>.spec.ts`
4. **Import helpers** in `TechnicalIndicatorsService.ts`
5. **Implement service method** that orchestrates helpers
6. **Register tool** in `CoinbaseMcpServer.ts` with Zod schema
7. **Write integration tests** for tool
8. **Update docs** (see checklist below)
9. **Run checks** (see quality checks below)
10. **Commit** with proper message format

## Quality Checks

Run these commands before committing. All must pass with zero errors/warnings:

```bash
npm run format          # Format code
npm run lint            # Lint check
npm run test:types      # TypeScript type check
npm run knip            # Unused exports/dependencies check
npm run test:coverage   # Tests with 100% coverage (all categories)
```

## Commit Message Format

```
feat(indicators): add <NAME> (<FULL NAME>) MCP tool

- <Change 1>
- <Change 2>

<Impact description: what this enables or improves>
```

Example:

```
feat(indicators): add RSI (Relative Strength Index) MCP tool

- Add calculateRsi method to TechnicalIndicatorsService
- Register calculate_rsi tool with Zod schema validation

Enables momentum analysis for overbought/oversold detection in trading workflows.
```

## Checklist

Before committing, verify all items:

- [ ] Service method with explicit input/output interfaces
- [ ] Zod schema for tool input validation
- [ ] Unit tests for service method
- [ ] Integration test for tool call
- [ ] 100% test coverage maintained
- [ ] `docs/IMPLEMENTED_TOOLS.md` updated (tool + count)
- [ ] `README.md` updated (tool count)
- [ ] `CLAUDE.md` updated (tool count)
- [ ] `CoinbaseMcpServer.ts` assist prompt updated (tool count)
- [ ] `.claude/skills/coinbase-trading/*.md` updated (if applicable)
- [ ] All quality checks pass (format, lint, types, knip, coverage)
- [ ] **If indicator is useful for trading signals**: Add to `TechnicalAnalysisService.ts` (analyze_technical_indicators tool)
