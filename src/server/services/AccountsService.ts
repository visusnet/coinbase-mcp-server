import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkListAccountsResponse,
  SdkGetAccountResponse,
  ListAccountsRequest,
  ListAccountsResponse,
  GetAccountRequest,
  GetAccountResponse,
} from './AccountsService.types';
import {
  toListAccountsResponse,
  toGetAccountResponse,
} from './AccountsService.convert';

/**
 * Wrapper service for Coinbase Accounts API.
 * Converts response types from strings to numbers.
 */
export class AccountsService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listAccounts(
    request?: ListAccountsRequest,
  ): Promise<ListAccountsResponse> {
    const sdkResponse = (
      await this.client.request({
        url: 'accounts',
        queryParams: request ?? {},
      })
    ).data as SdkListAccountsResponse;
    return toListAccountsResponse(sdkResponse);
  }

  public async getAccount(
    request: GetAccountRequest,
  ): Promise<GetAccountResponse> {
    const sdkResponse = (
      await this.client.request({
        url: `accounts/${request.accountUuid}`,
      })
    ).data as SdkGetAccountResponse;
    return toGetAccountResponse(sdkResponse);
  }
}
