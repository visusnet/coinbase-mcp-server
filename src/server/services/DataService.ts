import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { GetAPIKeyPermissionsResponse } from './DataService.types';

/**
 * Wrapper service for Coinbase Data API.
 * Delegates to the SDK service with no conversion needed.
 */
export class DataService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async getAPIKeyPermissions(): Promise<GetAPIKeyPermissionsResponse> {
    const response = await this.client.request({
      url: 'key_permissions',
      queryParams: {},
    });
    return response.data as GetAPIKeyPermissionsResponse;
  }
}
