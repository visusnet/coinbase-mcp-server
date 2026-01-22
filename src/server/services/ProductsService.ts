import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkListProductsResponse,
  SdkGetBestBidAskResponse,
  SdkGetProductBookResponse,
  ListProductsRequest,
  ListProductsResponse,
  GetProductRequest,
  GetProductResponse,
  GetProductCandlesRequest,
  GetProductCandlesResponse,
  GetProductBookRequest,
  GetProductBookResponse,
  GetBestBidAskRequest,
  GetBestBidAskResponse,
  GetProductMarketTradesRequest,
  GetProductMarketTradesResponse,
  GetMarketSnapshotRequest,
  GetMarketSnapshotResponse,
  GetProductCandlesBatchRequest,
  GetProductCandlesBatchResponse,
  OrderBookData,
  MarketSnapshot,
  SpreadStatus,
  ProductCandles,
  SdkGetProductResponse,
} from './ProductsService.types';
import type { Product, L2Level, PriceBook } from './common.types';
import {
  toListProductsResponse,
  toSdkGetProductCandlesRequest,
  toGetBestBidAskResponse,
  toGetProductBookResponse,
  toGetProductResponse,
} from './ProductsService.convert';
import {
  toCandle,
  toGetPublicMarketTradesResponse,
} from './PublicService.convert';
import type { SdkGetMarketTradesResponse } from './PublicService.types';

/**
 * Wrapper service for Coinbase Products API.
 * Delegates to SDK service and handles timestamp conversion.
 */
export class ProductsService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listProducts(
    request?: ListProductsRequest,
  ): Promise<ListProductsResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'products',
        queryParams: request ?? {},
      })
    ).data as SdkListProductsResponse;
    return toListProductsResponse(sdkResponse);
  }

  public async getProduct(
    request: GetProductRequest,
  ): Promise<GetProductResponse> {
    let queryParams = {};
    if (request.getTradabilityStatus) {
      queryParams = {
        getTradabilityStatus: request.getTradabilityStatus,
      };
    }
    const sdkResponse = (
      await this.client.request({
        url: `products/${request.productId}`,
        queryParams,
      })
    ).data as SdkGetProductResponse;
    return toGetProductResponse(sdkResponse);
  }

  /**
   * Get product candles with automatic ISO 8601 to Unix timestamp conversion.
   * The SDK expects ISO 8601 but the underlying API requires Unix timestamps.
   */
  public async getProductCandles(
    request: GetProductCandlesRequest,
  ): Promise<GetProductCandlesResponse> {
    const sdkRequest = toSdkGetProductCandlesRequest(request);
    const queryParams = {
      start: sdkRequest.start,
      end: sdkRequest.end,
      granularity: sdkRequest.granularity,
      limit: sdkRequest.limit || 350,
    };
    const sdkResponse = (
      await this.client.request({
        url: `products/${request.productId}/candles`,
        queryParams,
      })
    ).data as GetProductCandlesResponse;
    return sdkResponse;
  }

  public async getProductBook(
    request: GetProductBookRequest,
  ): Promise<GetProductBookResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'product_book',
        queryParams: request,
      })
    ).data as SdkGetProductBookResponse;
    return toGetProductBookResponse(sdkResponse);
  }

  public async getBestBidAsk(
    request?: GetBestBidAskRequest,
  ): Promise<GetBestBidAskResponse> {
    let queryParams = {};
    if (request?.productIds) {
      queryParams = {
        productIds: request.productIds.join(','),
      };
    }
    const sdkResponse = (
      await this.client.request({
        url: 'best_bid_ask',
        queryParams,
      })
    ).data as SdkGetBestBidAskResponse;
    return toGetBestBidAskResponse(sdkResponse);
  }

  public async getProductMarketTrades(
    request: GetProductMarketTradesRequest,
  ): Promise<GetProductMarketTradesResponse> {
    const sdkResponse = (
      await this.client.request({
        url: `products/${request.productId}/ticker`,
        queryParams: request,
      })
    ).data as SdkGetMarketTradesResponse;
    return toGetPublicMarketTradesResponse(sdkResponse);
  }

  public async getMarketSnapshot({
    productIds,
    includeOrderBook = false,
  }: GetMarketSnapshotRequest): Promise<GetMarketSnapshotResponse> {
    const bestBidAsk = await this.getBestBidAsk({ productIds });

    const products = await this.getProducts(productIds);

    const orderBooksByProductId: Partial<Record<string, OrderBookData>> = {};
    if (includeOrderBook) {
      const productBooks = await this.getProductBooks(productIds);

      for (const book of productBooks) {
        const { bids, asks } = book.pricebook;

        const bidDepth = calculateBidAskDepth(bids);
        const askDepth = calculateBidAskDepth(asks);
        const imbalance = calculateBidAskImbalance(bidDepth, askDepth);

        orderBooksByProductId[book.pricebook.productId] = {
          bids: [...bids],
          asks: [...asks],
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
    const productCandlesByProductId: Record<string, ProductCandles> = {};
    const errors: Record<string, string> = {};
    let candleCount = 0;

    await Promise.all(
      productIds.map(async (productId) => {
        try {
          const response = await this.getProductCandles({
            productId,
            start,
            end,
            granularity,
          });
          const sdkCandles = response.candles ?? [];
          const candles = sdkCandles.map(toCandle);
          productCandlesByProductId[productId] = {
            candles,
            latest: candles[0] ?? null,
            oldest: candles[candles.length - 1] ?? null,
          };
          candleCount += candles.length;
        } catch (err) {
          errors[productId] = err instanceof Error ? err.message : String(err);
        }
      }),
    );

    return {
      timestamp: new Date().toISOString(),
      granularity,
      candleCount,
      productCandlesByProductId,
      errors,
    };
  }

  private async getProductBooks(
    productIds: string[],
  ): Promise<GetProductBookResponse[]> {
    return Promise.all(
      productIds.map((productId) => this.getProductBook({ productId })),
    );
  }

  private async getProducts(productIds: string[]): Promise<Product[]> {
    const responses = await Promise.all(
      productIds.map((productId) => this.getProduct({ productId })),
    );
    return responses.map(({ product }) => product);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function classifySpreadStatus(spreadPercent: number): SpreadStatus {
  if (spreadPercent < 0.1) {
    return 'tight';
  }
  if (spreadPercent < 0.3) {
    return 'normal';
  }
  if (spreadPercent < 0.5) {
    return 'elevated';
  }
  return 'wide';
}

function getMaxPrice(levels: readonly L2Level[]): number {
  let best = -Infinity;
  for (const level of levels) {
    const price = level.price ?? 0;
    if (price > best) {
      best = price;
    }
  }
  return best === -Infinity ? 0 : best;
}

function getMinPrice(levels: readonly L2Level[]): number {
  let best = Infinity;
  for (const level of levels) {
    const price = level.price ?? 0;
    if (price < best) {
      best = price;
    }
  }
  return best === Infinity ? 0 : best;
}

function calculateMidPrice(minAskPrice: number, maxBidPrice: number): number {
  return (minAskPrice + maxBidPrice) / 2;
}

function calculateSpread(minAskPrice: number, maxBidPrice: number): number {
  return minAskPrice - maxBidPrice;
}

function calculateSpreadPercent(price: number, spread: number): number {
  return price > 0 ? (spread / price) * 100 : 0;
}

function calculateBidAskDepth(levels: readonly L2Level[]): number {
  return levels.reduce(
    (sum, level) => sum + (level.price ?? 0) * (level.size ?? 0),
    0,
  );
}

function calculateBidAskImbalance(bidDepth: number, askDepth: number): number {
  return bidDepth + askDepth > 0
    ? (bidDepth - askDepth) / (bidDepth + askDepth)
    : 0;
}

function findPriceBookForProduct(
  pricebooks: readonly PriceBook[],
  productId: string,
): PriceBook | undefined {
  return pricebooks.find((p) => p.productId === productId);
}

function createMarketSnapshot(
  pricebook: PriceBook,
  { volume24h, pricePercentageChange24h: change24hPercent }: Product,
  orderBook?: OrderBookData,
): MarketSnapshot {
  const bid = getMaxPrice(pricebook.bids);
  const ask = getMinPrice(pricebook.asks);
  const price = calculateMidPrice(ask, bid);
  const spread = calculateSpread(ask, bid);
  const spreadPercent = calculateSpreadPercent(price, spread);
  const spreadStatus = classifySpreadStatus(spreadPercent);

  return {
    price,
    bid,
    ask,
    spread,
    spreadPercent,
    spreadStatus,
    volume24h,
    change24hPercent,
    orderBook,
  };
}

function createMarketSnapshots(
  productIds: string[],
  products: Product[],
  bestBidAsk: GetBestBidAskResponse,
  orderBooksByProductId: Partial<Record<string, OrderBookData>>,
): Record<string, MarketSnapshot> {
  const snapshots: Record<string, MarketSnapshot> = {};
  const productMap = new Map(products.map((p) => [p.productId, p]));

  for (const productId of productIds) {
    const product = productMap.get(productId);
    const pricebook = findPriceBookForProduct(bestBidAsk.pricebooks, productId);

    if (!pricebook || !product) {
      continue;
    }

    snapshots[productId] = createMarketSnapshot(
      pricebook,
      product,
      orderBooksByProductId[productId],
    );
  }
  return snapshots;
}

function findBestAndWorstPerformers(
  snapshots: Record<string, MarketSnapshot>,
): { bestPerformer: { id: string }; worstPerformer: { id: string } } {
  let bestPerformer = { id: '', change: -Infinity };
  let worstPerformer = { id: '', change: Infinity };

  for (const [id, snapshot] of Object.entries(snapshots)) {
    const change = snapshot.change24hPercent;
    if (change > bestPerformer.change) {
      bestPerformer = { id, change };
    }
    if (change < worstPerformer.change) {
      worstPerformer = { id, change };
    }
  }

  return { bestPerformer, worstPerformer };
}
