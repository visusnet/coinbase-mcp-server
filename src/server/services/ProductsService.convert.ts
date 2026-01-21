import type {
  SdkGetProductCandlesRequest,
  SdkListProductsResponse,
  SdkGetBestBidAskResponse,
  SdkGetProductBookResponse,
  ListProductsResponse,
  GetProductCandlesRequest,
  GetBestBidAskResponse,
  GetProductBookResponse,
  SdkGetProductResponse,
  GetProductResponse,
} from './ProductsService.types';
import type { SdkProduct } from './common.types';
import { toNumber, toUnixTimestamp } from './numberConversion';
import { toPriceBook, toProduct } from './common.convert';

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

export function toGetProductResponse(
  sdkResponse: SdkGetProductResponse,
): GetProductResponse {
  // SDK types incorrectly declare GetProductResponse as { body?: Product }
  // but the SDK actually returns Product directly (SDK bug)
  return { product: toProduct(sdkResponse as SdkProduct) };
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

/**
 * Convert SDK GetBestBidAskResponse to our type with numbers.
 */
export function toGetBestBidAskResponse(
  sdkResponse: SdkGetBestBidAskResponse,
): GetBestBidAskResponse {
  return {
    pricebooks: sdkResponse.pricebooks.map(toPriceBook),
  };
}

/**
 * Convert SDK GetProductBookResponse to our type with numbers.
 */
export function toGetProductBookResponse(
  sdkResponse: SdkGetProductBookResponse,
): GetProductBookResponse {
  const { pricebook, last, midMarket, spreadBps, spreadAbsolute } = sdkResponse;
  return {
    pricebook: toPriceBook(pricebook),
    last: toNumber(last),
    midMarket: toNumber(midMarket),
    spreadBps: toNumber(spreadBps),
    spreadAbsolute: toNumber(spreadAbsolute),
  };
}
