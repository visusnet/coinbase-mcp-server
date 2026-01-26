import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { Method } from '@coinbase-sample/core-ts';
import { mockResponse } from '@test/serviceMocks';
import { ConvertsService } from './ConvertsService';
import { TradeStatus } from './ConvertsService.types';

describe('ConvertsService', () => {
  let service: ConvertsService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new ConvertsService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('createConvertQuote', () => {
    it('should pass pre-transformed request and convert response to numbers', async () => {
      const mockTrade = {
        id: 'trade-123',
        status: TradeStatus.Created,
        userEnteredAmount: { value: '100.50', currency: 'USD' },
        amount: { value: '100.50', currency: 'BTC' },
        total: { value: '100.55', currency: 'USD' },
      };
      const mockApiResponse = { trade: mockTrade };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      // Service receives pre-transformed data (amount as string from MCP layer)
      const result = await service.createConvertQuote({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: '100.5',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'convert/quote',
        method: Method.POST,
        bodyParams: {
          fromAccount: 'account-1',
          toAccount: 'account-2',
          amount: '100.5',
        },
      });
      expect(result).toEqual({
        trade: {
          id: 'trade-123',
          status: TradeStatus.Created,
          userEnteredAmount: { value: 100.5, currency: 'USD' },
          amount: { value: 100.5, currency: 'BTC' },
          total: { value: 100.55, currency: 'USD' },
        },
      });
    });
  });

  describe('commitConvertTrade', () => {
    it('should convert response amounts to numbers', async () => {
      const mockTrade = {
        id: 'trade-123',
        status: TradeStatus.Completed,
        total: { value: '500.00', currency: 'USD' },
        fees: [{ title: 'Fee', amount: { value: '5.00', currency: 'USD' } }],
      };
      const mockApiResponse = { trade: mockTrade };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.commitConvertTrade({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'convert/trade/trade-123',
        method: Method.POST,
        bodyParams: {
          tradeId: 'trade-123',
          fromAccount: 'account-1',
          toAccount: 'account-2',
        },
      });
      expect(result).toEqual({
        trade: {
          id: 'trade-123',
          status: TradeStatus.Completed,
          total: { value: 500, currency: 'USD' },
          fees: [{ title: 'Fee', amount: { value: 5, currency: 'USD' } }],
        },
      });
    });
  });

  describe('getConvertTrade', () => {
    it('should convert response amounts to numbers', async () => {
      const mockTrade = {
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
      const mockApiResponse = { trade: mockTrade };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getConvertTrade({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'convert/trade/trade-123',
        queryParams: {
          fromAccount: 'account-1',
          toAccount: 'account-2',
        },
      });
      expect(result).toEqual({
        trade: {
          id: 'trade-123',
          status: TradeStatus.Created,
          exchangeRate: { value: 50000, currency: 'USD' },
          unitPrice: {
            targetToFiat: {
              amount: { value: 1, currency: 'USD' },
              scale: 2,
            },
          },
        },
      });
    });

    it('should handle undefined trade', async () => {
      const mockApiResponse = {};
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getConvertTrade({
        tradeId: 'trade-123',
        fromAccount: 'account-1',
        toAccount: 'account-2',
      });

      expect(result.trade).toBeUndefined();
    });

    it('should convert taxDetails amounts to numbers', async () => {
      const mockTrade = {
        id: 'trade-123',
        status: TradeStatus.Completed,
        taxDetails: [
          { name: 'Sales Tax', amount: { value: '10.00', currency: 'USD' } },
          { name: 'VAT', amount: { value: '5.50', currency: 'EUR' } },
        ],
      };
      const mockApiResponse = { trade: mockTrade };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

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
