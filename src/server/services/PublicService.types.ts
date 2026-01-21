// Our types with number instead of string for numeric fields
import type {
  Product,
  Candle,
  PriceBook,
  HistoricalMarketTrade,
} from './common.types';

// =============================================================================
// SDK Types (for conversion) - these have our own converted counterparts
// =============================================================================

export type { GetProductBookResponse as SdkGetProductBookResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetProductBookResponse';
export type { GetMarketTradesResponse as SdkGetMarketTradesResponse } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/GetMarketTradesResponse';
export type {
  GetPublicProductCandlesRequest as SdkGetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse as SdkGetPublicProductCandlesResponse,
  GetPublicProductResponse as SdkGetPublicProductResponse,
  ListPublicProductsResponse as SdkListPublicProductsResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/types';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

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

// =============================================================================
// SDK Types (pass-through) - no conversion needed
// =============================================================================

export type {
  ListPublicProductsRequest,
  GetPublicProductRequest,
  GetPublicProductCandlesRequest,
  GetPublicProductBookRequest,
  GetPublicProductMarketTradesRequest as GetPublicMarketTradesRequest,
  GetServerTimeResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/types';
