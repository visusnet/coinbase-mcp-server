// Re-export SDK types unchanged - this is the decoupling layer
export type {
  ListFuturesPositionsResponse,
  GetFuturesPositionRequest,
  GetFuturesPositionsResponse as GetFuturesPositionResponse,
  GetFuturesBalanceSummaryResponse,
  ListFuturesSweepsResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/futures/types';
