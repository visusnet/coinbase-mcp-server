import pino from 'pino';
import pretty from 'pino-pretty';

/**
 * Fields to redact from all log output to prevent credential leakage.
 */
export const REDACT_PATHS = [
  'apiKey',
  'privateKey',
  'jwt',
  'token',
  'secret',
  'password',
  'COINBASE_API_KEY_NAME',
  'COINBASE_PRIVATE_KEY',
];

/**
 * Central pino configuration.
 * All logger instances are created from this base logger.
 */
const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'debug',
    redact: REDACT_PATHS,
  },
  pretty({
    colorize: true,
    translateTime: 'HH:MM:ss.l',
    ignore: 'pid,hostname,scope',
    messageFormat: '[{scope}] {msg}',
    destination: 2, // stderr - prevents stdout pollution in stdio transport mode
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
  streaming: createLogger('Streaming'),
};
