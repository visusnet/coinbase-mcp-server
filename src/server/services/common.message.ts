import { z } from 'zod';

// =============================================================================
// Shared WebSocket Message Schemas
// =============================================================================

/** Schema for heartbeats channel message */
export const HeartbeatsChannelMessageSchema = z
  .object({
    channel: z.literal('heartbeats').describe('Channel name'),
    client_id: z.string().optional().describe('Client identifier (optional)'),
    timestamp: z.string().describe('Message timestamp'),
    sequence_num: z.number().describe('Sequence number'),
    events: z
      .array(
        z.object({
          current_time: z.string().describe('Current server time'),
          heartbeat_counter: z.number().describe('Heartbeat counter'),
        }),
      )
      .describe('Heartbeat events'),
  })
  .strict()
  .transform((data) => ({
    channel: data.channel,
    clientId: data.client_id,
    timestamp: data.timestamp,
    sequenceNum: data.sequence_num,
    events: data.events,
  }))
  .describe('Heartbeats channel message');

/** Schema for error message from Coinbase WebSocket */
export const ErrorMessageSchema = z
  .object({
    type: z.literal('error').describe('Message type'),
    message: z.string().describe('Error message'),
  })
  .strict()
  .describe('Error message from Coinbase WebSocket');

export type ErrorMessage = z.output<typeof ErrorMessageSchema>;

/** Type guard for error messages */
export function isErrorMessage(message: unknown): message is ErrorMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === 'error'
  );
}
