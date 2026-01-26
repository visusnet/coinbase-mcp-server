import { jest, beforeEach } from '@jest/globals';

/**
 * Logger mock for testing. Provides mocked logger functions and automatically
 * clears them in beforeEach.
 */
export interface LoggerScope {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
}

export interface MockedLogger {
  server: LoggerScope;
  tools: LoggerScope;
  websocket: LoggerScope;
}

function createLoggerScope(): LoggerScope {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
}

/**
 * Creates a mock logger and sets up automatic clearing in beforeEach.
 * Call this BEFORE jest.mock() is called to set up the mock.
 *
 * @example
 * ```typescript
 * import { mockLogger } from '@test/loggerMock';
 *
 * const logger = mockLogger();
 * jest.mock('../logger', () => ({
 *   logger,
 * }));
 *
 * // In tests:
 * expect(logger.server.info).toHaveBeenCalledWith('message');
 * ```
 */
export function mockLogger(): MockedLogger {
  const logger: MockedLogger = {
    server: createLoggerScope(),
    tools: createLoggerScope(),
    websocket: createLoggerScope(),
  };

  beforeEach(() => {
    logger.server.info.mockClear();
    logger.server.error.mockClear();
    logger.server.warn.mockClear();
    logger.server.debug.mockClear();
    logger.tools.info.mockClear();
    logger.tools.error.mockClear();
    logger.tools.warn.mockClear();
    logger.tools.debug.mockClear();
    logger.websocket.info.mockClear();
    logger.websocket.error.mockClear();
    logger.websocket.warn.mockClear();
    logger.websocket.debug.mockClear();
  });

  return logger;
}
