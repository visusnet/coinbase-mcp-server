// Wrapper types with numbers for API convenience
import type {
  Candle,
  L2Level,
  PriceBook,
  Product,
  HistoricalMarketTrade,
} from './common.types';

// =============================================================================
// SDK Types (for conversion) - these have our own converted counterparts
// =============================================================================

export type {
  GetProductCandlesRequest as SdkGetProductCandlesRequest,
  GetProductResponse as SdkGetProductResponse,
  ListProductsResponse as SdkListProductsResponse,
  GetBestBidAskResponse as SdkGetBestBidAskResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';

export type { GetProductBookResponse as SdkGetProductBookResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetProductBookResponse';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

// =============================================================================
// Product Types
// =============================================================================

// ListProductsResponse with our Product type
export interface ListProductsResponse {
  readonly products?: Product[];
  readonly numProducts?: number;
}

// GetProductResponse wrapping our Product type
export interface GetProductResponse {
  readonly product: Product;
}

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

export interface GetProductCandlesBatchRequest {
  productIds: string[];
  granularity: Granularity;
  start: string; // ISO 8601 timestamp
  end: string; // ISO 8601 timestamp
}

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

// =============================================================================
// Best Bid/Ask Types
// =============================================================================

// GetBestBidAskResponse with our PriceBook type (numbers instead of strings)
export interface GetBestBidAskResponse {
  readonly pricebooks: ReadonlyArray<PriceBook>;
}

// GetProductBookResponse with our PriceBook type (numbers instead of strings)
export interface GetProductBookResponse {
  readonly pricebook: PriceBook;
  readonly last?: number;
  readonly midMarket?: number;
  readonly spreadBps?: number;
  readonly spreadAbsolute?: number;
}

// =============================================================================
// Market Trades Types
// =============================================================================

export interface GetProductMarketTradesResponse {
  readonly trades?: ReadonlyArray<HistoricalMarketTrade>;
  readonly bestBid?: number;
  readonly bestAsk?: number;
}

// =============================================================================
// SDK Types (pass-through) - no conversion needed
// =============================================================================

export type {
  ListProductsRequest,
  GetProductRequest,
  GetProductCandlesRequest,
  GetProductCandlesResponse,
  GetProductBookRequest,
  GetBestBidAskRequest,
  GetProductMarketTradesRequest,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';
