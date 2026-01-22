import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { Method } from '@coinbase-sample/core-ts';
import type {
  SdkCreateConvertQuoteResponse,
  SdkCommitConvertTradeResponse,
  SdkGetConvertTradeResponse,
  CreateConvertQuoteResponse,
  CommitConvertTradeResponse,
  GetConvertTradeResponse,
} from './ConvertsService.types';
import type {
  CreateConvertQuoteRequest,
  CommitConvertTradeRequest,
  GetConvertTradeRequest,
} from './ConvertsService.schema';
import {
  toSdkCreateConvertQuoteRequest,
  toCreateConvertQuoteResponse,
  toCommitConvertTradeResponse,
  toGetConvertTradeResponse,
} from './ConvertsService.convert';

/**
 * Wrapper service for Coinbase Converts API.
 * Converts number types to strings for SDK calls and SDK responses to numbers.
 */
export class ConvertsService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async createConvertQuote(
    request: CreateConvertQuoteRequest,
  ): Promise<CreateConvertQuoteResponse> {
    const response = await this.client.request({
      url: 'convert/quote',
      method: Method.POST,
      bodyParams: toSdkCreateConvertQuoteRequest(request),
    });
    const sdkResponse = response.data as SdkCreateConvertQuoteResponse;
    return toCreateConvertQuoteResponse(sdkResponse);
  }

  public async commitConvertTrade(
    request: CommitConvertTradeRequest,
  ): Promise<CommitConvertTradeResponse> {
    const response = await this.client.request({
      url: `convert/trade/${request.tradeId}`,
      method: Method.POST,
      bodyParams: request,
    });
    const sdkResponse = response.data as SdkCommitConvertTradeResponse;
    return toCommitConvertTradeResponse(sdkResponse);
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
    const sdkResponse = response.data as SdkGetConvertTradeResponse;
    return toGetConvertTradeResponse(sdkResponse);
  }
}
