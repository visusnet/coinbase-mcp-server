import type {
  SdkFCMPosition,
  SdkFCMBalanceSummary,
  SdkFCMSweep,
  FCMPosition,
  FCMBalanceSummary,
  FCMSweep,
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
