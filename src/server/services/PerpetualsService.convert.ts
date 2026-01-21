import type {
  SdkListPerpetualsPositionsResponse,
  SdkGetPerpetualsPositionResponse,
  SdkGetPortfolioSummaryResponse,
  SdkGetPortfolioBalanceResponse,
  SdkAsset,
  SdkBalance,
  SdkPosition,
  SdkPositionSummary,
  SdkPortfolio,
  SdkPortfoliosSummary,
  SdkPortfolioBalance,
  Asset,
  Balance,
  Position,
  PositionSummary,
  Portfolio,
  PortfoliosSummary,
  PortfolioBalance,
  ListPerpetualsPositionsResponse,
  GetPerpetualsPositionResponse,
  GetPortfolioSummaryResponse,
  GetPortfolioBalanceResponse,
} from './PerpetualsService.types';
import { toNumber } from './numberConversion';
import { toAmount } from './common.convert';

/**
 * Convert SDK Asset to our Asset type with numbers.
 */
function toAsset(sdkAsset: SdkAsset | undefined): Asset | undefined {
  if (!sdkAsset) {
    return undefined;
  }
  const { collateralWeight, accountCollateralLimit, ...unchanged } = sdkAsset;
  return {
    ...unchanged,
    collateralWeight: toNumber(collateralWeight),
    accountCollateralLimit: toNumber(accountCollateralLimit),
  };
}

/**
 * Convert SDK Balance to our Balance type with numbers.
 */
function toBalance(sdkBalance: SdkBalance): Balance {
  const {
    asset,
    quantity,
    hold,
    transferHold,
    collateralValue,
    collateralWeight,
    maxWithdrawAmount,
    loan,
    loanCollateralRequirementUsd,
    pledgedQuantity,
  } = sdkBalance;
  return {
    asset: toAsset(asset),
    quantity: toNumber(quantity),
    hold: toNumber(hold),
    transferHold: toNumber(transferHold),
    collateralValue: toNumber(collateralValue),
    collateralWeight: toNumber(collateralWeight),
    maxWithdrawAmount: toNumber(maxWithdrawAmount),
    loan: toNumber(loan),
    loanCollateralRequirementUsd: toNumber(loanCollateralRequirementUsd),
    pledgedQuantity: toNumber(pledgedQuantity),
  };
}

/**
 * Convert SDK Position to our Position type with numbers.
 */
function toPosition(sdkPosition: SdkPosition): Position {
  const {
    netSize,
    buyOrderSize,
    sellOrderSize,
    imContribution,
    leverage,
    vwap,
    entryVwap,
    unrealizedPnl,
    markPrice,
    liquidationPrice,
    imNotional,
    mmNotional,
    positionNotional,
    aggregatedPnl,
    ...unchanged
  } = sdkPosition;
  return {
    ...unchanged,
    netSize: toNumber(netSize),
    buyOrderSize: toNumber(buyOrderSize),
    sellOrderSize: toNumber(sellOrderSize),
    imContribution: toNumber(imContribution),
    leverage: toNumber(leverage),
    vwap: toAmount(vwap),
    entryVwap: toAmount(entryVwap),
    unrealizedPnl: toAmount(unrealizedPnl),
    markPrice: toAmount(markPrice),
    liquidationPrice: toAmount(liquidationPrice),
    imNotional: toAmount(imNotional),
    mmNotional: toAmount(mmNotional),
    positionNotional: toAmount(positionNotional),
    aggregatedPnl: toAmount(aggregatedPnl),
  };
}

/**
 * Convert SDK PositionSummary to our PositionSummary type with numbers.
 */
function toPositionSummary(
  sdkSummary: SdkPositionSummary | undefined,
): PositionSummary | undefined {
  if (!sdkSummary) {
    return undefined;
  }
  return {
    aggregatedPnl: toAmount(sdkSummary.aggregatedPnl),
  };
}

/**
 * Convert SDK Portfolio to our Portfolio type with numbers.
 */
function toPortfolio(sdkPortfolio: SdkPortfolio): Portfolio {
  const {
    collateral,
    positionNotional,
    openPositionNotional,
    pendingFees,
    borrow,
    accruedInterest,
    rollingDebt,
    portfolioInitialMargin,
    portfolioMaintenanceMargin,
    liquidationPercentage,
    liquidationBuffer,
    portfolioImNotional,
    portfolioMmNotional,
    unrealizedPnl,
    totalBalance,
    ...unchanged
  } = sdkPortfolio;
  return {
    ...unchanged,
    collateral: toNumber(collateral),
    positionNotional: toNumber(positionNotional),
    openPositionNotional: toNumber(openPositionNotional),
    pendingFees: toNumber(pendingFees),
    borrow: toNumber(borrow),
    accruedInterest: toNumber(accruedInterest),
    rollingDebt: toNumber(rollingDebt),
    portfolioInitialMargin: toNumber(portfolioInitialMargin),
    portfolioMaintenanceMargin: toNumber(portfolioMaintenanceMargin),
    liquidationPercentage: toNumber(liquidationPercentage),
    liquidationBuffer: toNumber(liquidationBuffer),
    portfolioImNotional: toAmount(portfolioImNotional),
    portfolioMmNotional: toAmount(portfolioMmNotional),
    unrealizedPnl: toAmount(unrealizedPnl),
    totalBalance: toAmount(totalBalance),
  };
}

/**
 * Convert SDK PortfoliosSummary to our PortfoliosSummary type with numbers.
 */
function toPortfoliosSummary(
  sdkSummary: SdkPortfoliosSummary | undefined,
): PortfoliosSummary | undefined {
  if (!sdkSummary) {
    return undefined;
  }
  return {
    unrealizedPnl: toAmount(sdkSummary.unrealizedPnl),
    buyingPower: toAmount(sdkSummary.buyingPower),
    totalBalance: toAmount(sdkSummary.totalBalance),
    maxWithdrawalAmount: toAmount(sdkSummary.maxWithdrawalAmount),
  };
}

/**
 * Convert SDK PortfolioBalance to our PortfolioBalance type with numbers.
 */
function toPortfolioBalance(sdkBalance: SdkPortfolioBalance): PortfolioBalance {
  const { balances, ...unchanged } = sdkBalance;
  return {
    ...unchanged,
    balances: balances?.map(toBalance),
  };
}

/**
 * Convert SDK ListPerpetualsPositionsResponse to our type.
 */
export function toListPerpetualsPositionsResponse(
  sdkResponse: SdkListPerpetualsPositionsResponse,
): ListPerpetualsPositionsResponse {
  return {
    positions: sdkResponse.positions?.map(toPosition),
    summary: toPositionSummary(sdkResponse.summary),
  };
}

/**
 * Convert SDK GetPerpetualsPositionResponse to our type.
 */
export function toGetPerpetualsPositionResponse(
  sdkResponse: SdkGetPerpetualsPositionResponse,
): GetPerpetualsPositionResponse {
  return {
    position: sdkResponse.position
      ? toPosition(sdkResponse.position)
      : undefined,
  };
}

/**
 * Convert SDK GetPortfolioSummaryResponse to our type.
 */
export function toGetPortfolioSummaryResponse(
  sdkResponse: SdkGetPortfolioSummaryResponse,
): GetPortfolioSummaryResponse {
  return {
    portfolios: sdkResponse.portfolios?.map(toPortfolio),
    summary: toPortfoliosSummary(sdkResponse.summary),
  };
}

/**
 * Convert SDK GetPortfolioBalanceResponse to our type.
 */
export function toGetPortfolioBalanceResponse(
  sdkResponse: SdkGetPortfolioBalanceResponse,
): GetPortfolioBalanceResponse {
  return {
    portfolioBalances: sdkResponse.portfolioBalances?.map(toPortfolioBalance),
  };
}
