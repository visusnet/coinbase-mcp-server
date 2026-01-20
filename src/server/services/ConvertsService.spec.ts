import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConvertsService } from './ConvertsService';

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  ConvertsService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  createConvertQuote: jest.fn(),
  commitConvertTrade: jest.fn(),
  GetConvertTrade: jest.fn(),
};

describe('ConvertsService', () => {
  let service: ConvertsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConvertsService({} as never);
  });

  describe('createConvertQuote', () => {
    it('should convert amount number to string', async () => {
      const mockResponse = { trade: { id: 'trade-123' } };
      mockSdkService.createConvertQuote.mockResolvedValue(mockResponse);

      const result = await service.createConvertQuote({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: 100.5,
      });

      expect(mockSdkService.createConvertQuote).toHaveBeenCalledWith({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: '100.5',
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle integer amounts', async () => {
      mockSdkService.createConvertQuote.mockResolvedValue({});

      await service.createConvertQuote({
        fromAccount: 'acc-a',
        toAccount: 'acc-b',
        amount: 1000,
      });

      expect(mockSdkService.createConvertQuote).toHaveBeenCalledWith({
        fromAccount: 'acc-a',
        toAccount: 'acc-b',
        amount: '1000',
      });
    });

    it('should handle small decimal amounts', async () => {
      mockSdkService.createConvertQuote.mockResolvedValue({});

      await service.createConvertQuote({
        fromAccount: 'acc-a',
        toAccount: 'acc-b',
        amount: 0.00001,
      });

      expect(mockSdkService.createConvertQuote).toHaveBeenCalledWith({
        fromAccount: 'acc-a',
        toAccount: 'acc-b',
        amount: '0.00001',
      });
    });
  });

  describe('commitConvertTrade', () => {
    it('should pass through request unchanged', async () => {
      const mockResponse = { trade: { status: 'completed' } };
      mockSdkService.commitConvertTrade.mockResolvedValue(mockResponse);

      const result = await service.commitConvertTrade({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });

      expect(mockSdkService.commitConvertTrade).toHaveBeenCalledWith({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('GetConvertTrade', () => {
    it('should pass through request unchanged', async () => {
      const mockResponse = { trade: { id: 'trade-123', status: 'pending' } };
      mockSdkService.GetConvertTrade.mockResolvedValue(mockResponse);

      const result = await service.GetConvertTrade({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });

      expect(mockSdkService.GetConvertTrade).toHaveBeenCalledWith({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });
      expect(result).toBe(mockResponse);
    });
  });
});
