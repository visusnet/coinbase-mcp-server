import {
  PerpetualsService as SdkPerpetualsService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListPerpetualsPositionsRequest,
  ListPerpetualsPositionsResponse,
  GetPerpetualsPositionRequest,
  GetPerpetualsPositionResponse,
  GetPortfolioSummaryRequest,
  GetPortfolioSummaryResponse,
  GetPortfolioBalanceRequest,
  GetPortfolioBalanceResponse,
} from './PerpetualsService.types';

/**
 * Wrapper service for Coinbase Perpetuals API.
 * Delegates to the SDK service with no conversion needed.
 */
export class PerpetualsService {
  private readonly sdk: SdkPerpetualsService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkPerpetualsService(client);
  }

  public listPositions(
    request: ListPerpetualsPositionsRequest,
  ): Promise<ListPerpetualsPositionsResponse> {
    return this.sdk.listPositions(
      request,
    ) as Promise<ListPerpetualsPositionsResponse>;
  }

  public getPosition(
    request: GetPerpetualsPositionRequest,
  ): Promise<GetPerpetualsPositionResponse> {
    return this.sdk.getPosition(
      request,
    ) as Promise<GetPerpetualsPositionResponse>;
  }

  public getPortfolioSummary(
    request: GetPortfolioSummaryRequest,
  ): Promise<GetPortfolioSummaryResponse> {
    return this.sdk.getPortfolioSummary(
      request,
    ) as Promise<GetPortfolioSummaryResponse>;
  }

  public getPortfolioBalance(
    request: GetPortfolioBalanceRequest,
  ): Promise<GetPortfolioBalanceResponse> {
    return this.sdk.getPortfolioBalance(
      request,
    ) as Promise<GetPortfolioBalanceResponse>;
  }
}
