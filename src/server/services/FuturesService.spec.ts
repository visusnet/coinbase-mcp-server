import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { FuturesService } from './FuturesService';
import type { FCMPosition as SdkFCMPosition } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMPosition';
import type { FCMBalanceSummary as SdkFCMBalanceSummary } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMBalanceSummary';
import type { FCMSweep as SdkFCMSweep } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMSweep';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { FCMPositionSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FCMPositionSide';
import { FCMSweepStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FCMSweepStatus';
import { mockResponse } from '@test/serviceMocks';
import {
  toFCMPosition,
  toFCMBalanceSummary,
  toFCMSweep,
} from './FuturesService.convert';

describe('FuturesService', () => {
  let service: FuturesService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new FuturesService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('listPositions', () => {
    it('should convert SDK response to numbers', async () => {
      const mockSdkPosition: SdkFCMPosition = {
        productId: 'BTC-PERP',
        expirationTime: '2024-12-31T00:00:00Z',
        side: FCMPositionSide.Long,
        numberOfContracts: '10',
        currentPrice: '50000.50',
        avgEntryPrice: '48000.25',
        unrealizedPnl: '20002.50',
        dailyRealizedPnl: '100.00',
      };
      const mockSdkResponse = { positions: [mockSdkPosition] };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.listPositions();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'cfm/positions',
        queryParams: {},
      });
      expect(result).toEqual({
        positions: [toFCMPosition(mockSdkPosition)],
      });
      expect(result.positions?.[0].numberOfContracts).toBe(10);
      expect(result.positions?.[0].currentPrice).toBe(50000.5);
    });
  });

  describe('getPosition', () => {
    it('should convert SDK response to numbers', async () => {
      const mockSdkPosition: SdkFCMPosition = {
        productId: 'BTC-PERP',
        numberOfContracts: '5',
        currentPrice: '51000.00',
        avgEntryPrice: '50000.00',
        unrealizedPnl: '5000.00',
        dailyRealizedPnl: '0',
      };
      const mockSdkResponse = { position: mockSdkPosition };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPosition({ productId: 'BTC-PERP' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'cfm/positions/BTC-PERP',
        queryParams: {},
      });
      expect(result).toEqual({
        position: toFCMPosition(mockSdkPosition),
      });
      expect(result.position?.numberOfContracts).toBe(5);
    });

    it('should handle undefined position', async () => {
      const mockSdkResponse = {};
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPosition({ productId: 'NOT-FOUND' });

      expect(result.position).toBeUndefined();
    });
  });

  describe('getBalanceSummary', () => {
    it('should convert SDK response to numbers', async () => {
      const mockSdkSummary: SdkFCMBalanceSummary = {
        futuresBuyingPower: { value: '10000.00', currency: 'USD' },
        totalUsdBalance: { value: '25000.00', currency: 'USD' },
        cbiUsdBalance: { value: '15000.00', currency: 'USD' },
        cfmUsdBalance: { value: '10000.00', currency: 'USD' },
        totalOpenOrdersHoldAmount: { value: '1000.00', currency: 'USD' },
        unrealizedPnl: { value: '500.50', currency: 'USD' },
        dailyRealizedPnl: { value: '100.25', currency: 'USD' },
        initialMargin: { value: '5000.00', currency: 'USD' },
        availableMargin: { value: '9500.00', currency: 'USD' },
        liquidationThreshold: { value: '2000.00', currency: 'USD' },
        liquidationBufferAmount: { value: '7500.00', currency: 'USD' },
        liquidationBufferPercentage: '75.5',
      };
      const mockSdkResponse = { balanceSummary: mockSdkSummary };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getBalanceSummary();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'cfm/balance_summary',
        queryParams: {},
      });
      expect(result).toEqual({
        balanceSummary: toFCMBalanceSummary(mockSdkSummary),
      });
      expect(result.balanceSummary?.futuresBuyingPower?.value).toBe(10000);
      expect(result.balanceSummary?.liquidationBufferPercentage).toBe(75.5);
    });

    it('should handle undefined balanceSummary', async () => {
      const mockSdkResponse = {};
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getBalanceSummary();

      expect(result.balanceSummary).toBeUndefined();
    });
  });

  describe('listSweeps', () => {
    it('should convert SDK response to numbers', async () => {
      const mockSdkSweep: SdkFCMSweep = {
        id: 'sweep-123',
        requestedAmount: { value: '5000.00', currency: 'USD' },
        shouldSweepAll: false,
        status: FCMSweepStatus.Pending,
        scheduledTime: '2024-01-15T10:00:00Z',
      };
      const mockSdkResponse = { sweeps: [mockSdkSweep] };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.listSweeps();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'cfm/sweeps',
        queryParams: {},
      });
      expect(result).toEqual({
        sweeps: [toFCMSweep(mockSdkSweep)],
      });
      expect(result.sweeps?.[0].requestedAmount?.value).toBe(5000);
    });

    it('should handle empty sweeps array', async () => {
      const mockSdkResponse = { sweeps: [] };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.listSweeps();

      expect(result).toEqual({ sweeps: [] });
    });

    it('should handle undefined requestedAmount', async () => {
      const mockSdkSweep: SdkFCMSweep = {
        id: 'sweep-456',
        shouldSweepAll: true,
        status: FCMSweepStatus.Pending,
      };
      const mockSdkResponse = { sweeps: [mockSdkSweep] };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.listSweeps();

      expect(result.sweeps?.[0].requestedAmount).toBeUndefined();
    });
  });
});
