// Wrapper types with numbers for API convenience
import type { FcmTradingSessionDetails } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FcmTradingSessionDetails';
import type { FutureProductDetails } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FutureProductDetails';
import type { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType';
import type { ProductVenue } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductVenue';
import type { Candle, L2Level } from './PublicService.types';

// =============================================================================
// SDK Type Re-exports
// =============================================================================

export type { Product as SdkProduct } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';
export type {
  GetProductCandlesRequest as SdkGetProductCandlesRequest,
  ListProductsResponse as SdkListProductsResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';

// Re-export shared SDK types from PublicService.types for convenience
export type { SdkL2Level, SdkPriceBook } from './PublicService.types';

// Re-export shared types for convenience
export type { Candle, L2Level } from './PublicService.types';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

// =============================================================================
// Product Types
// =============================================================================

// Product type with numbers instead of strings for numeric fields
export interface Product {
  readonly productId: string;
  readonly price: number;
  readonly pricePercentageChange24h: number;
  readonly volume24h: number;
  readonly volumePercentageChange24h: number;
  readonly baseIncrement: number;
  readonly quoteIncrement: number;
  readonly quoteMinSize: number;
  readonly quoteMaxSize: number;
  readonly baseMinSize: number;
  readonly baseMaxSize: number;
  readonly baseName: string;
  readonly quoteName: string;
  readonly watched: boolean;
  readonly isDisabled: boolean;
  readonly _new: boolean;
  readonly status: string;
  readonly cancelOnly: boolean;
  readonly limitOnly: boolean;
  readonly postOnly: boolean;
  readonly tradingDisabled: boolean;
  readonly auctionMode: boolean;
  readonly productType?: ProductType;
  readonly quoteCurrencyId?: string;
  readonly baseCurrencyId?: string;
  readonly fcmTradingSessionDetails?: FcmTradingSessionDetails;
  readonly midMarketPrice?: number;
  readonly alias?: string;
  readonly aliasTo?: Array<string>;
  readonly baseDisplaySymbol: string;
  readonly quoteDisplaySymbol: string;
  readonly viewOnly?: boolean;
  readonly priceIncrement?: number;
  readonly displayName?: string;
  readonly productVenue?: ProductVenue;
  readonly approximateQuote24hVolume?: number;
  readonly futureProductDetails?: FutureProductDetails;
}

// ListProductsResponse with our Product type
export interface ListProductsResponse {
  readonly products?: Product[];
  readonly numProducts?: number;
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
// Re-export SDK types that don't need conversion
// =============================================================================

export type {
  ListProductsRequest,
  GetProductRequest,
  GetProductCandlesRequest,
  GetProductCandlesResponse,
  GetProductBookRequest,
  GetProductBookResponse,
  GetBestBidAskRequest,
  GetBestBidAskResponse,
  GetProductMarketTradesRequest,
  GetProductMarketTradesResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';
