// Re-export SDK types unchanged - this is the decoupling layer
export type {
  GetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse,
  GetPublicProductRequest,
  GetPublicProductResponse,
  ListPublicProductsRequest,
  ListPublicProductsResponse,
  GetPublicProductBookRequest,
  GetPublicProductBookResponse,
  GetPublicProductMarketTradesRequest as GetPublicMarketTradesRequest,
  GetPublicProductMarketTradesResponse as GetPublicMarketTradesResponse,
  GetServerTimeResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/types';
