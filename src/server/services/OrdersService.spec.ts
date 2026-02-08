import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { Method } from '@coinbase-sample/core-ts';
import { mockResponse } from '@test/serviceMocks';
import { OrdersService } from './OrdersService';
import { OrderSide } from './OrdersService.types';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockClient: {
    request: jest.MockedFunction<CoinbaseAdvTradeClient['request']>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      request: jest.fn<CoinbaseAdvTradeClient['request']>(),
    };
    service = new OrdersService(
      mockClient as unknown as CoinbaseAdvTradeClient,
    );
  });

  describe('createOrder', () => {
    it('should pass pre-transformed request for market order', async () => {
      const responseData = { success: true, orderId: '123' };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      // Service receives pre-transformed data (strings from MCP layer)
      await service.createOrder({
        clientOrderId: 'test-123',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          marketMarketIoc: {
            quoteSize: '100.5',
            baseSize: '0.001',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-123',
          productId: 'BTC-USD',
          side: OrderSide.Buy,
          orderConfiguration: {
            marketMarketIoc: {
              quoteSize: '100.5',
              baseSize: '0.001',
            },
          },
        },
      });
    });

    it('should pass pre-transformed request for limit GTC order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-456',
        productId: 'ETH-USD',
        side: OrderSide.Sell,
        orderConfiguration: {
          limitLimitGtc: {
            baseSize: '1.5',
            limitPrice: '2000.25',
            postOnly: true,
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-456',
          productId: 'ETH-USD',
          side: OrderSide.Sell,
          orderConfiguration: {
            limitLimitGtc: {
              baseSize: '1.5',
              limitPrice: '2000.25',
              postOnly: true,
            },
          },
        },
      });
    });

    it('should pass pre-transformed request for stop-limit GTC order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-789',
        productId: 'BTC-USD',
        side: OrderSide.Sell,
        orderConfiguration: {
          stopLimitStopLimitGtc: {
            baseSize: '0.5',
            limitPrice: '40000',
            stopPrice: '41000',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-789',
          productId: 'BTC-USD',
          side: OrderSide.Sell,
          orderConfiguration: {
            stopLimitStopLimitGtc: {
              baseSize: '0.5',
              limitPrice: '40000',
              stopPrice: '41000',
            },
          },
        },
      });
    });

    it('should pass pre-transformed request for trigger bracket GTC order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-bracket',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          triggerBracketGtc: {
            baseSize: '0.1',
            limitPrice: '42000',
            stopTriggerPrice: '43000',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-bracket',
          productId: 'BTC-USD',
          side: OrderSide.Buy,
          orderConfiguration: {
            triggerBracketGtc: {
              baseSize: '0.1',
              limitPrice: '42000',
              stopTriggerPrice: '43000',
            },
          },
        },
      });
    });

    it('should pass pre-transformed request for limit GTD order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-gtd',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          limitLimitGtd: {
            baseSize: '0.1',
            limitPrice: '50000',
            endTime: '2025-12-31T23:59:59Z',
            postOnly: true,
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-gtd',
          productId: 'BTC-USD',
          side: OrderSide.Buy,
          orderConfiguration: {
            limitLimitGtd: {
              baseSize: '0.1',
              limitPrice: '50000',
              endTime: '2025-12-31T23:59:59Z',
              postOnly: true,
            },
          },
        },
      });
    });

    it('should pass pre-transformed request for limit FOK order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-fok',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          limitLimitFok: {
            baseSize: '0.5',
            limitPrice: '48000',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-fok',
          productId: 'BTC-USD',
          side: OrderSide.Buy,
          orderConfiguration: {
            limitLimitFok: {
              baseSize: '0.5',
              limitPrice: '48000',
            },
          },
        },
      });
    });

    it('should pass pre-transformed request for SOR limit IOC order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-sor',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          sorLimitIoc: {
            baseSize: '0.25',
            limitPrice: '47000',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-sor',
          productId: 'BTC-USD',
          side: OrderSide.Buy,
          orderConfiguration: {
            sorLimitIoc: {
              baseSize: '0.25',
              limitPrice: '47000',
            },
          },
        },
      });
    });

    it('should pass pre-transformed request for stop-limit GTD order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-stop-gtd',
        productId: 'BTC-USD',
        side: OrderSide.Sell,
        orderConfiguration: {
          stopLimitStopLimitGtd: {
            baseSize: '0.5',
            limitPrice: '39000',
            stopPrice: '40000',
            endTime: '2025-12-31T23:59:59Z',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-stop-gtd',
          productId: 'BTC-USD',
          side: OrderSide.Sell,
          orderConfiguration: {
            stopLimitStopLimitGtd: {
              baseSize: '0.5',
              limitPrice: '39000',
              stopPrice: '40000',
              endTime: '2025-12-31T23:59:59Z',
            },
          },
        },
      });
    });

    it('should pass pre-transformed request for trigger bracket GTD order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-bracket-gtd',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          triggerBracketGtd: {
            baseSize: '0.2',
            limitPrice: '45000',
            stopTriggerPrice: '46000',
            endTime: '2025-12-31T23:59:59Z',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-bracket-gtd',
          productId: 'BTC-USD',
          side: OrderSide.Buy,
          orderConfiguration: {
            triggerBracketGtd: {
              baseSize: '0.2',
              limitPrice: '45000',
              stopTriggerPrice: '46000',
              endTime: '2025-12-31T23:59:59Z',
            },
          },
        },
      });
    });

    it('should pass attachedOrderConfiguration with market order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-attached-market',
        productId: 'BTC-EUR',
        side: OrderSide.Buy,
        orderConfiguration: {
          marketMarketIoc: { quoteSize: '50' },
        },
        attachedOrderConfiguration: {
          triggerBracketGtc: {
            limitPrice: '98000',
            stopTriggerPrice: '91000',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-attached-market',
          productId: 'BTC-EUR',
          side: OrderSide.Buy,
          orderConfiguration: {
            marketMarketIoc: { quoteSize: '50' },
          },
          attachedOrderConfiguration: {
            triggerBracketGtc: {
              limitPrice: '98000',
              stopTriggerPrice: '91000',
            },
          },
        },
      });
    });

    it('should pass attachedOrderConfiguration with limit GTD order', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.createOrder({
        clientOrderId: 'test-attached-limit',
        productId: 'BTC-EUR',
        side: OrderSide.Buy,
        orderConfiguration: {
          limitLimitGtd: {
            baseSize: '0.001',
            limitPrice: '95000',
            endTime: '2026-02-08T01:00:00Z',
            postOnly: true,
          },
        },
        attachedOrderConfiguration: {
          triggerBracketGtc: {
            limitPrice: '98000',
            stopTriggerPrice: '91000',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'test-attached-limit',
          productId: 'BTC-EUR',
          side: OrderSide.Buy,
          orderConfiguration: {
            limitLimitGtd: {
              baseSize: '0.001',
              limitPrice: '95000',
              endTime: '2026-02-08T01:00:00Z',
              postOnly: true,
            },
          },
          attachedOrderConfiguration: {
            triggerBracketGtc: {
              limitPrice: '98000',
              stopTriggerPrice: '91000',
            },
          },
        },
      });
    });
  });

  describe('editOrder', () => {
    it('should pass pre-transformed request', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      // Service receives pre-transformed data (strings from MCP layer)
      await service.editOrder({
        orderId: 'order-123',
        price: '50000.5',
        size: '0.05',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/edit',
        method: Method.POST,
        bodyParams: {
          orderId: 'order-123',
          price: '50000.5',
          size: '0.05',
        },
      });
    });
  });

  describe('editOrderPreview', () => {
    it('should pass pre-transformed request', async () => {
      mockClient.request.mockResolvedValue(
        mockResponse({
          errors: [],
          slippage: '0.01',
        }),
      );

      await service.editOrderPreview({
        orderId: 'order-456',
        price: '45000',
        size: '0.1',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/edit_preview',
        method: Method.POST,
        bodyParams: {
          orderId: 'order-456',
          price: '45000',
          size: '0.1',
        },
      });
    });
  });

  describe('closePosition', () => {
    it('should pass pre-transformed request with size', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.closePosition({
        clientOrderId: 'close-123',
        productId: 'BTC-USD',
        size: '0.5',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/close_position',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'close-123',
          productId: 'BTC-USD',
          size: '0.5',
        },
      });
    });

    it('should handle undefined size', async () => {
      mockClient.request.mockResolvedValue(mockResponse({ success: true }));

      await service.closePosition({
        clientOrderId: 'close-456',
        productId: 'ETH-USD',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/close_position',
        method: Method.POST,
        bodyParams: {
          clientOrderId: 'close-456',
          productId: 'ETH-USD',
        },
      });
    });
  });

  describe('createOrderPreview', () => {
    it('should pass pre-transformed request', async () => {
      mockClient.request.mockResolvedValue(
        mockResponse({
          orderTotal: '50000',
          commissionTotal: '50',
          errs: [],
          warning: [],
          quoteSize: '50000',
          baseSize: '0.01',
          bestBid: '49990',
          bestAsk: '50010',
          isMax: false,
          slippage: '0.01',
        }),
      );

      await service.createOrderPreview({
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          limitLimitGtc: {
            baseSize: '0.01',
            limitPrice: '50000',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/preview',
        method: Method.POST,
        bodyParams: {
          productId: 'BTC-USD',
          side: OrderSide.Buy,
          orderConfiguration: {
            limitLimitGtc: {
              baseSize: '0.01',
              limitPrice: '50000',
            },
          },
        },
      });
    });

    it('should pass attachedOrderConfiguration in preview', async () => {
      mockClient.request.mockResolvedValue(
        mockResponse({
          orderTotal: '50000',
          commissionTotal: '50',
          errs: [],
          warning: [],
          quoteSize: '50000',
          baseSize: '0.01',
          bestBid: '49990',
          bestAsk: '50010',
          isMax: false,
          slippage: '0.01',
          pnlConfiguration: {
            triggerBracketPnl: {
              takeProfitPnl: '3000',
              stopLossPnl: '-4000',
            },
          },
        }),
      );

      const result = await service.createOrderPreview({
        productId: 'BTC-EUR',
        side: OrderSide.Buy,
        orderConfiguration: {
          marketMarketIoc: { quoteSize: '50' },
        },
        attachedOrderConfiguration: {
          triggerBracketGtc: {
            limitPrice: '98000',
            stopTriggerPrice: '91000',
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/preview',
        method: Method.POST,
        bodyParams: {
          productId: 'BTC-EUR',
          side: OrderSide.Buy,
          orderConfiguration: {
            marketMarketIoc: { quoteSize: '50' },
          },
          attachedOrderConfiguration: {
            triggerBracketGtc: {
              limitPrice: '98000',
              stopTriggerPrice: '91000',
            },
          },
        },
      });
      // Verify pnlConfiguration is converted from strings to numbers
      expect(result.pnlConfiguration).toEqual({
        triggerBracketPnl: {
          takeProfitPnl: 3000,
          stopLossPnl: -4000,
        },
      });
    });
  });

  describe('response conversion methods', () => {
    it('listOrders should delegate to SDK and convert response', async () => {
      const mockApiResponse = { orders: [], hasNext: false };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listOrders({ limit: 10 });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/historical/batch',
        queryParams: { limit: 10 },
      });
      expect(result).toEqual({ orders: [], hasNext: false, cursor: undefined });
    });

    it('listOrders should delegate to SDK with empty object when no request', async () => {
      const mockApiResponse = { orders: [], hasNext: false };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.listOrders();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/historical/batch',
        queryParams: {},
      });
      expect(result).toEqual({ orders: [], hasNext: false, cursor: undefined });
    });

    it('getOrder should delegate to SDK and convert numeric strings to numbers', async () => {
      // SDK response wraps order in { order: {...} }
      const mockApiResponse = {
        order: {
          orderId: '123',
          productId: 'BTC-USD',
          userId: 'user-1',
          orderConfiguration: {},
          side: OrderSide.Buy,
          clientOrderId: 'client-123',
          status: 'OPEN',
          timeInForce: 'GOOD_UNTIL_CANCELLED',
          createdTime: '2025-01-01T00:00:00Z',
          completionPercentage: '50.5',
          filledSize: '0.5',
          averageFilledPrice: '45000.25',
          fee: '10.5',
          numberOfFills: '3',
          filledValue: '22500.125',
          pendingCancel: false,
          sizeInQuote: false,
          totalFees: '15.75',
          sizeInclusiveOfFees: false,
          totalValueAfterFees: '22484.375',
          triggerStatus: 'INVALID_ORDER_TYPE',
          orderType: 'LIMIT',
          rejectReason: 'REJECT_REASON_UNSPECIFIED',
          settled: false,
          productType: 'SPOT',
          rejectMessage: '',
          cancelMessage: '',
          orderPlacementSource: 'RETAIL_ADVANCED',
          outstandingHoldAmount: '100.5',
          leverage: '2.0',
        },
      };
      mockClient.request.mockResolvedValue(mockResponse(mockApiResponse));

      const result = await service.getOrder({ orderId: '123' });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/historical/123',
      });
      // Verify numeric fields are converted from strings to numbers
      expect(result.completionPercentage).toBe(50.5);
      expect(result.filledSize).toBe(0.5);
      expect(result.averageFilledPrice).toBe(45000.25);
      expect(result.fee).toBe(10.5);
      expect(result.numberOfFills).toBe(3);
      expect(result.filledValue).toBe(22500.125);
      expect(result.totalFees).toBe(15.75);
      expect(result.totalValueAfterFees).toBe(22484.375);
      expect(result.outstandingHoldAmount).toBe(100.5);
      expect(result.leverage).toBe(2.0);
      // Verify non-numeric fields are unchanged
      expect(result.orderId).toBe('123');
      expect(result.productId).toBe('BTC-USD');
      expect(result.side).toBe(OrderSide.Buy);
    });

    it('cancelOrders should delegate to SDK', async () => {
      const responseData = {
        results: [
          {
            success: true,
            failureReason: 'UNKNOWN_CANCEL_FAILURE_REASON',
            orderId: '123',
          },
        ],
      };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      const result = await service.cancelOrders({ orderIds: ['123', '456'] });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/batch_cancel',
        method: Method.POST,
        bodyParams: {
          orderIds: ['123', '456'],
        },
      });
      expect(result).toEqual(responseData);
    });

    it('listFills should delegate to SDK with request', async () => {
      const responseData = { fills: [] };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      const result = await service.listFills({ limit: 50 });

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/historical/fills',
        queryParams: { limit: 50 },
      });
      expect(result).toEqual(responseData);
    });

    it('listFills should delegate to SDK with empty object when no request', async () => {
      const responseData = { fills: [] };
      mockClient.request.mockResolvedValue(mockResponse(responseData));

      const result = await service.listFills();

      expect(mockClient.request).toHaveBeenCalledWith({
        url: 'orders/historical/fills',
        queryParams: {},
      });
      expect(result).toEqual(responseData);
    });
  });
});
