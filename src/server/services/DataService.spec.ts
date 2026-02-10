import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseClient } from '@client/CoinbaseClient';
import { mockResponse } from '@test/serviceMocks';
import { DataService } from './DataService';

describe('DataService', () => {
  let service: DataService;
  let mockClient: { request: jest.Mock<CoinbaseClient['request']> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = { request: jest.fn<CoinbaseClient['request']>() };
    service = new DataService(mockClient as unknown as CoinbaseClient);
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
