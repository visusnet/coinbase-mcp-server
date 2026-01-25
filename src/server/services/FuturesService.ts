import type { CoinbaseAdvTradeClient } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type {
  GetFuturesPositionRequest,
  ListFuturesPositionsResponse,
  GetFuturesPositionResponse,
  GetFuturesBalanceSummaryResponse,
  ListFuturesSweepsResponse,
} from './FuturesService.schema';
import {
  ListFuturesPositionsResponseSchema,
  GetFuturesPositionResponseSchema,
  GetFuturesBalanceSummaryResponseSchema,
  ListFuturesSweepsResponseSchema,
} from './FuturesService.schema';

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
    return ListFuturesPositionsResponseSchema.parse(response.data);
  }

  public async getPosition(
    request: GetFuturesPositionRequest,
  ): Promise<GetFuturesPositionResponse> {
    const response = await this.client.request({
      url: `cfm/positions/${request.productId}`,
      queryParams: {},
    });
    return GetFuturesPositionResponseSchema.parse(response.data);
  }

  public async getBalanceSummary(): Promise<GetFuturesBalanceSummaryResponse> {
    const response = await this.client.request({
      url: 'cfm/balance_summary',
      queryParams: {},
    });
    return GetFuturesBalanceSummaryResponseSchema.parse(response.data);
  }

  public async listSweeps(): Promise<ListFuturesSweepsResponse> {
    const response = await this.client.request({
      url: 'cfm/sweeps',
      queryParams: {},
    });
    return ListFuturesSweepsResponseSchema.parse(response.data);
  }
}
