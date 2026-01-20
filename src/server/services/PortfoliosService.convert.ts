import type {
  SdkMovePortfolioFundsRequest,
  SdkListPortfoliosResponse,
  SdkCreatePortfolioResponse,
  SdkGetPortfolioResponse,
  SdkEditPortfolioResponse,
  SdkSpotPortfolio,
  SdkPortfolioBreakdown,
  SdkPortfolioBalances,
  SdkPortfolioPosition,
  SdkPerpPosition,
  SdkFuturesPosition,
  SdkBalancePair,
  SdkAmount,
  SpotPortfolio,
  PortfolioBreakdown,
  PortfolioBalances,
  PortfolioPosition,
  PerpPosition,
  FuturesPosition,
  BalancePair,
  MovePortfolioFundsRequest,
  ListPortfoliosResponse,
  CreatePortfolioResponse,
  GetPortfolioResponse,
  EditPortfolioResponse,
} from './PortfoliosService.types';
import type { Amount } from './AccountsService.types';
import { toNumber } from './numberConversion';

/**
 * Convert SDK Amount to our Amount type with number value.
 */
function toAmount(sdkAmount: SdkAmount | undefined): Amount | undefined {
  if (!sdkAmount) {
    return undefined;
  }
  const { value, ...unchanged } = sdkAmount;
  return { ...unchanged, value: toNumber(value) };
}

/**
 * Convert SDK BalancePair to our BalancePair type with numbers.
 */
function toBalancePair(
  sdkPair: SdkBalancePair | undefined,
): BalancePair | undefined {
  if (!sdkPair) {
    return undefined;
  }
  return {
    userNativeCurrency: toAmount(sdkPair.userNativeCurrency),
    rawCurrency: toAmount(sdkPair.rawCurrency),
  };
}

/**
 * Convert SDK Portfolio (spot) to our SpotPortfolio type with numbers.
 */
function toSpotPortfolio(sdkPortfolio: SdkSpotPortfolio): SpotPortfolio {
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
 * Convert SDK PortfolioBalances to our type with numbers.
 */
function toPortfolioBalances(
  sdkBalances: SdkPortfolioBalances | undefined,
): PortfolioBalances | undefined {
  if (!sdkBalances) {
    return undefined;
  }
  return {
    totalBalance: toAmount(sdkBalances.totalBalance),
    totalFuturesBalance: toAmount(sdkBalances.totalFuturesBalance),
    totalCashEquivalentBalance: toAmount(
      sdkBalances.totalCashEquivalentBalance,
    ),
    totalCryptoBalance: toAmount(sdkBalances.totalCryptoBalance),
    futuresUnrealizedPnl: toAmount(sdkBalances.futuresUnrealizedPnl),
    perpUnrealizedPnl: toAmount(sdkBalances.perpUnrealizedPnl),
  };
}

/**
 * Convert SDK PortfolioPosition to our type with numbers.
 */
function toPortfolioPosition(
  sdkPosition: SdkPortfolioPosition,
): PortfolioPosition {
  const { costBasis, ...unchanged } = sdkPosition;
  return {
    ...unchanged,
    costBasis: toAmount(costBasis),
  };
}

/**
 * Convert SDK PerpPosition to our type with numbers.
 */
function toPerpPosition(sdkPosition: SdkPerpPosition): PerpPosition {
  const {
    netSize,
    buyOrderSize,
    sellOrderSize,
    imContribution,
    leverage,
    liquidationBuffer,
    liquidationPercentage,
    vwap,
    unrealizedPnl,
    markPrice,
    liquidationPrice,
    imNotional,
    mmNotional,
    positionNotional,
    ...unchanged
  } = sdkPosition;
  return {
    ...unchanged,
    netSize: toNumber(netSize),
    buyOrderSize: toNumber(buyOrderSize),
    sellOrderSize: toNumber(sellOrderSize),
    imContribution: toNumber(imContribution),
    leverage: toNumber(leverage),
    liquidationBuffer: toNumber(liquidationBuffer),
    liquidationPercentage: toNumber(liquidationPercentage),
    vwap: toBalancePair(vwap),
    unrealizedPnl: toBalancePair(unrealizedPnl),
    markPrice: toBalancePair(markPrice),
    liquidationPrice: toBalancePair(liquidationPrice),
    imNotional: toBalancePair(imNotional),
    mmNotional: toBalancePair(mmNotional),
    positionNotional: toBalancePair(positionNotional),
  };
}

/**
 * Convert SDK FuturesPosition to our type with numbers.
 */
function toFuturesPosition(sdkPosition: SdkFuturesPosition): FuturesPosition {
  const {
    contractSize,
    amount,
    avgEntryPrice,
    currentPrice,
    unrealizedPnl,
    notionalValue,
    ...unchanged
  } = sdkPosition;
  return {
    ...unchanged,
    contractSize: toNumber(contractSize),
    amount: toNumber(amount),
    avgEntryPrice: toNumber(avgEntryPrice),
    currentPrice: toNumber(currentPrice),
    unrealizedPnl: toNumber(unrealizedPnl),
    notionalValue: toNumber(notionalValue),
  };
}

/**
 * Convert SDK PortfolioBreakdown to our type with numbers.
 */
function toPortfolioBreakdown(
  sdkBreakdown: SdkPortfolioBreakdown,
): PortfolioBreakdown {
  return {
    portfolio: sdkBreakdown.portfolio
      ? toSpotPortfolio(sdkBreakdown.portfolio)
      : undefined,
    portfolioBalances: toPortfolioBalances(sdkBreakdown.portfolioBalances),
    spotPositions: sdkBreakdown.spotPositions?.map(toPortfolioPosition),
    perpPositions: sdkBreakdown.perpPositions?.map(toPerpPosition),
    futuresPositions: sdkBreakdown.futuresPositions?.map(toFuturesPosition),
  };
}

/**
 * Convert SDK ListPortfoliosResponse to our type.
 */
export function toListPortfoliosResponse(
  sdkResponse: SdkListPortfoliosResponse,
): ListPortfoliosResponse {
  return {
    portfolios: sdkResponse.portfolios.map(toSpotPortfolio),
  };
}

/**
 * Convert SDK CreatePortfolioResponse to our type.
 */
export function toCreatePortfolioResponse(
  sdkResponse: SdkCreatePortfolioResponse,
): CreatePortfolioResponse {
  return {
    portfolio: sdkResponse.portfolio
      ? toSpotPortfolio(sdkResponse.portfolio)
      : undefined,
  };
}

/**
 * Convert SDK GetPortfolioResponse (PortfolioBreakdown) to our type.
 */
export function toGetPortfolioResponse(
  sdkResponse: SdkGetPortfolioResponse,
): GetPortfolioResponse {
  return toPortfolioBreakdown(sdkResponse);
}

/**
 * Convert SDK EditPortfolioResponse to our type.
 */
export function toEditPortfolioResponse(
  sdkResponse: SdkEditPortfolioResponse,
): EditPortfolioResponse {
  return {
    portfolio: sdkResponse.portfolio
      ? toSpotPortfolio(sdkResponse.portfolio)
      : undefined,
  };
}

// =============================================================================
// Request Conversions (our types -> SDK types)
// =============================================================================

/**
 * Convert our MovePortfolioFundsRequest to SDK request type.
 */
export function toSdkMovePortfolioFundsRequest(
  request: MovePortfolioFundsRequest,
): SdkMovePortfolioFundsRequest {
  return {
    funds: {
      value: request.funds.value.toString(),
      currency: request.funds.currency,
    },
    sourcePortfolioUuid: request.sourcePortfolioUuid,
    targetPortfolioUuid: request.targetPortfolioUuid,
  };
}
