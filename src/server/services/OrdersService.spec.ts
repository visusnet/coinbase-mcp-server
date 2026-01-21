import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CancelOrderFailureReason } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/CancelOrderFailureReason';
import { OrderExecutionStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderExecutionStatus';
import { OrderPlacementSource } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderPlacementSource';
import { OrderType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderType';
import { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType';
import { RejectReason } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/RejectReason';
import { StopTriggerStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/StopTriggerStatus';
import { TimeInForceType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/TimeInForceType';
import { createSdkOrdersServiceMock } from '@test/serviceMocks';
import { OrdersService } from './OrdersService';
import type { SdkGetOrderResponse } from './OrdersService.types';
import { OrderSide } from './OrdersService.types';

const mockSdkService = createSdkOrdersServiceMock();

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  OrdersService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService({} as never);
  });

  describe('createOrder', () => {
    it('should convert number fields to strings for market order', async () => {
      const mockResponse = { success: true, orderId: '123' };
      mockSdkService.createOrder.mockResolvedValue(mockResponse);

      await service.createOrder({
        clientOrderId: 'test-123',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          marketMarketIoc: {
            quoteSize: 100.5,
            baseSize: 0.001,
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
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
    });

    it('should convert number fields to strings for limit GTC order', async () => {
      mockSdkService.createOrder.mockResolvedValue({ success: true });

      await service.createOrder({
        clientOrderId: 'test-456',
        productId: 'ETH-USD',
        side: OrderSide.Sell,
        orderConfiguration: {
          limitLimitGtc: {
            baseSize: 1.5,
            limitPrice: 2000.25,
            postOnly: true,
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
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
    });

    it('should convert number fields to strings for stop-limit GTC order', async () => {
      mockSdkService.createOrder.mockResolvedValue({ success: true });

      await service.createOrder({
        clientOrderId: 'test-789',
        productId: 'BTC-USD',
        side: OrderSide.Sell,
        orderConfiguration: {
          stopLimitStopLimitGtc: {
            baseSize: 0.5,
            limitPrice: 40000,
            stopPrice: 41000,
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
        clientOrderId: 'test-789',
        productId: 'BTC-USD',
        side: OrderSide.Sell,
        orderConfiguration: {
          stopLimitStopLimitGtc: {
            baseSize: '0.5',
            limitPrice: '40000',
            stopPrice: '41000',
            stopDirection: undefined,
          },
        },
      });
    });

    it('should convert number fields to strings for trigger bracket GTC order', async () => {
      mockSdkService.createOrder.mockResolvedValue({ success: true });

      await service.createOrder({
        clientOrderId: 'test-bracket',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          triggerBracketGtc: {
            baseSize: 0.1,
            limitPrice: 42000,
            stopTriggerPrice: 43000,
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
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
    });

    it('should convert number fields to strings for limit GTD order', async () => {
      mockSdkService.createOrder.mockResolvedValue({ success: true });

      await service.createOrder({
        clientOrderId: 'test-gtd',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          limitLimitGtd: {
            baseSize: 0.1,
            limitPrice: 50000,
            endTime: '2025-12-31T23:59:59Z',
            postOnly: true,
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
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
    });

    it('should convert number fields to strings for limit FOK order', async () => {
      mockSdkService.createOrder.mockResolvedValue({ success: true });

      await service.createOrder({
        clientOrderId: 'test-fok',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          limitLimitFok: {
            baseSize: 0.5,
            limitPrice: 48000,
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
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
    });

    it('should convert number fields to strings for SOR limit IOC order', async () => {
      mockSdkService.createOrder.mockResolvedValue({ success: true });

      await service.createOrder({
        clientOrderId: 'test-sor',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          sorLimitIoc: {
            baseSize: 0.25,
            limitPrice: 47000,
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
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
    });

    it('should convert number fields to strings for stop-limit GTD order', async () => {
      mockSdkService.createOrder.mockResolvedValue({ success: true });

      await service.createOrder({
        clientOrderId: 'test-stop-gtd',
        productId: 'BTC-USD',
        side: OrderSide.Sell,
        orderConfiguration: {
          stopLimitStopLimitGtd: {
            baseSize: 0.5,
            limitPrice: 39000,
            stopPrice: 40000,
            endTime: '2025-12-31T23:59:59Z',
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
        clientOrderId: 'test-stop-gtd',
        productId: 'BTC-USD',
        side: OrderSide.Sell,
        orderConfiguration: {
          stopLimitStopLimitGtd: {
            baseSize: '0.5',
            limitPrice: '39000',
            stopPrice: '40000',
            endTime: '2025-12-31T23:59:59Z',
            stopDirection: undefined,
          },
        },
      });
    });

    it('should convert number fields to strings for trigger bracket GTD order', async () => {
      mockSdkService.createOrder.mockResolvedValue({ success: true });

      await service.createOrder({
        clientOrderId: 'test-bracket-gtd',
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          triggerBracketGtd: {
            baseSize: 0.2,
            limitPrice: 45000,
            stopTriggerPrice: 46000,
            endTime: '2025-12-31T23:59:59Z',
          },
        },
      });

      expect(mockSdkService.createOrder).toHaveBeenCalledWith({
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
    });
  });

  describe('editOrder', () => {
    it('should convert number fields to strings', async () => {
      mockSdkService.editOrder.mockResolvedValue({ success: true });

      await service.editOrder({
        orderId: 'order-123',
        price: 50000.5,
        size: 0.05,
      });

      expect(mockSdkService.editOrder).toHaveBeenCalledWith({
        orderId: 'order-123',
        price: '50000.5',
        size: '0.05',
      });
    });
  });

  describe('editOrderPreview', () => {
    it('should convert number fields to strings', async () => {
      mockSdkService.editOrderPreview.mockResolvedValue({
        errors: [],
        slippage: '0.01',
      });

      await service.editOrderPreview({
        orderId: 'order-456',
        price: 45000,
        size: 0.1,
      });

      expect(mockSdkService.editOrderPreview).toHaveBeenCalledWith({
        orderId: 'order-456',
        price: '45000',
        size: '0.1',
      });
    });
  });

  describe('closePosition', () => {
    it('should convert optional size to string', async () => {
      mockSdkService.closePosition.mockResolvedValue({ success: true });

      await service.closePosition({
        clientOrderId: 'close-123',
        productId: 'BTC-USD',
        size: 0.5,
      });

      expect(mockSdkService.closePosition).toHaveBeenCalledWith({
        clientOrderId: 'close-123',
        productId: 'BTC-USD',
        size: '0.5',
      });
    });

    it('should handle undefined size', async () => {
      mockSdkService.closePosition.mockResolvedValue({ success: true });

      await service.closePosition({
        clientOrderId: 'close-456',
        productId: 'ETH-USD',
      });

      expect(mockSdkService.closePosition).toHaveBeenCalledWith({
        clientOrderId: 'close-456',
        productId: 'ETH-USD',
        size: undefined,
      });
    });
  });

  describe('createOrderPreview', () => {
    it('should convert number fields to strings', async () => {
      mockSdkService.createOrderPreview.mockResolvedValue({
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
      });

      await service.createOrderPreview({
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          limitLimitGtc: {
            baseSize: 0.01,
            limitPrice: 50000,
          },
        },
      });

      expect(mockSdkService.createOrderPreview).toHaveBeenCalledWith({
        productId: 'BTC-USD',
        side: OrderSide.Buy,
        orderConfiguration: {
          limitLimitGtc: {
            baseSize: '0.01',
            limitPrice: '50000',
            postOnly: undefined,
          },
        },
      });
    });
  });

  describe('response conversion methods', () => {
    it('listOrders should delegate to SDK and convert response', async () => {
      const mockSdkResponse = { orders: [], hasNext: false };
      mockSdkService.listOrders.mockResolvedValue(mockSdkResponse);

      const result = await service.listOrders({ limit: 10 });

      expect(mockSdkService.listOrders).toHaveBeenCalledWith({ limit: 10 });
      expect(result).toEqual({ orders: [], hasNext: false, cursor: undefined });
    });

    it('listOrders should delegate to SDK with empty object when no request', async () => {
      const mockSdkResponse = { orders: [], hasNext: false };
      mockSdkService.listOrders.mockResolvedValue(mockSdkResponse);

      const result = await service.listOrders();

      expect(mockSdkService.listOrders).toHaveBeenCalledWith({});
      expect(result).toEqual({ orders: [], hasNext: false, cursor: undefined });
    });

    it('getOrder should delegate to SDK and convert numeric strings to numbers', async () => {
      // SDK response wraps order in { order: {...} }
      const mockSdkResponse = {
        order: {
          orderId: '123',
          productId: 'BTC-USD',
          userId: 'user-1',
          orderConfiguration: {},
          side: OrderSide.Buy,
          clientOrderId: 'client-123',
          status: OrderExecutionStatus.Open,
          timeInForce: TimeInForceType.GoodUntilCancelled,
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
          triggerStatus: StopTriggerStatus.InvalidOrderType,
          orderType: OrderType.Limit,
          rejectReason: RejectReason.RejectReasonUnspecified,
          settled: false,
          productType: ProductType.Spot,
          rejectMessage: '',
          cancelMessage: '',
          orderPlacementSource: OrderPlacementSource.RetailAdvanced,
          outstandingHoldAmount: '100.5',
          leverage: '2.0',
        },
      };
      // Cast needed: SDK types are wrong - actual response is { order: {...} }
      mockSdkService.getOrder.mockResolvedValue(
        mockSdkResponse as unknown as SdkGetOrderResponse,
      );

      const result = await service.getOrder({ orderId: '123' });

      expect(mockSdkService.getOrder).toHaveBeenCalledWith({ orderId: '123' });
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
      const mockResponse = {
        success: true,
        failureReason: CancelOrderFailureReason.UnknownCancelFailureReason,
        orderId: '123',
      };
      mockSdkService.cancelOrders.mockResolvedValue(mockResponse);

      const result = await service.cancelOrders({ orderIds: ['123', '456'] });

      expect(mockSdkService.cancelOrders).toHaveBeenCalledWith({
        orderIds: ['123', '456'],
      });
      expect(result).toBe(mockResponse);
    });

    it('listFills should delegate to SDK with request', async () => {
      const mockResponse = { fills: [] };
      mockSdkService.listFills.mockResolvedValue(mockResponse);

      const result = await service.listFills({ limit: 50 });

      expect(mockSdkService.listFills).toHaveBeenCalledWith({ limit: 50 });
      expect(result).toBe(mockResponse);
    });

    it('listFills should delegate to SDK with empty object when no request', async () => {
      const mockResponse = { fills: [] };
      mockSdkService.listFills.mockResolvedValue(mockResponse);

      const result = await service.listFills();

      expect(mockSdkService.listFills).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });
  });
});
