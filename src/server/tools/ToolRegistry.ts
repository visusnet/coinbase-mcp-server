import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z, type ZodRawShape } from 'zod';
import { encode as toonEncode } from '@toon-format/toon';

import { logger } from '../../logger';

const formatSchema = z
  .enum(['json', 'toon'])
  .optional()
  .describe(
    'Output format: json (default) or toon (compact, ~35% fewer tokens for lists)',
  );

/**
 * Slim extra context passed from ToolRegistry to service methods.
 * Decouples service layer from MCP SDK types.
 */
export interface ToolExtra {
  signal: AbortSignal;
}

type SdkExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

interface ToolOptions<S extends ZodRawShape> {
  title: string;
  description: string;
  inputSchema: S;
  annotations?: ToolAnnotations;
}

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
   */
  protected registerTool<S extends ZodRawShape>(
    name: string,
    options: ToolOptions<S>,
    fn: (input: z.output<z.ZodObject<S>>) => unknown,
  ): void {
    const extendedSchema = { ...options.inputSchema, format: formatSchema };

    // Type assertion needed: MCP SDK expects a different callback signature,
    // but our ToolResult is compatible with the expected return type.
    this.server.registerTool(
      name,
      { ...options, inputSchema: extendedSchema },
      this.call(name, (input: z.output<z.ZodObject<S>>) =>
        fn(input),
      ) as Parameters<typeof this.server.registerTool>[2],
    );
  }

  /**
   * Registers a long-running tool that receives an AbortSignal for cancellation.
   * Use this for tools that hold open connections (WebSocket, polling) and need
   * to clean up when the MCP client cancels the request.
   */
  protected registerToolWithExtra<S extends ZodRawShape>(
    name: string,
    options: ToolOptions<S>,
    fn: (input: z.output<z.ZodObject<S>>, extra: ToolExtra) => unknown,
  ): void {
    const extendedSchema = { ...options.inputSchema, format: formatSchema };

    this.server.registerTool(
      name,
      { ...options, inputSchema: extendedSchema },
      this.call(name, fn) as Parameters<typeof this.server.registerTool>[2],
    );
  }

  /**
   * Wraps a service method call to produce MCP tool results with logging and error handling.
   */
  private call<I extends Record<string, unknown>>(
    toolName: string,
    fn: (input: I, extra: ToolExtra) => unknown,
  ) {
    return async (input: I, extra: SdkExtra): Promise<ToolResult> => {
      const { format, ...params } = input as I & { format?: 'json' | 'toon' };
      logger.tools.info(`${toolName} called`);
      logger.tools.debug(params as object, `${toolName} parameters`);
      try {
        const toolExtra: ToolExtra = { signal: extra.signal };
        const response = await Promise.resolve(fn(params as I, toolExtra));
        const text =
          format === 'toon'
            ? toonEncode(response)
            : JSON.stringify(response, null, 2);
        return {
          content: [{ type: 'text' as const, text }],
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
