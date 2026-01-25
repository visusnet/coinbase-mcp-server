import { z } from 'zod';
import { AmountSchema } from './common.schema';
import { numberToString } from './schema.helpers';

// =============================================================================
// Request Schemas
// =============================================================================

export const CreateConvertQuoteRequestSchema = z.object({
  fromAccount: z.string().describe('Source account UUID'),
  toAccount: z.string().describe('Destination account UUID'),
  amount: numberToString.describe('Amount to convert'),
});

export const CommitConvertTradeRequestSchema = z.object({
  tradeId: z.string().describe('The trade ID from the quote'),
  fromAccount: z.string().describe('Source account UUID'),
  toAccount: z.string().describe('Destination account UUID'),
});

export const GetConvertTradeRequestSchema = z.object({
  tradeId: z.string().describe('The trade ID'),
  fromAccount: z.string().describe('Source account UUID'),
  toAccount: z.string().describe('Destination account UUID'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type CreateConvertQuoteRequest = z.output<
  typeof CreateConvertQuoteRequestSchema
>;
export type CommitConvertTradeRequest = z.output<
  typeof CommitConvertTradeRequestSchema
>;
export type GetConvertTradeRequest = z.output<
  typeof GetConvertTradeRequestSchema
>;

// =============================================================================
// Enums
// =============================================================================

export enum TradeStatus {
  Created = 'TRADE_STATUS_CREATED',
  Started = 'TRADE_STATUS_STARTED',
  Completed = 'TRADE_STATUS_COMPLETED',
  Canceled = 'TRADE_STATUS_CANCELED',
  Failed = 'TRADE_STATUS_FAILED',
  Pending = 'TRADE_STATUS_PENDING',
}

// =============================================================================
// Nested Type Schemas
// =============================================================================

const LinkResponseSchema = z.object({
  text: z.string().optional().describe('Link text'),
  url: z.string().optional().describe('Link URL'),
});

const DisclosureResponseSchema = z.object({
  title: z.string().optional().describe('Disclosure title'),
  description: z.string().optional().describe('Disclosure description'),
  link: LinkResponseSchema.optional().describe('Disclosure link'),
});

/**
 * Fee schema with Amount.
 */
const FeeResponseSchema = z.object({
  title: z.string().optional().describe('Fee title'),
  description: z.string().optional().describe('Fee description'),
  amount: AmountSchema.optional().describe('Fee amount'),
  label: z.string().optional().describe('Fee label'),
  disclosure: DisclosureResponseSchema.optional().describe('Fee disclosure'),
});

const ScaledAmountResponseSchema = z.object({
  amount: AmountSchema.optional().describe('Amount'),
  scale: z.number().optional().describe('Scale'),
});

const UnitPriceResponseSchema = z.object({
  targetToFiat:
    ScaledAmountResponseSchema.optional().describe('Target to fiat'),
  targetToSource:
    ScaledAmountResponseSchema.optional().describe('Target to source'),
  sourceToFiat:
    ScaledAmountResponseSchema.optional().describe('Source to fiat'),
});

const TaxInfoResponseSchema = z.object({
  name: z.string().optional().describe('Tax name'),
  amount: AmountSchema.optional().describe('Tax amount'),
});

const PaymentMethodResponseSchema = z.object({
  id: z.string().optional().describe('Payment method ID'),
  type: z.string().optional().describe('Payment method type'),
  name: z.string().optional().describe('Payment method name'),
  currency: z.string().optional().describe('Currency'),
  verified: z.boolean().optional().describe('Verified status'),
  allowBuy: z.boolean().optional().describe('Allow buy'),
  allowSell: z.boolean().optional().describe('Allow sell'),
  allowDeposit: z.boolean().optional().describe('Allow deposit'),
  allowWithdraw: z.boolean().optional().describe('Allow withdraw'),
  createdAt: z.string().optional().describe('Created at'),
  updatedAt: z.string().optional().describe('Updated at'),
});

const UserWarningContextResponseSchema = z.object({
  details: z.array(z.string()).optional().describe('Details'),
  title: z.string().optional().describe('Title'),
  linkText: z.string().optional().describe('Link text'),
});

const UserWarningResponseSchema = z.object({
  id: z.string().optional().describe('Warning ID'),
  link: LinkResponseSchema.optional().describe('Warning link'),
  context:
    UserWarningContextResponseSchema.optional().describe('Warning context'),
  code: z.string().optional().describe('Warning code'),
  message: z.string().optional().describe('Warning message'),
});

const ErrorResponseSchema = z.object({
  message: z.string().optional().describe('Error message'),
  code: z.string().optional().describe('Error code'),
  errorCode: z.string().optional().describe('Error code enum'),
  errorCta: z.string().optional().describe('Error CTA'),
});

const SubscriptionInfoResponseSchema = z.object({
  freeTradingResetDate: z
    .string()
    .optional()
    .describe('Free trading reset date'),
  usedZeroFeeTrading: AmountSchema.optional().describe('Used zero fee trading'),
  remainingFreeTradingVolume: AmountSchema.optional().describe(
    'Remaining free trading volume',
  ),
  maxFreeTradingVolume: AmountSchema.optional().describe(
    'Max free trading volume',
  ),
  hasBenefitCap: z.boolean().optional().describe('Has benefit cap'),
  appliedSubscriptionBenefit: z
    .boolean()
    .optional()
    .describe('Applied subscription benefit'),
  feeWithoutSubscriptionBenefit: AmountSchema.optional().describe(
    'Fee without subscription benefit',
  ),
  paymentMethodFeeWithoutSubscriptionBenefit: AmountSchema.optional().describe(
    'Payment method fee without subscription benefit',
  ),
});

const TradeIncentiveInfoResponseSchema = z.object({
  appliedIncentive: z.boolean().optional().describe('Applied incentive'),
  userIncentiveId: z.string().optional().describe('User incentive ID'),
  codeVal: z.string().optional().describe('Code value'),
  endsAt: z.string().optional().describe('Ends at'),
  feeWithoutIncentive: AmountSchema.optional().describe(
    'Fee without incentive',
  ),
  redeemed: z.boolean().optional().describe('Redeemed'),
});

/**
 * RatConvertTrade schema with Amount fields.
 */
const RatConvertTradeResponseSchema = z.object({
  id: z.string().optional().describe('Trade ID'),
  status: z.nativeEnum(TradeStatus).optional().describe('Trade status'),
  userEnteredAmount: AmountSchema.optional().describe('User entered amount'),
  amount: AmountSchema.optional().describe('Amount'),
  subtotal: AmountSchema.optional().describe('Subtotal'),
  total: AmountSchema.optional().describe('Total'),
  fees: z.array(FeeResponseSchema).optional().describe('Fees'),
  totalFee: FeeResponseSchema.optional().describe('Total fee'),
  source: PaymentMethodResponseSchema.optional().describe(
    'Source payment method',
  ),
  target: PaymentMethodResponseSchema.optional().describe(
    'Target payment method',
  ),
  unitPrice: UnitPriceResponseSchema.optional().describe('Unit price'),
  userWarnings: z
    .array(UserWarningResponseSchema)
    .optional()
    .describe('User warnings'),
  userReference: z.string().optional().describe('User reference'),
  sourceCurrency: z.string().optional().describe('Source currency'),
  targetCurrency: z.string().optional().describe('Target currency'),
  cancellationReason: ErrorResponseSchema.optional().describe(
    'Cancellation reason',
  ),
  sourceId: z.string().optional().describe('Source ID'),
  targetId: z.string().optional().describe('Target ID'),
  subscriptionInfo:
    SubscriptionInfoResponseSchema.optional().describe('Subscription info'),
  exchangeRate: AmountSchema.optional().describe('Exchange rate'),
  taxDetails: z.array(TaxInfoResponseSchema).optional().describe('Tax details'),
  tradeIncentiveInfo: TradeIncentiveInfoResponseSchema.optional().describe(
    'Trade incentive info',
  ),
  totalFeeWithoutTax: FeeResponseSchema.optional().describe(
    'Total fee without tax',
  ),
  fiatDenotedTotal: AmountSchema.optional().describe('Fiat denoted total'),
});

// =============================================================================
// Response Schemas
// =============================================================================

export const CreateConvertQuoteResponseSchema = z.object({
  trade: RatConvertTradeResponseSchema.optional().describe('Trade details'),
});

export const CommitConvertTradeResponseSchema = z.object({
  trade: RatConvertTradeResponseSchema.optional().describe('Trade details'),
});

export const GetConvertTradeResponseSchema = z.object({
  trade: RatConvertTradeResponseSchema.optional().describe('Trade details'),
});

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type CreateConvertQuoteResponse = z.output<
  typeof CreateConvertQuoteResponseSchema
>;
export type CommitConvertTradeResponse = z.output<
  typeof CommitConvertTradeResponseSchema
>;
export type GetConvertTradeResponse = z.output<
  typeof GetConvertTradeResponseSchema
>;
