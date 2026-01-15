import { GetBestBidAskResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetBestBidAskResponse';
import { L2Level } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/L2Level';
import { PriceBook } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PriceBook';
import { Product } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';

export interface GetMarketSnapshotRequest {
  productIds: string[];
  includeOrderBook?: boolean;
}

export interface OrderBookData {
  bids: L2Level[];
  asks: L2Level[];
  bidDepth: number;
  askDepth: number;
  imbalance: number;
}

export type SpreadStatus = 'tight' | 'normal' | 'elevated' | 'wide';

export interface MarketSnapshot {
  price: number;
  bid: string;
  ask: string;
  spread: number;
  spreadPercent: number;
  spreadStatus: SpreadStatus;
  volume24h: string;
  change24hPercent: string;
  orderBook?: OrderBookData;
}

export interface GetMarketSnapshotResponse {
  timestamp: string;
  snapshots: Record<string, MarketSnapshot>;
  summary: {
    assetsQueried: number;
    bestPerformer: string | null;
    worstPerformer: string | null;
  };
}

export function createMarketSnapshots(
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
function getProductById(products: Product[], productId: string): Product {
  const product = products.find((p) => p.productId === productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }
  return product;
}

export function calculateBidAskImbalance(bidDepth: number, askDepth: number) {
  return bidDepth + askDepth > 0
    ? (bidDepth - askDepth) / (bidDepth + askDepth)
    : 0;
}

export function calculateBidAskDepth(levels: L2Level[]) {
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

export function findBestAndWorstPerformers(
  snapshots: Record<string, MarketSnapshot>,
) {
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

function calculateSpread(minAskPrice: string, maxBidPrice: string): number {
  return parseNumber(minAskPrice) - parseNumber(maxBidPrice);
}
