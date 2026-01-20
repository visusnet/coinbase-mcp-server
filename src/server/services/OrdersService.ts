import {
  OrdersService as SdkOrdersService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkListOrdersResponse,
  SdkGetOrderResponse,
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
} from './OrdersService.types';
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
  private readonly sdk: SdkOrdersService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkOrdersService(client);
  }

  public async listOrders(
    request?: ListOrdersRequest,
  ): Promise<ListOrdersResponse> {
    const sdkResponse = (await this.sdk.listOrders(
      request ?? {},
    )) as SdkListOrdersResponse;
    return toListOrdersResponse(sdkResponse);
  }

  public async getOrder(request: GetOrderRequest): Promise<GetOrderResponse> {
    const sdkResponse = (await this.sdk.getOrder(
      request,
    )) as SdkGetOrderResponse;
    return toOrder(sdkResponse);
  }

  public createOrder(
    request: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    return this.sdk.createOrder(
      toSdkCreateOrderRequest(request),
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
      toSdkEditOrderRequest(request),
    ) as Promise<EditOrderResponse>;
  }

  public editOrderPreview(
    request: PreviewEditOrderRequest,
  ): Promise<PreviewEditOrderResponse> {
    return this.sdk.editOrderPreview(
      toSdkPreviewEditOrderRequest(request),
    ) as Promise<PreviewEditOrderResponse>;
  }

  public createOrderPreview(
    request: PreviewOrderRequest,
  ): Promise<PreviewOrderResponse> {
    return this.sdk.createOrderPreview(
      toSdkPreviewOrderRequest(request),
    ) as Promise<PreviewOrderResponse>;
  }

  public closePosition(
    request: ClosePositionRequest,
  ): Promise<ClosePositionResponse> {
    return this.sdk.closePosition(
      toSdkClosePositionRequest(request),
    ) as Promise<ClosePositionResponse>;
  }
}
