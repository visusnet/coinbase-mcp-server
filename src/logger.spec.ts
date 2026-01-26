import { Writable } from 'stream';

// Mock pino-pretty to suppress output while testing
jest.mock('pino-pretty', () => {
  return jest.fn().mockReturnValue(
    new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    }),
  );
});

// Unmock logger for this test file - we want to test the actual logger
jest.unmock('./logger');

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should create loggers with pino-pretty', async () => {
    const { logger, createLogger } = await import('./logger');

    expect(logger.server).toBeDefined();
    expect(logger.tools).toBeDefined();
    expect(logger.websocket).toBeDefined();

    const customLogger = createLogger('CustomScope');
    expect(customLogger).toBeDefined();
    expect(customLogger.info).toBeDefined();
  });

  it('should work for logging', async () => {
    const { logger } = await import('./logger');

    expect(() => {
      logger.server.info('test message');
      logger.tools.error('test error');
      logger.websocket.warn('test warning');
    }).not.toThrow();
  });
});
