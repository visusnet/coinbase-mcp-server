import {
  PerpetualsService as SdkPerpetualsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkListPerpetualsPositionsResponse,
  SdkGetPerpetualsPositionResponse,
  SdkGetPortfolioSummaryResponse,
  SdkGetPortfolioBalanceResponse,
  ListPerpetualsPositionsRequest,
  ListPerpetualsPositionsResponse,
  GetPerpetualsPositionRequest,
  GetPerpetualsPositionResponse,
  GetPortfolioSummaryRequest,
  GetPortfolioSummaryResponse,
  GetPortfolioBalanceRequest,
  GetPortfolioBalanceResponse,
} from './PerpetualsService.types';
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
  private readonly sdk: SdkPerpetualsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPerpetualsService(client);
  }

  public async listPositions(
    request: ListPerpetualsPositionsRequest,
  ): Promise<ListPerpetualsPositionsResponse> {
    const sdkResponse = (await this.sdk.listPositions(
      request,
    )) as SdkListPerpetualsPositionsResponse;
    return toListPerpetualsPositionsResponse(sdkResponse);
  }

  public async getPosition(
    request: GetPerpetualsPositionRequest,
  ): Promise<GetPerpetualsPositionResponse> {
    const sdkResponse = (await this.sdk.getPosition(
      request,
    )) as SdkGetPerpetualsPositionResponse;
    return toGetPerpetualsPositionResponse(sdkResponse);
  }

  public async getPortfolioSummary(
    request: GetPortfolioSummaryRequest,
  ): Promise<GetPortfolioSummaryResponse> {
    const sdkResponse = (await this.sdk.getPortfolioSummary(
      request,
    )) as SdkGetPortfolioSummaryResponse;
    return toGetPortfolioSummaryResponse(sdkResponse);
  }

  public async getPortfolioBalance(
    request: GetPortfolioBalanceRequest,
  ): Promise<GetPortfolioBalanceResponse> {
    const sdkResponse = (await this.sdk.getPortfolioBalance(
      request,
    )) as SdkGetPortfolioBalanceResponse;
    return toGetPortfolioBalanceResponse(sdkResponse);
  }
}
