import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import { AmountSchema } from './common.schema';
import {
  PortfolioMarginType,
  PortfolioMarginFlags,
  PortfolioLiquidationStatus,
} from './PortfoliosService.schema';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListPerpetualsPositionsRequestSchema = z.object({
  portfolioUuid: z.string().describe('Portfolio UUID'),
});

export const GetPerpetualsPositionRequestSchema = z.object({
  portfolioUuid: z.string().describe('Portfolio UUID'),
  symbol: z.string().describe('Product symbol'),
});

export const GetPortfolioSummaryRequestSchema = z.object({
  portfolioUuid: z.string().describe('Portfolio UUID'),
});

export const GetPortfolioBalanceRequestSchema = z.object({
  portfolioUuid: z.string().describe('Portfolio UUID'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListPerpetualsPositionsRequest = z.input<
  typeof ListPerpetualsPositionsRequestSchema
>;
export type GetPerpetualsPositionRequest = z.input<
  typeof GetPerpetualsPositionRequestSchema
>;
export type GetPortfolioSummaryRequest = z.input<
  typeof GetPortfolioSummaryRequestSchema
>;
export type GetPortfolioBalanceRequest = z.input<
  typeof GetPortfolioBalanceRequestSchema
>;

// =============================================================================
// Enums
// =============================================================================

export enum PositionSide {
  Unknown = 'UNKNOWN',
  Long = 'LONG',
  Short = 'SHORT',
}

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Asset schema with number fields.
 */
const AssetResponseSchema = z.object({
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
});

/**
 * Balance schema with number fields.
 */
const BalanceResponseSchema = z.object({
  asset: AssetResponseSchema.optional().describe('Asset details'),
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
});

/**
 * Position schema with number fields.
 */
const PositionResponseSchema = z.object({
  productId: z.string().optional().describe('Product ID'),
  productUuid: z.string().optional().describe('Product UUID'),
  portfolioUuid: z.string().optional().describe('Portfolio UUID'),
  symbol: z.string().optional().describe('Symbol'),
  vwap: AmountSchema.optional().describe('VWAP'),
  entryVwap: AmountSchema.optional().describe('Entry VWAP'),
  positionSide: z.nativeEnum(PositionSide).optional().describe('Position side'),
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
});

const PositionSummaryResponseSchema = z.object({
  aggregatedPnl: AmountSchema.optional().describe('Aggregated PnL'),
});

/**
 * Portfolio schema with number fields (for perpetuals).
 */
const PortfolioResponseSchema = z.object({
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
});

const PortfoliosSummaryResponseSchema = z.object({
  unrealizedPnl: AmountSchema.optional().describe('Unrealized PnL'),
  buyingPower: AmountSchema.optional().describe('Buying power'),
  totalBalance: AmountSchema.optional().describe('Total balance'),
  maxWithdrawalAmount: AmountSchema.optional().describe(
    'Max withdrawal amount',
  ),
});

const PortfolioBalanceResponseSchema = z.object({
  portfolioUuid: z.string().optional().describe('Portfolio UUID'),
  balances: z
    .array(BalanceResponseSchema)
    .optional()
    .describe('List of balances'),
  isMarginLimitReached: z
    .boolean()
    .optional()
    .describe('Is margin limit reached'),
});

export const ListPerpetualsPositionsResponseSchema = z.object({
  positions: z
    .array(PositionResponseSchema)
    .optional()
    .describe('List of positions'),
  summary:
    PositionSummaryResponseSchema.optional().describe('Position summary'),
});

export const GetPerpetualsPositionResponseSchema = z.object({
  position: PositionResponseSchema.optional().describe('Position details'),
});

export const GetPortfolioSummaryResponseSchema = z.object({
  portfolios: z
    .array(PortfolioResponseSchema)
    .optional()
    .describe('List of portfolios'),
  summary:
    PortfoliosSummaryResponseSchema.optional().describe('Portfolios summary'),
});

export const GetPortfolioBalanceResponseSchema = z.object({
  portfolioBalances: z
    .array(PortfolioBalanceResponseSchema)
    .optional()
    .describe('List of portfolio balances'),
});
