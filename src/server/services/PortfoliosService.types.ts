// Our types with number instead of string for numeric fields

// Funds with number type for value
export interface Funds {
  readonly value: number;
  readonly currency: string;
}

// Move portfolio funds request with number types
export interface MovePortfolioFundsRequest {
  readonly funds: Funds;
  readonly sourcePortfolioUuid: string;
  readonly targetPortfolioUuid: string;
}

// Re-export other types unchanged
export type {
  ListPortfoliosRequest,
  ListPortfoliosResponse,
  CreatePortfolioRequest,
  CreatePortfolioResponse,
  GetPortfolioRequest,
  GetPortfolioResponse,
  EditPortfolioRequest,
  EditPortfolioResponse,
  DeletePortfolioRequest,
  DeletePortfolioResponse,
  MovePortfolioFundsResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/portfolios/types';
