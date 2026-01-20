import {
  PortfoliosService as SdkPortfoliosService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkListPortfoliosResponse,
  SdkCreatePortfolioResponse,
  SdkGetPortfolioResponse,
  SdkEditPortfolioResponse,
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
import {
  toListPortfoliosResponse,
  toCreatePortfolioResponse,
  toGetPortfolioResponse,
  toEditPortfolioResponse,
  toSdkMovePortfolioFundsRequest,
} from './PortfoliosService.convert';

/**
 * Wrapper service for Coinbase Portfolios API.
 * Converts number types to strings for SDK calls and strings to numbers for responses.
 */
export class PortfoliosService {
  private readonly sdk: SdkPortfoliosService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPortfoliosService(client);
  }

  public async listPortfolios(
    request?: ListPortfoliosRequest,
  ): Promise<ListPortfoliosResponse> {
    const sdkResponse = (await this.sdk.listPortfolios(
      request ?? {},
    )) as SdkListPortfoliosResponse;
    return toListPortfoliosResponse(sdkResponse);
  }

  public async createPortfolio(
    request: CreatePortfolioRequest,
  ): Promise<CreatePortfolioResponse> {
    const sdkResponse = (await this.sdk.createPortfolio(
      request,
    )) as SdkCreatePortfolioResponse;
    return toCreatePortfolioResponse(sdkResponse);
  }

  public async getPortfolio(
    request: GetPortfolioRequest,
  ): Promise<GetPortfolioResponse> {
    const sdkResponse = (await this.sdk.getPortfolio(
      request,
    )) as SdkGetPortfolioResponse;
    return toGetPortfolioResponse(sdkResponse);
  }

  public async editPortfolio(
    request: EditPortfolioRequest,
  ): Promise<EditPortfolioResponse> {
    const sdkResponse = (await this.sdk.editPortfolio(
      request,
    )) as SdkEditPortfolioResponse;
    return toEditPortfolioResponse(sdkResponse);
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
    return this.sdk.movePortfolioFunds(
      toSdkMovePortfolioFundsRequest(request),
    ) as Promise<MovePortfolioFundsResponse>;
  }
}
