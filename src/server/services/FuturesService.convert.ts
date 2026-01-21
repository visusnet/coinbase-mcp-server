import type {
  SdkListFuturesPositionsResponse,
  SdkGetFuturesPositionResponse,
  SdkGetFuturesBalanceSummaryResponse,
  SdkListFuturesSweepsResponse,
  SdkFCMPosition,
  SdkFCMBalanceSummary,
  SdkFCMSweep,
  FCMPosition,
  FCMBalanceSummary,
  FCMSweep,
  ListFuturesPositionsResponse,
  GetFuturesPositionResponse,
  GetFuturesBalanceSummaryResponse,
  ListFuturesSweepsResponse,
} from './FuturesService.types';
import { toNumber } from './numberConversion';
import { toAmount } from './common.convert';

/**
 * Convert SDK FCMPosition to our type with numbers.
 */
export function toFCMPosition(sdkPosition: SdkFCMPosition): FCMPosition {
  const {
    numberOfContracts,
    currentPrice,
    avgEntryPrice,
    unrealizedPnl,
    dailyRealizedPnl,
    ...unchanged
  } = sdkPosition;
  return {
    ...unchanged,
    numberOfContracts: toNumber(numberOfContracts),
    currentPrice: toNumber(currentPrice),
    avgEntryPrice: toNumber(avgEntryPrice),
    unrealizedPnl: toNumber(unrealizedPnl),
    dailyRealizedPnl: toNumber(dailyRealizedPnl),
  };
}

/**
 * Convert SDK FCMBalanceSummary to our type with numbers.
 */
export function toFCMBalanceSummary(
  sdkSummary: SdkFCMBalanceSummary,
): FCMBalanceSummary {
  const {
    futuresBuyingPower,
    totalUsdBalance,
    cbiUsdBalance,
    cfmUsdBalance,
    totalOpenOrdersHoldAmount,
    unrealizedPnl,
    dailyRealizedPnl,
    initialMargin,
    availableMargin,
    liquidationThreshold,
    liquidationBufferAmount,
    liquidationBufferPercentage,
    ...unchanged
  } = sdkSummary;
  return {
    ...unchanged,
    futuresBuyingPower: toAmount(futuresBuyingPower),
    totalUsdBalance: toAmount(totalUsdBalance),
    cbiUsdBalance: toAmount(cbiUsdBalance),
    cfmUsdBalance: toAmount(cfmUsdBalance),
    totalOpenOrdersHoldAmount: toAmount(totalOpenOrdersHoldAmount),
    unrealizedPnl: toAmount(unrealizedPnl),
    dailyRealizedPnl: toAmount(dailyRealizedPnl),
    initialMargin: toAmount(initialMargin),
    availableMargin: toAmount(availableMargin),
    liquidationThreshold: toAmount(liquidationThreshold),
    liquidationBufferAmount: toAmount(liquidationBufferAmount),
    liquidationBufferPercentage: toNumber(liquidationBufferPercentage),
  };
}

/**
 * Convert SDK FCMSweep to our type with numbers.
 */
export function toFCMSweep(sdkSweep: SdkFCMSweep): FCMSweep {
  const { requestedAmount, ...unchanged } = sdkSweep;
  return {
    ...unchanged,
    requestedAmount: toAmount(requestedAmount),
  };
}

/**
 * Convert SDK ListFuturesPositionsResponse to our type.
 */
export function toListFuturesPositionsResponse(
  sdkResponse: SdkListFuturesPositionsResponse,
): ListFuturesPositionsResponse {
  return {
    positions: sdkResponse.positions?.map(toFCMPosition),
  };
}

/**
 * Convert SDK GetFuturesPositionResponse to our type.
 */
export function toGetFuturesPositionResponse(
  sdkResponse: SdkGetFuturesPositionResponse,
): GetFuturesPositionResponse {
  return {
    position: sdkResponse.position
      ? toFCMPosition(sdkResponse.position)
      : undefined,
  };
}

/**
 * Convert SDK GetFuturesBalanceSummaryResponse to our type.
 */
export function toGetFuturesBalanceSummaryResponse(
  sdkResponse: SdkGetFuturesBalanceSummaryResponse,
): GetFuturesBalanceSummaryResponse {
  return {
    balanceSummary: sdkResponse.balanceSummary
      ? toFCMBalanceSummary(sdkResponse.balanceSummary)
      : undefined,
  };
}

/**
 * Convert SDK ListFuturesSweepsResponse to our type.
 */
export function toListFuturesSweepsResponse(
  sdkResponse: SdkListFuturesSweepsResponse,
): ListFuturesSweepsResponse {
  return {
    sweeps: sdkResponse.sweeps?.map(toFCMSweep),
  };
}
