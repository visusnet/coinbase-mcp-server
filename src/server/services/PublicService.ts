import { PublicService as SdkPublicService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js';
import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { toUnixTimestamp } from '../ProductCandles';
import type {
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

/**
 * Wrapper service for Coinbase Public API.
 * Delegates to SDK service and handles timestamp conversion.
 */
export class PublicService {
  private readonly sdk: SdkPublicService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPublicService(client);
  }

  public getServerTime(): Promise<GetServerTimeResponse> {
    return this.sdk.getServerTime({}) as Promise<GetServerTimeResponse>;
  }

  public getProduct(
    request: GetPublicProductRequest,
  ): Promise<GetPublicProductResponse> {
    return this.sdk.getProduct(request) as Promise<GetPublicProductResponse>;
  }

  public listProducts(
    request?: ListPublicProductsRequest,
  ): Promise<ListPublicProductsResponse> {
    return this.sdk.listProducts(
      request ?? {},
    ) as Promise<ListPublicProductsResponse>;
  }

  public getProductBook(
    request: GetPublicProductBookRequest,
  ): Promise<GetPublicProductBookResponse> {
    return this.sdk.getProductBook(
      request,
    ) as Promise<GetPublicProductBookResponse>;
  }

  public getProductMarketTrades(
    request: GetPublicMarketTradesRequest,
  ): Promise<GetPublicMarketTradesResponse> {
    return this.sdk.getProductMarketTrades(
      request,
    ) as Promise<GetPublicMarketTradesResponse>;
  }

  /**
   * Get public product candles with automatic ISO 8601 to Unix timestamp conversion.
   * The SDK expects ISO 8601 but the underlying API requires Unix timestamps.
   */
  public getProductCandles(
    request: GetPublicProductCandlesRequest,
  ): Promise<GetPublicProductCandlesResponse> {
    return this.sdk.getProductCandles({
      productId: request.productId,
      start: toUnixTimestamp(request.start),
      end: toUnixTimestamp(request.end),
      granularity: request.granularity,
    }) as Promise<GetPublicProductCandlesResponse>;
  }
}
