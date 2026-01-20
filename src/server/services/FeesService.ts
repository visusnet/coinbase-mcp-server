import {
  FeesService as SdkFeesService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkGetTransactionSummaryResponse,
  GetTransactionsSummaryRequest,
  GetTransactionsSummaryResponse,
} from './FeesService.types';
import { toGetTransactionsSummaryResponse } from './FeesService.convert';

/**
 * Wrapper service for Coinbase Fees API.
 * Converts SDK response types to our types with number fields.
 */
export class FeesService {
  private readonly sdk: SdkFeesService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkFeesService(client);
  }

  public async getTransactionSummary(
    request: GetTransactionsSummaryRequest,
  ): Promise<GetTransactionsSummaryResponse> {
    const sdkResponse = (await this.sdk.getTransactionSummary(
      request,
    )) as SdkGetTransactionSummaryResponse;
    return toGetTransactionsSummaryResponse(sdkResponse);
  }
}
