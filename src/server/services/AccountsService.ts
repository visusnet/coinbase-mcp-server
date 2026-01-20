import {
  AccountsService as SdkAccountsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
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
  private readonly sdk: SdkAccountsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkAccountsService(client);
  }

  public async listAccounts(
    request?: ListAccountsRequest,
  ): Promise<ListAccountsResponse> {
    const sdkResponse = (await this.sdk.listAccounts(
      request ?? {},
    )) as SdkListAccountsResponse;
    return toListAccountsResponse(sdkResponse);
  }

  public async getAccount(
    request: GetAccountRequest,
  ): Promise<GetAccountResponse> {
    const sdkResponse = (await this.sdk.getAccount(
      request,
    )) as SdkGetAccountResponse;
    return toGetAccountResponse(sdkResponse);
  }
}
