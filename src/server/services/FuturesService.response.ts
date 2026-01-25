import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import { AmountSchema } from './common.response';

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
// Response Schemas
// =============================================================================

/**
 * FCM margin window measure schema.
 */
const FcmMarginWindowMeasureSchema = z
  .object({
    marginWindowType: z.string().optional().describe('Margin window type'),
    marginLevel: z.string().optional().describe('Margin level'),
    initialMargin: stringToNumber.describe('Initial margin'),
    maintenanceMargin: stringToNumber.describe('Maintenance margin'),
    liquidationBuffer: stringToNumber.describe('Liquidation buffer'),
    totalHold: stringToNumber.describe('Total hold amount'),
    futuresBuyingPower: stringToNumber.describe('Futures buying power'),
  })
  .describe('FCM margin window measure');

/** FCM margin window measure type */
export type FcmMarginWindowMeasure = z.output<
  typeof FcmMarginWindowMeasureSchema
>;

/**
 * FCM position schema.
 */
const FCMPositionSchema = z
  .object({
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
  })
  .describe('FCM position');

/**
 * FCM balance summary schema.
 */
const FCMBalanceSummarySchema = z
  .object({
    futuresBuyingPower: AmountSchema.optional().describe(
      'Futures buying power',
    ),
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
      FcmMarginWindowMeasureSchema.optional().describe(
        'Intraday margin window measure',
      ),
    overnightMarginWindowMeasure:
      FcmMarginWindowMeasureSchema.optional().describe(
        'Overnight margin window measure',
      ),
  })
  .describe('FCM balance summary');

/**
 * FCM sweep schema.
 */
const FCMSweepSchema = z
  .object({
    id: z.string().optional().describe('Sweep ID'),
    requestedAmount: AmountSchema.optional().describe('Requested amount'),
    shouldSweepAll: z.boolean().optional().describe('Sweep all funds flag'),
    status: z.nativeEnum(FCMSweepStatus).optional().describe('Sweep status'),
    scheduledTime: z.string().optional().describe('Scheduled time'),
  })
  .describe('FCM sweep');

/**
 * Response schema for listing futures positions.
 */
export const ListFuturesPositionsResponseSchema = z
  .object({
    positions: z
      .array(FCMPositionSchema)
      .optional()
      .describe('List of positions'),
  })
  .describe('Response containing list of futures positions');

/**
 * Response schema for getting a specific futures position.
 */
export const GetFuturesPositionResponseSchema = z
  .object({
    position: FCMPositionSchema.optional().describe('Position details'),
  })
  .describe('Response containing a futures position');

/**
 * Response schema for getting futures balance summary.
 */
export const GetFuturesBalanceSummaryResponseSchema = z
  .object({
    balanceSummary:
      FCMBalanceSummarySchema.optional().describe('Balance summary'),
  })
  .describe('Response containing futures balance summary');

/**
 * Response schema for listing futures sweeps.
 */
export const ListFuturesSweepsResponseSchema = z
  .object({
    sweeps: z.array(FCMSweepSchema).optional().describe('List of sweeps'),
  })
  .describe('Response containing list of futures sweeps');

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
