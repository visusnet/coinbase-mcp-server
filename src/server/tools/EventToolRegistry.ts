import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { EventService } from '../services/EventService';
import { WaitForEventRequestSchema } from '../services/EventService.request';
import { VIEW_API } from './annotations';
import { ToolRegistry } from './ToolRegistry';
import {
  ConditionOperator,
  IndicatorConditionField,
  TickerConditionField,
  OrderConditionField,
} from '@server/services/EventService.types';

/**
 * Registry for unified event MCP tools.
 */
export class EventToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly eventService: EventService,
  ) {
    super(server);
  }

  public register(): void {
    this.registerToolWithExtra(
      'wait_for_event',
      {
        title: 'Wait for Event',
        description: `
Waits for market or order conditions to be met before returning.
Monitors real-time data via WebSocket and triggers when conditions
are satisfied or timeout is reached.

SUBSCRIPTION TYPES:
- market: Monitor price/indicator conditions for a product
- order: Monitor order status/fill conditions for an order

Use this instead of polling with sleep intervals for efficient
event-driven trading strategies.

Returns immediately when any subscription's conditions are met,
or returns timeout status with last known state.

MARKET CONDITIONS:
Ticker fields: ${Object.values(TickerConditionField).join(', ')}
Indicator fields: ${Object.values(IndicatorConditionField).join(', ')}

ORDER CONDITIONS:
- status: Uses targetStatus array with implicit IN operator (triggers if status IN targetStatus)
- Numeric fields (${Object.values(OrderConditionField)
          .filter((f) => f !== OrderConditionField.Status)
          .join(', ')}): Use operator + value

Operators: ${Object.values(ConditionOperator).join(', ')}
Logic: any (OR), all (AND)
        `.trim(),
        inputSchema: WaitForEventRequestSchema.shape,
        annotations: VIEW_API,
      },
      this.eventService.waitForEvent.bind(this.eventService),
    );
  }
}
