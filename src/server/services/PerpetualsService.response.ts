import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import { AmountSchema } from './common.response';
import {
  PortfolioMarginType,
  PortfolioMarginFlags,
  PortfolioLiquidationStatus,
} from './PortfoliosService.response';

// =============================================================================
// Enums
// =============================================================================

export enum PositionSide {
  Unknown = 'UNKNOWN',
  Long = 'LONG',
  Short = 'SHORT',
}

// =============================================================================
// Sub-Schemas
// =============================================================================

/**
 * Asset schema with number fields.
 */
const AssetSchema = z
  .object({
    assetId: z.string().optional().describe('Asset ID'),
    assetUuid: z.string().optional().describe('Asset UUID'),
    assetName: z.string().optional().describe('Asset name'),
    status: z.string().optional().describe('Asset status'),
    collateralWeight: stringToNumber.describe('Collateral weight'),
    accountCollateralLimit: stringToNumber.describe('Account collateral limit'),
    ecosystemCollateralLimitBreached: z
      .boolean()
      .optional()
      .describe('Ecosystem collateral limit breached'),
    assetIconUrl: z.string().optional().describe('Asset icon URL'),
    supportedNetworksEnabled: z
      .boolean()
      .optional()
      .describe('Supported networks enabled'),
  })
  .describe('Asset details');

/**
 * Balance schema with number fields.
 */
const BalanceSchema = z
  .object({
    asset: AssetSchema.optional().describe('Asset details'),
    quantity: stringToNumber.describe('Quantity'),
    hold: stringToNumber.describe('Hold amount'),
    transferHold: stringToNumber.describe('Transfer hold'),
    collateralValue: stringToNumber.describe('Collateral value'),
    collateralWeight: stringToNumber.describe('Collateral weight'),
    maxWithdrawAmount: stringToNumber.describe('Max withdrawal amount'),
    loan: stringToNumber.describe('Loan amount'),
    loanCollateralRequirementUsd: stringToNumber.describe(
      'Loan collateral requirement USD',
    ),
    pledgedQuantity: stringToNumber.describe('Pledged quantity'),
  })
  .describe('Balance details');

/**
 * Position schema with number fields.
 */
const PositionSchema = z
  .object({
    productId: z.string().optional().describe('Product ID'),
    productUuid: z.string().optional().describe('Product UUID'),
    portfolioUuid: z.string().optional().describe('Portfolio UUID'),
    symbol: z.string().optional().describe('Symbol'),
    vwap: AmountSchema.optional().describe('VWAP'),
    entryVwap: AmountSchema.optional().describe('Entry VWAP'),
    positionSide: z
      .nativeEnum(PositionSide)
      .optional()
      .describe('Position side'),
    marginType: z
      .nativeEnum(PortfolioMarginType)
      .optional()
      .describe('Margin type'),
    netSize: stringToNumber.describe('Net size'),
    buyOrderSize: stringToNumber.describe('Buy order size'),
    sellOrderSize: stringToNumber.describe('Sell order size'),
    imContribution: stringToNumber.describe('IM contribution'),
    unrealizedPnl: AmountSchema.optional().describe('Unrealized PnL'),
    markPrice: AmountSchema.optional().describe('Mark price'),
    liquidationPrice: AmountSchema.optional().describe('Liquidation price'),
    leverage: stringToNumber.describe('Leverage'),
    imNotional: AmountSchema.optional().describe('IM notional'),
    mmNotional: AmountSchema.optional().describe('MM notional'),
    positionNotional: AmountSchema.optional().describe('Position notional'),
    aggregatedPnl: AmountSchema.optional().describe('Aggregated PnL'),
  })
  .describe('Perpetual position');

const PositionSummarySchema = z
  .object({
    aggregatedPnl: AmountSchema.optional().describe('Aggregated PnL'),
  })
  .describe('Position summary');

/**
 * Portfolio schema with number fields (for perpetuals).
 */
const PortfolioSchema = z
  .object({
    portfolioUuid: z.string().optional().describe('Portfolio UUID'),
    collateral: stringToNumber.describe('Collateral'),
    positionNotional: stringToNumber.describe('Position notional'),
    openPositionNotional: stringToNumber.describe('Open position notional'),
    pendingFees: stringToNumber.describe('Pending fees'),
    borrow: stringToNumber.describe('Borrow'),
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
  .describe('Portfolio details');

const PortfoliosSummarySchema = z
  .object({
    unrealizedPnl: AmountSchema.optional().describe('Unrealized PnL'),
    buyingPower: AmountSchema.optional().describe('Buying power'),
    totalBalance: AmountSchema.optional().describe('Total balance'),
    maxWithdrawalAmount: AmountSchema.optional().describe(
      'Max withdrawal amount',
    ),
  })
  .describe('Portfolios summary');

const PortfolioBalanceSchema = z
  .object({
    portfolioUuid: z.string().optional().describe('Portfolio UUID'),
    balances: z.array(BalanceSchema).optional().describe('List of balances'),
    isMarginLimitReached: z
      .boolean()
      .optional()
      .describe('Is margin limit reached'),
  })
  .describe('Portfolio balance');

// =============================================================================
// Response Schemas
// =============================================================================

export const ListPerpetualsPositionsResponseSchema = z
  .object({
    positions: z.array(PositionSchema).optional().describe('List of positions'),
    summary: PositionSummarySchema.optional().describe('Position summary'),
  })
  .describe('Response for listing perpetuals positions');

export const GetPerpetualsPositionResponseSchema = z
  .object({
    position: PositionSchema.optional().describe('Position details'),
  })
  .describe('Response for getting a perpetuals position');

export const GetPortfolioSummaryResponseSchema = z
  .object({
    portfolios: z
      .array(PortfolioSchema)
      .optional()
      .describe('List of portfolios'),
    summary: PortfoliosSummarySchema.optional().describe('Portfolios summary'),
  })
  .describe('Response for getting portfolio summary');

export const GetPortfolioBalanceResponseSchema = z
  .object({
    portfolioBalances: z
      .array(PortfolioBalanceSchema)
      .optional()
      .describe('List of portfolio balances'),
  })
  .describe('Response for getting portfolio balance');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type ListPerpetualsPositionsResponse = z.output<
  typeof ListPerpetualsPositionsResponseSchema
>;
export type GetPerpetualsPositionResponse = z.output<
  typeof GetPerpetualsPositionResponseSchema
>;
export type GetPortfolioSummaryResponse = z.output<
  typeof GetPortfolioSummaryResponseSchema
>;
export type GetPortfolioBalanceResponse = z.output<
  typeof GetPortfolioBalanceResponseSchema
>;
