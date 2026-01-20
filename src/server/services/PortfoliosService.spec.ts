import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PortfoliosService } from './PortfoliosService';

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  PortfoliosService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  listPortfolios: jest.fn(),
  createPortfolio: jest.fn(),
  getPortfolio: jest.fn(),
  editPortfolio: jest.fn(),
  deletePortfolio: jest.fn(),
  movePortfolioFunds: jest.fn(),
};

describe('PortfoliosService', () => {
  let service: PortfoliosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PortfoliosService({} as never);
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

  describe('pass-through methods', () => {
    it('listPortfolios should delegate to SDK', async () => {
      const mockResponse = { portfolios: [] };
      mockSdkService.listPortfolios.mockResolvedValue(mockResponse);

      const result = await service.listPortfolios();

      expect(mockSdkService.listPortfolios).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });

    it('createPortfolio should delegate to SDK', async () => {
      const mockResponse = { portfolio: { uuid: 'new-uuid' } };
      mockSdkService.createPortfolio.mockResolvedValue(mockResponse);

      const result = await service.createPortfolio({ name: 'My Portfolio' });

      expect(mockSdkService.createPortfolio).toHaveBeenCalledWith({
        name: 'My Portfolio',
      });
      expect(result).toBe(mockResponse);
    });

    it('getPortfolio should delegate to SDK', async () => {
      const mockResponse = { portfolio: { uuid: 'uuid-123' } };
      mockSdkService.getPortfolio.mockResolvedValue(mockResponse);

      const result = await service.getPortfolio({ portfolioUuid: 'uuid-123' });

      expect(mockSdkService.getPortfolio).toHaveBeenCalledWith({
        portfolioUuid: 'uuid-123',
      });
      expect(result).toBe(mockResponse);
    });

    it('editPortfolio should delegate to SDK', async () => {
      const mockResponse = {
        portfolio: { uuid: 'uuid-123', name: 'New Name' },
      };
      mockSdkService.editPortfolio.mockResolvedValue(mockResponse);

      const result = await service.editPortfolio({
        portfolioUuid: 'uuid-123',
        name: 'New Name',
      });

      expect(mockSdkService.editPortfolio).toHaveBeenCalledWith({
        portfolioUuid: 'uuid-123',
        name: 'New Name',
      });
      expect(result).toBe(mockResponse);
    });

    it('deletePortfolio should delegate to SDK', async () => {
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
});
