import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { Method } from '@coinbase-sample/core-ts';
import { mockResponse } from '@test/serviceMocks';
import { PortfoliosService } from './PortfoliosService';
import { FuturesPositionSide } from './PortfoliosService.response';

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new PortfoliosService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('listPortfolios', () => {
    it('should convert SDK response to our types', async () => {
      const mockPortfolio = {
        name: 'Default',
        uuid: 'uuid-1',
        type: 'DEFAULT',
        deleted: false,
      };
      mockClient.request.mockResolvedValue(
        mockResponse({
          portfolios: [mockPortfolio],
        }),
      );

      const result = await service.listPortfolios();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'portfolios',
        queryParams: {},
      });
      expect(result.portfolios).toHaveLength(1);
      expect(result.portfolios[0].uuid).toBe('uuid-1');
      expect(result.portfolios[0].name).toBe('Default');
      expect(result.portfolios[0].type).toBe('DEFAULT');
      expect(result.portfolios[0].deleted).toBe(false);
    });
  });

  describe('createPortfolio', () => {
    it('should convert SDK response to our types', async () => {
      const mockPortfolio = {
        name: 'My Portfolio',
        uuid: 'new-uuid',
        type: 'CONSUMER',
        deleted: false,
      };
      mockClient.request.mockResolvedValue(
        mockResponse({
          portfolio: mockPortfolio,
        }),
      );

      const result = await service.createPortfolio({ name: 'My Portfolio' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'portfolios',
        method: Method.POST,
        bodyParams: { name: 'My Portfolio' },
      });
      expect(result.portfolio?.uuid).toBe('new-uuid');
      expect(result.portfolio?.name).toBe('My Portfolio');
      expect(result.portfolio?.type).toBe('CONSUMER');
      expect(result.portfolio?.deleted).toBe(false);
    });

    it('should handle undefined portfolio', async () => {
      mockClient.request.mockResolvedValue(mockResponse({}));

      const result = await service.createPortfolio({ name: 'Test' });

      expect(result.portfolio).toBeUndefined();
    });
  });

  describe('getPortfolio', () => {
    it('should convert SDK response with full breakdown', async () => {
      const mockResponse_ = {
        breakdown: {
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
        },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockResponse_));

      const result = await service.getPortfolio({ portfolioUuid: 'uuid-123' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'portfolios/uuid-123',
        queryParams: {},
      });
      // Check portfolio conversion
      expect(result.breakdown.portfolio?.portfolioUuid).toBe('uuid-123');
      expect(result.breakdown.portfolio?.collateral).toBe(50000);
      expect(result.breakdown.portfolio?.liquidationBuffer).toBe(0.2);
      // Check portfolioBalances conversion
      expect(result.breakdown.portfolioBalances?.totalBalance?.value).toBe(
        50000,
      );
      expect(
        result.breakdown.portfolioBalances?.futuresUnrealizedPnl?.value,
      ).toBe(500);
      expect(result.breakdown.portfolioBalances?.perpUnrealizedPnl?.value).toBe(
        -100,
      );
      // Check spotPositions conversion
      expect(result.breakdown.spotPositions?.[0].asset).toBe('BTC');
      expect(result.breakdown.spotPositions?.[0].costBasis?.value).toBe(20000);
      // Check perpPositions conversion
      expect(result.breakdown.perpPositions?.[0].productId).toBe('BTC-PERP');
      expect(result.breakdown.perpPositions?.[0].netSize).toBe(0.1);
      expect(result.breakdown.perpPositions?.[0].leverage).toBe(10);
      expect(
        result.breakdown.perpPositions?.[0].vwap?.userNativeCurrency?.value,
      ).toBe(50000);
      expect(
        result.breakdown.perpPositions?.[0].unrealizedPnl?.userNativeCurrency
          ?.value,
      ).toBe(500);
      // Check futuresPositions conversion
      expect(result.breakdown.futuresPositions?.[0].productId).toBe(
        'BTC-FUT-123',
      );
      expect(result.breakdown.futuresPositions?.[0].contractSize).toBe(1);
      expect(result.breakdown.futuresPositions?.[0].amount).toBe(0.5);
      expect(result.breakdown.futuresPositions?.[0].avgEntryPrice).toBe(48000);
      expect(result.breakdown.futuresPositions?.[0].currentPrice).toBe(50000);
      expect(result.breakdown.futuresPositions?.[0].unrealizedPnl).toBe(1000);
      expect(result.breakdown.futuresPositions?.[0].notionalValue).toBe(25000);
    });

    it('should handle empty breakdown', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ breakdown: {} }));

      const result = await service.getPortfolio({ portfolioUuid: 'uuid-123' });

      expect(result.breakdown.portfolio).toBeUndefined();
      expect(result.breakdown.portfolioBalances).toBeUndefined();
      expect(result.breakdown.spotPositions).toBeUndefined();
      expect(result.breakdown.perpPositions).toBeUndefined();
      expect(result.breakdown.futuresPositions).toBeUndefined();
    });

    it('should handle perp positions with undefined BalancePair fields', async () => {
      mockClient.request.mockResolvedValue(
        mockResponse({
          breakdown: {
            perpPositions: [
              {
                productId: 'ETH-PERP',
                netSize: '1.0',
                // No vwap, unrealizedPnl, markPrice, etc. - all BalancePair fields undefined
              },
            ],
          },
        }),
      );

      const result = await service.getPortfolio({ portfolioUuid: 'uuid-123' });

      expect(result.breakdown.perpPositions?.[0].productId).toBe('ETH-PERP');
      expect(result.breakdown.perpPositions?.[0].netSize).toBe(1.0);
      expect(result.breakdown.perpPositions?.[0].vwap).toBeUndefined();
      expect(result.breakdown.perpPositions?.[0].unrealizedPnl).toBeUndefined();
      expect(result.breakdown.perpPositions?.[0].markPrice).toBeUndefined();
    });
  });

  describe('editPortfolio', () => {
    it('should convert SDK response to our types', async () => {
      const mockPortfolio = {
        name: 'New Name',
        uuid: 'uuid-123',
        type: 'DEFAULT',
        deleted: false,
      };
      mockClient.request.mockResolvedValue(
        mockResponse({
          portfolio: mockPortfolio,
        }),
      );

      const result = await service.editPortfolio({
        portfolioUuid: 'uuid-123',
        name: 'New Name',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'portfolios/uuid-123',
        method: Method.PUT,
        bodyParams: { portfolioUuid: undefined, name: 'New Name' },
      });
      expect(result.portfolio?.uuid).toBe('uuid-123');
      expect(result.portfolio?.name).toBe('New Name');
      expect(result.portfolio?.type).toBe('DEFAULT');
      expect(result.portfolio?.deleted).toBe(false);
    });

    it('should handle undefined portfolio', async () => {
      mockClient.request.mockResolvedValue(mockResponse({}));

      const result = await service.editPortfolio({
        portfolioUuid: 'uuid-123',
        name: 'New Name',
      });

      expect(result.portfolio).toBeUndefined();
    });
  });

  describe('deletePortfolio', () => {
    it('should delegate to SDK', async () => {
      const responseData = {};
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      const result = await service.deletePortfolio({
        portfolioUuid: 'uuid-123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'portfolios/uuid-123',
        method: Method.DELETE,
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('movePortfolioFunds', () => {
    it('should pass pre-transformed request to API', async () => {
      const responseData = {
        sourcePortfolioUuid: 'src',
        targetPortfolioUuid: 'tgt',
      };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      // Service receives pre-transformed data from MCP layer (value already a string)
      const result = await service.movePortfolioFunds({
        funds: {
          value: '100.5',
          currency: 'USD',
        },
        sourcePortfolioUuid: 'portfolio-1',
        targetPortfolioUuid: 'portfolio-2',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'portfolios/move_funds',
        method: Method.POST,
        bodyParams: {
          funds: {
            value: '100.5',
            currency: 'USD',
          },
          sourcePortfolioUuid: 'portfolio-1',
          targetPortfolioUuid: 'portfolio-2',
        },
      });
      expect(result).toEqual(responseData);
    });

    it('should handle integer string values', async () => {
      mockClient.request.mockResolvedValue(mockResponse({}));

      await service.movePortfolioFunds({
        funds: {
          value: '1000',
          currency: 'BTC',
        },
        sourcePortfolioUuid: 'src',
        targetPortfolioUuid: 'tgt',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'portfolios/move_funds',
        method: Method.POST,
        bodyParams: {
          funds: {
            value: '1000',
            currency: 'BTC',
          },
          sourcePortfolioUuid: 'src',
          targetPortfolioUuid: 'tgt',
        },
      });
    });

    it('should handle small decimal string values', async () => {
      mockClient.request.mockResolvedValue(mockResponse({}));

      await service.movePortfolioFunds({
        funds: {
          value: '0.00000001',
          currency: 'BTC',
        },
        sourcePortfolioUuid: 'src',
        targetPortfolioUuid: 'tgt',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'portfolios/move_funds',
        method: Method.POST,
        bodyParams: {
          funds: {
            value: '0.00000001',
            currency: 'BTC',
          },
          sourcePortfolioUuid: 'src',
          targetPortfolioUuid: 'tgt',
        },
      });
    });
  });
});
