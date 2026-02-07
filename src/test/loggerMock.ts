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
  trace: jest.Mock;
  isLevelEnabled: jest.Mock;
}

export interface MockedLogger {
  server: LoggerScope;
  tools: LoggerScope;
  streaming: LoggerScope;
}

function createLoggerScope(): LoggerScope {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    isLevelEnabled: jest.fn().mockReturnValue(false),
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
    streaming: createLoggerScope(),
  };

  beforeEach(() => {
    const scopes: LoggerScope[] = [
      logger.server,
      logger.tools,
      logger.streaming,
    ];
    for (const scope of scopes) {
      scope.info.mockClear();
      scope.error.mockClear();
      scope.warn.mockClear();
      scope.debug.mockClear();
      scope.trace.mockClear();
      scope.isLevelEnabled.mockClear();
    }
  });

  return logger;
}
