// Our types with number instead of string for numeric fields

// Create convert quote request with number types
export interface CreateConvertQuoteRequest {
  readonly fromAccount: string;
  readonly toAccount: string;
  readonly amount: number;
}

// Re-export response types unchanged
export type {
  CreateConvertQuoteResponse,
  CommitConvertTradeRequest,
  CommitConvertTradeResponse,
  GetConvertTradeRequest,
  GetConvertTradeResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/convert/types';
