import {
  FeesService as SdkFeesService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  GetTransactionsSummaryRequest,
  GetTransactionsSummaryResponse,
} from './FeesService.types';

/**
 * Wrapper service for Coinbase Fees API.
 * Delegates to the SDK service with no conversion needed.
 */
export class FeesService {
  private readonly sdk: SdkFeesService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkFeesService(client);
  }

  public getTransactionSummary(
    request: GetTransactionsSummaryRequest,
  ): Promise<GetTransactionsSummaryResponse> {
    return this.sdk.getTransactionSummary(
      request,
    ) as Promise<GetTransactionsSummaryResponse>;
  }
}
