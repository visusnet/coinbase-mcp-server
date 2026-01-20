import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType.js';
import { ContractExpiryType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ContractExpiryType.js';
import { ProductVenue } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductVenue.js';
import { FeesService } from './FeesService';

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  FeesService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  getTransactionSummary: jest.fn(),
};

describe('FeesService', () => {
  let service: FeesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FeesService({} as never);
  });

  describe('getTransactionSummary', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = {
        totalVolume: 1000,
        totalFees: 10,
        feeTier: { pricingTier: 'Advanced' },
      };
      mockSdkService.getTransactionSummary.mockResolvedValue(mockResponse);

      const result = await service.getTransactionSummary({
        productType: ProductType.Spot,
        contractExpiryType: ContractExpiryType.UnknownContractExpiryType,
        productVenue: ProductVenue.Cbe,
      });

      expect(mockSdkService.getTransactionSummary).toHaveBeenCalledWith({
        productType: ProductType.Spot,
        contractExpiryType: ContractExpiryType.UnknownContractExpiryType,
        productVenue: ProductVenue.Cbe,
      });
      expect(result).toBe(mockResponse);
    });
  });
});
