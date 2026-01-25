// Wrapper types with numbers for API convenience
import type { Amount } from './common.schema';
import type {
  PortfolioMarginType,
  PortfolioMarginFlags,
  PortfolioLiquidationStatus,
} from './PortfoliosService.schema';
import type { PositionSide } from './PerpetualsService.schema';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

// Asset with numbers
interface Asset {
  readonly assetId?: string;
  readonly assetUuid?: string;
  readonly assetName?: string;
  readonly status?: string;
  readonly collateralWeight?: number;
  readonly accountCollateralLimit?: number;
  readonly ecosystemCollateralLimitBreached?: boolean;
  readonly assetIconUrl?: string;
  readonly supportedNetworksEnabled?: boolean;
}

// Balance with numbers
interface Balance {
  readonly asset?: Asset;
  readonly quantity?: number;
  readonly hold?: number;
  readonly transferHold?: number;
  readonly collateralValue?: number;
  readonly collateralWeight?: number;
  readonly maxWithdrawAmount?: number;
  readonly loan?: number;
  readonly loanCollateralRequirementUsd?: number;
  readonly pledgedQuantity?: number;
}

// Position with numbers
export interface Position {
  readonly productId?: string;
  readonly productUuid?: string;
  readonly portfolioUuid?: string;
  readonly symbol?: string;
  readonly vwap?: Amount;
  readonly entryVwap?: Amount;
  readonly positionSide?: PositionSide;
  readonly marginType?: PortfolioMarginType;
  readonly netSize?: number;
  readonly buyOrderSize?: number;
  readonly sellOrderSize?: number;
  readonly imContribution?: number;
  readonly unrealizedPnl?: Amount;
  readonly markPrice?: Amount;
  readonly liquidationPrice?: Amount;
  readonly leverage?: number;
  readonly imNotional?: Amount;
  readonly mmNotional?: Amount;
  readonly positionNotional?: Amount;
  readonly aggregatedPnl?: Amount;
}

// PositionSummary with numbers
export interface PositionSummary {
  readonly aggregatedPnl?: Amount;
}

// Portfolio with numbers
export interface Portfolio {
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

// PortfoliosSummary with numbers
export interface PortfoliosSummary {
  readonly unrealizedPnl?: Amount;
  readonly buyingPower?: Amount;
  readonly totalBalance?: Amount;
  readonly maxWithdrawalAmount?: Amount;
}

// PortfolioBalance with our Balance type
export interface PortfolioBalance {
  readonly portfolioUuid?: string;
  readonly balances?: Balance[];
  readonly isMarginLimitReached?: boolean;
}

// Response types with our wrapper types
export interface ListPerpetualsPositionsResponse {
  readonly positions?: Position[];
  readonly summary?: PositionSummary;
}

export interface GetPerpetualsPositionResponse {
  readonly position?: Position;
}

export interface GetPortfolioSummaryResponse {
  readonly portfolios?: Portfolio[];
  readonly summary?: PortfoliosSummary;
}

export interface GetPortfolioBalanceResponse {
  readonly portfolioBalances?: PortfolioBalance[];
}
