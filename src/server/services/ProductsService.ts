import {
  ProductsService as SdkProductsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkProduct,
  SdkL2Level,
  SdkPriceBook,
  SdkListProductsResponse,
  Product,
  ListProductsRequest,
  ListProductsResponse,
  GetProductRequest,
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
  L2Level,
  Candle,
} from './ProductsService.types';
import { toNumber } from './numberConversion';
import {
  toProduct,
  toListProductsResponse,
  toSdkGetProductCandlesRequest,
} from './ProductsService.convert';

// =============================================================================
// Helper Functions (from MarketSnapshot.ts and ProductCandles.ts)
// =============================================================================

function parseNumber(value?: string): number {
  if (typeof value !== 'string') {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

function getMaxPrice(levels: SdkL2Level[]): number {
  let best = -Infinity;
  for (const level of levels) {
    if (typeof level.price !== 'string') {
      continue;
    }
    const price = parseNumber(level.price);
    if (price > best) {
      best = price;
    }
  }
  return best === -Infinity ? 0 : best;
}

function getMinPrice(levels: SdkL2Level[]): number {
  let best = Infinity;
  for (const level of levels) {
    if (typeof level.price !== 'string') {
      continue;
    }
    const price = parseNumber(level.price);
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

function calculateBidAskDepth(levels: SdkL2Level[]): number {
  return levels.reduce(
    (sum, level) => sum + parseNumber(level.price) * parseNumber(level.size),
    0,
  );
}

function calculateBidAskImbalance(bidDepth: number, askDepth: number): number {
  return bidDepth + askDepth > 0
    ? (bidDepth - askDepth) / (bidDepth + askDepth)
    : 0;
}

function toL2Levels(levels: SdkL2Level[]): L2Level[] {
  return levels.map((level) => ({
    price: toNumber(level.price),
    size: toNumber(level.size),
  }));
}

function findPriceBookForProduct(
  pricebooks: SdkPriceBook[],
  productId: string,
): SdkPriceBook | undefined {
  return pricebooks.find((p) => p.productId === productId);
}

function createMarketSnapshot(
  pricebook: SdkPriceBook,
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

function countCandles(
  candleResults: { productId: string; response: GetProductCandlesResponse }[],
): number {
  return candleResults.reduce(
    (acc: number, { response }) => acc + (response.candles?.length ?? 0),
    0,
  );
}

function toCandle(candle: {
  start?: string;
  low?: string;
  high?: string;
  open?: string;
  close?: string;
  volume?: string;
}): Candle {
  return {
    start: toNumber(candle.start),
    low: toNumber(candle.low),
    high: toNumber(candle.high),
    open: toNumber(candle.open),
    close: toNumber(candle.close),
    volume: toNumber(candle.volume),
  };
}

function toCandles(
  candles: ReadonlyArray<{
    start?: string;
    low?: string;
    high?: string;
    open?: string;
    close?: string;
    volume?: string;
  }>,
): Candle[] {
  return candles.map(toCandle);
}

// =============================================================================
// ProductsService
// =============================================================================

/**
 * Wrapper service for Coinbase Products API.
 * Delegates to SDK service and handles timestamp conversion.
 */
export class ProductsService {
  private readonly sdk: SdkProductsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkProductsService(client);
  }

  public async listProducts(
    request?: ListProductsRequest,
  ): Promise<ListProductsResponse> {
    const sdkResponse = (await this.sdk.listProducts(
      request ?? {},
    )) as SdkListProductsResponse;
    return toListProductsResponse(sdkResponse);
  }

  public async getProduct(request: GetProductRequest): Promise<Product> {
    // SDK types incorrectly declare GetProductResponse as { body?: Product }
    // but the SDK actually returns Product directly (SDK bug)
    const sdkResponse = (await this.sdk.getProduct(
      request,
    )) as unknown as SdkProduct;
    return toProduct(sdkResponse);
  }

  /**
   * Get product candles with automatic ISO 8601 to Unix timestamp conversion.
   * The SDK expects ISO 8601 but the underlying API requires Unix timestamps.
   */
  public getProductCandles(
    request: GetProductCandlesRequest,
  ): Promise<GetProductCandlesResponse> {
    return this.sdk.getProductCandles(
      toSdkGetProductCandlesRequest(request),
    ) as Promise<GetProductCandlesResponse>;
  }

  public getProductBook(
    request: GetProductBookRequest,
  ): Promise<GetProductBookResponse> {
    return this.sdk.getProductBook(request) as Promise<GetProductBookResponse>;
  }

  public getBestBidAsk(
    request?: GetBestBidAskRequest,
  ): Promise<GetBestBidAskResponse> {
    return this.sdk.getBestBidAsk(
      request ?? {},
    ) as Promise<GetBestBidAskResponse>;
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
    const bestBidAsk = await this.getBestBidAsk({ productIds });

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
          bids: toL2Levels(bids),
          asks: toL2Levels(asks),
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
      const sdkCandles = response.candles ?? [];
      const candles = toCandles(sdkCandles);
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
