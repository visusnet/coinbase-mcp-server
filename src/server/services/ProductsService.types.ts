// Wrapper types with numbers for API convenience
import type { Candle, L2Level } from './common.response';
import type { Granularity } from './common.request';

// =============================================================================
// Product Candles Types
// =============================================================================

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
  volume24h?: number;
  change24hPercent?: number;
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
