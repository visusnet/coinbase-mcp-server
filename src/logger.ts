import pino from 'pino';
import pretty from 'pino-pretty';

/**
 * Central pino configuration.
 * All logger instances are created from this base logger.
 */
const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'debug',
  },
  pretty({
    colorize: true,
    translateTime: 'HH:MM:ss.l',
    ignore: 'pid,hostname,scope',
    messageFormat: '[{scope}] {msg}',
  }),
);

/**
 * Creates a scoped logger instance.
 * @param scope - The scope/component name (e.g., 'WebSocket', 'Tools', 'Server')
 */
export function createLogger(scope: string): pino.Logger {
  return baseLogger.child({ scope });
}

/**
 * Pre-configured loggers for common scopes.
 */
export const logger = {
  server: createLogger('Server'),
  tools: createLogger('Tools'),
  websocket: createLogger('WebSocket'),
};
