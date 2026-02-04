import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { mockLogger } from '@test/loggerMock';

// Mock dotenv to prevent .env file loading
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const logger = mockLogger();
jest.mock('./logger', () => ({
  logger,
}));

// Mock the CoinbaseMcpServer before importing index
jest.mock('@server/CoinbaseMcpServer', () => {
  return {
    CoinbaseMcpServer: jest.fn().mockImplementation(() => {
      return {
        listen: jest.fn(),
        listenStdio: jest.fn<() => Promise<void>>().mockResolvedValue(),
      };
    }),
  };
});

describe('main', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockExit: jest.SpiedFunction<(code?: number) => never>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockExit = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    // Clear the module cache to ensure fresh import
    jest.resetModules();

    // Clear all environment variables to ensure clean state
    delete process.env.COINBASE_API_KEY_NAME;
    delete process.env.COINBASE_PRIVATE_KEY;
    delete process.env.PORT;
  });

  afterEach(() => {
    process.env = originalEnv;
    mockExit.mockRestore();
  });

  it('should start server with environment variables set', () => {
    process.env.COINBASE_API_KEY_NAME = 'test-api-key';
    process.env.COINBASE_PRIVATE_KEY = 'test-private-key';
    process.env.PORT = '4000';

    const { CoinbaseMcpServer } = require('@server/CoinbaseMcpServer') as {
      CoinbaseMcpServer: jest.MockedClass<
        typeof import('./server/CoinbaseMcpServer').CoinbaseMcpServer
      >;
    };

    // Import and run main
    require('./index');

    expect(CoinbaseMcpServer).toHaveBeenCalledWith(
      'test-api-key',
      'test-private-key',
    );

    const mockInstance = CoinbaseMcpServer.mock.results[0]?.value as {
      listen: jest.Mock;
    };
    expect(mockInstance.listen).toHaveBeenCalledWith(4000);
  });

  it('should use default port 3000 when PORT is not set', () => {
    process.env.COINBASE_API_KEY_NAME = 'test-api-key';
    process.env.COINBASE_PRIVATE_KEY = 'test-private-key';

    const { CoinbaseMcpServer } = require('@server/CoinbaseMcpServer') as {
      CoinbaseMcpServer: jest.MockedClass<
        typeof import('./server/CoinbaseMcpServer').CoinbaseMcpServer
      >;
    };

    require('./index');

    const mockInstance = CoinbaseMcpServer.mock.results[0]?.value as {
      listen: jest.Mock;
    };
    expect(mockInstance.listen).toHaveBeenCalledWith(3000);
  });

  it('should start server in stdio mode when --stdio flag is present', async () => {
    process.env.COINBASE_API_KEY_NAME = 'test-api-key';
    process.env.COINBASE_PRIVATE_KEY = 'test-private-key';

    // Add --stdio flag to process.argv
    const originalArgv = process.argv;
    process.argv = [...originalArgv, '--stdio'];

    try {
      const { CoinbaseMcpServer } = require('@server/CoinbaseMcpServer') as {
        CoinbaseMcpServer: jest.MockedClass<
          typeof import('./server/CoinbaseMcpServer').CoinbaseMcpServer
        >;
      };

      require('./index');

      // Wait for the async main function to complete
      await new Promise((resolve) => setImmediate(resolve));

      const mockInstance = CoinbaseMcpServer.mock.results[0]?.value as {
        listen: jest.Mock;
        listenStdio: jest.Mock;
      };
      expect(mockInstance.listenStdio).toHaveBeenCalled();
      expect(mockInstance.listen).not.toHaveBeenCalled();
    } finally {
      process.argv = originalArgv;
    }
  });

  it('should exit with error when COINBASE_API_KEY_NAME is missing', () => {
    delete process.env.COINBASE_API_KEY_NAME;
    process.env.COINBASE_PRIVATE_KEY = 'test-private-key';

    require('./index');

    expect(logger.server.error).toHaveBeenCalledWith(
      'COINBASE_API_KEY_NAME and COINBASE_PRIVATE_KEY environment variables must be set',
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit with error when COINBASE_PRIVATE_KEY is missing', () => {
    process.env.COINBASE_API_KEY_NAME = 'test-api-key';
    delete process.env.COINBASE_PRIVATE_KEY;

    require('./index');

    expect(logger.server.error).toHaveBeenCalledWith(
      'COINBASE_API_KEY_NAME and COINBASE_PRIVATE_KEY environment variables must be set',
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit with error when both environment variables are missing', () => {
    delete process.env.COINBASE_API_KEY_NAME;
    delete process.env.COINBASE_PRIVATE_KEY;

    require('./index');

    expect(logger.server.error).toHaveBeenCalledWith(
      'COINBASE_API_KEY_NAME and COINBASE_PRIVATE_KEY environment variables must be set',
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
