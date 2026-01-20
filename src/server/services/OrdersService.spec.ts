import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OrdersService } from './OrdersService';
import { OrderSide } from './OrdersService.types';

// Mock the SDK
jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => ({
  OrdersService: jest.fn().mockImplementation(() => mockSdkService),
  CoinbaseAdvTradeClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdkService: Record<string, jest.Mock<any>> = {
  listOrders: jest.fn(),
  getOrder: jest.fn(),
  createOrder: jest.fn(),
  cancelOrders: jest.fn(),
  listFills: jest.fn(),
  editOrder: jest.fn(),
  editOrderPreview: jest.fn(),
  createOrderPreview: jest.fn(),
  closePosition: jest.fn(),
};

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
      mockSdkService.editOrderPreview.mockResolvedValue({ slippage: '0.01' });

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
      mockSdkService.createOrderPreview.mockResolvedValue({ slippage: '0.01' });

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

  describe('pass-through methods', () => {
    it('listOrders should delegate to SDK with request', async () => {
      const mockResponse = { orders: [] };
      mockSdkService.listOrders.mockResolvedValue(mockResponse);

      const result = await service.listOrders({ limit: 10 });

      expect(mockSdkService.listOrders).toHaveBeenCalledWith({ limit: 10 });
      expect(result).toBe(mockResponse);
    });

    it('listOrders should delegate to SDK with empty object when no request', async () => {
      const mockResponse = { orders: [] };
      mockSdkService.listOrders.mockResolvedValue(mockResponse);

      const result = await service.listOrders();

      expect(mockSdkService.listOrders).toHaveBeenCalledWith({});
      expect(result).toBe(mockResponse);
    });

    it('getOrder should delegate to SDK', async () => {
      const mockResponse = { order: { orderId: '123' } };
      mockSdkService.getOrder.mockResolvedValue(mockResponse);

      const result = await service.getOrder({ orderId: '123' });

      expect(mockSdkService.getOrder).toHaveBeenCalledWith({ orderId: '123' });
      expect(result).toBe(mockResponse);
    });

    it('cancelOrders should delegate to SDK', async () => {
      const mockResponse = { results: [] };
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
