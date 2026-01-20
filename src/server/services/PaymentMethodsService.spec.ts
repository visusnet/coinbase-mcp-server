import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createSdkPaymentMethodsServiceMock } from '@test/serviceMocks';
import { PaymentMethodsService } from './PaymentMethodsService';

const mockSdkService = createSdkPaymentMethodsServiceMock();

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  PaymentMethodsService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentMethodsService({} as never);
  });

  describe('listPaymentMethods', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = { paymentMethods: [] };
      mockSdkService.listPaymentMethods.mockResolvedValue(mockResponse);

      const result = await service.listPaymentMethods();

      expect(mockSdkService.listPaymentMethods).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPaymentMethod', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = {
        id: 'pm-123',
        type: 'BANK_ACCOUNT',
        name: 'Test Bank',
      };
      mockSdkService.getPaymentMethod.mockResolvedValue(mockResponse);

      const result = await service.getPaymentMethod({
        paymentMethodId: 'pm-123',
      });

      expect(mockSdkService.getPaymentMethod).toHaveBeenCalledWith({
        paymentMethodId: 'pm-123',
      });
      expect(result).toBe(mockResponse);
    });
  });
});
