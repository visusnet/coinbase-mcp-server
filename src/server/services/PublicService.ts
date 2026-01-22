import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkGetProductBookResponse,
  SdkGetMarketTradesResponse,
  SdkGetPublicProductResponse,
  SdkListPublicProductsResponse,
  SdkGetPublicProductCandlesResponse,
  GetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse,
  GetPublicProductRequest,
  GetPublicProductResponse,
  ListPublicProductsRequest,
  ListPublicProductsResponse,
  GetPublicProductBookRequest,
  GetPublicProductBookResponse,
  GetPublicMarketTradesRequest,
  GetPublicMarketTradesResponse,
  GetServerTimeResponse,
} from './PublicService.types';
import {
  toSdkGetPublicProductCandlesRequest,
  toListPublicProductsResponse,
  toGetPublicProductCandlesResponse,
  toGetPublicProductBookResponse,
  toGetPublicMarketTradesResponse,
} from './PublicService.convert';
import { toProduct } from './common.convert';

/**
 * Wrapper service for Coinbase Public API.
 * Converts SDK response types to our types with number fields.
 */
export class PublicService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async getServerTime(): Promise<GetServerTimeResponse> {
    const response = await this.client.request({
      url: 'time',
      queryParams: {},
    });
    return response.data as GetServerTimeResponse;
  }

  public async getProduct(
    request: GetPublicProductRequest,
  ): Promise<GetPublicProductResponse> {
    const response = await this.client.request({
      url: `market/products/${request.productId}`,
      queryParams: {},
    });
    const sdkResponse = response.data as SdkGetPublicProductResponse;
    return toProduct(sdkResponse);
  }

  public async listProducts(
    request?: ListPublicProductsRequest,
  ): Promise<ListPublicProductsResponse> {
    const response = await this.client.request({
      url: 'market/products',
      queryParams: request ?? {},
    });
    const sdkResponse = response.data as SdkListPublicProductsResponse;
    return toListPublicProductsResponse(sdkResponse);
  }

  public async getProductBook(
    request: GetPublicProductBookRequest,
  ): Promise<GetPublicProductBookResponse> {
    const response = await this.client.request({
      url: 'market/product_book',
      queryParams: request,
    });
    const sdkResponse = response.data as SdkGetProductBookResponse;
    return toGetPublicProductBookResponse(sdkResponse);
  }

  public async getProductMarketTrades(
    request: GetPublicMarketTradesRequest,
  ): Promise<GetPublicMarketTradesResponse> {
    const response = await this.client.request({
      url: `market/products/${request.productId}/ticker`,
      queryParams: request,
    });
    const sdkResponse = response.data as SdkGetMarketTradesResponse;
    return toGetPublicMarketTradesResponse(sdkResponse);
  }

  /**
   * Get public product candles with automatic ISO 8601 to Unix timestamp conversion.
   * The SDK expects ISO 8601 but the underlying API requires Unix timestamps.
   */
  public async getProductCandles(
    request: GetPublicProductCandlesRequest,
  ): Promise<GetPublicProductCandlesResponse> {
    const sdkRequest = toSdkGetPublicProductCandlesRequest(request);
    const response = await this.client.request({
      url: `market/products/${request.productId}/candles`,
      queryParams: sdkRequest,
    });
    const sdkResponse = response.data as SdkGetPublicProductCandlesResponse;
    return toGetPublicProductCandlesResponse(sdkResponse);
  }
}
