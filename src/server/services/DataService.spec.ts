import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { mockResponse } from '@test/serviceMocks';
import { DataService } from './DataService';

describe('DataService', () => {
  let service: DataService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new DataService(mockClient as unknown as CoinbaseAdvTradeClient);
  });

  describe('getAPIKeyPermissions', () => {
    it('should delegate to SDK with empty object', async () => {
      const responseData = { canView: true, canTrade: true };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      const result = await service.getAPIKeyPermissions();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'key_permissions',
        queryParams: {},
      });
      expect(result).toEqual(responseData);
    });
  });
});
