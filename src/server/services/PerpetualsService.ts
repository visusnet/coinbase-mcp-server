import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkListPerpetualsPositionsResponse,
  SdkGetPerpetualsPositionResponse,
  SdkGetPortfolioSummaryResponse,
  SdkGetPortfolioBalanceResponse,
  ListPerpetualsPositionsResponse,
  GetPerpetualsPositionResponse,
  GetPortfolioSummaryResponse,
  GetPortfolioBalanceResponse,
} from './PerpetualsService.types';
import type {
  ListPerpetualsPositionsRequest,
  GetPerpetualsPositionRequest,
  GetPortfolioSummaryRequest,
  GetPortfolioBalanceRequest,
} from './PerpetualsService.schema';
import {
  toListPerpetualsPositionsResponse,
  toGetPerpetualsPositionResponse,
  toGetPortfolioSummaryResponse,
  toGetPortfolioBalanceResponse,
} from './PerpetualsService.convert';

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
    const sdkResponse = response.data as SdkListPerpetualsPositionsResponse;
    return toListPerpetualsPositionsResponse(sdkResponse);
  }

  public async getPosition(
    request: GetPerpetualsPositionRequest,
  ): Promise<GetPerpetualsPositionResponse> {
    const response = await this.client.request({
      url: `intx/positions/${request.portfolioUuid}/${request.symbol}`,
      queryParams: {},
    });
    const sdkResponse = response.data as SdkGetPerpetualsPositionResponse;
    return toGetPerpetualsPositionResponse(sdkResponse);
  }

  public async getPortfolioSummary(
    request: GetPortfolioSummaryRequest,
  ): Promise<GetPortfolioSummaryResponse> {
    const response = await this.client.request({
      url: `intx/portfolio/${request.portfolioUuid}`,
      queryParams: {},
    });
    const sdkResponse = response.data as SdkGetPortfolioSummaryResponse;
    return toGetPortfolioSummaryResponse(sdkResponse);
  }

  public async getPortfolioBalance(
    request: GetPortfolioBalanceRequest,
  ): Promise<GetPortfolioBalanceResponse> {
    const response = await this.client.request({
      url: `intx/balances/${request.portfolioUuid}`,
      queryParams: {},
    });
    const sdkResponse = response.data as SdkGetPortfolioBalanceResponse;
    return toGetPortfolioBalanceResponse(sdkResponse);
  }
}
