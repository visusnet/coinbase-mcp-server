import {
  OrdersService as SdkOrdersService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  CreateOrderRequest as SdkCreateOrderRequest,
  EditOrderRequest as SdkEditOrderRequest,
  EditOrderPreviewRequest as SdkPreviewEditOrderRequest,
  ClosePositionRequest as SdkClosePositionRequest,
  CreateOrderPreviewRequest as SdkPreviewOrderRequest,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/orders/types';
import { toString } from './numberConversion';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ListOrdersRequest,
  ListOrdersResponse,
  GetOrderRequest,
  GetOrderResponse,
  CancelOrdersRequest,
  CancelOrdersResponse,
  ListFillsRequest,
  ListFillsResponse,
  EditOrderRequest,
  EditOrderResponse,
  PreviewEditOrderRequest,
  PreviewEditOrderResponse,
  ClosePositionRequest,
  ClosePositionResponse,
  PreviewOrderRequest,
  PreviewOrderResponse,
  OrderConfiguration,
} from './OrdersService.types';

/**
 * Wrapper service for Coinbase Orders API.
 * Converts number types to strings for SDK calls.
 */
export class OrdersService {
  private readonly sdk: SdkOrdersService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkOrdersService(client);
  }

  public listOrders(request?: ListOrdersRequest): Promise<ListOrdersResponse> {
    return this.sdk.listOrders(request ?? {}) as Promise<ListOrdersResponse>;
  }

  public getOrder(request: GetOrderRequest): Promise<GetOrderResponse> {
    return this.sdk.getOrder(request) as Promise<GetOrderResponse>;
  }

  public createOrder(
    request: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    return this.sdk.createOrder(
      this.convertCreateOrderRequest(request),
    ) as Promise<CreateOrderResponse>;
  }

  public cancelOrders(
    request: CancelOrdersRequest,
  ): Promise<CancelOrdersResponse> {
    return this.sdk.cancelOrders(request) as Promise<CancelOrdersResponse>;
  }

  public listFills(request?: ListFillsRequest): Promise<ListFillsResponse> {
    return this.sdk.listFills(request ?? {}) as Promise<ListFillsResponse>;
  }

  public editOrder(request: EditOrderRequest): Promise<EditOrderResponse> {
    return this.sdk.editOrder(
      this.convertEditOrderRequest(request),
    ) as Promise<EditOrderResponse>;
  }

  public editOrderPreview(
    request: PreviewEditOrderRequest,
  ): Promise<PreviewEditOrderResponse> {
    return this.sdk.editOrderPreview(
      this.convertPreviewEditOrderRequest(request),
    ) as Promise<PreviewEditOrderResponse>;
  }

  public createOrderPreview(
    request: PreviewOrderRequest,
  ): Promise<PreviewOrderResponse> {
    return this.sdk.createOrderPreview(
      this.convertPreviewOrderRequest(request),
    ) as Promise<PreviewOrderResponse>;
  }

  public closePosition(
    request: ClosePositionRequest,
  ): Promise<ClosePositionResponse> {
    return this.sdk.closePosition(
      this.convertClosePositionRequest(request),
    ) as Promise<ClosePositionResponse>;
  }

  private convertCreateOrderRequest(
    request: CreateOrderRequest,
  ): SdkCreateOrderRequest {
    return {
      clientOrderId: request.clientOrderId,
      productId: request.productId,
      side: request.side,
      orderConfiguration: this.convertOrderConfiguration(
        request.orderConfiguration,
      ),
    };
  }

  private convertEditOrderRequest(
    request: EditOrderRequest,
  ): SdkEditOrderRequest {
    return {
      orderId: request.orderId,
      price: request.price.toString(),
      size: request.size.toString(),
    };
  }

  private convertPreviewEditOrderRequest(
    request: PreviewEditOrderRequest,
  ): SdkPreviewEditOrderRequest {
    return {
      orderId: request.orderId,
      price: request.price.toString(),
      size: request.size.toString(),
    };
  }

  private convertClosePositionRequest(
    request: ClosePositionRequest,
  ): SdkClosePositionRequest {
    return {
      clientOrderId: request.clientOrderId,
      productId: request.productId,
      size: toString(request.size),
    };
  }

  private convertPreviewOrderRequest(
    request: PreviewOrderRequest,
  ): SdkPreviewOrderRequest {
    return {
      productId: request.productId,
      side: request.side,
      orderConfiguration: this.convertOrderConfiguration(
        request.orderConfiguration,
      ),
    };
  }

  private convertOrderConfiguration(
    config: OrderConfiguration,
  ): SdkCreateOrderRequest['orderConfiguration'] {
    const result: SdkCreateOrderRequest['orderConfiguration'] = {};

    if (config.marketMarketIoc) {
      result.marketMarketIoc = {
        quoteSize: toString(config.marketMarketIoc.quoteSize),
        baseSize: toString(config.marketMarketIoc.baseSize),
      };
    }

    if (config.limitLimitGtc) {
      result.limitLimitGtc = {
        baseSize: config.limitLimitGtc.baseSize.toString(),
        limitPrice: config.limitLimitGtc.limitPrice.toString(),
        postOnly: config.limitLimitGtc.postOnly,
      };
    }

    if (config.limitLimitGtd) {
      result.limitLimitGtd = {
        baseSize: config.limitLimitGtd.baseSize.toString(),
        limitPrice: config.limitLimitGtd.limitPrice.toString(),
        endTime: config.limitLimitGtd.endTime,
        postOnly: config.limitLimitGtd.postOnly,
      };
    }

    if (config.limitLimitFok) {
      result.limitLimitFok = {
        baseSize: config.limitLimitFok.baseSize.toString(),
        limitPrice: config.limitLimitFok.limitPrice.toString(),
      };
    }

    if (config.sorLimitIoc) {
      result.sorLimitIoc = {
        baseSize: config.sorLimitIoc.baseSize.toString(),
        limitPrice: config.sorLimitIoc.limitPrice.toString(),
      };
    }

    if (config.stopLimitStopLimitGtc) {
      result.stopLimitStopLimitGtc = {
        baseSize: config.stopLimitStopLimitGtc.baseSize.toString(),
        limitPrice: config.stopLimitStopLimitGtc.limitPrice.toString(),
        stopPrice: config.stopLimitStopLimitGtc.stopPrice.toString(),
        stopDirection: config.stopLimitStopLimitGtc.stopDirection,
      };
    }

    if (config.stopLimitStopLimitGtd) {
      result.stopLimitStopLimitGtd = {
        baseSize: config.stopLimitStopLimitGtd.baseSize.toString(),
        limitPrice: config.stopLimitStopLimitGtd.limitPrice.toString(),
        stopPrice: config.stopLimitStopLimitGtd.stopPrice.toString(),
        endTime: config.stopLimitStopLimitGtd.endTime,
        stopDirection: config.stopLimitStopLimitGtd.stopDirection,
      };
    }

    if (config.triggerBracketGtc) {
      result.triggerBracketGtc = {
        baseSize: config.triggerBracketGtc.baseSize.toString(),
        limitPrice: config.triggerBracketGtc.limitPrice.toString(),
        stopTriggerPrice: config.triggerBracketGtc.stopTriggerPrice.toString(),
      };
    }

    if (config.triggerBracketGtd) {
      result.triggerBracketGtd = {
        baseSize: config.triggerBracketGtd.baseSize.toString(),
        limitPrice: config.triggerBracketGtd.limitPrice.toString(),
        stopTriggerPrice: config.triggerBracketGtd.stopTriggerPrice.toString(),
        endTime: config.triggerBracketGtd.endTime,
      };
    }

    return result;
  }
}
