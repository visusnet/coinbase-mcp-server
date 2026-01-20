// Re-export SDK types unchanged - this is the decoupling layer
export type {
  ListPerpetualsPositionsRequest,
  ListPerpetualsPositionsResponse,
  GetPerpetualsPositionRequest,
  GetPerpetualsPositionResponse,
  GetPerpetualsPortfolioSummaryRequest as GetPortfolioSummaryRequest,
  GetPerpetualsPortfolioSummaryResponse as GetPortfolioSummaryResponse,
  GetPerpetualsPortfoliosBalancesRequest as GetPortfolioBalanceRequest,
  GetPerpetualsPortfoliosBalancesResponse as GetPortfolioBalanceResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/perpetuals/types';
