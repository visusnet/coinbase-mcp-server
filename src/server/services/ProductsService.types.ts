// Re-export SDK types that don't need conversion
export type {
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
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/products/types';

// Re-export custom types from the application
export type {
  GetMarketSnapshotRequest,
  GetMarketSnapshotResponse,
} from '../MarketSnapshot';

export type {
  GetProductCandlesBatchRequest,
  GetProductCandlesBatchResponse,
} from '../ProductCandles';
