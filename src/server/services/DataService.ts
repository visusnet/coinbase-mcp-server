import {
  DataService as SdkDataService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { GetAPIKeyPermissionsResponse } from './DataService.types';

/**
 * Wrapper service for Coinbase Data API.
 * Delegates to the SDK service with no conversion needed.
 */
export class DataService {
  private readonly sdk: SdkDataService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkDataService(client);
  }

  public getAPIKeyPermissions(): Promise<GetAPIKeyPermissionsResponse> {
    return this.sdk.getAPIKeyPermissions(
      {},
    ) as Promise<GetAPIKeyPermissionsResponse>;
  }
}
