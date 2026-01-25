---
paths:
  - "src/**/*.ts"
---
# Zod Schema Rules

## Critical Rules

1. **Always define explicit schemas** using Zod for all request and response types
2. **Do not use `z.any()` or `z.unknown()`** because all fields must be explicitly defined
3. **Do not use `passthrough()`** because we assume that all fields are known and defined
4. **All fields must have a description using `.describe()`** so that they appear in MCP documentation
5. **Model schemas for our business logic, not the raw API structure** i.e. use numbers and Dates instead of strings where appropriate
   - . **Use `transform()` to convert Request fields to API formats** because validation happens on our business model before sending the request
   - **Use `preprocess()` to convert API response fields to desired types** because validation happens after receiving and pre-processing the response to our business model
6. **Reuse common schemas** by defining them in common.schema.ts
7. **Extract nested objects and arrays into separate schemas** for clarity and (sometimes) reusability
8. **Use request schemas in tool definitions** using `{ApiMethodName}RequestSchema.shape` to automatically generate MCP tool documentation
9. **Use `z.nativeEnum()` for enum fields** to ensure only valid values are accepted and define TypeScript enums for them (do not import enums from the SDK, copy them instead)
10. Follow the rules defined in this document for request schemas, response schemas, naming conventions, API integration, data flow, and testing

**THESE RULES ARE SACRED AND MUST BE FOLLOWED WITHOUT EXCEPTION.**
If you find a case where these rules do not make sense, discuss it with the user before making any changes. Present options.

## Request Schemas

- Service methods interacting with external APIs have a single parameter with a type that follows the pattern `{APIMethodName}Request`.
- Each request type is defined as the input of a Zod schema in the corresponding `{ServiceName}.schema.ts` file (`z.input<typeof schema>`).
- The schema name matches the method's parameter type name suffixed with `Schema`, e.g. `GetProductCandlesRequestSchema`.
- Example: `getProductCandles` method in `TechnicalIndicatorsService.ts` uses `GetProductCandlesRequest` defined in `TechnicalIndicatorsService.schema.ts`.
- The schema is used by the MCP framework to validate incoming requests.

## Response Schemas

- Service methods return a type that follows the pattern `Promise<{APIMethodName}Response>`.
- Each response type is defined as the output of a Zod schema in the corresponding `{ServiceName}.schema.ts` file (`z.output<typeof schema>`).
- The schema name matches the method's return type name suffixed with `Schema`, e.g. `GetProductCandlesResponseSchema`.
- Example: `getProductCandles` method returns `GetProductCandlesResponse` defined in `TechnicalIndicatorsService.schema.ts`.
- Response schemas convert raw API data into a structured format.
- Response schemas use `preprocess()` to transform raw API responses before validation.

## Naming Conventions

- Request schema: `{APIMethodName}RequestSchema`
- Request type: `{APIMethodName}Request` (`z.input` of the request schema)
- Response schema: `{APIMethodName}ResponseSchema`
- Response type: `{APIMethodName}Response` (`z.output` of the response schema)
- Find the correct APIMethodName by looking at node_modules/@coinbase-sample/advanced-trade-sdk-ts/dist/model/**

## API Integration

- The Coinbase API may return data in various formats (e.g., strings for numbers, ISO date strings).
- Zod schemas must transform these raw formats into appropriate types (e.g., `number`, `Date`).
- Use Zod's `preprocess()` to handle these transformations within the schema definitions.

## Data Flow Example

```typescript
// DollarService.schema.ts
import { z } from 'zod';

export const GetDollarValueRequestSchema = z.object({
  valueInEuros: zodNumber.describe('Value in Euros'),
});

export type GetDollarValueRequest = z.input<typeof GetDollarValueRequestSchema>;

export const GetDollarValueResponseSchema = z.object({
  valueInDollars: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().describe('Value in US Dollars')
  ),
});
export type GetDollarValueResponse = z.output<typeof GetDollarValueResponseSchema>;
```

```typescript
// DollarService.ts
import { GetDollarValueRequest, GetDollarValueResponse } from './DollarService.schema';

export class DollarService {
  ...
  public async getDollarValue(request: GetDollarValueRequest): Promise<GetDollarValueResponse> {
    const response = await this.client.request({
      url: 'dollar',
      queryParams: GetDollarValueRequestSchema.parse(request),
    });
    return GetDollarValueResponseSchema.parse(response.data);
  }
  ...
}
```

```typescript
// Usage example (will be done by MCP framework)
const dollarValue = await dollarService.getDollarValue({ valueInEuros: 100 });
```

The data flow is as follows:
1. getDollarValue is called with valueInEuros as a number
2. The request is validated by GetDollarValueRequestSchema and transformed to the API format
3. The raw API request is sent ({ valueInEuros: "100" })
4. The raw API response is received ({ valueInDollars: "110.50" })
5. The response is validated and transformed by GetDollarValueResponseSchema
6. The final result is returned with valueInDollars as a number

## Testing Schemas

- Schemas are indirectly tested through service method tests.
- Validate that API requests are correctly formed:
```typescript
expect(mockClient.request).toHaveBeenCalledWith({
  url: 'dollar',
  queryParams: { valueInEuros: '100' }, // Tests transformation from number to string
});
```
- Validate that service methods correctly return data in the expected format:
```typescript
expect(result).toEqual({
  valueInDollars: 110.5, // Tests transformation from string to number
});
```
