import type { CoinbaseClient } from '@client/CoinbaseClient';
import {
  GetAPIKeyPermissionsResponseSchema,
  type GetAPIKeyPermissionsResponse,
} from './DataService.response';

/**
 * Wrapper service for Coinbase Data API.
 * Delegates to the SDK service with no conversion needed.
 */
export class DataService {
  constructor(private readonly client: CoinbaseClient) {}

  public async getAPIKeyPermissions(): Promise<GetAPIKeyPermissionsResponse> {
    const response = await this.client.request({
      url: 'key_permissions',
      queryParams: {},
    });
    return GetAPIKeyPermissionsResponseSchema.parse(response.data);
  }
}
