import { ProductsService as BaseProductsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { GetBestBidAskResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetBestBidAskResponse';
import { GetProductBookResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetProductBookResponse';
import { Product } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';
import {
  GetProductCandlesRequest,
  GetProductCandlesResponse,
  GetProductRequest,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';
import {
  GetMarketSnapshotRequest,
  GetMarketSnapshotResponse,
  OrderBookData,
  MarketSnapshot,
  calculateBidAskDepth,
  calculateBidAskImbalance,
  createMarketSnapshots,
  findBestAndWorstPerformers,
} from './MarketSnapshot';
import {
  countCandles,
  GetProductCandlesBatchRequest,
  GetProductCandlesBatchResponse,
  ProductCandles,
  toUnixTimestamp,
} from './ProductCandles';

export class ProductsService extends BaseProductsService {
  /**
   * The SDK's getProduct type claims to return GetProductResponse, but it actually
   * returns a Product type. This function coerces the type.
   */
  public async getProductFixed(request: GetProductRequest): Promise<Product> {
    return this.getProduct(request) as Promise<Product>;
  }

  /**
   * The SDK's getProductCandles method expects ISO 8601 timestamps, but the underlying
   * API requires Unix timestamps. This method converts ISO 8601 to Unix timestamps
   * before calling the original method.
   */
  public async getProductCandlesFixed(
    request: GetProductCandlesRequest,
  ): Promise<GetProductCandlesResponse> {
    return this.getProductCandles({
      productId: request.productId,
      start: toUnixTimestamp(request.start),
      end: toUnixTimestamp(request.end),
      granularity: request.granularity,
    }) as Promise<GetProductCandlesResponse>;
  }

  public async getMarketSnapshot({
    productIds,
    includeOrderBook = false,
  }: GetMarketSnapshotRequest): Promise<GetMarketSnapshotResponse> {
    const bestBidAsk = (await this.getBestBidAsk({
      productIds,
    })) as GetBestBidAskResponse;

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
        response: await this.getProductCandlesFixed({
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
    ) as Promise<GetProductBookResponse[]>;
  }

  private async getProducts(productIds: string[]): Promise<Product[]> {
    return Promise.all(
      productIds.map((id) => this.getProductFixed({ productId: id })),
    );
  }
}
