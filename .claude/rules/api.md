---
paths:
  - "src/**/*.ts"
  - "!**/*.spec.ts"
---
# API Development

## Tool Registration Pattern
```typescript
server.registerTool(
  'tool_name',
  { title: 'Title', description: 'Desc', inputSchema: zodSchema },
  this.call(this.service.method.bind(this.service))
);
```

## Response Format
```typescript
return {
  content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
};
```

## Error Format
```typescript
return {
  content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
  isError: true
};
```

## Timestamp Handling
- **Most endpoints**: ISO 8601 (`2024-01-01T00:00:00Z`)
- **Product Candles**: Unix timestamps only - use `toUnixTimestamp()`

## Adding New Tool
1. Check Coinbase SDK docs for endpoint
2. Add service method to `CoinbaseService.ts`
3. Register tool with Zod schema in `registerToolsForServer()`:
   - Clear title and description
   - Zod schema for all parameters
   - Call pattern: `this.call(this.service.method.bind(this.service))`
4. Wrap SDK call in try-catch with meaningful error
5. Write tests (100% coverage) - mock service responses
6. Update `docs/IMPLEMENTED_TOOLS.md` incl. tool count
7. Update `README.md` incl. tool count
8. Update `src/server/CoinbaseMcpServer.ts` assist prompt incl. tool count
9. Update `CLAUDE.md` incl. tool count

## Rate Limits
- **Public endpoints**: 10 requests/second
- **Private endpoints**: 15 requests/second
- Consider caching product lists and static data
- Use batch endpoints when available
