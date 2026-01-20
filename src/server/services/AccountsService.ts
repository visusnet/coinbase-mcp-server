import {
  AccountsService as SdkAccountsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListAccountsRequest,
  ListAccountsResponse,
  GetAccountRequest,
  GetAccountResponse,
} from './AccountsService.types';

/**
 * Wrapper service for Coinbase Accounts API.
 * Delegates to the SDK service with no conversion needed.
 */
export class AccountsService {
  private readonly sdk: SdkAccountsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkAccountsService(client);
  }

  public listAccounts(
    request?: ListAccountsRequest,
  ): Promise<ListAccountsResponse> {
    return this.sdk.listAccounts(
      request ?? {},
    ) as Promise<ListAccountsResponse>;
  }

  public getAccount(request: GetAccountRequest): Promise<GetAccountResponse> {
    return this.sdk.getAccount(request) as Promise<GetAccountResponse>;
  }
}
