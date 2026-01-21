import type {
  SdkGetOrderResponse,
  SdkListOrdersResponse,
  SdkCreateOrderRequest,
  SdkEditOrderRequest,
  SdkPreviewEditOrderRequest,
  SdkClosePositionRequest,
  SdkPreviewOrderRequest,
  Order,
  ListOrdersResponse,
  CreateOrderRequest,
  EditOrderRequest,
  PreviewEditOrderRequest,
  ClosePositionRequest,
  PreviewOrderRequest,
  OrderConfiguration,
} from './OrdersService.types';
import { toString, toNumber, toNumberRequired } from './numberConversion';

/**
 * Convert SDK Order to our Order type with numbers.
 * SDK types are wrong - actual response is { order: {...} }.
 */
export function toOrder(sdkResponse: SdkGetOrderResponse): Order {
  const sdkOrder = (sdkResponse as unknown as { order: SdkGetOrderResponse })
    .order;

  const {
    completionPercentage,
    filledSize,
    averageFilledPrice,
    fee,
    numberOfFills,
    filledValue,
    totalFees,
    totalValueAfterFees,
    outstandingHoldAmount,
    leverage,
    ...unchanged
  } = sdkOrder;

  return {
    ...unchanged,
    completionPercentage: toNumberRequired(completionPercentage),
    filledSize: toNumber(filledSize),
    averageFilledPrice: toNumberRequired(averageFilledPrice),
    fee: toNumber(fee),
    numberOfFills: toNumberRequired(numberOfFills),
    filledValue: toNumber(filledValue),
    totalFees: toNumberRequired(totalFees),
    totalValueAfterFees: toNumberRequired(totalValueAfterFees),
    outstandingHoldAmount: toNumber(outstandingHoldAmount),
    leverage: toNumber(leverage),
  };
}

/**
 * Convert SDK ListOrdersResponse to our type.
 */
export function toListOrdersResponse(
  sdkResponse: SdkListOrdersResponse,
): ListOrdersResponse {
  const { orders, ...unchanged } = sdkResponse;
  return { ...unchanged, orders: orders.map(toOrder) };
}

// =============================================================================
// Request Conversions (our types -> SDK types)
// =============================================================================

/**
 * Convert OrderConfiguration to SDK format with string numbers.
 */
function toSdkOrderConfiguration(
  config: OrderConfiguration,
): SdkCreateOrderRequest['orderConfiguration'] {
  const result: SdkCreateOrderRequest['orderConfiguration'] = {};

  if (config.marketMarketIoc) {
    result.marketMarketIoc = {
      quoteSize: toString(config.marketMarketIoc.quoteSize),
      baseSize: toString(config.marketMarketIoc.baseSize),
    };
  }

  if (config.limitLimitGtc) {
    result.limitLimitGtc = {
      baseSize: config.limitLimitGtc.baseSize.toString(),
      limitPrice: config.limitLimitGtc.limitPrice.toString(),
      postOnly: config.limitLimitGtc.postOnly,
    };
  }

  if (config.limitLimitGtd) {
    result.limitLimitGtd = {
      baseSize: config.limitLimitGtd.baseSize.toString(),
      limitPrice: config.limitLimitGtd.limitPrice.toString(),
      endTime: config.limitLimitGtd.endTime,
      postOnly: config.limitLimitGtd.postOnly,
    };
  }

  if (config.limitLimitFok) {
    result.limitLimitFok = {
      baseSize: config.limitLimitFok.baseSize.toString(),
      limitPrice: config.limitLimitFok.limitPrice.toString(),
    };
  }

  if (config.sorLimitIoc) {
    result.sorLimitIoc = {
      baseSize: config.sorLimitIoc.baseSize.toString(),
      limitPrice: config.sorLimitIoc.limitPrice.toString(),
    };
  }

  if (config.stopLimitStopLimitGtc) {
    result.stopLimitStopLimitGtc = {
      baseSize: config.stopLimitStopLimitGtc.baseSize.toString(),
      limitPrice: config.stopLimitStopLimitGtc.limitPrice.toString(),
      stopPrice: config.stopLimitStopLimitGtc.stopPrice.toString(),
      stopDirection: config.stopLimitStopLimitGtc.stopDirection,
    };
  }

  if (config.stopLimitStopLimitGtd) {
    result.stopLimitStopLimitGtd = {
      baseSize: config.stopLimitStopLimitGtd.baseSize.toString(),
      limitPrice: config.stopLimitStopLimitGtd.limitPrice.toString(),
      stopPrice: config.stopLimitStopLimitGtd.stopPrice.toString(),
      endTime: config.stopLimitStopLimitGtd.endTime,
      stopDirection: config.stopLimitStopLimitGtd.stopDirection,
    };
  }

  if (config.triggerBracketGtc) {
    result.triggerBracketGtc = {
      baseSize: config.triggerBracketGtc.baseSize.toString(),
      limitPrice: config.triggerBracketGtc.limitPrice.toString(),
      stopTriggerPrice: config.triggerBracketGtc.stopTriggerPrice.toString(),
    };
  }

  if (config.triggerBracketGtd) {
    result.triggerBracketGtd = {
      baseSize: config.triggerBracketGtd.baseSize.toString(),
      limitPrice: config.triggerBracketGtd.limitPrice.toString(),
      stopTriggerPrice: config.triggerBracketGtd.stopTriggerPrice.toString(),
      endTime: config.triggerBracketGtd.endTime,
    };
  }

  return result;
}

/**
 * Convert our CreateOrderRequest to SDK request type.
 */
export function toSdkCreateOrderRequest(
  request: CreateOrderRequest,
): SdkCreateOrderRequest {
  return {
    clientOrderId: request.clientOrderId,
    productId: request.productId,
    side: request.side,
    orderConfiguration: toSdkOrderConfiguration(request.orderConfiguration),
  };
}

/**
 * Convert our EditOrderRequest to SDK request type.
 */
export function toSdkEditOrderRequest(
  request: EditOrderRequest,
): SdkEditOrderRequest {
  return {
    orderId: request.orderId,
    price: request.price.toString(),
    size: request.size.toString(),
  };
}

/**
 * Convert our PreviewEditOrderRequest to SDK request type.
 */
export function toSdkPreviewEditOrderRequest(
  request: PreviewEditOrderRequest,
): SdkPreviewEditOrderRequest {
  return {
    orderId: request.orderId,
    price: request.price.toString(),
    size: request.size.toString(),
  };
}

/**
 * Convert our ClosePositionRequest to SDK request type.
 */
export function toSdkClosePositionRequest(
  request: ClosePositionRequest,
): SdkClosePositionRequest {
  return {
    clientOrderId: request.clientOrderId,
    productId: request.productId,
    size: toString(request.size),
  };
}

/**
 * Convert our PreviewOrderRequest to SDK request type.
 */
export function toSdkPreviewOrderRequest(
  request: PreviewOrderRequest,
): SdkPreviewOrderRequest {
  return {
    productId: request.productId,
    side: request.side,
    orderConfiguration: toSdkOrderConfiguration(request.orderConfiguration),
  };
}
