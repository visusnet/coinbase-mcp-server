import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { Method } from '@coinbase-sample/core-ts';
import type {
  SdkListOrdersResponse,
  SdkGetOrderResponse,
  CreateOrderResponse,
  ListOrdersResponse,
  GetOrderResponse,
  CancelOrdersResponse,
  ListFillsResponse,
  EditOrderResponse,
  PreviewEditOrderResponse,
  ClosePositionResponse,
  PreviewOrderResponse,
} from './OrdersService.types';
import type {
  CreateOrderRequest,
  ListOrdersRequest,
  GetOrderRequest,
  CancelOrdersRequest,
  ListFillsRequest,
  EditOrderRequest,
  PreviewEditOrderRequest,
  ClosePositionRequest,
  PreviewOrderRequest,
} from './OrdersService.schema';
import {
  toOrder,
  toListOrdersResponse,
  toSdkCreateOrderRequest,
  toSdkEditOrderRequest,
  toSdkPreviewEditOrderRequest,
  toSdkClosePositionRequest,
  toSdkPreviewOrderRequest,
} from './OrdersService.convert';

/**
 * Wrapper service for Coinbase Orders API.
 * Converts number types to strings for SDK calls.
 */
export class OrdersService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listOrders(
    request?: ListOrdersRequest,
  ): Promise<ListOrdersResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'orders/historical/batch',
        queryParams: request ?? {},
      })
    ).data as SdkListOrdersResponse;
    return toListOrdersResponse(sdkResponse);
  }

  public async getOrder(request: GetOrderRequest): Promise<GetOrderResponse> {
    const sdkResponse = (
      await this.client.request({
        url: `orders/historical/${request.orderId}`,
      })
    ).data as SdkGetOrderResponse;
    return toOrder(sdkResponse);
  }

  public async createOrder(
    request: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'orders',
        method: Method.POST,
        bodyParams: toSdkCreateOrderRequest(request),
      })
    ).data as CreateOrderResponse;
    return sdkResponse;
  }

  public async cancelOrders(
    request: CancelOrdersRequest,
  ): Promise<CancelOrdersResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'orders/batch_cancel',
        method: Method.POST,
        bodyParams: request,
      })
    ).data as CancelOrdersResponse;
    return sdkResponse;
  }

  public async listFills(
    request?: ListFillsRequest,
  ): Promise<ListFillsResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'orders/historical/fills',
        queryParams: request ?? {},
      })
    ).data as ListFillsResponse;
    return sdkResponse;
  }

  public async editOrder(
    request: EditOrderRequest,
  ): Promise<EditOrderResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'orders/edit',
        method: Method.POST,
        bodyParams: toSdkEditOrderRequest(request),
      })
    ).data as EditOrderResponse;
    return sdkResponse;
  }

  public async editOrderPreview(
    request: PreviewEditOrderRequest,
  ): Promise<PreviewEditOrderResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'orders/edit_preview',
        method: Method.POST,
        bodyParams: toSdkPreviewEditOrderRequest(request),
      })
    ).data as PreviewEditOrderResponse;
    return sdkResponse;
  }

  public async createOrderPreview(
    request: PreviewOrderRequest,
  ): Promise<PreviewOrderResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'orders/preview',
        method: Method.POST,
        bodyParams: toSdkPreviewOrderRequest(request),
      })
    ).data as PreviewOrderResponse;
    return sdkResponse;
  }

  public async closePosition(
    request: ClosePositionRequest,
  ): Promise<ClosePositionResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'orders/close_position',
        method: Method.POST,
        bodyParams: toSdkClosePositionRequest(request),
      })
    ).data as ClosePositionResponse;
    return sdkResponse;
  }
}
