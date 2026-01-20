import type {
  SdkProduct,
  SdkGetProductCandlesRequest,
  SdkListProductsResponse,
  Product,
  ListProductsResponse,
  GetProductCandlesRequest,
} from './ProductsService.types';
import {
  toNumber,
  toNumberRequired,
  toUnixTimestamp,
} from './numberConversion';

/**
 * Convert our GetProductCandlesRequest to SDK request.
 * Converts ISO 8601 timestamps to Unix timestamps.
 */
export function toSdkGetProductCandlesRequest(
  request: GetProductCandlesRequest,
): SdkGetProductCandlesRequest {
  return {
    productId: request.productId,
    start: toUnixTimestamp(request.start),
    end: toUnixTimestamp(request.end),
    granularity: request.granularity,
    limit: request.limit,
  };
}

/**
 * Convert SDK Product to our Product type with numbers.
 */
export function toProduct(sdkProduct: SdkProduct): Product {
  const {
    price,
    pricePercentageChange24h,
    volume24h,
    volumePercentageChange24h,
    baseIncrement,
    quoteIncrement,
    quoteMinSize,
    quoteMaxSize,
    baseMinSize,
    baseMaxSize,
    midMarketPrice,
    priceIncrement,
    approximateQuote24hVolume,
    ...unchanged
  } = sdkProduct;
  return {
    ...unchanged,
    price: toNumberRequired(price),
    pricePercentageChange24h: toNumberRequired(pricePercentageChange24h),
    volume24h: toNumberRequired(volume24h),
    volumePercentageChange24h: toNumberRequired(volumePercentageChange24h),
    baseIncrement: toNumberRequired(baseIncrement),
    quoteIncrement: toNumberRequired(quoteIncrement),
    quoteMinSize: toNumberRequired(quoteMinSize),
    quoteMaxSize: toNumberRequired(quoteMaxSize),
    baseMinSize: toNumberRequired(baseMinSize),
    baseMaxSize: toNumberRequired(baseMaxSize),
    midMarketPrice: toNumber(midMarketPrice),
    priceIncrement: toNumber(priceIncrement),
    approximateQuote24hVolume: toNumber(approximateQuote24hVolume),
  };
}

/**
 * Convert SDK ListProductsResponse to our type.
 */
export function toListProductsResponse(
  sdkResponse: SdkListProductsResponse,
): ListProductsResponse {
  const { products, ...unchanged } = sdkResponse;
  return { ...unchanged, products: products.map(toProduct) };
}
