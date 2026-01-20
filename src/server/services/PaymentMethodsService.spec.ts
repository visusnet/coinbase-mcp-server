import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PaymentMethodsService } from './PaymentMethodsService';

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  PaymentMethodsService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  listPaymentMethods: jest.fn(),
  getPaymentMethod: jest.fn(),
};

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
      const mockResponse = { paymentMethod: { id: 'pm-123' } };
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
