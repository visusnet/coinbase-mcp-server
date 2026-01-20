import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createSdkAccountsServiceMock } from '@test/serviceMocks';
import { AccountsService } from './AccountsService';

const mockSdkService = createSdkAccountsServiceMock();

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  AccountsService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccountsService({} as never);
  });

  describe('listAccounts', () => {
    it('should delegate to SDK and convert Amount values to numbers', async () => {
      const mockSdkResponse = {
        accounts: [
          {
            uuid: 'acc-123',
            availableBalance: { value: '100.50', currency: 'USD' },
            hold: { value: '10.25', currency: 'USD' },
          },
        ],
        hasNext: false,
      };
      mockSdkService.listAccounts.mockResolvedValue(mockSdkResponse);

      const result = await service.listAccounts();

      expect(mockSdkService.listAccounts).toHaveBeenCalledWith({});
      expect(result.accounts?.[0].availableBalance?.value).toBe(100.5);
      expect(result.accounts?.[0].hold?.value).toBe(10.25);
    });

    it('should delegate to SDK with request when provided', async () => {
      const mockSdkResponse = {
        accounts: [{ uuid: 'acc-123' }],
        hasNext: false,
      };
      mockSdkService.listAccounts.mockResolvedValue(mockSdkResponse);

      const result = await service.listAccounts({ limit: 10 });

      expect(mockSdkService.listAccounts).toHaveBeenCalledWith({ limit: 10 });
      expect(result.accounts?.[0].uuid).toBe('acc-123');
    });
  });

  describe('getAccount', () => {
    it('should delegate to SDK and convert Amount values to numbers', async () => {
      const mockSdkResponse = {
        account: {
          uuid: 'acc-123',
          availableBalance: { value: '500.75', currency: 'BTC' },
          hold: { value: '50.25', currency: 'BTC' },
        },
      };
      mockSdkService.getAccount.mockResolvedValue(mockSdkResponse);

      const result = await service.getAccount({ accountUuid: 'acc-123' });

      expect(mockSdkService.getAccount).toHaveBeenCalledWith({
        accountUuid: 'acc-123',
      });
      expect(result.account?.availableBalance?.value).toBe(500.75);
      expect(result.account?.hold?.value).toBe(50.25);
    });

    it('should handle undefined account', async () => {
      const mockSdkResponse = {};
      mockSdkService.getAccount.mockResolvedValue(mockSdkResponse);

      const result = await service.getAccount({ accountUuid: 'acc-not-found' });

      expect(result.account).toBeUndefined();
    });
  });
});
