import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TradeStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/TradeStatus';
import type { RatConvertTrade as SdkRatConvertTrade } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/RatConvertTrade';
import { createSdkConvertsServiceMock } from '@test/serviceMocks';
import { ConvertsService } from './ConvertsService';
import {
  toCreateConvertQuoteResponse,
  toCommitConvertTradeResponse,
  toGetConvertTradeResponse,
} from './ConvertsService.convert';

const mockSdkService = createSdkConvertsServiceMock();

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  ConvertsService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

describe('ConvertsService', () => {
  let service: ConvertsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConvertsService({} as never);
  });

  describe('createConvertQuote', () => {
    it('should convert amount number to string and response to numbers', async () => {
      const mockSdkTrade: SdkRatConvertTrade = {
        id: 'trade-123',
        status: TradeStatus.Created,
        userEnteredAmount: { value: '100.50', currency: 'USD' },
        amount: { value: '100.50', currency: 'BTC' },
        total: { value: '100.55', currency: 'USD' },
      };
      const mockSdkResponse = { trade: mockSdkTrade };
      mockSdkService.createConvertQuote.mockResolvedValue(mockSdkResponse);

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
      expect(result).toEqual(toCreateConvertQuoteResponse(mockSdkResponse));
      expect(result.trade?.userEnteredAmount?.value).toBe(100.5);
      expect(result.trade?.total?.value).toBe(100.55);
    });

    it('should handle integer amounts', async () => {
      const mockSdkResponse = { trade: { id: 'trade-456' } };
      mockSdkService.createConvertQuote.mockResolvedValue(mockSdkResponse);

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
      const mockSdkResponse = { trade: { id: 'trade-789' } };
      mockSdkService.createConvertQuote.mockResolvedValue(mockSdkResponse);

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
    it('should convert response amounts to numbers', async () => {
      const mockSdkTrade: SdkRatConvertTrade = {
        id: 'trade-123',
        status: TradeStatus.Completed,
        total: { value: '500.00', currency: 'USD' },
        fees: [{ title: 'Fee', amount: { value: '5.00', currency: 'USD' } }],
      };
      const mockSdkResponse = { trade: mockSdkTrade };
      mockSdkService.commitConvertTrade.mockResolvedValue(mockSdkResponse);

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
      expect(result).toEqual(toCommitConvertTradeResponse(mockSdkResponse));
      expect(result.trade?.total?.value).toBe(500);
      expect(result.trade?.fees?.[0].amount?.value).toBe(5);
    });
  });

  describe('getConvertTrade', () => {
    it('should convert response amounts to numbers', async () => {
      const mockSdkTrade: SdkRatConvertTrade = {
        id: 'trade-123',
        status: TradeStatus.Created,
        exchangeRate: { value: '50000.00', currency: 'USD' },
        unitPrice: {
          targetToFiat: {
            amount: { value: '1.00', currency: 'USD' },
            scale: 2,
          },
        },
      };
      const mockSdkResponse = { trade: mockSdkTrade };
      mockSdkService.GetConvertTrade.mockResolvedValue(mockSdkResponse);

      const result = await service.getConvertTrade({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });

      expect(mockSdkService.GetConvertTrade).toHaveBeenCalledWith({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });
      expect(result).toEqual(toGetConvertTradeResponse(mockSdkResponse));
      expect(result.trade?.exchangeRate?.value).toBe(50000);
      expect(result.trade?.unitPrice?.targetToFiat?.amount?.value).toBe(1);
    });

    it('should handle undefined trade', async () => {
      const mockSdkResponse = {};
      mockSdkService.GetConvertTrade.mockResolvedValue(mockSdkResponse);

      const result = await service.getConvertTrade({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });

      expect(result.trade).toBeUndefined();
    });

    it('should convert taxDetails amounts to numbers', async () => {
      const mockSdkTrade: SdkRatConvertTrade = {
        id: 'trade-123',
        status: TradeStatus.Completed,
        taxDetails: [
          { name: 'Sales Tax', amount: { value: '10.00', currency: 'USD' } },
          { name: 'VAT', amount: { value: '5.50', currency: 'EUR' } },
        ],
      };
      const mockSdkResponse = { trade: mockSdkTrade };
      mockSdkService.GetConvertTrade.mockResolvedValue(mockSdkResponse);

      const result = await service.getConvertTrade({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });

      expect(result.trade?.taxDetails?.[0].amount?.value).toBe(10);
      expect(result.trade?.taxDetails?.[1].amount?.value).toBe(5.5);
    });
  });
});
