import {
  PaymentMethodsService as SdkPaymentMethodsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListPaymentMethodsResponse,
  GetPaymentMethodRequest,
  GetPaymentMethodResponse,
} from './PaymentMethodsService.types';

/**
 * Wrapper service for Coinbase Payment Methods API.
 * Delegates to the SDK service with no conversion needed.
 */
export class PaymentMethodsService {
  private readonly sdk: SdkPaymentMethodsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPaymentMethodsService(client);
  }

  public listPaymentMethods(): Promise<ListPaymentMethodsResponse> {
    return this.sdk.listPaymentMethods() as Promise<ListPaymentMethodsResponse>;
  }

  public getPaymentMethod(
    request: GetPaymentMethodRequest,
  ): Promise<GetPaymentMethodResponse> {
    return this.sdk.getPaymentMethod(
      request,
    ) as Promise<GetPaymentMethodResponse>;
  }
}
