import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListAccountsRequest,
  GetAccountRequest,
} from './AccountsService.request';
import type {
  ListAccountsResponse,
  GetAccountResponse,
} from './AccountsService.response';
import {
  ListAccountsResponseSchema,
  GetAccountResponseSchema,
} from './AccountsService.response';

/**
 * Wrapper service for Coinbase Accounts API.
 * Converts response types from strings to numbers.
 */
export class AccountsService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listAccounts(
    request?: ListAccountsRequest,
  ): Promise<ListAccountsResponse> {
    const response = await this.client.request({
      url: 'accounts',
      queryParams: request ?? {},
    });
    return ListAccountsResponseSchema.parse(response.data);
  }

  public async getAccount(
    request: GetAccountRequest,
  ): Promise<GetAccountResponse> {
    const response = await this.client.request({
      url: `accounts/${request.accountUuid}`,
    });
    return GetAccountResponseSchema.parse(response.data);
  }
}
