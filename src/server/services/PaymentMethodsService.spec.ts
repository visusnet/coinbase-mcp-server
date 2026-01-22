import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { mockResponse } from '@test/serviceMocks';
import { PaymentMethodsService } from './PaymentMethodsService';

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new PaymentMethodsService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('listPaymentMethods', () => {
    it('should delegate to SDK', async () => {
      const responseData = { paymentMethods: [] };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      const result = await service.listPaymentMethods();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'payment_methods',
        queryParams: {},
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('getPaymentMethod', () => {
    it('should delegate to SDK', async () => {
      const responseData = {
        id: 'pm-123',
        type: 'BANK_ACCOUNT',
        name: 'Test Bank',
      };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      const result = await service.getPaymentMethod({
        paymentMethodId: 'pm-123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'payment_methods/pm-123',
        queryParams: {},
      });
      expect(result).toEqual(responseData);
    });
  });
});
