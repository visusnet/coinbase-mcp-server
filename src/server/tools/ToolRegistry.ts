import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z, type ZodRawShape } from 'zod';

import { logger } from '../../logger';

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
 * Provides the `registerTool` wrapper method for consistent error handling and logging.
 */
export abstract class ToolRegistry {
  constructor(private readonly server: McpServer) {}

  /**
   * Registers a tool with the MCP server, wrapping the handler with logging and error handling.
   * Type-safe: the callback's input type must match the schema's output type.
   * @param name - The tool name (used for registration and logging)
   * @param options - Tool options (title, description, inputSchema)
   * @param fn - The service method to call (input type inferred from schema)
   */
  protected registerTool<S extends ZodRawShape>(
    name: string,
    options: {
      title: string;
      description: string;
      inputSchema: S;
      annotations?: ToolAnnotations;
    },
    fn: (input: z.output<z.ZodObject<S>>) => unknown,
  ): void {
    // Type assertion needed: MCP SDK expects a different callback signature,
    // but our ToolResult is compatible with the expected return type.
    this.server.registerTool(
      name,
      options,
      this.call(name, fn) as Parameters<typeof this.server.registerTool>[2],
    );
  }

  /**
   * Wraps a service method call to produce MCP tool results with logging and error handling.
   */
  private call<I>(toolName: string, fn: (input: I) => unknown) {
    return async (input: I): Promise<ToolResult> => {
      logger.tools.info(`${toolName} called`);
      logger.tools.debug(input as object, `${toolName} parameters`);
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
        logger.tools.error({ err: error }, `${toolName} failed`);
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
