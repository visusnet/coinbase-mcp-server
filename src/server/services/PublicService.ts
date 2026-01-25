import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  GetPublicProductCandlesRequest,
  GetPublicProductRequest,
  ListPublicProductsRequest,
  GetPublicProductBookRequest,
  GetPublicMarketTradesRequest,
  GetPublicProductCandlesResponse,
  GetPublicProductResponse,
  ListPublicProductsResponse,
  GetPublicProductBookResponse,
  GetPublicMarketTradesResponse,
  GetServerTimeResponse,
} from './PublicService.schema';
import {
  GetPublicProductResponseSchema,
  ListPublicProductsResponseSchema,
  GetPublicProductCandlesResponseSchema,
  GetPublicProductBookResponseSchema,
  GetPublicMarketTradesResponseSchema,
  GetServerTimeResponseSchema,
} from './PublicService.schema';

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
    return GetServerTimeResponseSchema.parse(response.data);
  }

  public async getProduct(
    request: GetPublicProductRequest,
  ): Promise<GetPublicProductResponse> {
    const response = await this.client.request({
      url: `market/products/${request.productId}`,
      queryParams: {},
    });
    return GetPublicProductResponseSchema.parse(response.data);
  }

  public async listProducts(
    request?: ListPublicProductsRequest,
  ): Promise<ListPublicProductsResponse> {
    const response = await this.client.request({
      url: 'market/products',
      queryParams: request ?? {},
    });
    return ListPublicProductsResponseSchema.parse(response.data);
  }

  public async getProductBook(
    request: GetPublicProductBookRequest,
  ): Promise<GetPublicProductBookResponse> {
    const response = await this.client.request({
      url: 'market/product_book',
      queryParams: request,
    });
    return GetPublicProductBookResponseSchema.parse(response.data);
  }

  public async getProductMarketTrades(
    request: GetPublicMarketTradesRequest,
  ): Promise<GetPublicMarketTradesResponse> {
    const response = await this.client.request({
      url: `market/products/${request.productId}/ticker`,
      queryParams: request,
    });
    return GetPublicMarketTradesResponseSchema.parse(response.data);
  }

  /**
   * Get public product candles.
   * Receives pre-transformed request (ISO 8601 already converted to Unix timestamps by MCP layer).
   */
  public async getProductCandles(
    request: GetPublicProductCandlesRequest,
  ): Promise<GetPublicProductCandlesResponse> {
    const response = await this.client.request({
      url: `market/products/${request.productId}/candles`,
      queryParams: request,
    });
    return GetPublicProductCandlesResponseSchema.parse(response.data);
  }
}
