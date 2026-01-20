// Our types with number instead of string for numeric fields
import type { PortfolioMarginType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/PortfolioMarginType';
import type { PortfolioMarginFlags } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/PortfolioMarginFlags';
import type { PortfolioLiquidationStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/PortfolioLiquidationStatus';
import type { FuturesPositionSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FuturesPositionSide';
import type { Amount } from './AccountsService.types';

// =============================================================================
// SDK Type Re-exports
// =============================================================================

export type {
  MovePortfolioFundsRequest as SdkMovePortfolioFundsRequest,
  ListPortfoliosResponse as SdkListPortfoliosResponse,
  CreatePortfolioResponse as SdkCreatePortfolioResponse,
  GetPortfolioResponse as SdkGetPortfolioResponse,
  EditPortfolioResponse as SdkEditPortfolioResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/portfolios/types';
export type { Portfolio as SdkSpotPortfolio } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Portfolio';
export type { PortfolioBreakdown as SdkPortfolioBreakdown } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PortfolioBreakdown';
export type { PortfolioBalances as SdkPortfolioBalances } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PortfolioBalances';
export type { PortfolioPosition as SdkPortfolioPosition } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PortfolioPosition';
export type { PerpPosition as SdkPerpPosition } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PerpPosition';
export type { FuturesPosition as SdkFuturesPosition } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FuturesPosition';
export type { BalancePair as SdkBalancePair } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/BalancePair';

// Re-export SdkAmount from AccountsService.types
export type { SdkAmount } from './AccountsService.types';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

// Funds with number type for value
export interface Funds {
  readonly value: number;
  readonly currency: string;
}

// Move portfolio funds request with number types
export interface MovePortfolioFundsRequest {
  readonly funds: Funds;
  readonly sourcePortfolioUuid: string;
  readonly targetPortfolioUuid: string;
}

// BalancePair with Amount fields
export interface BalancePair {
  readonly userNativeCurrency?: Amount;
  readonly rawCurrency?: Amount;
}

// Portfolio (spot) with number fields
export interface SpotPortfolio {
  readonly portfolioUuid?: string;
  readonly collateral?: number;
  readonly positionNotional?: number;
  readonly openPositionNotional?: number;
  readonly pendingFees?: number;
  readonly borrow?: number;
  readonly accruedInterest?: number;
  readonly rollingDebt?: number;
  readonly portfolioInitialMargin?: number;
  readonly portfolioImNotional?: Amount;
  readonly portfolioMaintenanceMargin?: number;
  readonly portfolioMmNotional?: Amount;
  readonly liquidationPercentage?: number;
  readonly liquidationBuffer?: number;
  readonly marginType?: PortfolioMarginType;
  readonly marginFlags?: PortfolioMarginFlags;
  readonly liquidationStatus?: PortfolioLiquidationStatus;
  readonly unrealizedPnl?: Amount;
  readonly totalBalance?: Amount;
}

// PortfolioBalances with Amount fields
export interface PortfolioBalances {
  readonly totalBalance?: Amount;
  readonly totalFuturesBalance?: Amount;
  readonly totalCashEquivalentBalance?: Amount;
  readonly totalCryptoBalance?: Amount;
  readonly futuresUnrealizedPnl?: Amount;
  readonly perpUnrealizedPnl?: Amount;
}

// PortfolioPosition (spot positions) with number fields
export interface PortfolioPosition {
  readonly asset?: string;
  readonly accountUuid?: string;
  readonly totalBalanceFiat?: number;
  readonly totalBalanceCrypto?: number;
  readonly availableToTradeFiat?: number;
  readonly allocation?: number;
  readonly oneDayChange?: number;
  readonly costBasis?: Amount;
  readonly assetImgUrl?: string;
  readonly isCash?: boolean;
}

// PerpPosition (perpetuals positions in breakdown) with number fields
export interface PerpPosition {
  readonly productId?: string;
  readonly productUuid?: string;
  readonly symbol?: string;
  readonly assetImageUrl?: string;
  readonly vwap?: BalancePair;
  readonly positionSide?: FuturesPositionSide;
  readonly netSize?: number;
  readonly buyOrderSize?: number;
  readonly sellOrderSize?: number;
  readonly imContribution?: number;
  readonly unrealizedPnl?: BalancePair;
  readonly markPrice?: BalancePair;
  readonly liquidationPrice?: BalancePair;
  readonly leverage?: number;
  readonly imNotional?: BalancePair;
  readonly mmNotional?: BalancePair;
  readonly positionNotional?: BalancePair;
  readonly marginType?: PortfolioMarginType;
  readonly liquidationBuffer?: number;
  readonly liquidationPercentage?: number;
}

// FuturesPosition (FCM futures in breakdown) with number fields
export interface FuturesPosition {
  readonly productId?: string;
  readonly contractSize?: number;
  readonly side?: FuturesPositionSide;
  readonly amount?: number;
  readonly avgEntryPrice?: number;
  readonly currentPrice?: number;
  readonly unrealizedPnl?: number;
  readonly expiry?: string;
  readonly underlyingAsset?: string;
  readonly assetImgUrl?: string;
  readonly productName?: string;
  readonly venue?: string;
  readonly notionalValue?: number;
}

// PortfolioBreakdown (GetPortfolioResponse) with number fields
export interface PortfolioBreakdown {
  readonly portfolio?: SpotPortfolio;
  readonly portfolioBalances?: PortfolioBalances;
  readonly spotPositions?: ReadonlyArray<PortfolioPosition>;
  readonly perpPositions?: ReadonlyArray<PerpPosition>;
  readonly futuresPositions?: ReadonlyArray<FuturesPosition>;
}

// Response types
export interface ListPortfoliosResponse {
  readonly portfolios: ReadonlyArray<SpotPortfolio>;
}

export interface CreatePortfolioResponse {
  readonly portfolio?: SpotPortfolio;
}

export type GetPortfolioResponse = PortfolioBreakdown;

export type EditPortfolioResponse = CreatePortfolioResponse;

// Re-export SDK types unchanged for requests and simple responses
export type {
  ListPortfoliosRequest,
  CreatePortfolioRequest,
  GetPortfolioRequest,
  EditPortfolioRequest,
  DeletePortfolioRequest,
  DeletePortfolioResponse,
  MovePortfolioFundsResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/portfolios/types';
