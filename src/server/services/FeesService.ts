import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  GetTransactionsSummaryRequest,
  GetTransactionsSummaryResponse,
} from './FeesService.schema';
import { GetTransactionsSummaryResponseSchema } from './FeesService.schema';

/**
 * Wrapper service for Coinbase Fees API.
 * Converts SDK response types to our types with number fields.
 */
export class FeesService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async getTransactionSummary(
    request: GetTransactionsSummaryRequest,
  ): Promise<GetTransactionsSummaryResponse> {
    const response = await this.client.request({
      url: 'transaction_summary',
      queryParams: request,
    });
    return GetTransactionsSummaryResponseSchema.parse(response.data);
  }
}
