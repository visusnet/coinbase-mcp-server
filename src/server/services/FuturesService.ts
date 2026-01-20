import {
  FuturesService as SdkFuturesService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  ListFuturesPositionsResponse,
  GetFuturesPositionRequest,
  GetFuturesPositionResponse,
  GetFuturesBalanceSummaryResponse,
  ListFuturesSweepsResponse,
} from './FuturesService.types';

/**
 * Wrapper service for Coinbase Futures API.
 * Delegates to the SDK service with no conversion needed.
 */
export class FuturesService {
  private readonly sdk: SdkFuturesService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkFuturesService(client);
  }

  public listPositions(): Promise<ListFuturesPositionsResponse> {
    return this.sdk.listPositions({}) as Promise<ListFuturesPositionsResponse>;
  }

  public getPosition(
    request: GetFuturesPositionRequest,
  ): Promise<GetFuturesPositionResponse> {
    return this.sdk.getPosition(request) as Promise<GetFuturesPositionResponse>;
  }

  public getBalanceSummary(): Promise<GetFuturesBalanceSummaryResponse> {
    return this.sdk.getBalanceSummary(
      {},
    ) as Promise<GetFuturesBalanceSummaryResponse>;
  }

  public listSweeps(): Promise<ListFuturesSweepsResponse> {
    return this.sdk.listSweeps({}) as Promise<ListFuturesSweepsResponse>;
  }
}
