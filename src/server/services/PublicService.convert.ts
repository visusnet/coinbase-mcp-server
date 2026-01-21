import type {
  SdkGetProductBookResponse,
  SdkGetMarketTradesResponse,
  SdkGetPublicProductCandlesRequest,
  SdkGetPublicProductCandlesResponse,
  SdkListPublicProductsResponse,
  GetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse,
  GetPublicProductBookResponse,
  GetPublicMarketTradesResponse,
  ListPublicProductsResponse,
} from './PublicService.types';
import { toNumber, toUnixTimestamp } from './numberConversion';
import {
  toCandle,
  toPriceBook,
  toHistoricalMarketTrade,
  toProduct,
} from './common.convert';

/**
 * Convert our GetPublicProductCandlesRequest to SDK request.
 * Converts ISO 8601 timestamps to Unix timestamps.
 */
export function toSdkGetPublicProductCandlesRequest(
  request: GetPublicProductCandlesRequest,
): SdkGetPublicProductCandlesRequest {
  return {
    productId: request.productId,
    start: toUnixTimestamp(request.start),
    end: toUnixTimestamp(request.end),
    granularity: request.granularity,
    limit: request.limit,
  };
}

/**
 * Convert SDK GetPublicProductCandlesResponse to our type.
 */
export function toGetPublicProductCandlesResponse(
  sdkResponse: SdkGetPublicProductCandlesResponse,
): GetPublicProductCandlesResponse {
  return {
    candles: sdkResponse.candles?.map(toCandle),
  };
}

/**
 * Convert SDK GetPublicProductBookResponse to our type.
 */
export function toGetPublicProductBookResponse(
  sdkResponse: SdkGetProductBookResponse,
): GetPublicProductBookResponse {
  const { pricebook, last, midMarket, spreadBps, spreadAbsolute } = sdkResponse;
  return {
    pricebook: toPriceBook(pricebook),
    last: toNumber(last),
    midMarket: toNumber(midMarket),
    spreadBps: toNumber(spreadBps),
    spreadAbsolute: toNumber(spreadAbsolute),
  };
}

/**
 * Convert SDK GetPublicMarketTradesResponse to our type.
 */
export function toGetPublicMarketTradesResponse(
  sdkResponse: SdkGetMarketTradesResponse,
): GetPublicMarketTradesResponse {
  const { trades, bestBid, bestAsk } = sdkResponse;
  return {
    trades: trades?.map(toHistoricalMarketTrade),
    bestBid: toNumber(bestBid),
    bestAsk: toNumber(bestAsk),
  };
}

/**
 * Convert SDK ListPublicProductsResponse to our type.
 */
export function toListPublicProductsResponse(
  sdkResponse: SdkListPublicProductsResponse,
): ListPublicProductsResponse {
  const { products, ...unchanged } = sdkResponse;
  return { ...unchanged, products: products?.map(toProduct) };
}

// Re-export common conversion functions for backwards compatibility
export { toCandle } from './common.convert';
