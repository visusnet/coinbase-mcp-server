import { PublicService as SdkPublicService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js';
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
  private readonly sdk: SdkPublicService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPublicService(client);
  }

  public getServerTime(): Promise<GetServerTimeResponse> {
    return this.sdk.getServerTime({}) as Promise<GetServerTimeResponse>;
  }

  public async getProduct(
    request: GetPublicProductRequest,
  ): Promise<GetPublicProductResponse> {
    const sdkResponse = (await this.sdk.getProduct(
      request,
    )) as SdkGetPublicProductResponse;
    return toProduct(sdkResponse);
  }

  public async listProducts(
    request?: ListPublicProductsRequest,
  ): Promise<ListPublicProductsResponse> {
    const sdkResponse = (await this.sdk.listProducts(
      request ?? {},
    )) as SdkListPublicProductsResponse;
    return toListPublicProductsResponse(sdkResponse);
  }

  public async getProductBook(
    request: GetPublicProductBookRequest,
  ): Promise<GetPublicProductBookResponse> {
    const sdkResponse = (await this.sdk.getProductBook(
      request,
    )) as SdkGetProductBookResponse;
    return toGetPublicProductBookResponse(sdkResponse);
  }

  public async getProductMarketTrades(
    request: GetPublicMarketTradesRequest,
  ): Promise<GetPublicMarketTradesResponse> {
    const sdkResponse = (await this.sdk.getProductMarketTrades(
      request,
    )) as SdkGetMarketTradesResponse;
    return toGetPublicMarketTradesResponse(sdkResponse);
  }

  /**
   * Get public product candles with automatic ISO 8601 to Unix timestamp conversion.
   * The SDK expects ISO 8601 but the underlying API requires Unix timestamps.
   */
  public async getProductCandles(
    request: GetPublicProductCandlesRequest,
  ): Promise<GetPublicProductCandlesResponse> {
    const sdkResponse = (await this.sdk.getProductCandles(
      toSdkGetPublicProductCandlesRequest(request),
    )) as SdkGetPublicProductCandlesResponse;
    return toGetPublicProductCandlesResponse(sdkResponse);
  }
}
