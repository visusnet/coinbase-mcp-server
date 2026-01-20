import {
  ProductsService as SdkProductsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { GetProductBookResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetProductBookResponse';
import type { Product } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';
import { toUnixTimestamp } from '../ProductCandles';
import {
  OrderBookData,
  MarketSnapshot,
  calculateBidAskDepth,
  calculateBidAskImbalance,
  createMarketSnapshots,
  findBestAndWorstPerformers,
} from '../MarketSnapshot';
import { countCandles, ProductCandles } from '../ProductCandles';
import type {
  ListProductsRequest,
  ListProductsResponse,
  GetProductRequest,
  GetProductCandlesRequest,
  GetProductCandlesResponse,
  GetProductBookRequest,
  GetProductBookResponse as GetProductBookResponseType,
  GetBestBidAskRequest,
  GetBestBidAskResponse as GetBestBidAskResponseType,
  GetProductMarketTradesRequest,
  GetProductMarketTradesResponse,
  GetMarketSnapshotRequest,
  GetMarketSnapshotResponse,
  GetProductCandlesBatchRequest,
  GetProductCandlesBatchResponse,
} from './ProductsService.types';

/**
 * Wrapper service for Coinbase Products API.
 * Delegates to SDK service and handles timestamp conversion.
 */
export class ProductsService {
  private readonly sdk: SdkProductsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkProductsService(client);
  }

  public listProducts(
    request?: ListProductsRequest,
  ): Promise<ListProductsResponse> {
    return this.sdk.listProducts(
      request ?? {},
    ) as Promise<ListProductsResponse>;
  }

  public getProduct(request: GetProductRequest): Promise<Product> {
    return this.sdk.getProduct(request) as Promise<Product>;
  }

  /**
   * Get product candles with automatic ISO 8601 to Unix timestamp conversion.
   * The SDK expects ISO 8601 but the underlying API requires Unix timestamps.
   */
  public getProductCandles(
    request: GetProductCandlesRequest,
  ): Promise<GetProductCandlesResponse> {
    return this.sdk.getProductCandles({
      productId: request.productId,
      start: toUnixTimestamp(request.start),
      end: toUnixTimestamp(request.end),
      granularity: request.granularity,
    }) as Promise<GetProductCandlesResponse>;
  }

  public getProductBook(
    request: GetProductBookRequest,
  ): Promise<GetProductBookResponseType> {
    return this.sdk.getProductBook(
      request,
    ) as Promise<GetProductBookResponseType>;
  }

  public getBestBidAsk(
    request?: GetBestBidAskRequest,
  ): Promise<GetBestBidAskResponseType> {
    return this.sdk.getBestBidAsk(
      request ?? {},
    ) as Promise<GetBestBidAskResponseType>;
  }

  public getProductMarketTrades(
    request: GetProductMarketTradesRequest,
  ): Promise<GetProductMarketTradesResponse> {
    return this.sdk.getProductMarketTrades(
      request,
    ) as Promise<GetProductMarketTradesResponse>;
  }

  public async getMarketSnapshot({
    productIds,
    includeOrderBook = false,
  }: GetMarketSnapshotRequest): Promise<GetMarketSnapshotResponse> {
    const bestBidAsk = await this.getBestBidAsk({
      productIds,
    });

    const products = await this.getProducts(productIds);

    const orderBooksByProductId: Partial<Record<string, OrderBookData>> = {};
    if (includeOrderBook) {
      const orderBooks = await this.getOrderBooks(productIds);

      for (const book of orderBooks) {
        const bids = book.pricebook.bids;
        const asks = book.pricebook.asks;

        const bidDepth = calculateBidAskDepth(bids);
        const askDepth = calculateBidAskDepth(asks);
        const imbalance = calculateBidAskImbalance(bidDepth, askDepth);

        orderBooksByProductId[book.pricebook.productId] = {
          bids,
          asks,
          bidDepth,
          askDepth,
          imbalance,
        };
      }
    }

    const snapshots: Record<string, MarketSnapshot> = createMarketSnapshots(
      productIds,
      products,
      bestBidAsk,
      orderBooksByProductId,
    );

    const { bestPerformer, worstPerformer } =
      findBestAndWorstPerformers(snapshots);

    return {
      timestamp: new Date().toISOString(),
      snapshots,
      summary: {
        assetsQueried: Object.keys(snapshots).length,
        bestPerformer: bestPerformer.id || null,
        worstPerformer: worstPerformer.id || null,
      },
    };
  }

  public async getProductCandlesBatch({
    productIds,
    start,
    end,
    granularity,
  }: GetProductCandlesBatchRequest): Promise<GetProductCandlesBatchResponse> {
    const candleResults = await Promise.all(
      productIds.map(async (productId) => ({
        productId,
        response: await this.getProductCandles({
          productId,
          start,
          end,
          granularity,
        }),
      })),
    );

    const productCandlesByProductId: Record<string, ProductCandles> = {};
    for (const { productId, response } of candleResults) {
      const candles = response.candles ?? [];
      productCandlesByProductId[productId] = {
        candles,
        latest: candles[0] ?? null,
        oldest: candles[candles.length - 1] ?? null,
      };
    }

    const candleCount = countCandles(candleResults);

    return {
      timestamp: new Date().toISOString(),
      granularity,
      candleCount,
      productCandlesByProductId,
    };
  }

  private async getOrderBooks(
    productIds: string[],
  ): Promise<GetProductBookResponse[]> {
    return Promise.all(
      productIds.map((id) => this.getProductBook({ productId: id })),
    );
  }

  private async getProducts(productIds: string[]): Promise<Product[]> {
    return Promise.all(
      productIds.map((id) => this.getProduct({ productId: id })),
    );
  }
}
