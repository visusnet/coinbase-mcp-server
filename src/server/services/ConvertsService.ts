import {
  ConvertsService as SdkConvertsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { CreateConvertQuoteRequest as SdkCreateConvertQuoteRequest } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/convert/types';
import type {
  CreateConvertQuoteRequest,
  CreateConvertQuoteResponse,
  CommitConvertTradeRequest,
  CommitConvertTradeResponse,
  GetConvertTradeRequest,
  GetConvertTradeResponse,
} from './ConvertsService.types';

/**
 * Wrapper service for Coinbase Converts API.
 * Converts number types to strings for SDK calls.
 */
export class ConvertsService {
  private readonly sdk: SdkConvertsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkConvertsService(client);
  }

  public createConvertQuote(
    request: CreateConvertQuoteRequest,
  ): Promise<CreateConvertQuoteResponse> {
    const sdkRequest: SdkCreateConvertQuoteRequest = {
      fromAccount: request.fromAccount,
      toAccount: request.toAccount,
      amount: request.amount.toString(),
    };
    return this.sdk.createConvertQuote(
      sdkRequest,
    ) as Promise<CreateConvertQuoteResponse>;
  }

  public commitConvertTrade(
    request: CommitConvertTradeRequest,
  ): Promise<CommitConvertTradeResponse> {
    return this.sdk.commitConvertTrade(
      request,
    ) as Promise<CommitConvertTradeResponse>;
  }

  // Note: SDK uses capital G in GetConvertTrade - we preserve this naming
  public GetConvertTrade(
    request: GetConvertTradeRequest,
  ): Promise<GetConvertTradeResponse> {
    return this.sdk.GetConvertTrade(
      request,
    ) as Promise<GetConvertTradeResponse>;
  }
}
