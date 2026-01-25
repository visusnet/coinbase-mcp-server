import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PerpetualsService } from './PerpetualsService';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { z } from 'zod';
import { mockResponse } from '@test/serviceMocks';
import {
  PositionSide,
  ListPerpetualsPositionsResponseSchema,
  GetPerpetualsPositionResponseSchema,
  GetPortfolioSummaryResponseSchema,
  GetPortfolioBalanceResponseSchema,
} from './PerpetualsService.schema';

describe('PerpetualsService', () => {
  let service: PerpetualsService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new PerpetualsService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('listPositions', () => {
    it('should convert SDK response to numbers', async () => {
      const mockApiResponse: z.input<
        typeof ListPerpetualsPositionsResponseSchema
      > = {
        positions: [
          {
            productId: 'BTC-PERP',
            portfolioUuid: 'port-123',
            symbol: 'BTC-PERP-INTX',
            positionSide: PositionSide.Long,
            netSize: '1.5',
            buyOrderSize: '0.5',
            sellOrderSize: '0',
            imContribution: '1000.00',
            leverage: '10',
            vwap: { value: '50000.00', currency: 'USD' },
            unrealizedPnl: { value: '500.00', currency: 'USD' },
          },
        ],
        summary: { aggregatedPnl: { value: '500.00', currency: 'USD' } },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listPositions({ portfolioUuid: 'port-123' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'intx/positions/port-123',
        queryParams: {},
      });
      expect(result.positions?.[0].netSize).toBe(1.5);
      expect(result.positions?.[0].leverage).toBe(10);
      expect(result.positions?.[0].vwap?.value).toBe(50000);
    });
  });

  describe('getPosition', () => {
    it('should convert SDK response to numbers', async () => {
      const mockApiResponse: z.input<
        typeof GetPerpetualsPositionResponseSchema
      > = {
        position: {
          productId: 'BTC-PERP',
          netSize: '2.0',
          buyOrderSize: '0',
          sellOrderSize: '0',
          imContribution: '0',
          leverage: '5',
          markPrice: { value: '51000.00', currency: 'USD' },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPosition({
        portfolioUuid: 'port-123',
        symbol: 'BTC-PERP',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'intx/positions/port-123/BTC-PERP',
        queryParams: {},
      });
      expect(result.position?.netSize).toBe(2);
      expect(result.position?.markPrice?.value).toBe(51000);
    });

    it('should handle undefined position', async () => {
      const mockApiResponse: z.input<
        typeof GetPerpetualsPositionResponseSchema
      > = {};
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPosition({
        portfolioUuid: 'port-123',
        symbol: 'NOT-FOUND',
      });

      expect(result.position).toBeUndefined();
    });
  });

  describe('getPortfolioSummary', () => {
    it('should convert SDK response to numbers', async () => {
      const mockApiResponse: z.input<typeof GetPortfolioSummaryResponseSchema> =
        {
          portfolios: [
            {
              portfolioUuid: 'port-123',
              collateral: '10000.00',
              positionNotional: '50000.00',
              openPositionNotional: '0',
              pendingFees: '10.50',
              borrow: '0',
              accruedInterest: '0',
              rollingDebt: '0',
              portfolioInitialMargin: '0.1',
              portfolioMaintenanceMargin: '0',
              liquidationPercentage: '0',
              liquidationBuffer: '0',
              unrealizedPnl: { value: '500.00', currency: 'USD' },
              totalBalance: { value: '10500.00', currency: 'USD' },
            },
          ],
          summary: {
            unrealizedPnl: { value: '500.00', currency: 'USD' },
            buyingPower: { value: '5000.00', currency: 'USD' },
          },
        };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPortfolioSummary({
        portfolioUuid: 'port-123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'intx/portfolio/port-123',
        queryParams: {},
      });
      expect(result.portfolios?.[0].collateral).toBe(10000);
      expect(result.portfolios?.[0].pendingFees).toBe(10.5);
      expect(result.summary?.buyingPower?.value).toBe(5000);
    });
  });

  describe('getPortfolioBalance', () => {
    it('should convert SDK response to numbers', async () => {
      const mockApiResponse: z.input<typeof GetPortfolioBalanceResponseSchema> =
        {
          portfolioBalances: [
            {
              portfolioUuid: 'port-123',
              balances: [
                {
                  asset: {
                    assetId: 'BTC',
                    collateralWeight: '0.9',
                    accountCollateralLimit: '0',
                  },
                  quantity: '1.5',
                  hold: '0.1',
                  transferHold: '0',
                  collateralValue: '75000.00',
                  collateralWeight: '0.9',
                  maxWithdrawAmount: '0',
                  loan: '0',
                  loanCollateralRequirementUsd: '0',
                  pledgedQuantity: '0',
                },
              ],
              isMarginLimitReached: false,
            },
          ],
        };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPortfolioBalance({
        portfolioUuid: 'port-123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'intx/balances/port-123',
        queryParams: {},
      });
      expect(result.portfolioBalances?.[0].balances?.[0].quantity).toBe(1.5);
      expect(result.portfolioBalances?.[0].balances?.[0].collateralValue).toBe(
        75000,
      );
      expect(
        result.portfolioBalances?.[0].balances?.[0].asset?.collateralWeight,
      ).toBe(0.9);
    });

    it('should handle empty balances array', async () => {
      const mockApiResponse: z.input<typeof GetPortfolioBalanceResponseSchema> =
        {
          portfolioBalances: [],
        };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPortfolioBalance({
        portfolioUuid: 'port-123',
      });

      expect(result).toEqual({ portfolioBalances: [] });
    });

    it('should handle balance with undefined asset', async () => {
      const mockApiResponse: z.input<typeof GetPortfolioBalanceResponseSchema> =
        {
          portfolioBalances: [
            {
              portfolioUuid: 'port-123',
              balances: [
                {
                  quantity: '1.0',
                  hold: '0',
                  transferHold: '0',
                  collateralValue: '0',
                  collateralWeight: '0',
                  maxWithdrawAmount: '0',
                  loan: '0',
                  loanCollateralRequirementUsd: '0',
                  pledgedQuantity: '0',
                },
              ],
            },
          ],
        };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPortfolioBalance({
        portfolioUuid: 'port-123',
      });

      expect(result.portfolioBalances?.[0].balances?.[0].asset).toBeUndefined();
      expect(result.portfolioBalances?.[0].balances?.[0].quantity).toBe(1);
    });
  });

  describe('listPositions edge cases', () => {
    it('should handle undefined summary', async () => {
      const mockApiResponse: z.input<
        typeof ListPerpetualsPositionsResponseSchema
      > = {
        positions: [
          {
            productId: 'BTC-PERP',
            netSize: '1.0',
            buyOrderSize: '0',
            sellOrderSize: '0',
            imContribution: '0',
            leverage: '0',
          },
        ],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listPositions({ portfolioUuid: 'port-123' });

      expect(result.summary).toBeUndefined();
    });
  });

  describe('getPortfolioSummary edge cases', () => {
    it('should handle undefined summary', async () => {
      const mockApiResponse: z.input<typeof GetPortfolioSummaryResponseSchema> =
        {
          portfolios: [
            {
              portfolioUuid: 'port-123',
              collateral: '1000.00',
              positionNotional: '0',
              openPositionNotional: '0',
              pendingFees: '0',
              borrow: '0',
              accruedInterest: '0',
              rollingDebt: '0',
              portfolioInitialMargin: '0',
              portfolioMaintenanceMargin: '0',
              liquidationPercentage: '0',
              liquidationBuffer: '0',
            },
          ],
        };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getPortfolioSummary({
        portfolioUuid: 'port-123',
      });

      expect(result.summary).toBeUndefined();
    });
  });
});
