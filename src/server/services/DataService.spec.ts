import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createSdkDataServiceMock } from '@test/serviceMocks';
import { DataService } from './DataService';

const mockSdkService = createSdkDataServiceMock();

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  DataService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DataService({} as never);
  });

  describe('getAPIKeyPermissions', () => {
    it('should delegate to SDK with empty object', async () => {
      const mockResponse = { canView: true, canTrade: true };
      mockSdkService.getAPIKeyPermissions.mockResolvedValue(mockResponse);

      const result = await service.getAPIKeyPermissions();

      expect(mockSdkService.getAPIKeyPermissions).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });
  });
});
