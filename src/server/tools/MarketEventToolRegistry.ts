import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { MarketEventService } from '../services';
import { WaitForMarketEventRequestSchema } from '../services/MarketEventService.request';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for market event MCP tools.
 */
export class MarketEventToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly marketEvent: MarketEventService,
  ) {
    super(server);
  }

  public register(): void {
    this.registerTool(
      'wait_for_market_event',
      {
        title: 'Wait for Market Event',
        description: `
Waits for specific market conditions to be met before returning.
Monitors real-time ticker data via WebSocket and triggers when
conditions are satisfied or timeout is reached.

Use this instead of polling with sleep intervals for efficient
event-driven trading strategies.

Returns immediately when any subscription's conditions are met,
or returns timeout status with last known ticker data.

Fields: price, volume24h, percentChange24h, high24h, low24h
Operators: gt, gte, lt, lte, crossAbove, crossBelow
Logic: any (OR), all (AND)
        `.trim(),
        inputSchema: WaitForMarketEventRequestSchema.shape,
      },
      this.marketEvent.waitForEvent.bind(this.marketEvent),
    );
  }
}
