import { type CoinbaseClient, HttpMethod } from '@client/CoinbaseClient';
import type {
  CreateConvertQuoteRequest,
  CommitConvertTradeRequest,
  GetConvertTradeRequest,
} from './ConvertsService.request';
import type {
  CreateConvertQuoteResponse,
  CommitConvertTradeResponse,
  GetConvertTradeResponse,
} from './ConvertsService.response';
import {
  CreateConvertQuoteResponseSchema,
  CommitConvertTradeResponseSchema,
  GetConvertTradeResponseSchema,
} from './ConvertsService.response';

/**
 * Wrapper service for Coinbase Converts API.
 * Receives pre-transformed request data (numbers already converted to strings by MCP layer).
 * Converts SDK response strings to numbers.
 */
export class ConvertsService {
  constructor(private readonly client: CoinbaseClient) {}

  public async createConvertQuote(
    request: CreateConvertQuoteRequest,
  ): Promise<CreateConvertQuoteResponse> {
    const response = await this.client.request({
      url: 'convert/quote',
      method: HttpMethod.POST,
      bodyParams: request,
    });
    return CreateConvertQuoteResponseSchema.parse(response.data);
  }

  public async commitConvertTrade(
    request: CommitConvertTradeRequest,
  ): Promise<CommitConvertTradeResponse> {
    const response = await this.client.request({
      url: `convert/trade/${request.tradeId}`,
      method: HttpMethod.POST,
      bodyParams: request,
    });
    return CommitConvertTradeResponseSchema.parse(response.data);
  }

  public async getConvertTrade(
    request: GetConvertTradeRequest,
  ): Promise<GetConvertTradeResponse> {
    const response = await this.client.request({
      url: `convert/trade/${request.tradeId}`,
      queryParams: {
        fromAccount: request.fromAccount,
        toAccount: request.toAccount,
      },
    });
    return GetConvertTradeResponseSchema.parse(response.data);
  }
}
