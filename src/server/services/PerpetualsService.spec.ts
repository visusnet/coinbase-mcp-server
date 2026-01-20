import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PerpetualsService } from './PerpetualsService';

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  PerpetualsService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  listPositions: jest.fn(),
  getPosition: jest.fn(),
  getPortfolioSummary: jest.fn(),
  getPortfolioBalance: jest.fn(),
};

describe('PerpetualsService', () => {
  let service: PerpetualsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PerpetualsService({} as never);
  });

  describe('listPositions', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = { positions: [] };
      mockSdkService.listPositions.mockResolvedValue(mockResponse);

      const result = await service.listPositions({ portfolioUuid: 'port-123' });

      expect(mockSdkService.listPositions).toHaveBeenCalledWith({
        portfolioUuid: 'port-123',
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPosition', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = { position: { productId: 'BTC-PERP' } };
      mockSdkService.getPosition.mockResolvedValue(mockResponse);

      const result = await service.getPosition({
        portfolioUuid: 'port-123',
        symbol: 'BTC-PERP',
      });

      expect(mockSdkService.getPosition).toHaveBeenCalledWith({
        portfolioUuid: 'port-123',
        symbol: 'BTC-PERP',
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPortfolioSummary', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = { portfolios: [] };
      mockSdkService.getPortfolioSummary.mockResolvedValue(mockResponse);

      const result = await service.getPortfolioSummary({
        portfolioUuid: 'port-123',
      });

      expect(mockSdkService.getPortfolioSummary).toHaveBeenCalledWith({
        portfolioUuid: 'port-123',
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPortfolioBalance', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = { portfolioBalances: {} };
      mockSdkService.getPortfolioBalance.mockResolvedValue(mockResponse);

      const result = await service.getPortfolioBalance({
        portfolioUuid: 'port-123',
      });

      expect(mockSdkService.getPortfolioBalance).toHaveBeenCalledWith({
        portfolioUuid: 'port-123',
      });
      expect(result).toBe(mockResponse);
    });
  });
});
