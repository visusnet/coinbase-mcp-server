import type { CoinbaseClient } from '@client/CoinbaseClient';
import type { GetPaymentMethodRequest } from './PaymentMethodsService.request';
import {
  ListPaymentMethodsResponseSchema,
  GetPaymentMethodResponseSchema,
  type ListPaymentMethodsResponse,
  type GetPaymentMethodResponse,
} from './PaymentMethodsService.response';

/**
 * Wrapper service for Coinbase Payment Methods API.
 * Delegates to the SDK service with no conversion needed.
 */
export class PaymentMethodsService {
  constructor(private readonly client: CoinbaseClient) {}

  public async listPaymentMethods(): Promise<ListPaymentMethodsResponse> {
    const response = await this.client.request({
      url: 'payment_methods',
      queryParams: {},
    });
    return ListPaymentMethodsResponseSchema.parse(response.data);
  }

  public async getPaymentMethod(
    request: GetPaymentMethodRequest,
  ): Promise<GetPaymentMethodResponse> {
    const response = await this.client.request({
      url: `payment_methods/${request.paymentMethodId}`,
      queryParams: {},
    });
    return GetPaymentMethodResponseSchema.parse(response.data);
  }
}
