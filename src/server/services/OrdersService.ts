import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { Method } from '@coinbase-sample/core-ts';
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
} from './OrdersService.request';
import type {
  ListOrdersResponse,
  GetOrderResponse,
  CreateOrderResponse,
  CancelOrdersResponse,
  ListFillsResponse,
  EditOrderResponse,
  PreviewEditOrderResponse,
  ClosePositionResponse,
  PreviewOrderResponse,
} from './OrdersService.response';
import {
  ListOrdersResponseSchema,
  GetOrderResponseSchema,
  CreateOrderResponseSchema,
  CancelOrdersResponseSchema,
  ListFillsResponseSchema,
  EditOrderResponseSchema,
  PreviewEditOrderResponseSchema,
  ClosePositionResponseSchema,
  PreviewOrderResponseSchema,
} from './OrdersService.response';

/**
 * Wrapper service for Coinbase Orders API.
 * Receives pre-transformed request data (numbers already converted to strings by MCP layer).
 * Converts SDK response strings to numbers.
 */
export class OrdersService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listOrders(
    request?: ListOrdersRequest,
  ): Promise<ListOrdersResponse> {
    const response = await this.client.request({
      url: 'orders/historical/batch',
      queryParams: request ?? {},
    });
    return ListOrdersResponseSchema.parse(response.data);
  }

  public async getOrder(request: GetOrderRequest): Promise<GetOrderResponse> {
    const response = await this.client.request({
      url: `orders/historical/${request.orderId}`,
    });
    return GetOrderResponseSchema.parse(response.data);
  }

  public async createOrder(
    request: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    const response = await this.client.request({
      url: 'orders',
      method: Method.POST,
      bodyParams: request,
    });
    return CreateOrderResponseSchema.parse(response.data);
  }

  public async cancelOrders(
    request: CancelOrdersRequest,
  ): Promise<CancelOrdersResponse> {
    const response = await this.client.request({
      url: 'orders/batch_cancel',
      method: Method.POST,
      bodyParams: request,
    });
    return CancelOrdersResponseSchema.parse(response.data);
  }

  public async listFills(
    request?: ListFillsRequest,
  ): Promise<ListFillsResponse> {
    const response = await this.client.request({
      url: 'orders/historical/fills',
      queryParams: request ?? {},
    });
    return ListFillsResponseSchema.parse(response.data);
  }

  public async editOrder(
    request: EditOrderRequest,
  ): Promise<EditOrderResponse> {
    const response = await this.client.request({
      url: 'orders/edit',
      method: Method.POST,
      bodyParams: request,
    });
    return EditOrderResponseSchema.parse(response.data);
  }

  public async editOrderPreview(
    request: PreviewEditOrderRequest,
  ): Promise<PreviewEditOrderResponse> {
    const response = await this.client.request({
      url: 'orders/edit_preview',
      method: Method.POST,
      bodyParams: request,
    });
    return PreviewEditOrderResponseSchema.parse(response.data);
  }

  public async createOrderPreview(
    request: PreviewOrderRequest,
  ): Promise<PreviewOrderResponse> {
    const response = await this.client.request({
      url: 'orders/preview',
      method: Method.POST,
      bodyParams: request,
    });
    return PreviewOrderResponseSchema.parse(response.data);
  }

  public async closePosition(
    request: ClosePositionRequest,
  ): Promise<ClosePositionResponse> {
    const response = await this.client.request({
      url: 'orders/close_position',
      method: Method.POST,
      bodyParams: request,
    });
    return ClosePositionResponseSchema.parse(response.data);
  }
}
