import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListPerpetualsPositionsResponse,
  GetPerpetualsPositionResponse,
  GetPortfolioSummaryResponse,
  GetPortfolioBalanceResponse,
} from './PerpetualsService.types';
import {
  ListPerpetualsPositionsResponseSchema,
  GetPerpetualsPositionResponseSchema,
  GetPortfolioSummaryResponseSchema,
  GetPortfolioBalanceResponseSchema,
} from './PerpetualsService.schema';
import type {
  ListPerpetualsPositionsRequest,
  GetPerpetualsPositionRequest,
  GetPortfolioSummaryRequest,
  GetPortfolioBalanceRequest,
} from './PerpetualsService.schema';

/**
 * Wrapper service for Coinbase Perpetuals API.
 * Converts SDK responses with string numbers to our types with numeric values.
 */
export class PerpetualsService {
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listPositions(
    request: ListPerpetualsPositionsRequest,
  ): Promise<ListPerpetualsPositionsResponse> {
    const response = await this.client.request({
      url: `intx/positions/${request.portfolioUuid}`,
      queryParams: {},
    });
    return ListPerpetualsPositionsResponseSchema.parse(response.data);
  }

  public async getPosition(
    request: GetPerpetualsPositionRequest,
  ): Promise<GetPerpetualsPositionResponse> {
    const response = await this.client.request({
      url: `intx/positions/${request.portfolioUuid}/${request.symbol}`,
      queryParams: {},
    });
    return GetPerpetualsPositionResponseSchema.parse(response.data);
  }

  public async getPortfolioSummary(
    request: GetPortfolioSummaryRequest,
  ): Promise<GetPortfolioSummaryResponse> {
    const response = await this.client.request({
      url: `intx/portfolio/${request.portfolioUuid}`,
      queryParams: {},
    });
    return GetPortfolioSummaryResponseSchema.parse(response.data);
  }

  public async getPortfolioBalance(
    request: GetPortfolioBalanceRequest,
  ): Promise<GetPortfolioBalanceResponse> {
    const response = await this.client.request({
      url: `intx/balances/${request.portfolioUuid}`,
      queryParams: {},
    });
    return GetPortfolioBalanceResponseSchema.parse(response.data);
  }
}
