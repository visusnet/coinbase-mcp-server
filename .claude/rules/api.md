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
- **Product Candles**: Unix timestamps only - use `isoToUnix` from `schema.helpers.ts`

## Adding New Tool

1. Check Coinbase SDK docs for endpoint
2. Create or update service in `services/{ServiceName}.ts`
3. Define request schema in `services/{ServiceName}.request.ts`:
   - Use `{MethodName}RequestSchema` naming
   - Use `numberToString` helpers for numeric fields
   - Add `.describe()` to all fields and the schema itself
4. Define response schema in `services/{ServiceName}.response.ts`:
   - Use `{MethodName}ResponseSchema` naming
   - Use `stringToNumber` helpers for numeric fields
   - Add `.describe()` to all fields and the schema itself
5. Register tool in `tools/{Domain}ToolRegistry.ts`:
   - Clear title and description
   - Use `{MethodName}RequestSchema.shape` for inputSchema
   - Call pattern: `this.call(this.service.method.bind(this.service))`
6. Wrap SDK call in try-catch with meaningful error
7. Write tests (100% coverage) - mock service responses
8. Update `docs/IMPLEMENTED_TOOLS.md` incl. tool count
9. Update `README.md` incl. tool count
10. Update `src/server/CoinbaseMcpServer.ts` assist prompt incl. tool count
11. Update `CLAUDE.md` incl. tool count

## Rate Limits

- **Public endpoints**: 10 requests/second
- **Private endpoints**: 15 requests/second
- Consider caching product lists and static data
- Use batch endpoints when available
