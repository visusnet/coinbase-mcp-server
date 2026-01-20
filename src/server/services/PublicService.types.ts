// Our types with number instead of string for numeric fields
import type { OrderSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderSide';
import type { Product } from './ProductsService.types';

// =============================================================================
// SDK Type Re-exports
// =============================================================================

export type { Candle as SdkCandle } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Candle';
export type { L2Level as SdkL2Level } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/L2Level';
export type { PriceBook as SdkPriceBook } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PriceBook';
export type { HistoricalMarketTrade as SdkHistoricalMarketTrade } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/HistoricalMarketTrade';
export type { GetProductBookResponse as SdkGetProductBookResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetProductBookResponse';
export type { GetMarketTradesResponse as SdkGetMarketTradesResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetMarketTradesResponse';
export type {
  GetPublicProductCandlesRequest as SdkGetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse as SdkGetPublicProductCandlesResponse,
  GetPublicProductResponse as SdkGetPublicProductResponse,
  ListPublicProductsResponse as SdkListPublicProductsResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/types';

// Re-export SDK types unchanged (no numeric string fields)
export type {
  ListPublicProductsRequest,
  GetPublicProductRequest,
  GetPublicProductCandlesRequest,
  GetPublicProductBookRequest,
  GetPublicProductMarketTradesRequest as GetPublicMarketTradesRequest,
  GetServerTimeResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/types';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

// L2Level with number fields for order book
export interface L2Level {
  readonly price?: number;
  readonly size?: number;
}

// PriceBook with L2Level arrays
export interface PriceBook {
  readonly productId: string;
  readonly bids: ReadonlyArray<L2Level>;
  readonly asks: ReadonlyArray<L2Level>;
  readonly time?: string;
}

// Candle with number fields
export interface Candle {
  readonly start?: number;
  readonly low?: number;
  readonly high?: number;
  readonly open?: number;
  readonly close?: number;
  readonly volume?: number;
}

// HistoricalMarketTrade with number fields
export interface HistoricalMarketTrade {
  readonly tradeId?: string;
  readonly productId?: string;
  readonly price?: number;
  readonly size?: number;
  readonly time?: string;
  readonly side?: OrderSide;
  readonly exchange?: string;
}

// Response types with number fields
export interface GetPublicProductCandlesResponse {
  readonly candles?: ReadonlyArray<Candle>;
}

export type GetPublicProductResponse = Product;

export interface ListPublicProductsResponse {
  readonly products?: ReadonlyArray<Product>;
  readonly numProducts?: number;
}

export interface GetPublicProductBookResponse {
  readonly pricebook: PriceBook;
  readonly last?: number;
  readonly midMarket?: number;
  readonly spreadBps?: number;
  readonly spreadAbsolute?: number;
}

export interface GetPublicMarketTradesResponse {
  readonly trades?: ReadonlyArray<HistoricalMarketTrade>;
  readonly bestBid?: number;
  readonly bestAsk?: number;
}
