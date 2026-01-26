import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import { AmountSchema, PortfolioType } from './common.response';

// =============================================================================
// Enums
// =============================================================================

export enum PortfolioMarginType {
  UnknownMarginType = 'UNKNOWN_MARGIN_TYPE',
  Cross = 'CROSS',
  Isolated = 'ISOLATED',
}

export enum PortfolioMarginFlags {
  UnknownMarginFlags = 'UNKNOWN_MARGIN_FLAGS',
  PmEnrolled = 'PM_ENROLLED',
}

export enum PortfolioLiquidationStatus {
  Unknown = 'UNKNOWN',
  FullyFunded = 'FULLY_FUNDED',
  PartiallyFunded = 'PARTIALLY_FUNDED',
  Liquidation = 'LIQUIDATION',
  AutoDeleveraging = 'AUTO_DELEVERAGING',
  Bankruptcy = 'BANKRUPTCY',
  Deactivated = 'DEACTIVATED',
}

export enum FuturesPositionSide {
  Unspecified = 'FUTURES_POSITION_SIDE_UNSPECIFIED',
  Long = 'FUTURES_POSITION_SIDE_LONG',
  Short = 'FUTURES_POSITION_SIDE_SHORT',
}

// =============================================================================
// Sub-Schemas
// =============================================================================

/**
 * Simple portfolio schema for list/create/edit responses.
 */
const PortfolioSchema = z
  .object({
    name: z.string().describe('Portfolio name'),
    uuid: z.string().describe('Portfolio UUID'),
    type: z.nativeEnum(PortfolioType).describe('Portfolio type'),
    deleted: z.boolean().describe('Whether portfolio is deleted'),
  })
  .describe('Portfolio');

/**
 * BalancePair schema with Amount fields.
 */
const BalancePairSchema = z
  .object({
    userNativeCurrency: AmountSchema.optional().describe(
      'User native currency',
    ),
    rawCurrency: AmountSchema.optional().describe('Raw currency'),
  })
  .describe('Balance pair with user native and raw currency');

/**
 * SpotPortfolio schema with number fields.
 */
const SpotPortfolioSchema = z
  .object({
    portfolioUuid: z.string().optional().describe('Portfolio UUID'),
    collateral: stringToNumber.describe('Collateral value'),
    positionNotional: stringToNumber.describe('Position notional'),
    openPositionNotional: stringToNumber.describe('Open position notional'),
    pendingFees: stringToNumber.describe('Pending fees'),
    borrow: stringToNumber.describe('Borrow amount'),
    accruedInterest: stringToNumber.describe('Accrued interest'),
    rollingDebt: stringToNumber.describe('Rolling debt'),
    portfolioInitialMargin: stringToNumber.describe('Portfolio initial margin'),
    portfolioImNotional: AmountSchema.optional().describe(
      'Portfolio IM notional',
    ),
    portfolioMaintenanceMargin: stringToNumber.describe(
      'Portfolio maintenance margin',
    ),
    portfolioMmNotional: AmountSchema.optional().describe(
      'Portfolio MM notional',
    ),
    liquidationPercentage: stringToNumber.describe('Liquidation percentage'),
    liquidationBuffer: stringToNumber.describe('Liquidation buffer'),
    marginType: z
      .nativeEnum(PortfolioMarginType)
      .optional()
      .describe('Margin type'),
    marginFlags: z
      .nativeEnum(PortfolioMarginFlags)
      .optional()
      .describe('Margin flags'),
    liquidationStatus: z
      .nativeEnum(PortfolioLiquidationStatus)
      .optional()
      .describe('Liquidation status'),
    unrealizedPnl: AmountSchema.optional().describe('Unrealized PnL'),
    totalBalance: AmountSchema.optional().describe('Total balance'),
  })
  .describe('Spot portfolio details');

/**
 * PortfolioBalances schema with Amount fields.
 */
const PortfolioBalancesSchema = z
  .object({
    totalBalance: AmountSchema.optional().describe('Total balance'),
    totalFuturesBalance: AmountSchema.optional().describe(
      'Total futures balance',
    ),
    totalCashEquivalentBalance: AmountSchema.optional().describe(
      'Total cash equivalent balance',
    ),
    totalCryptoBalance: AmountSchema.optional().describe(
      'Total crypto balance',
    ),
    futuresUnrealizedPnl: AmountSchema.optional().describe(
      'Futures unrealized PnL',
    ),
    perpUnrealizedPnl: AmountSchema.optional().describe('Perp unrealized PnL'),
  })
  .describe('Portfolio balances');

/**
 * PortfolioPosition schema with number fields.
 */
const PortfolioPositionSchema = z
  .object({
    asset: z.string().optional().describe('Asset'),
    accountUuid: z.string().optional().describe('Account UUID'),
    totalBalanceFiat: stringToNumber.describe('Total balance in fiat'),
    totalBalanceCrypto: stringToNumber.describe('Total balance in crypto'),
    availableToTradeFiat: stringToNumber.describe('Available to trade in fiat'),
    allocation: stringToNumber.describe('Allocation percentage'),
    oneDayChange: stringToNumber.describe('One day change'),
    costBasis: AmountSchema.optional().describe('Cost basis'),
    assetImgUrl: z.string().optional().describe('Asset image URL'),
    isCash: z.boolean().optional().describe('Is cash'),
  })
  .describe('Portfolio position');

/**
 * PerpPosition schema with number fields.
 */
const PerpPositionSchema = z
  .object({
    productId: z.string().optional().describe('Product ID'),
    productUuid: z.string().optional().describe('Product UUID'),
    symbol: z.string().optional().describe('Symbol'),
    assetImageUrl: z.string().optional().describe('Asset image URL'),
    vwap: BalancePairSchema.optional().describe('VWAP'),
    positionSide: z
      .nativeEnum(FuturesPositionSide)
      .optional()
      .describe('Position side'),
    netSize: stringToNumber.describe('Net size'),
    buyOrderSize: stringToNumber.describe('Buy order size'),
    sellOrderSize: stringToNumber.describe('Sell order size'),
    imContribution: stringToNumber.describe('IM contribution'),
    unrealizedPnl: BalancePairSchema.optional().describe('Unrealized PnL'),
    markPrice: BalancePairSchema.optional().describe('Mark price'),
    liquidationPrice:
      BalancePairSchema.optional().describe('Liquidation price'),
    leverage: stringToNumber.describe('Leverage'),
    imNotional: BalancePairSchema.optional().describe('IM notional'),
    mmNotional: BalancePairSchema.optional().describe('MM notional'),
    positionNotional:
      BalancePairSchema.optional().describe('Position notional'),
    marginType: z
      .nativeEnum(PortfolioMarginType)
      .optional()
      .describe('Margin type'),
    liquidationBuffer: stringToNumber.describe('Liquidation buffer'),
    liquidationPercentage: stringToNumber.describe('Liquidation percentage'),
  })
  .describe('Perpetual position');

/**
 * FuturesPosition schema with number fields.
 */
const FuturesPositionSchema = z
  .object({
    productId: z.string().optional().describe('Product ID'),
    contractSize: stringToNumber.describe('Contract size'),
    side: z
      .nativeEnum(FuturesPositionSide)
      .optional()
      .describe('Position side'),
    amount: stringToNumber.describe('Amount'),
    avgEntryPrice: stringToNumber.describe('Average entry price'),
    currentPrice: stringToNumber.describe('Current price'),
    unrealizedPnl: stringToNumber.describe('Unrealized PnL'),
    expiry: z.string().optional().describe('Expiry'),
    underlyingAsset: z.string().optional().describe('Underlying asset'),
    assetImgUrl: z.string().optional().describe('Asset image URL'),
    productName: z.string().optional().describe('Product name'),
    venue: z.string().optional().describe('Venue'),
    notionalValue: stringToNumber.describe('Notional value'),
  })
  .describe('Futures position');

/**
 * PortfolioBreakdown schema (GetPortfolioResponse).
 */
const PortfolioBreakdownSchema = z
  .object({
    portfolio: SpotPortfolioSchema.optional().describe('Portfolio details'),
    portfolioBalances:
      PortfolioBalancesSchema.optional().describe('Portfolio balances'),
    spotPositions: z
      .array(PortfolioPositionSchema)
      .optional()
      .describe('Spot positions'),
    perpPositions: z
      .array(PerpPositionSchema)
      .optional()
      .describe('Perp positions'),
    futuresPositions: z
      .array(FuturesPositionSchema)
      .optional()
      .describe('Futures positions'),
  })
  .describe('Portfolio breakdown');

// =============================================================================
// Response Schemas
// =============================================================================

export const ListPortfoliosResponseSchema = z
  .object({
    portfolios: z.array(PortfolioSchema).describe('List of portfolios'),
  })
  .describe('Response for listing portfolios');

export const CreatePortfolioResponseSchema = z
  .object({
    portfolio: PortfolioSchema.optional().describe('Created portfolio'),
  })
  .describe('Response for creating a portfolio');

export const GetPortfolioResponseSchema = z
  .object({
    breakdown: PortfolioBreakdownSchema.describe('Portfolio breakdown'),
  })
  .describe('Response for getting a portfolio');

export const EditPortfolioResponseSchema = z
  .object({
    portfolio: PortfolioSchema.optional().describe('Edited portfolio'),
  })
  .describe('Response for editing a portfolio');

export const DeletePortfolioResponseSchema = z
  .object({})
  .describe('Response for deleting a portfolio');

export const MovePortfolioFundsResponseSchema = z
  .object({
    sourcePortfolioUuid: z
      .string()
      .optional()
      .describe('UUID of the source portfolio'),
    targetPortfolioUuid: z
      .string()
      .optional()
      .describe('UUID of the target portfolio'),
  })
  .describe('Response for moving funds between portfolios');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type ListPortfoliosResponse = z.output<
  typeof ListPortfoliosResponseSchema
>;
export type CreatePortfolioResponse = z.output<
  typeof CreatePortfolioResponseSchema
>;
export type GetPortfolioResponse = z.output<typeof GetPortfolioResponseSchema>;
export type EditPortfolioResponse = z.output<
  typeof EditPortfolioResponseSchema
>;
export type DeletePortfolioResponse = z.output<
  typeof DeletePortfolioResponseSchema
>;
export type MovePortfolioFundsResponse = z.output<
  typeof MovePortfolioFundsResponseSchema
>;
