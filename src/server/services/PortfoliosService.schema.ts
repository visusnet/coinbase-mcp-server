import { z } from 'zod';
import { stringToNumber, numberToString } from './schema.helpers';
import { AmountSchema } from './common.schema';

// =============================================================================
// Shared Schemas
// =============================================================================

const FundsRequestSchema = z.object({
  value: numberToString.describe('Amount to transfer'),
  currency: z.string().describe('Currency code (e.g., USD, BTC)'),
});

// =============================================================================
// Request Schemas
// =============================================================================

export const ListPortfoliosRequestSchema = z.object({});

export const CreatePortfolioRequestSchema = z.object({
  name: z.string().describe('Name of the portfolio'),
});

export const GetPortfolioRequestSchema = z.object({
  portfolioUuid: z.string().describe('The UUID of the portfolio'),
});

export const MovePortfolioFundsRequestSchema = z.object({
  funds: FundsRequestSchema.describe(
    'Fund movement details (amount, currency)',
  ),
  sourcePortfolioUuid: z.string().describe('Source portfolio UUID'),
  targetPortfolioUuid: z.string().describe('Target portfolio UUID'),
});

export const EditPortfolioRequestSchema = z.object({
  portfolioUuid: z.string().describe('The UUID of the portfolio to edit'),
  name: z.string().describe('New name for the portfolio'),
});

export const DeletePortfolioRequestSchema = z.object({
  portfolioUuid: z.string().describe('The UUID of the portfolio to delete'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListPortfoliosRequest = z.input<typeof ListPortfoliosRequestSchema>;
export type CreatePortfolioRequest = z.input<
  typeof CreatePortfolioRequestSchema
>;
export type GetPortfolioRequest = z.input<typeof GetPortfolioRequestSchema>;
export type MovePortfolioFundsRequest = z.output<
  typeof MovePortfolioFundsRequestSchema
>;
export type EditPortfolioRequest = z.input<typeof EditPortfolioRequestSchema>;
export type DeletePortfolioRequest = z.input<
  typeof DeletePortfolioRequestSchema
>;

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
// Response Schemas
// =============================================================================

/**
 * BalancePair schema with Amount fields.
 */
const BalancePairResponseSchema = z.object({
  userNativeCurrency: AmountSchema.optional().describe('User native currency'),
  rawCurrency: AmountSchema.optional().describe('Raw currency'),
});

/**
 * SpotPortfolio schema with number fields.
 */
const SpotPortfolioResponseSchema = z.object({
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
});

/**
 * PortfolioBalances schema with Amount fields.
 */
const PortfolioBalancesResponseSchema = z.object({
  totalBalance: AmountSchema.optional().describe('Total balance'),
  totalFuturesBalance: AmountSchema.optional().describe(
    'Total futures balance',
  ),
  totalCashEquivalentBalance: AmountSchema.optional().describe(
    'Total cash equivalent balance',
  ),
  totalCryptoBalance: AmountSchema.optional().describe('Total crypto balance'),
  futuresUnrealizedPnl: AmountSchema.optional().describe(
    'Futures unrealized PnL',
  ),
  perpUnrealizedPnl: AmountSchema.optional().describe('Perp unrealized PnL'),
});

/**
 * PortfolioPosition schema with number fields.
 */
const PortfolioPositionResponseSchema = z.object({
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
});

/**
 * PerpPosition schema with number fields.
 */
const PerpPositionResponseSchema = z.object({
  productId: z.string().optional().describe('Product ID'),
  productUuid: z.string().optional().describe('Product UUID'),
  symbol: z.string().optional().describe('Symbol'),
  assetImageUrl: z.string().optional().describe('Asset image URL'),
  vwap: BalancePairResponseSchema.optional().describe('VWAP'),
  positionSide: z
    .nativeEnum(FuturesPositionSide)
    .optional()
    .describe('Position side'),
  netSize: stringToNumber.describe('Net size'),
  buyOrderSize: stringToNumber.describe('Buy order size'),
  sellOrderSize: stringToNumber.describe('Sell order size'),
  imContribution: stringToNumber.describe('IM contribution'),
  unrealizedPnl:
    BalancePairResponseSchema.optional().describe('Unrealized PnL'),
  markPrice: BalancePairResponseSchema.optional().describe('Mark price'),
  liquidationPrice:
    BalancePairResponseSchema.optional().describe('Liquidation price'),
  leverage: stringToNumber.describe('Leverage'),
  imNotional: BalancePairResponseSchema.optional().describe('IM notional'),
  mmNotional: BalancePairResponseSchema.optional().describe('MM notional'),
  positionNotional:
    BalancePairResponseSchema.optional().describe('Position notional'),
  marginType: z
    .nativeEnum(PortfolioMarginType)
    .optional()
    .describe('Margin type'),
  liquidationBuffer: stringToNumber.describe('Liquidation buffer'),
  liquidationPercentage: stringToNumber.describe('Liquidation percentage'),
});

/**
 * FuturesPosition schema with number fields.
 */
const FuturesPositionResponseSchema = z.object({
  productId: z.string().optional().describe('Product ID'),
  contractSize: stringToNumber.describe('Contract size'),
  side: z.nativeEnum(FuturesPositionSide).optional().describe('Position side'),
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
});

/**
 * PortfolioBreakdown schema (GetPortfolioResponse).
 */
const PortfolioBreakdownResponseSchema = z.object({
  portfolio:
    SpotPortfolioResponseSchema.optional().describe('Portfolio details'),
  portfolioBalances:
    PortfolioBalancesResponseSchema.optional().describe('Portfolio balances'),
  spotPositions: z
    .array(PortfolioPositionResponseSchema)
    .optional()
    .describe('Spot positions'),
  perpPositions: z
    .array(PerpPositionResponseSchema)
    .optional()
    .describe('Perp positions'),
  futuresPositions: z
    .array(FuturesPositionResponseSchema)
    .optional()
    .describe('Futures positions'),
});

export const ListPortfoliosResponseSchema = z.object({
  portfolios: z
    .array(SpotPortfolioResponseSchema)
    .describe('List of portfolios'),
});

export const CreatePortfolioResponseSchema = z.object({
  portfolio:
    SpotPortfolioResponseSchema.optional().describe('Created portfolio'),
});

export const GetPortfolioResponseSchema = PortfolioBreakdownResponseSchema;

export const EditPortfolioResponseSchema = z.object({
  portfolio:
    SpotPortfolioResponseSchema.optional().describe('Edited portfolio'),
});

export const DeletePortfolioResponseSchema = z.object({});

export const MovePortfolioFundsResponseSchema = z.object({
  sourcePortfolioUuid: z
    .string()
    .optional()
    .describe('UUID of the source portfolio'),
  targetPortfolioUuid: z
    .string()
    .optional()
    .describe('UUID of the target portfolio'),
});

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
