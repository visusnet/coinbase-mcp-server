import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { Method } from '@coinbase-sample/core-ts';
import type {
  ListPortfoliosRequest,
  CreatePortfolioRequest,
  GetPortfolioRequest,
  EditPortfolioRequest,
  DeletePortfolioRequest,
  MovePortfolioFundsRequest,
} from './PortfoliosService.request';
import type {
  ListPortfoliosResponse,
  CreatePortfolioResponse,
  GetPortfolioResponse,
  EditPortfolioResponse,
  DeletePortfolioResponse,
  MovePortfolioFundsResponse,
} from './PortfoliosService.response';
import {
  ListPortfoliosResponseSchema,
  CreatePortfolioResponseSchema,
  GetPortfolioResponseSchema,
  EditPortfolioResponseSchema,
  DeletePortfolioResponseSchema,
  MovePortfolioFundsResponseSchema,
} from './PortfoliosService.response';

/**
 * Wrapper service for Coinbase Portfolios API.
 * Converts number types to strings for SDK calls and strings to numbers for responses.
 */
export class PortfoliosService {
  constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listPortfolios(
    request?: ListPortfoliosRequest,
  ): Promise<ListPortfoliosResponse> {
    const response = await this.client.request({
      url: 'portfolios',
      queryParams: request ?? {},
    });
    return ListPortfoliosResponseSchema.parse(response.data);
  }

  public async createPortfolio(
    request: CreatePortfolioRequest,
  ): Promise<CreatePortfolioResponse> {
    const response = await this.client.request({
      url: 'portfolios',
      method: Method.POST,
      bodyParams: request,
    });
    return CreatePortfolioResponseSchema.parse(response.data);
  }

  public async getPortfolio(
    request: GetPortfolioRequest,
  ): Promise<GetPortfolioResponse> {
    const response = await this.client.request({
      url: `portfolios/${request.portfolioUuid}`,
      queryParams: {},
    });
    return GetPortfolioResponseSchema.parse(response.data);
  }

  public async editPortfolio(
    request: EditPortfolioRequest,
  ): Promise<EditPortfolioResponse> {
    const response = await this.client.request({
      url: `portfolios/${request.portfolioUuid}`,
      method: Method.PUT,
      bodyParams: { ...request, portfolioUuid: undefined },
    });
    return EditPortfolioResponseSchema.parse(response.data);
  }

  public async deletePortfolio(
    request: DeletePortfolioRequest,
  ): Promise<DeletePortfolioResponse> {
    const response = await this.client.request({
      url: `portfolios/${request.portfolioUuid}`,
      method: Method.DELETE,
    });
    return DeletePortfolioResponseSchema.parse(response.data);
  }

  public async movePortfolioFunds(
    request: MovePortfolioFundsRequest,
  ): Promise<MovePortfolioFundsResponse> {
    const response = await this.client.request({
      url: 'portfolios/move_funds',
      method: Method.POST,
      bodyParams: request,
    });
    return MovePortfolioFundsResponseSchema.parse(response.data);
  }
}
