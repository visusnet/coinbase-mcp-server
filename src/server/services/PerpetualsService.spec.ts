import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PerpetualsService } from './PerpetualsService';
import type { Position as SdkPosition } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Position';
import type { Portfolio as SdkPortfolio } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Portfolio';
import type { PortfolioBalance as SdkPortfolioBalance } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PortfolioBalance';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { PositionSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/PositionSide';
import { mockResponse } from '@test/serviceMocks';
import {
  toListPerpetualsPositionsResponse,
  toGetPerpetualsPositionResponse,
  toGetPortfolioSummaryResponse,
  toGetPortfolioBalanceResponse,
} from './PerpetualsService.convert';

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
      const mockSdkPosition: SdkPosition = {
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
      };
      const mockSdkResponse = {
        positions: [mockSdkPosition],
        summary: { aggregatedPnl: { value: '500.00', currency: 'USD' } },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.listPositions({ portfolioUuid: 'port-123' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'intx/positions/port-123',
        queryParams: {},
      });
      expect(result).toEqual(
        toListPerpetualsPositionsResponse(mockSdkResponse),
      );
      expect(result.positions?.[0].netSize).toBe(1.5);
      expect(result.positions?.[0].leverage).toBe(10);
      expect(result.positions?.[0].vwap?.value).toBe(50000);
    });
  });

  describe('getPosition', () => {
    it('should convert SDK response to numbers', async () => {
      const mockSdkPosition: SdkPosition = {
        productId: 'BTC-PERP',
        netSize: '2.0',
        leverage: '5',
        markPrice: { value: '51000.00', currency: 'USD' },
      };
      const mockSdkResponse = { position: mockSdkPosition };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPosition({
        portfolioUuid: 'port-123',
        symbol: 'BTC-PERP',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'intx/positions/port-123/BTC-PERP',
        queryParams: {},
      });
      expect(result).toEqual(toGetPerpetualsPositionResponse(mockSdkResponse));
      expect(result.position?.netSize).toBe(2);
      expect(result.position?.markPrice?.value).toBe(51000);
    });

    it('should handle undefined position', async () => {
      const mockSdkResponse = {};
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPosition({
        portfolioUuid: 'port-123',
        symbol: 'NOT-FOUND',
      });

      expect(result.position).toBeUndefined();
    });
  });

  describe('getPortfolioSummary', () => {
    it('should convert SDK response to numbers', async () => {
      const mockSdkPortfolio: SdkPortfolio = {
        portfolioUuid: 'port-123',
        collateral: '10000.00',
        positionNotional: '50000.00',
        pendingFees: '10.50',
        portfolioInitialMargin: '0.1',
        unrealizedPnl: { value: '500.00', currency: 'USD' },
        totalBalance: { value: '10500.00', currency: 'USD' },
      };
      const mockSdkResponse = {
        portfolios: [mockSdkPortfolio],
        summary: {
          unrealizedPnl: { value: '500.00', currency: 'USD' },
          buyingPower: { value: '5000.00', currency: 'USD' },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPortfolioSummary({
        portfolioUuid: 'port-123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'intx/portfolio/port-123',
        queryParams: {},
      });
      expect(result).toEqual(toGetPortfolioSummaryResponse(mockSdkResponse));
      expect(result.portfolios?.[0].collateral).toBe(10000);
      expect(result.portfolios?.[0].pendingFees).toBe(10.5);
      expect(result.summary?.buyingPower?.value).toBe(5000);
    });
  });

  describe('getPortfolioBalance', () => {
    it('should convert SDK response to numbers', async () => {
      const mockSdkPortfolioBalance: SdkPortfolioBalance = {
        portfolioUuid: 'port-123',
        balances: [
          {
            asset: {
              assetId: 'BTC',
              collateralWeight: '0.9',
            },
            quantity: '1.5',
            hold: '0.1',
            collateralValue: '75000.00',
          },
        ],
        isMarginLimitReached: false,
      };
      const mockSdkResponse = {
        portfolioBalances: [mockSdkPortfolioBalance],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPortfolioBalance({
        portfolioUuid: 'port-123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'intx/balances/port-123',
        queryParams: {},
      });
      expect(result).toEqual(toGetPortfolioBalanceResponse(mockSdkResponse));
      expect(result.portfolioBalances?.[0].balances?.[0].quantity).toBe(1.5);
      expect(result.portfolioBalances?.[0].balances?.[0].collateralValue).toBe(
        75000,
      );
      expect(
        result.portfolioBalances?.[0].balances?.[0].asset?.collateralWeight,
      ).toBe(0.9);
    });

    it('should handle empty balances array', async () => {
      const mockSdkResponse = { portfolioBalances: [] };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPortfolioBalance({
        portfolioUuid: 'port-123',
      });

      expect(result).toEqual({ portfolioBalances: [] });
    });

    it('should handle balance with undefined asset', async () => {
      const mockSdkPortfolioBalance: SdkPortfolioBalance = {
        portfolioUuid: 'port-123',
        balances: [
          {
            quantity: '1.0',
            hold: '0',
          },
        ],
      };
      const mockSdkResponse = {
        portfolioBalances: [mockSdkPortfolioBalance],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPortfolioBalance({
        portfolioUuid: 'port-123',
      });

      expect(result.portfolioBalances?.[0].balances?.[0].asset).toBeUndefined();
      expect(result.portfolioBalances?.[0].balances?.[0].quantity).toBe(1);
    });
  });

  describe('listPositions edge cases', () => {
    it('should handle undefined summary', async () => {
      const mockSdkResponse = {
        positions: [{ productId: 'BTC-PERP', netSize: '1.0' }],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.listPositions({ portfolioUuid: 'port-123' });

      expect(result.summary).toBeUndefined();
    });
  });

  describe('getPortfolioSummary edge cases', () => {
    it('should handle undefined summary', async () => {
      const mockSdkResponse = {
        portfolios: [{ portfolioUuid: 'port-123', collateral: '1000.00' }],
      };
      mockClient.request.mockResolvedValue(mockResponse(mockSdkResponse));

      const result = await service.getPortfolioSummary({
        portfolioUuid: 'port-123',
      });

      expect(result.summary).toBeUndefined();
    });
  });
});
