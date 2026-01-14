import { ProductsService as BaseProductsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { GetBestBidAskResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetBestBidAskResponse';
import { GetProductBookResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetProductBookResponse';
import { L2Level } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/L2Level';
import { PriceBook } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PriceBook';
import { Product } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';
import { GetProductRequest } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';

interface GetMarketSnapshotRequest {
  productIds: string[];
  includeOrderBook?: boolean;
}

interface OrderBookData {
  bids: L2Level[];
  asks: L2Level[];
  bidDepth: number;
  askDepth: number;
  imbalance: number;
}

interface MarketSnapshot {
  price: number;
  bid: string;
  ask: string;
  spread: number;
  spreadPercent: number;
  spreadStatus: 'tight' | 'normal' | 'elevated' | 'wide';
  volume24h: string;
  change24hPercent: string;
  orderBook?: OrderBookData;
}

interface GetMarketSnapshotResponse {
  timestamp: string;
  snapshots: Record<string, MarketSnapshot>;
  summary: {
    assetsQueried: number;
    bestPerformer: string | null;
    worstPerformer: string | null;
  };
}

export class ProductsService extends BaseProductsService {
  /**
   * The SDK's getProduct type claims to return GetProductResponse, but it actually
   * returns a Product type. This function coerces the type.
   */
  public async getProductFixed(request: GetProductRequest): Promise<Product> {
    return this.getProduct(request) as Promise<Product>;
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

function createMarketSnapshots(
  productIds: string[],
  products: Product[],
  bestBidAsk: GetBestBidAskResponse,
  orderBooksByProductId: Partial<Record<string, OrderBookData>>,
) {
  const snapshots: Record<string, MarketSnapshot> = {};

  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    const product = getProductById(products, productId);
    const pricebook = findPriceBookForProduct(bestBidAsk.pricebooks, productId);

    if (!pricebook) {
      continue;
    }

    const snapshot: MarketSnapshot = createMarketSnapshot(
      pricebook,
      product,
      orderBooksByProductId[productId],
    );

    snapshots[productId] = snapshot;
  }
  return snapshots;
}

function getProductById(products: Product[], productId: string) {
  const product = products.find((p) => p.productId === productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }
  return product;
}

function calculateBidAskImbalance(bidDepth: number, askDepth: number) {
  return bidDepth + askDepth > 0
    ? (bidDepth - askDepth) / (bidDepth + askDepth)
    : 0;
}

function calculateBidAskDepth(levels: L2Level[]) {
  return levels.reduce(
    (sum, level) => sum + parseNumber(level.price) * parseNumber(level.size),
    0,
  );
}

function findPriceBookForProduct(
  pricebooks: PriceBook[],
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

function findBestAndWorstPerformers(snapshots: Record<string, MarketSnapshot>) {
  let bestPerformer = { id: '', change: -Infinity };
  let worstPerformer = { id: '', change: Infinity };

  for (const [id, snapshot] of Object.entries(snapshots)) {
    const change = parseNumber(snapshot.change24hPercent);
    if (change > bestPerformer.change) {
      bestPerformer = { id, change };
    }
    if (change < worstPerformer.change) {
      worstPerformer = { id, change };
    }
  }

  return { bestPerformer, worstPerformer };
}

function calculateSpreadPercent(price: number, spread: number) {
  return price > 0 ? (spread / price) * 100 : 0;
}

function parseNumber(value?: string): number {
  if (typeof value !== 'string') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function classifySpreadStatus(
  spreadPercent: number,
): 'tight' | 'normal' | 'elevated' | 'wide' {
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

function getMaxPrice(levels: L2Level[]): string {
  let best = -Infinity;
  let bestRaw = '0';

  for (const level of levels) {
    if (typeof level.price !== 'string') {
      continue;
    }
    const price = parseNumber(level.price);
    if (price > best) {
      best = price;
      bestRaw = level.price;
    }
  }

  return bestRaw;
}

function getMinPrice(levels: L2Level[]): string {
  let best = Infinity;
  let bestRaw = '0';

  for (const level of levels) {
    if (typeof level.price !== 'string') {
      continue;
    }
    const price = parseNumber(level.price);
    if (price < best) {
      best = price;
      bestRaw = level.price;
    }
  }

  return bestRaw;
}

function calculateMidPrice(minAskPrice: string, maxBidPrice: string): number {
  return (parseNumber(minAskPrice) + parseNumber(maxBidPrice)) / 2;
}

function calculateSpread(minAskPrice: string, maxBidPrice: string) {
  return parseNumber(minAskPrice) - parseNumber(maxBidPrice);
}
