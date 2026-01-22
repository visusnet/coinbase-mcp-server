import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListPaymentMethodsResponse,
  GetPaymentMethodResponse,
} from './PaymentMethodsService.types';
import type { GetPaymentMethodRequest } from './PaymentMethodsService.schema';

/**
 * Wrapper service for Coinbase Payment Methods API.
 * Delegates to the SDK service with no conversion needed.
 */
export class PaymentMethodsService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listPaymentMethods(): Promise<ListPaymentMethodsResponse> {
    const response = await this.client.request({
      url: 'payment_methods',
      queryParams: {},
    });
    return response.data as ListPaymentMethodsResponse;
  }

  public async getPaymentMethod(
    request: GetPaymentMethodRequest,
  ): Promise<GetPaymentMethodResponse> {
    const response = await this.client.request({
      url: `payment_methods/${request.paymentMethodId}`,
      queryParams: {},
    });
    return response.data as GetPaymentMethodResponse;
  }
}
