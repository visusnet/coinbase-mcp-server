import type {
  SdkCandle,
  SdkL2Level,
  SdkPriceBook,
  SdkHistoricalMarketTrade,
  SdkGetProductBookResponse,
  SdkGetMarketTradesResponse,
  SdkGetPublicProductCandlesRequest,
  SdkGetPublicProductCandlesResponse,
  SdkListPublicProductsResponse,
  Candle,
  L2Level,
  PriceBook,
  HistoricalMarketTrade,
  GetPublicProductCandlesRequest,
  GetPublicProductCandlesResponse,
  GetPublicProductBookResponse,
  GetPublicMarketTradesResponse,
  ListPublicProductsResponse,
} from './PublicService.types';
import { toNumber, toUnixTimestamp } from './numberConversion';
import { toProduct } from './ProductsService.convert';

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
 * Convert SDK Candle to our Candle type with numbers.
 */
function toCandle(sdkCandle: SdkCandle): Candle {
  const { start, low, high, open, close, volume } = sdkCandle;
  return {
    start: toNumber(start),
    low: toNumber(low),
    high: toNumber(high),
    open: toNumber(open),
    close: toNumber(close),
    volume: toNumber(volume),
  };
}

/**
 * Convert SDK L2Level to our L2Level type with numbers.
 */
function toL2Level(sdkLevel: SdkL2Level): L2Level {
  const { price, size } = sdkLevel;
  return {
    price: toNumber(price),
    size: toNumber(size),
  };
}

/**
 * Convert SDK PriceBook to our PriceBook type with numbers.
 */
function toPriceBook(sdkPriceBook: SdkPriceBook): PriceBook {
  const { bids, asks, ...unchanged } = sdkPriceBook;
  return {
    ...unchanged,
    bids: bids.map(toL2Level),
    asks: asks.map(toL2Level),
  };
}

/**
 * Convert SDK HistoricalMarketTrade to our type with numbers.
 */
function toHistoricalMarketTrade(
  sdkTrade: SdkHistoricalMarketTrade,
): HistoricalMarketTrade {
  const { price, size, ...unchanged } = sdkTrade;
  return {
    ...unchanged,
    price: toNumber(price),
    size: toNumber(size),
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
 * Reuses toProduct from ProductsService.
 */
export function toListPublicProductsResponse(
  sdkResponse: SdkListPublicProductsResponse,
): ListPublicProductsResponse {
  const { products, ...unchanged } = sdkResponse;
  return { ...unchanged, products: products?.map(toProduct) };
}
