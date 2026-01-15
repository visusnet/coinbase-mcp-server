import { PublicService as BasePublicService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js';
import {
  GetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/types';
import { toUnixTimestamp } from './ProductCandles';

export class PublicService extends BasePublicService {
  /**
   * The SDK's getProductCandles method expects ISO 8601 timestamps, but the underlying
   * API requires Unix timestamps. This method converts ISO 8601 to Unix timestamps
   * before calling the original method.
   */
  public async getProductCandlesFixed(
    request: GetPublicProductCandlesRequest,
  ): Promise<GetPublicProductCandlesResponse> {
    return this.getProductCandles({
      productId: request.productId,
      start: toUnixTimestamp(request.start),
      end: toUnixTimestamp(request.end),
      granularity: request.granularity,
    }) as Promise<GetPublicProductCandlesResponse>;
  }
}
