import {
  ConvertsService as SdkConvertsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkCreateConvertQuoteResponse,
  SdkCommitConvertTradeResponse,
  SdkGetConvertTradeResponse,
  CreateConvertQuoteRequest,
  CreateConvertQuoteResponse,
  CommitConvertTradeRequest,
  CommitConvertTradeResponse,
  GetConvertTradeRequest,
  GetConvertTradeResponse,
} from './ConvertsService.types';
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
  private readonly sdk: SdkConvertsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkConvertsService(client);
  }

  public async createConvertQuote(
    request: CreateConvertQuoteRequest,
  ): Promise<CreateConvertQuoteResponse> {
    const sdkResponse = (await this.sdk.createConvertQuote(
      toSdkCreateConvertQuoteRequest(request),
    )) as SdkCreateConvertQuoteResponse;
    return toCreateConvertQuoteResponse(sdkResponse);
  }

  public async commitConvertTrade(
    request: CommitConvertTradeRequest,
  ): Promise<CommitConvertTradeResponse> {
    const sdkResponse = (await this.sdk.commitConvertTrade(
      request,
    )) as SdkCommitConvertTradeResponse;
    return toCommitConvertTradeResponse(sdkResponse);
  }

  public async getConvertTrade(
    request: GetConvertTradeRequest,
  ): Promise<GetConvertTradeResponse> {
    const sdkResponse = (await this.sdk.GetConvertTrade(
      request,
    )) as SdkGetConvertTradeResponse;
    return toGetConvertTradeResponse(sdkResponse);
  }
}
