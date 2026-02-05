import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool requires 'view' permission - reads data from Coinbase API.
 * Safe to call repeatedly, no side effects.
 */
export const VIEW_API: ToolAnnotations = {
  readOnlyHint: true,
  openWorldHint: true,
};

/**
 * Tool requires 'trade' or 'transfer' permission - modifies state.
 * Can result in financial loss. Use with caution.
 */
export const DESTRUCTIVE_API: ToolAnnotations = {
  destructiveHint: true,
  openWorldHint: true,
};

/**
 * Pure calculation tool - no external API calls.
 * Computes results from provided input data only.
 * Same input always produces same output.
 */
export const PURE_CALCULATION: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
};
