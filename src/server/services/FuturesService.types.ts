// Wrapper types with numbers for API convenience
import type { FCMPositionSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FCMPositionSide';
import type { FCMSweepStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FCMSweepStatus';
import type { FcmMarginWindowMeasure } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FcmMarginWindowMeasure';
import type { Amount } from './common.types';

// =============================================================================
// SDK Types (for conversion) - used by convert functions for tests
// =============================================================================

export type { FCMPosition as SdkFCMPosition } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMPosition';
export type { FCMBalanceSummary as SdkFCMBalanceSummary } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMBalanceSummary';
export type { FCMSweep as SdkFCMSweep } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FCMSweep';

// =============================================================================
// Our Types (with number values instead of string) - used by convert functions
// =============================================================================

// FCMPosition with numbers
export interface FCMPosition {
  readonly productId?: string;
  readonly expirationTime?: string;
  readonly side?: FCMPositionSide;
  readonly numberOfContracts?: number;
  readonly currentPrice?: number;
  readonly avgEntryPrice?: number;
  readonly unrealizedPnl?: number;
  readonly dailyRealizedPnl?: number;
}

// FCMBalanceSummary with numbers
export interface FCMBalanceSummary {
  readonly futuresBuyingPower?: Amount;
  readonly totalUsdBalance?: Amount;
  readonly cbiUsdBalance?: Amount;
  readonly cfmUsdBalance?: Amount;
  readonly totalOpenOrdersHoldAmount?: Amount;
  readonly unrealizedPnl?: Amount;
  readonly dailyRealizedPnl?: Amount;
  readonly initialMargin?: Amount;
  readonly availableMargin?: Amount;
  readonly liquidationThreshold?: Amount;
  readonly liquidationBufferAmount?: Amount;
  readonly liquidationBufferPercentage?: number;
  readonly intradayMarginWindowMeasure?: FcmMarginWindowMeasure;
  readonly overnightMarginWindowMeasure?: FcmMarginWindowMeasure;
}

// FCMSweep with numbers
export interface FCMSweep {
  readonly id?: string;
  readonly requestedAmount?: Amount;
  readonly shouldSweepAll?: boolean;
  readonly status?: FCMSweepStatus;
  readonly scheduledTime?: string;
}
