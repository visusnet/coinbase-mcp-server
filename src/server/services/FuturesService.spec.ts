import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { z } from 'zod';
import { mockResponse } from '@test/serviceMocks';
import { FuturesService } from './FuturesService';
import {
  FCMPositionSide,
  FCMSweepStatus,
  ListFuturesPositionsResponseSchema,
  GetFuturesPositionResponseSchema,
  GetFuturesBalanceSummaryResponseSchema,
  ListFuturesSweepsResponseSchema,
} from './FuturesService.response';

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
      const mockApiResponse: z.input<
        typeof ListFuturesPositionsResponseSchema
      > = {
        positions: [
          {
            productId: 'BTC-PERP',
            expirationTime: '2024-12-31T00:00:00Z',
            side: FCMPositionSide.Long,
            numberOfContracts: '10',
            currentPrice: '50000.50',
            avgEntryPrice: '48000.25',
            unrealizedPnl: '20002.50',
            dailyRealizedPnl: '100.00',
          },
        ],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listPositions();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'cfm/positions',
        queryParams: {},
      });
      expect(result.positions).toHaveLength(1);
      expect(result.positions?.[0].productId).toBe('BTC-PERP');
      expect(result.positions?.[0].expirationTime).toBe('2024-12-31T00:00:00Z');
      expect(result.positions?.[0].side).toBe(FCMPositionSide.Long);
      expect(result.positions?.[0].numberOfContracts).toBe(10);
      expect(result.positions?.[0].currentPrice).toBe(50000.5);
      expect(result.positions?.[0].avgEntryPrice).toBe(48000.25);
      expect(result.positions?.[0].unrealizedPnl).toBe(20002.5);
      expect(result.positions?.[0].dailyRealizedPnl).toBe(100);
    });
  });

  describe('getPosition', () => {
    it('should convert SDK response to numbers', async () => {
      const mockApiResponse: z.input<typeof GetFuturesPositionResponseSchema> =
        {
          position: {
            productId: 'BTC-PERP',
            numberOfContracts: '5',
            currentPrice: '51000.00',
            avgEntryPrice: '50000.00',
            unrealizedPnl: '5000.00',
            dailyRealizedPnl: '0',
          },
        };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPosition({ productId: 'BTC-PERP' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'cfm/positions/BTC-PERP',
        queryParams: {},
      });
      expect(result.position?.productId).toBe('BTC-PERP');
      expect(result.position?.numberOfContracts).toBe(5);
      expect(result.position?.currentPrice).toBe(51000);
      expect(result.position?.avgEntryPrice).toBe(50000);
      expect(result.position?.unrealizedPnl).toBe(5000);
      expect(result.position?.dailyRealizedPnl).toBe(0);
    });

    it('should handle undefined position', async () => {
      const mockApiResponse = {};
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPosition({ productId: 'NOT-FOUND' });

      expect(result.position).toBeUndefined();
    });
  });

  describe('getBalanceSummary', () => {
    it('should convert SDK response to numbers', async () => {
      const mockApiResponse: z.input<
        typeof GetFuturesBalanceSummaryResponseSchema
      > = {
        balanceSummary: {
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
          intradayMarginWindowMeasure: {
            marginWindowType: 'INTRADAY',
            marginLevel: 'BASE',
            initialMargin: '1000.00',
            maintenanceMargin: '500.00',
            liquidationBuffer: '250.00',
            totalHold: '100.00',
            futuresBuyingPower: '5000.00',
          },
          overnightMarginWindowMeasure: {
            marginWindowType: 'OVERNIGHT',
            marginLevel: 'BASE',
            initialMargin: '2000.00',
            maintenanceMargin: '1000.00',
            liquidationBuffer: '500.00',
            totalHold: '200.00',
            futuresBuyingPower: '4000.00',
          },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getBalanceSummary();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'cfm/balance_summary',
        queryParams: {},
      });
      // Verify Amount fields
      expect(result.balanceSummary?.futuresBuyingPower?.value).toBe(10000);
      expect(result.balanceSummary?.futuresBuyingPower?.currency).toBe('USD');
      expect(result.balanceSummary?.totalUsdBalance?.value).toBe(25000);
      expect(result.balanceSummary?.cbiUsdBalance?.value).toBe(15000);
      expect(result.balanceSummary?.cfmUsdBalance?.value).toBe(10000);
      expect(result.balanceSummary?.totalOpenOrdersHoldAmount?.value).toBe(
        1000,
      );
      expect(result.balanceSummary?.unrealizedPnl?.value).toBe(500.5);
      expect(result.balanceSummary?.dailyRealizedPnl?.value).toBe(100.25);
      expect(result.balanceSummary?.initialMargin?.value).toBe(5000);
      expect(result.balanceSummary?.availableMargin?.value).toBe(9500);
      expect(result.balanceSummary?.liquidationThreshold?.value).toBe(2000);
      expect(result.balanceSummary?.liquidationBufferAmount?.value).toBe(7500);
      expect(result.balanceSummary?.liquidationBufferPercentage).toBe(75.5);
      // Verify margin window measures
      expect(
        result.balanceSummary?.intradayMarginWindowMeasure?.marginWindowType,
      ).toBe('INTRADAY');
      expect(
        result.balanceSummary?.intradayMarginWindowMeasure?.marginLevel,
      ).toBe('BASE');
      expect(
        result.balanceSummary?.intradayMarginWindowMeasure?.initialMargin,
      ).toBe(1000);
      expect(
        result.balanceSummary?.intradayMarginWindowMeasure?.maintenanceMargin,
      ).toBe(500);
      expect(
        result.balanceSummary?.intradayMarginWindowMeasure?.liquidationBuffer,
      ).toBe(250);
      expect(
        result.balanceSummary?.intradayMarginWindowMeasure?.totalHold,
      ).toBe(100);
      expect(
        result.balanceSummary?.intradayMarginWindowMeasure?.futuresBuyingPower,
      ).toBe(5000);
      expect(
        result.balanceSummary?.overnightMarginWindowMeasure?.futuresBuyingPower,
      ).toBe(4000);
    });

    it('should handle undefined balanceSummary', async () => {
      const mockApiResponse = {};
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getBalanceSummary();

      expect(result.balanceSummary).toBeUndefined();
    });

    it('should handle undefined margin window measures', async () => {
      const mockApiResponse: z.input<
        typeof GetFuturesBalanceSummaryResponseSchema
      > = {
        balanceSummary: {
          futuresBuyingPower: { value: '10000.00', currency: 'USD' },
          liquidationBufferPercentage: '50.0',
        },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getBalanceSummary();

      expect(result.balanceSummary?.futuresBuyingPower?.value).toBe(10000);
      expect(result.balanceSummary?.liquidationBufferPercentage).toBe(50);
      expect(
        result.balanceSummary?.intradayMarginWindowMeasure,
      ).toBeUndefined();
      expect(
        result.balanceSummary?.overnightMarginWindowMeasure,
      ).toBeUndefined();
    });
  });

  describe('listSweeps', () => {
    it('should convert SDK response to numbers', async () => {
      const mockApiResponse: z.input<typeof ListFuturesSweepsResponseSchema> = {
        sweeps: [
          {
            id: 'sweep-123',
            requestedAmount: { value: '5000.00', currency: 'USD' },
            shouldSweepAll: false,
            status: FCMSweepStatus.Pending,
            scheduledTime: '2024-01-15T10:00:00Z',
          },
        ],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listSweeps();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'cfm/sweeps',
        queryParams: {},
      });
      expect(result.sweeps).toHaveLength(1);
      expect(result.sweeps?.[0].id).toBe('sweep-123');
      expect(result.sweeps?.[0].requestedAmount?.value).toBe(5000);
      expect(result.sweeps?.[0].requestedAmount?.currency).toBe('USD');
      expect(result.sweeps?.[0].shouldSweepAll).toBe(false);
      expect(result.sweeps?.[0].status).toBe(FCMSweepStatus.Pending);
      expect(result.sweeps?.[0].scheduledTime).toBe('2024-01-15T10:00:00Z');
    });

    it('should handle empty sweeps array', async () => {
      const mockApiResponse: z.input<typeof ListFuturesSweepsResponseSchema> = {
        sweeps: [],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listSweeps();

      expect(result).toEqual({ sweeps: [] });
    });

    it('should handle undefined requestedAmount', async () => {
      const mockApiResponse: z.input<typeof ListFuturesSweepsResponseSchema> = {
        sweeps: [
          {
            id: 'sweep-456',
            shouldSweepAll: true,
            status: FCMSweepStatus.Pending,
          },
        ],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listSweeps();

      expect(result.sweeps?.[0].requestedAmount).toBeUndefined();
    });
  });
});
