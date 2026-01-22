import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { Method } from '@coinbase-sample/core-ts';
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
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listPortfolios(
    request?: ListPortfoliosRequest,
  ): Promise<ListPortfoliosResponse> {
    const response = await this.client.request({
      url: 'portfolios',
      queryParams: request ?? {},
    });
    const sdkResponse = response.data as SdkListPortfoliosResponse;
    return toListPortfoliosResponse(sdkResponse);
  }

  public async createPortfolio(
    request: CreatePortfolioRequest,
  ): Promise<CreatePortfolioResponse> {
    const response = await this.client.request({
      url: 'portfolios',
      method: Method.POST,
      bodyParams: request,
    });
    const sdkResponse = response.data as SdkCreatePortfolioResponse;
    return toCreatePortfolioResponse(sdkResponse);
  }

  public async getPortfolio(
    request: GetPortfolioRequest,
  ): Promise<GetPortfolioResponse> {
    const response = await this.client.request({
      url: `portfolios/${request.portfolioUuid}`,
      queryParams: {},
    });
    const sdkResponse = response.data as SdkGetPortfolioResponse;
    return toGetPortfolioResponse(sdkResponse);
  }

  public async editPortfolio(
    request: EditPortfolioRequest,
  ): Promise<EditPortfolioResponse> {
    const response = await this.client.request({
      url: `portfolios/${request.portfolioUuid}`,
      method: Method.PUT,
      bodyParams: { ...request, portfolioUuid: undefined },
    });
    const sdkResponse = response.data as SdkEditPortfolioResponse;
    return toEditPortfolioResponse(sdkResponse);
  }

  public async deletePortfolio(
    request: DeletePortfolioRequest,
  ): Promise<DeletePortfolioResponse> {
    const response = await this.client.request({
      url: `portfolios/${request.portfolioUuid}`,
      method: Method.DELETE,
    });
    return response.data as DeletePortfolioResponse;
  }

  public async movePortfolioFunds(
    request: MovePortfolioFundsRequest,
  ): Promise<MovePortfolioFundsResponse> {
    const response = await this.client.request({
      url: 'portfolios/move_funds',
      method: Method.POST,
      bodyParams: toSdkMovePortfolioFundsRequest(request),
    });
    return response.data as MovePortfolioFundsResponse;
  }
}
