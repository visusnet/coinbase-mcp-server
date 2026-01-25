import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import { AmountSchema } from './common.schema';

// =============================================================================
// Enums
// =============================================================================

/** FCM position side */
export enum FCMPositionSide {
  Unknown = 'UNKNOWN',
  Long = 'LONG',
  Short = 'SHORT',
}

/** FCM sweep status */
export enum FCMSweepStatus {
  UnknownFcmSweepStatus = 'UNKNOWN_FCM_SWEEP_STATUS',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
}

// =============================================================================
// Request Schemas
// =============================================================================

export const GetFuturesPositionRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetFuturesPositionRequest = z.input<
  typeof GetFuturesPositionRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

const FcmMarginWindowMeasureResponseSchema = z.object({
  marginWindowType: z.string().optional().describe('Margin window type'),
  marginLevel: z.string().optional().describe('Margin level'),
  initialMargin: stringToNumber.describe('Initial margin'),
  maintenanceMargin: stringToNumber.describe('Maintenance margin'),
  liquidationBuffer: stringToNumber.describe('Liquidation buffer'),
  totalHold: stringToNumber.describe('Total hold amount'),
  futuresBuyingPower: stringToNumber.describe('Futures buying power'),
});

/** FCM margin window measure type */
export type FcmMarginWindowMeasure = z.output<
  typeof FcmMarginWindowMeasureResponseSchema
>;

const FCMPositionResponseSchema = z.object({
  productId: z.string().optional().describe('Product ID'),
  expirationTime: z.string().optional().describe('Position expiration time'),
  side: z
    .nativeEnum(FCMPositionSide)
    .optional()
    .describe('Position side (LONG or SHORT)'),
  numberOfContracts: stringToNumber.describe('Number of contracts'),
  currentPrice: stringToNumber.describe('Current price'),
  avgEntryPrice: stringToNumber.describe('Average entry price'),
  unrealizedPnl: stringToNumber.describe('Unrealized profit/loss'),
  dailyRealizedPnl: stringToNumber.describe('Daily realized profit/loss'),
});

const FCMBalanceSummaryResponseSchema = z.object({
  futuresBuyingPower: AmountSchema.optional().describe('Futures buying power'),
  totalUsdBalance: AmountSchema.optional().describe('Total USD balance'),
  cbiUsdBalance: AmountSchema.optional().describe('CBI USD balance'),
  cfmUsdBalance: AmountSchema.optional().describe('CFM USD balance'),
  totalOpenOrdersHoldAmount: AmountSchema.optional().describe(
    'Total open orders hold amount',
  ),
  unrealizedPnl: AmountSchema.optional().describe('Unrealized profit/loss'),
  dailyRealizedPnl: AmountSchema.optional().describe(
    'Daily realized profit/loss',
  ),
  initialMargin: AmountSchema.optional().describe('Initial margin'),
  availableMargin: AmountSchema.optional().describe('Available margin'),
  liquidationThreshold: AmountSchema.optional().describe(
    'Liquidation threshold',
  ),
  liquidationBufferAmount: AmountSchema.optional().describe(
    'Liquidation buffer amount',
  ),
  liquidationBufferPercentage: stringToNumber.describe(
    'Liquidation buffer percentage',
  ),
  intradayMarginWindowMeasure:
    FcmMarginWindowMeasureResponseSchema.optional().describe(
      'Intraday margin window measure',
    ),
  overnightMarginWindowMeasure:
    FcmMarginWindowMeasureResponseSchema.optional().describe(
      'Overnight margin window measure',
    ),
});

const FCMSweepResponseSchema = z.object({
  id: z.string().optional().describe('Sweep ID'),
  requestedAmount: AmountSchema.optional().describe('Requested amount'),
  shouldSweepAll: z.boolean().optional().describe('Sweep all funds flag'),
  status: z.nativeEnum(FCMSweepStatus).optional().describe('Sweep status'),
  scheduledTime: z.string().optional().describe('Scheduled time'),
});

export const ListFuturesPositionsResponseSchema = z.object({
  positions: z
    .array(FCMPositionResponseSchema)
    .optional()
    .describe('List of positions'),
});

export const GetFuturesPositionResponseSchema = z.object({
  position: FCMPositionResponseSchema.optional().describe('Position details'),
});

export const GetFuturesBalanceSummaryResponseSchema = z.object({
  balanceSummary:
    FCMBalanceSummaryResponseSchema.optional().describe('Balance summary'),
});

export const ListFuturesSweepsResponseSchema = z.object({
  sweeps: z.array(FCMSweepResponseSchema).optional().describe('List of sweeps'),
});

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type ListFuturesPositionsResponse = z.output<
  typeof ListFuturesPositionsResponseSchema
>;
export type GetFuturesPositionResponse = z.output<
  typeof GetFuturesPositionResponseSchema
>;
export type GetFuturesBalanceSummaryResponse = z.output<
  typeof GetFuturesBalanceSummaryResponseSchema
>;
export type ListFuturesSweepsResponse = z.output<
  typeof ListFuturesSweepsResponseSchema
>;
