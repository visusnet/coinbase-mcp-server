import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { z } from 'zod';
import { mockResponse } from '@test/serviceMocks';
import { AccountsService } from './AccountsService';
import {
  ListAccountsResponseSchema,
  GetAccountResponseSchema,
} from './AccountsService.schema';

describe('AccountsService', () => {
  let service: AccountsService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new AccountsService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('listAccounts', () => {
    it('should delegate to SDK and convert Amount values to numbers', async () => {
      const mockApiResponse: z.input<typeof ListAccountsResponseSchema> = {
        accounts: [
          {
            uuid: 'acc-123',
            availableBalance: { value: '100.50', currency: 'USD' },
            hold: { value: '10.25', currency: 'USD' },
          },
        ],
        hasNext: false,
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listAccounts();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'accounts',
        queryParams: {},
      });
      expect(result.accounts?.[0].availableBalance?.value).toBe(100.5);
      expect(result.accounts?.[0].hold?.value).toBe(10.25);
    });

    it('should delegate to SDK with request when provided', async () => {
      const mockApiResponse: z.input<typeof ListAccountsResponseSchema> = {
        accounts: [{ uuid: 'acc-123' }],
        hasNext: false,
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listAccounts({ limit: 10 });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'accounts',
        queryParams: { limit: 10 },
      });
      expect(result.accounts?.[0].uuid).toBe('acc-123');
    });
  });

  describe('getAccount', () => {
    it('should delegate to SDK and convert Amount values to numbers', async () => {
      const mockApiResponse: z.input<typeof GetAccountResponseSchema> = {
        account: {
          uuid: 'acc-123',
          availableBalance: { value: '500.75', currency: 'BTC' },
          hold: { value: '50.25', currency: 'BTC' },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getAccount({ accountUuid: 'acc-123' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'accounts/acc-123',
      });
      expect(result.account?.availableBalance?.value).toBe(500.75);
      expect(result.account?.hold?.value).toBe(50.25);
    });

    it('should handle undefined account', async () => {
      const mockApiResponse: z.input<typeof GetAccountResponseSchema> = {};
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getAccount({ accountUuid: 'acc-not-found' });

      expect(result.account).toBeUndefined();
    });
  });
});
