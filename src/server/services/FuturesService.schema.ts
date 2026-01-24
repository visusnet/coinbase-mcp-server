import { z } from 'zod';
import { FCMPositionSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FCMPositionSide';
import { FCMSweepStatus } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/FCMSweepStatus';
import { zodNumber } from './schema.helpers';
import { AmountSchema } from './common.schema';

// =============================================================================
// Request Schemas
// =============================================================================

export const GetFuturesPositionRequestSchema = z.object({
  productId: z.string().describe('Trading pair (e.g., BTC-USD)'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetFuturesPositionRequest = z.infer<
  typeof GetFuturesPositionRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

const FcmMarginWindowMeasureSchema = z.object({
  marginWindowType: z.string().optional(),
  marginLevel: z.string().optional(),
  initialMargin: zodNumber,
  maintenanceMargin: zodNumber,
  liquidationBuffer: zodNumber,
  totalHold: zodNumber,
  futuresUnrealizedPnl: zodNumber,
});

const FCMPositionSchema = z.object({
  productId: z.string().optional(),
  expirationTime: z.string().optional(),
  side: z.nativeEnum(FCMPositionSide).optional(),
  numberOfContracts: zodNumber,
  currentPrice: zodNumber,
  avgEntryPrice: zodNumber,
  unrealizedPnl: zodNumber,
  dailyRealizedPnl: zodNumber,
});

const FCMBalanceSummarySchema = z.object({
  futuresBuyingPower: AmountSchema.optional(),
  totalUsdBalance: AmountSchema.optional(),
  cbiUsdBalance: AmountSchema.optional(),
  cfmUsdBalance: AmountSchema.optional(),
  totalOpenOrdersHoldAmount: AmountSchema.optional(),
  unrealizedPnl: AmountSchema.optional(),
  dailyRealizedPnl: AmountSchema.optional(),
  initialMargin: AmountSchema.optional(),
  availableMargin: AmountSchema.optional(),
  liquidationThreshold: AmountSchema.optional(),
  liquidationBufferAmount: AmountSchema.optional(),
  liquidationBufferPercentage: zodNumber,
  intradayMarginWindowMeasure: FcmMarginWindowMeasureSchema.optional(),
  overnightMarginWindowMeasure: FcmMarginWindowMeasureSchema.optional(),
});

const FCMSweepSchema = z.object({
  id: z.string().optional(),
  requestedAmount: AmountSchema.optional(),
  shouldSweepAll: z.boolean().optional(),
  status: z.nativeEnum(FCMSweepStatus).optional(),
  scheduledTime: z.string().optional(),
});

export const ListFuturesPositionsResponseSchema = z.object({
  positions: z.array(FCMPositionSchema).optional(),
});

export const GetFuturesPositionResponseSchema = z.object({
  position: FCMPositionSchema.optional(),
});

export const GetFuturesBalanceSummaryResponseSchema = z.object({
  balanceSummary: FCMBalanceSummarySchema.optional(),
});

export const ListFuturesSweepsResponseSchema = z.object({
  sweeps: z.array(FCMSweepSchema).optional(),
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
