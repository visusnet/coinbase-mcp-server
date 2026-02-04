import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import {
  GetAPIKeyPermissionsResponseSchema,
  type GetAPIKeyPermissionsResponse,
} from './DataService.response';

/**
 * Wrapper service for Coinbase Data API.
 * Delegates to the SDK service with no conversion needed.
 */
export class DataService {
  constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async getAPIKeyPermissions(): Promise<GetAPIKeyPermissionsResponse> {
    const response = await this.client.request({
      url: 'key_permissions',
      queryParams: {},
    });
    return GetAPIKeyPermissionsResponseSchema.parse(response.data);
  }
}
