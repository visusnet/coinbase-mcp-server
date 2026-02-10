import type { CoinbaseClient } from '@client/CoinbaseClient';
import type { GetFuturesPositionRequest } from './FuturesService.request';
import {
  ListFuturesPositionsResponseSchema,
  GetFuturesPositionResponseSchema,
  GetFuturesBalanceSummaryResponseSchema,
  ListFuturesSweepsResponseSchema,
  type ListFuturesPositionsResponse,
  type GetFuturesPositionResponse,
  type GetFuturesBalanceSummaryResponse,
  type ListFuturesSweepsResponse,
} from './FuturesService.response';

/**
 * Wrapper service for Coinbase Futures API.
 * Converts SDK responses with string numbers to our types with numeric values.
 */
export class FuturesService {
  constructor(private readonly client: CoinbaseClient) {}

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
