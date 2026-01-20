import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createSdkFuturesServiceMock } from '@test/serviceMocks';
import { FuturesService } from './FuturesService';
import type { FCMPosition as SdkFCMPosition } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMPosition';
import type { FCMBalanceSummary as SdkFCMBalanceSummary } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMBalanceSummary';
import type { FCMSweep as SdkFCMSweep } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMSweep';
import { FCMPositionSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FCMPositionSide';
import { FCMSweepStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FCMSweepStatus';
import {
  toFCMPosition,
  toFCMBalanceSummary,
  toFCMSweep,
} from './FuturesService.convert';

const mockSdkService = createSdkFuturesServiceMock();

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  FuturesService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

describe('FuturesService', () => {
  let service: FuturesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FuturesService({} as never);
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
      mockSdkService.listPositions.mockResolvedValue(mockSdkResponse);

      const result = await service.listPositions();

      expect(mockSdkService.listPositions).toHaveBeenCalledWith({});
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
      mockSdkService.getPosition.mockResolvedValue(mockSdkResponse);

      const result = await service.getPosition({ productId: 'BTC-PERP' });

      expect(mockSdkService.getPosition).toHaveBeenCalledWith({
        productId: 'BTC-PERP',
      });
      expect(result).toEqual({
        position: toFCMPosition(mockSdkPosition),
      });
      expect(result.position?.numberOfContracts).toBe(5);
    });

    it('should handle undefined position', async () => {
      const mockSdkResponse = {};
      mockSdkService.getPosition.mockResolvedValue(mockSdkResponse);

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
      mockSdkService.getBalanceSummary.mockResolvedValue(mockSdkResponse);

      const result = await service.getBalanceSummary();

      expect(mockSdkService.getBalanceSummary).toHaveBeenCalledWith({});
      expect(result).toEqual({
        balanceSummary: toFCMBalanceSummary(mockSdkSummary),
      });
      expect(result.balanceSummary?.futuresBuyingPower?.value).toBe(10000);
      expect(result.balanceSummary?.liquidationBufferPercentage).toBe(75.5);
    });

    it('should handle undefined balanceSummary', async () => {
      const mockSdkResponse = {};
      mockSdkService.getBalanceSummary.mockResolvedValue(mockSdkResponse);

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
      mockSdkService.listSweeps.mockResolvedValue(mockSdkResponse);

      const result = await service.listSweeps();

      expect(mockSdkService.listSweeps).toHaveBeenCalledWith({});
      expect(result).toEqual({
        sweeps: [toFCMSweep(mockSdkSweep)],
      });
      expect(result.sweeps?.[0].requestedAmount?.value).toBe(5000);
    });

    it('should handle empty sweeps array', async () => {
      const mockSdkResponse = { sweeps: [] };
      mockSdkService.listSweeps.mockResolvedValue(mockSdkResponse);

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
      mockSdkService.listSweeps.mockResolvedValue(mockSdkResponse);

      const result = await service.listSweeps();

      expect(result.sweeps?.[0].requestedAmount).toBeUndefined();
    });
  });
});
