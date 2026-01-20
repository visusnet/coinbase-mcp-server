import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AccountsService } from './AccountsService';

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  AccountsService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  listAccounts: jest.fn(),
  getAccount: jest.fn(),
};

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccountsService({} as never);
  });

  describe('listAccounts', () => {
    it('should delegate to SDK with empty object when no request provided', async () => {
      const mockResponse = { accounts: [] };
      mockSdkService.listAccounts.mockResolvedValue(mockResponse);

      const result = await service.listAccounts();

      expect(mockSdkService.listAccounts).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });

    it('should delegate to SDK with request when provided', async () => {
      const mockResponse = { accounts: [{ uuid: 'acc-123' }] };
      mockSdkService.listAccounts.mockResolvedValue(mockResponse);

      const result = await service.listAccounts({ limit: 10 });

      expect(mockSdkService.listAccounts).toHaveBeenCalledWith({ limit: 10 });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getAccount', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = { account: { uuid: 'acc-123' } };
      mockSdkService.getAccount.mockResolvedValue(mockResponse);

      const result = await service.getAccount({ accountUuid: 'acc-123' });

      expect(mockSdkService.getAccount).toHaveBeenCalledWith({
        accountUuid: 'acc-123',
      });
      expect(result).toBe(mockResponse);
    });
  });
});
