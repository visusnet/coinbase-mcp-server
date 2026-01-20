import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Portfolio as SdkPortfolio } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Portfolio';
import type { PortfolioBreakdown as SdkPortfolioBreakdown } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PortfolioBreakdown';
import { FuturesPositionSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FuturesPositionSide.js';
import { createSdkPortfoliosServiceMock } from '@test/serviceMocks';
import { PortfoliosService } from './PortfoliosService';

const mockSdkService = createSdkPortfoliosServiceMock();

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  PortfoliosService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

describe('PortfoliosService', () => {
  let service: PortfoliosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PortfoliosService({} as never);
  });

  describe('listPortfolios', () => {
    it('should convert SDK response to our types', async () => {
      const sdkPortfolio: SdkPortfolio = {
        portfolioUuid: 'uuid-1',
        collateral: '10000',
        positionNotional: '5000',
        openPositionNotional: '2500',
        pendingFees: '10',
        borrow: '0',
        accruedInterest: '0.5',
        rollingDebt: '0',
        portfolioInitialMargin: '0.1',
        portfolioMaintenanceMargin: '0.05',
        liquidationPercentage: '0.8',
        liquidationBuffer: '0.15',
        portfolioImNotional: { value: '500', currency: 'USD' },
        portfolioMmNotional: { value: '250', currency: 'USD' },
        unrealizedPnl: { value: '100', currency: 'USD' },
        totalBalance: { value: '10100', currency: 'USD' },
      };
      mockSdkService.listPortfolios.mockResolvedValue({
        portfolios: [sdkPortfolio],
      });

      const result = await service.listPortfolios();

      expect(mockSdkService.listPortfolios).toHaveBeenCalledWith({});
      expect(result.portfolios).toHaveLength(1);
      expect(result.portfolios[0].portfolioUuid).toBe('uuid-1');
      expect(result.portfolios[0].collateral).toBe(10000);
      expect(result.portfolios[0].positionNotional).toBe(5000);
      expect(result.portfolios[0].pendingFees).toBe(10);
      expect(result.portfolios[0].accruedInterest).toBe(0.5);
      expect(result.portfolios[0].portfolioInitialMargin).toBe(0.1);
      expect(result.portfolios[0].portfolioImNotional?.value).toBe(500);
      expect(result.portfolios[0].totalBalance?.value).toBe(10100);
    });
  });

  describe('createPortfolio', () => {
    it('should convert SDK response to our types', async () => {
      const sdkPortfolio: SdkPortfolio = {
        portfolioUuid: 'new-uuid',
        collateral: '0',
      };
      mockSdkService.createPortfolio.mockResolvedValue({
        portfolio: sdkPortfolio,
      });

      const result = await service.createPortfolio({ name: 'My Portfolio' });

      expect(mockSdkService.createPortfolio).toHaveBeenCalledWith({
        name: 'My Portfolio',
      });
      expect(result.portfolio?.portfolioUuid).toBe('new-uuid');
      expect(result.portfolio?.collateral).toBe(0);
    });

    it('should handle undefined portfolio', async () => {
      mockSdkService.createPortfolio.mockResolvedValue({});

      const result = await service.createPortfolio({ name: 'Test' });

      expect(result.portfolio).toBeUndefined();
    });
  });

  describe('getPortfolio', () => {
    it('should convert SDK response with full breakdown', async () => {
      const sdkBreakdown: SdkPortfolioBreakdown = {
        portfolio: {
          portfolioUuid: 'uuid-123',
          collateral: '50000',
          liquidationBuffer: '0.2',
        },
        portfolioBalances: {
          totalBalance: { value: '50000', currency: 'USD' },
          totalFuturesBalance: { value: '10000', currency: 'USD' },
          totalCashEquivalentBalance: { value: '20000', currency: 'USD' },
          totalCryptoBalance: { value: '20000', currency: 'USD' },
          futuresUnrealizedPnl: { value: '500', currency: 'USD' },
          perpUnrealizedPnl: { value: '-100', currency: 'USD' },
        },
        spotPositions: [
          {
            asset: 'BTC',
            accountUuid: 'acct-1',
            totalBalanceFiat: 25000,
            totalBalanceCrypto: 0.5,
            availableToTradeFiat: 25000,
            allocation: 0.5,
            oneDayChange: 0.02,
            costBasis: { value: '20000', currency: 'USD' },
            isCash: false,
          },
        ],
        perpPositions: [
          {
            productId: 'BTC-PERP',
            netSize: '0.1',
            buyOrderSize: '0',
            sellOrderSize: '0',
            imContribution: '100',
            leverage: '10',
            liquidationBuffer: '0.15',
            liquidationPercentage: '0.9',
            vwap: {
              userNativeCurrency: { value: '50000', currency: 'USD' },
              rawCurrency: { value: '50000', currency: 'USD' },
            },
            unrealizedPnl: {
              userNativeCurrency: { value: '500', currency: 'USD' },
            },
            markPrice: {
              userNativeCurrency: { value: '55000', currency: 'USD' },
            },
            liquidationPrice: {
              userNativeCurrency: { value: '45000', currency: 'USD' },
            },
            imNotional: {
              userNativeCurrency: { value: '550', currency: 'USD' },
            },
            mmNotional: {
              userNativeCurrency: { value: '275', currency: 'USD' },
            },
            positionNotional: {
              userNativeCurrency: { value: '5500', currency: 'USD' },
            },
          },
        ],
        futuresPositions: [
          {
            productId: 'BTC-FUT-123',
            contractSize: '1',
            side: FuturesPositionSide.Long,
            amount: '0.5',
            avgEntryPrice: '48000',
            currentPrice: '50000',
            unrealizedPnl: '1000',
            expiry: '2024-03-29',
            notionalValue: '25000',
          },
        ],
      };
      mockSdkService.getPortfolio.mockResolvedValue(sdkBreakdown);

      const result = await service.getPortfolio({ portfolioUuid: 'uuid-123' });

      expect(mockSdkService.getPortfolio).toHaveBeenCalledWith({
        portfolioUuid: 'uuid-123',
      });
      // Check portfolio conversion
      expect(result.portfolio?.portfolioUuid).toBe('uuid-123');
      expect(result.portfolio?.collateral).toBe(50000);
      expect(result.portfolio?.liquidationBuffer).toBe(0.2);
      // Check portfolioBalances conversion
      expect(result.portfolioBalances?.totalBalance?.value).toBe(50000);
      expect(result.portfolioBalances?.futuresUnrealizedPnl?.value).toBe(500);
      expect(result.portfolioBalances?.perpUnrealizedPnl?.value).toBe(-100);
      // Check spotPositions conversion
      expect(result.spotPositions?.[0].asset).toBe('BTC');
      expect(result.spotPositions?.[0].costBasis?.value).toBe(20000);
      // Check perpPositions conversion
      expect(result.perpPositions?.[0].productId).toBe('BTC-PERP');
      expect(result.perpPositions?.[0].netSize).toBe(0.1);
      expect(result.perpPositions?.[0].leverage).toBe(10);
      expect(result.perpPositions?.[0].vwap?.userNativeCurrency?.value).toBe(
        50000,
      );
      expect(
        result.perpPositions?.[0].unrealizedPnl?.userNativeCurrency?.value,
      ).toBe(500);
      // Check futuresPositions conversion
      expect(result.futuresPositions?.[0].productId).toBe('BTC-FUT-123');
      expect(result.futuresPositions?.[0].contractSize).toBe(1);
      expect(result.futuresPositions?.[0].amount).toBe(0.5);
      expect(result.futuresPositions?.[0].avgEntryPrice).toBe(48000);
      expect(result.futuresPositions?.[0].currentPrice).toBe(50000);
      expect(result.futuresPositions?.[0].unrealizedPnl).toBe(1000);
      expect(result.futuresPositions?.[0].notionalValue).toBe(25000);
    });

    it('should handle empty breakdown', async () => {
      mockSdkService.getPortfolio.mockResolvedValue({});

      const result = await service.getPortfolio({ portfolioUuid: 'uuid-123' });

      expect(result.portfolio).toBeUndefined();
      expect(result.portfolioBalances).toBeUndefined();
      expect(result.spotPositions).toBeUndefined();
      expect(result.perpPositions).toBeUndefined();
      expect(result.futuresPositions).toBeUndefined();
    });

    it('should handle perp positions with undefined BalancePair fields', async () => {
      mockSdkService.getPortfolio.mockResolvedValue({
        perpPositions: [
          {
            productId: 'ETH-PERP',
            netSize: '1.0',
            // No vwap, unrealizedPnl, markPrice, etc. - all BalancePair fields undefined
          },
        ],
      });

      const result = await service.getPortfolio({ portfolioUuid: 'uuid-123' });

      expect(result.perpPositions?.[0].productId).toBe('ETH-PERP');
      expect(result.perpPositions?.[0].netSize).toBe(1.0);
      expect(result.perpPositions?.[0].vwap).toBeUndefined();
      expect(result.perpPositions?.[0].unrealizedPnl).toBeUndefined();
      expect(result.perpPositions?.[0].markPrice).toBeUndefined();
    });
  });

  describe('editPortfolio', () => {
    it('should convert SDK response to our types', async () => {
      const sdkPortfolio: SdkPortfolio = {
        portfolioUuid: 'uuid-123',
        collateral: '1000',
      };
      mockSdkService.editPortfolio.mockResolvedValue({
        portfolio: sdkPortfolio,
      });

      const result = await service.editPortfolio({
        portfolioUuid: 'uuid-123',
        name: 'New Name',
      });

      expect(mockSdkService.editPortfolio).toHaveBeenCalledWith({
        portfolioUuid: 'uuid-123',
        name: 'New Name',
      });
      expect(result.portfolio?.portfolioUuid).toBe('uuid-123');
      expect(result.portfolio?.collateral).toBe(1000);
    });

    it('should handle undefined portfolio', async () => {
      mockSdkService.editPortfolio.mockResolvedValue({});

      const result = await service.editPortfolio({
        portfolioUuid: 'uuid-123',
        name: 'New Name',
      });

      expect(result.portfolio).toBeUndefined();
    });
  });

  describe('deletePortfolio', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = {};
      mockSdkService.deletePortfolio.mockResolvedValue(mockResponse);

      const result = await service.deletePortfolio({
        portfolioUuid: 'uuid-123',
      });

      expect(mockSdkService.deletePortfolio).toHaveBeenCalledWith({
        portfolioUuid: 'uuid-123',
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('movePortfolioFunds', () => {
    it('should convert funds.value number to string', async () => {
      const mockResponse = {
        sourcePortfolioUuid: 'src',
        targetPortfolioUuid: 'tgt',
      };
      mockSdkService.movePortfolioFunds.mockResolvedValue(mockResponse);

      const result = await service.movePortfolioFunds({
        funds: {
          value: 100.5,
          currency: 'USD',
        },
        sourcePortfolioUuid: 'portfolio-1',
        targetPortfolioUuid: 'portfolio-2',
      });

      expect(mockSdkService.movePortfolioFunds).toHaveBeenCalledWith({
        funds: {
          value: '100.5',
          currency: 'USD',
        },
        sourcePortfolioUuid: 'portfolio-1',
        targetPortfolioUuid: 'portfolio-2',
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle integer values', async () => {
      mockSdkService.movePortfolioFunds.mockResolvedValue({});

      await service.movePortfolioFunds({
        funds: {
          value: 1000,
          currency: 'BTC',
        },
        sourcePortfolioUuid: 'src',
        targetPortfolioUuid: 'tgt',
      });

      expect(mockSdkService.movePortfolioFunds).toHaveBeenCalledWith({
        funds: {
          value: '1000',
          currency: 'BTC',
        },
        sourcePortfolioUuid: 'src',
        targetPortfolioUuid: 'tgt',
      });
    });

    it('should handle small decimal values', async () => {
      mockSdkService.movePortfolioFunds.mockResolvedValue({});

      await service.movePortfolioFunds({
        funds: {
          value: 0.00000001,
          currency: 'BTC',
        },
        sourcePortfolioUuid: 'src',
        targetPortfolioUuid: 'tgt',
      });

      expect(mockSdkService.movePortfolioFunds).toHaveBeenCalledWith({
        funds: {
          value: '1e-8',
          currency: 'BTC',
        },
        sourcePortfolioUuid: 'src',
        targetPortfolioUuid: 'tgt',
      });
    });
  });
});
