// Wrapper types with numbers for API convenience
import type { Candle, L2Level } from './common.schema';

// =============================================================================
// Product Candles Types
// =============================================================================

export enum Granularity {
  ONE_MINUTE = 'ONE_MINUTE',
  FIVE_MINUTE = 'FIVE_MINUTE',
  FIFTEEN_MINUTE = 'FIFTEEN_MINUTE',
  THIRTY_MINUTE = 'THIRTY_MINUTE',
  ONE_HOUR = 'ONE_HOUR',
  TWO_HOUR = 'TWO_HOUR',
  SIX_HOUR = 'SIX_HOUR',
  ONE_DAY = 'ONE_DAY',
}

// Note: GetProductCandlesBatchRequest is derived from schema in ProductsService.schema.ts

export interface ProductCandles {
  candles: Candle[];
  latest: Candle | null;
  oldest: Candle | null;
}

export interface GetProductCandlesBatchResponse {
  timestamp: string;
  granularity: Granularity;
  candleCount: number;
  productCandlesByProductId: Record<string, ProductCandles>;
  /** Products that failed to fetch (with error messages) */
  errors: Record<string, string>;
}

// =============================================================================
// Market Snapshot Types
// =============================================================================

// Note: GetMarketSnapshotRequest is derived from schema in ProductsService.schema.ts

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
  bid: number;
  ask: number;
  spread: number;
  spreadPercent: number;
  spreadStatus: SpreadStatus;
  volume24h: number;
  change24hPercent: number;
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
