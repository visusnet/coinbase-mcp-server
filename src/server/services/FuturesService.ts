import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  SdkListFuturesPositionsResponse,
  SdkGetFuturesPositionResponse,
  SdkGetFuturesBalanceSummaryResponse,
  SdkListFuturesSweepsResponse,
  ListFuturesPositionsResponse,
  GetFuturesPositionResponse,
  GetFuturesBalanceSummaryResponse,
  ListFuturesSweepsResponse,
} from './FuturesService.types';
import type { GetFuturesPositionRequest } from './FuturesService.schema';
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
  public constructor(private readonly client: CoinbaseAdvTradeClient) {}

  public async listPositions(): Promise<ListFuturesPositionsResponse> {
    const response = await this.client.request({
      url: 'cfm/positions',
      queryParams: {},
    });
    const sdkResponse = response.data as SdkListFuturesPositionsResponse;
    return toListFuturesPositionsResponse(sdkResponse);
  }

  public async getPosition(
    request: GetFuturesPositionRequest,
  ): Promise<GetFuturesPositionResponse> {
    const response = await this.client.request({
      url: `cfm/positions/${request.productId}`,
      queryParams: {},
    });
    const sdkResponse = response.data as SdkGetFuturesPositionResponse;
    return toGetFuturesPositionResponse(sdkResponse);
  }

  public async getBalanceSummary(): Promise<GetFuturesBalanceSummaryResponse> {
    const response = await this.client.request({
      url: 'cfm/balance_summary',
      queryParams: {},
    });
    const sdkResponse = response.data as SdkGetFuturesBalanceSummaryResponse;
    return toGetFuturesBalanceSummaryResponse(sdkResponse);
  }

  public async listSweeps(): Promise<ListFuturesSweepsResponse> {
    const response = await this.client.request({
      url: 'cfm/sweeps',
      queryParams: {},
    });
    const sdkResponse = response.data as SdkListFuturesSweepsResponse;
    return toListFuturesSweepsResponse(sdkResponse);
  }
}
