import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { FuturesService } from './FuturesService';

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  FuturesService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  listPositions: jest.fn(),
  getPosition: jest.fn(),
  getBalanceSummary: jest.fn(),
  listSweeps: jest.fn(),
};

describe('FuturesService', () => {
  let service: FuturesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FuturesService({} as never);
  });

  describe('listPositions', () => {
    it('should delegate to SDK with empty object', async () => {
      const mockResponse = { positions: [] };
      mockSdkService.listPositions.mockResolvedValue(mockResponse);

      const result = await service.listPositions();

      expect(mockSdkService.listPositions).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPosition', () => {
    it('should delegate to SDK', async () => {
      const mockResponse = { position: { productId: 'BTC-PERP' } };
      mockSdkService.getPosition.mockResolvedValue(mockResponse);

      const result = await service.getPosition({ productId: 'BTC-PERP' });

      expect(mockSdkService.getPosition).toHaveBeenCalledWith({
        productId: 'BTC-PERP',
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getBalanceSummary', () => {
    it('should delegate to SDK with empty object', async () => {
      const mockResponse = { balanceSummary: { futuresBuyingPower: '1000' } };
      mockSdkService.getBalanceSummary.mockResolvedValue(mockResponse);

      const result = await service.getBalanceSummary();

      expect(mockSdkService.getBalanceSummary).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });
  });

  describe('listSweeps', () => {
    it('should delegate to SDK with empty object', async () => {
      const mockResponse = { sweeps: [] };
      mockSdkService.listSweeps.mockResolvedValue(mockResponse);

      const result = await service.listSweeps();

      expect(mockSdkService.listSweeps).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });
  });
});
