import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * MCP tool result structure with index signature for SDK compatibility
 */
export interface ToolResult {
  [key: string]: unknown;
  content: { type: 'text'; text: string }[];
  isError: boolean;
}

/**
 * Abstract base class for domain-specific tool registries.
 * Provides the `call` wrapper method for consistent error handling.
 */
export abstract class ToolRegistry {
  constructor(protected readonly server: McpServer) {}

  /**
   * Wraps a service method call to produce MCP tool results with error handling.
   */
  protected call<I, R>(fn: (input: I) => R | Promise<R>) {
    return async (input: I): Promise<ToolResult> => {
      try {
        const response = await Promise.resolve(fn(input));
        return {
          content: [
            { type: 'text' as const, text: JSON.stringify(response, null, 2) },
          ],
          isError: false,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: message }],
          isError: true,
        };
      }
    };
  }

  /**
   * Registers all tools for this domain.
   */
  public abstract register(): void;
}
