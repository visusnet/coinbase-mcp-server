import {
  PortfoliosService as SdkPortfoliosService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { MovePortfolioFundsRequest as SdkMovePortfolioFundsRequest } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/portfolios/types';
import type {
  ListPortfoliosRequest,
  ListPortfoliosResponse,
  CreatePortfolioRequest,
  CreatePortfolioResponse,
  GetPortfolioRequest,
  GetPortfolioResponse,
  EditPortfolioRequest,
  EditPortfolioResponse,
  DeletePortfolioRequest,
  DeletePortfolioResponse,
  MovePortfolioFundsRequest,
  MovePortfolioFundsResponse,
} from './PortfoliosService.types';

/**
 * Wrapper service for Coinbase Portfolios API.
 * Converts number types to strings for SDK calls.
 */
export class PortfoliosService {
  private readonly sdk: SdkPortfoliosService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPortfoliosService(client);
  }

  public listPortfolios(
    request?: ListPortfoliosRequest,
  ): Promise<ListPortfoliosResponse> {
    return this.sdk.listPortfolios(
      request ?? {},
    ) as Promise<ListPortfoliosResponse>;
  }

  public createPortfolio(
    request: CreatePortfolioRequest,
  ): Promise<CreatePortfolioResponse> {
    return this.sdk.createPortfolio(
      request,
    ) as Promise<CreatePortfolioResponse>;
  }

  public getPortfolio(
    request: GetPortfolioRequest,
  ): Promise<GetPortfolioResponse> {
    return this.sdk.getPortfolio(request) as Promise<GetPortfolioResponse>;
  }

  public editPortfolio(
    request: EditPortfolioRequest,
  ): Promise<EditPortfolioResponse> {
    return this.sdk.editPortfolio(request) as Promise<EditPortfolioResponse>;
  }

  public deletePortfolio(
    request: DeletePortfolioRequest,
  ): Promise<DeletePortfolioResponse> {
    return this.sdk.deletePortfolio(
      request,
    ) as Promise<DeletePortfolioResponse>;
  }

  public movePortfolioFunds(
    request: MovePortfolioFundsRequest,
  ): Promise<MovePortfolioFundsResponse> {
    const sdkRequest: SdkMovePortfolioFundsRequest = {
      funds: {
        value: request.funds.value.toString(),
        currency: request.funds.currency,
      },
      sourcePortfolioUuid: request.sourcePortfolioUuid,
      targetPortfolioUuid: request.targetPortfolioUuid,
    };
    return this.sdk.movePortfolioFunds(
      sdkRequest,
    ) as Promise<MovePortfolioFundsResponse>;
  }
}
