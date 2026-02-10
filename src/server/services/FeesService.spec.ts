import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseClient } from '@client/CoinbaseClient';
import { mockResponse } from '@test/serviceMocks';
import { FeesService } from './FeesService';
import { ProductType } from './common.request';
import { ContractExpiryType, ProductVenue } from './FeesService.request';

describe('FeesService', () => {
  let service: FeesService;
  let mockClient: { request: jest.Mock<CoinbaseClient['request']> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = { request: jest.fn<CoinbaseClient['request']>() };
    service = new FeesService(mockClient as unknown as CoinbaseClient);
  });

  describe('getTransactionSummary', () => {
    it('should convert SDK response to our types', async () => {
      const mockResponse_ = {
        totalVolume: 1000,
        totalFees: 10,
        feeTier: {
          pricingTier: 'Advanced',
          usdFrom: '0',
          usdTo: '10000',
          takerFeeRate: '0.006',
          makerFeeRate: '0.004',
          aopFrom: '0',
          aopTo: '100000',
        },
        marginRate: { value: '0.05' },
        goodsAndServicesTax: { rate: '0.10', type: 'INCLUSIVE' },
        advancedTradeOnlyVolume: 500,
        advancedTradeOnlyFees: 5,
        coinbaseProVolume: 500,
        coinbaseProFees: 5,
        totalBalance: '50000',
      };
      mockClient.request.mockResolvedValue(mockResponse(mockResponse_));

      const result = await service.getTransactionSummary({
        productType: ProductType.Spot,
        contractExpiryType: ContractExpiryType.UnknownContractExpiryType,
        productVenue: ProductVenue.Cbe,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'transaction_summary',
        queryParams: {
          productType: ProductType.Spot,
          contractExpiryType: ContractExpiryType.UnknownContractExpiryType,
          productVenue: ProductVenue.Cbe,
        },
      });
      // Verify conversions - numeric fields already numbers, string fields converted
      expect(result.totalVolume).toBe(1000);
      expect(result.totalFees).toBe(10);
      expect(result.feeTier?.pricingTier).toBe('Advanced');
      expect(result.feeTier?.usdFrom).toBe(0);
      expect(result.feeTier?.usdTo).toBe(10000);
      expect(result.feeTier?.takerFeeRate).toBe(0.006);
      expect(result.feeTier?.makerFeeRate).toBe(0.004);
      expect(result.feeTier?.aopFrom).toBe(0);
      expect(result.feeTier?.aopTo).toBe(100000);
      expect(result.marginRate?.value).toBe(0.05);
      expect(result.goodsAndServicesTax?.rate).toBe(0.1);
      expect(result.goodsAndServicesTax?.type).toBe('INCLUSIVE');
      expect(result.advancedTradeOnlyVolume).toBe(500);
      expect(result.advancedTradeOnlyFees).toBe(5);
      expect(result.coinbaseProVolume).toBe(500);
      expect(result.coinbaseProFees).toBe(5);
      expect(result.totalBalance).toBe(50000);
    });

    it('should handle response without optional fields', async () => {
      const mockResponse_ = {
        totalVolume: 1000,
        totalFees: 10,
        feeTier: { pricingTier: 'Basic' },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockResponse_));

      const result = await service.getTransactionSummary({
        productType: ProductType.Spot,
        contractExpiryType: ContractExpiryType.UnknownContractExpiryType,
        productVenue: ProductVenue.Cbe,
      });

      expect(result.totalVolume).toBe(1000);
      expect(result.totalFees).toBe(10);
      expect(result.feeTier?.pricingTier).toBe('Basic');
      expect(result.marginRate).toBeUndefined();
      expect(result.goodsAndServicesTax).toBeUndefined();
      expect(result.totalBalance).toBeUndefined();
    });
  });
});
