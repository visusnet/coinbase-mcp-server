import {
  FuturesService as SdkFuturesService,
  CoinbaseAdvTradeClient,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkListFuturesPositionsResponse,
  SdkGetFuturesPositionResponse,
  SdkGetFuturesBalanceSummaryResponse,
  SdkListFuturesSweepsResponse,
  ListFuturesPositionsResponse,
  GetFuturesPositionRequest,
  GetFuturesPositionResponse,
  GetFuturesBalanceSummaryResponse,
  ListFuturesSweepsResponse,
} from './FuturesService.types';
import {
  toListFuturesPositionsResponse,
  toGetFuturesPositionResponse,
  toGetFuturesBalanceSummaryResponse,
  toListFuturesSweepsResponse,
} from './FuturesService.convert';

/**
 * Wrapper service for Coinbase Futures API.
 * Converts SDK responses with string numbers to our types with numeric values.
 */
export class FuturesService {
  private readonly sdk: SdkFuturesService;

  public constructor(client: CoinbaseAdvTradeClient) {
    this.sdk = new SdkFuturesService(client);
  }

  public async listPositions(): Promise<ListFuturesPositionsResponse> {
    const sdkResponse = (await this.sdk.listPositions(
      {},
    )) as SdkListFuturesPositionsResponse;
    return toListFuturesPositionsResponse(sdkResponse);
  }

  public async getPosition(
    request: GetFuturesPositionRequest,
  ): Promise<GetFuturesPositionResponse> {
    const sdkResponse = (await this.sdk.getPosition(
      request,
    )) as SdkGetFuturesPositionResponse;
    return toGetFuturesPositionResponse(sdkResponse);
  }

  public async getBalanceSummary(): Promise<GetFuturesBalanceSummaryResponse> {
    const sdkResponse = (await this.sdk.getBalanceSummary(
      {},
    )) as SdkGetFuturesBalanceSummaryResponse;
    return toGetFuturesBalanceSummaryResponse(sdkResponse);
  }

  public async listSweeps(): Promise<ListFuturesSweepsResponse> {
    const sdkResponse = (await this.sdk.listSweeps(
      {},
    )) as SdkListFuturesSweepsResponse;
    return toListFuturesSweepsResponse(sdkResponse);
  }
}
