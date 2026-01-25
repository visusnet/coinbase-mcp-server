import { z } from 'zod';
import { AmountSchema } from './common.response';
import { TradeStatus } from './ConvertsService.types';

// =============================================================================
// Sub-Schemas for Response Objects
// =============================================================================

const LinkSchema = z
  .object({
    text: z.string().optional().describe('Link text'),
    url: z.string().optional().describe('Link URL'),
  })
  .describe('Link details');

const DisclosureSchema = z
  .object({
    title: z.string().optional().describe('Disclosure title'),
    description: z.string().optional().describe('Disclosure description'),
    link: LinkSchema.optional().describe('Disclosure link'),
  })
  .describe('Disclosure details');

/**
 * Fee schema with Amount.
 */
const FeeSchema = z
  .object({
    title: z.string().optional().describe('Fee title'),
    description: z.string().optional().describe('Fee description'),
    amount: AmountSchema.optional().describe('Fee amount'),
    label: z.string().optional().describe('Fee label'),
    disclosure: DisclosureSchema.optional().describe('Fee disclosure'),
  })
  .describe('Fee details');

const ScaledAmountSchema = z
  .object({
    amount: AmountSchema.optional().describe('Amount'),
    scale: z.number().optional().describe('Scale'),
  })
  .describe('Scaled amount');

const UnitPriceSchema = z
  .object({
    targetToFiat: ScaledAmountSchema.optional().describe('Target to fiat'),
    targetToSource: ScaledAmountSchema.optional().describe('Target to source'),
    sourceToFiat: ScaledAmountSchema.optional().describe('Source to fiat'),
  })
  .describe('Unit price details');

const TaxInfoSchema = z
  .object({
    name: z.string().optional().describe('Tax name'),
    amount: AmountSchema.optional().describe('Tax amount'),
  })
  .describe('Tax info');

const PaymentMethodSchema = z
  .object({
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
  })
  .describe('Payment method details');

const UserWarningContextSchema = z
  .object({
    details: z.array(z.string()).optional().describe('Details'),
    title: z.string().optional().describe('Title'),
    linkText: z.string().optional().describe('Link text'),
  })
  .describe('User warning context');

const UserWarningSchema = z
  .object({
    id: z.string().optional().describe('Warning ID'),
    link: LinkSchema.optional().describe('Warning link'),
    context: UserWarningContextSchema.optional().describe('Warning context'),
    code: z.string().optional().describe('Warning code'),
    message: z.string().optional().describe('Warning message'),
  })
  .describe('User warning');

const ErrorSchema = z
  .object({
    message: z.string().optional().describe('Error message'),
    code: z.string().optional().describe('Error code'),
    errorCode: z.string().optional().describe('Error code enum'),
    errorCta: z.string().optional().describe('Error CTA'),
  })
  .describe('Error details');

const SubscriptionInfoSchema = z
  .object({
    freeTradingResetDate: z
      .string()
      .optional()
      .describe('Free trading reset date'),
    usedZeroFeeTrading: AmountSchema.optional().describe(
      'Used zero fee trading',
    ),
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
    paymentMethodFeeWithoutSubscriptionBenefit:
      AmountSchema.optional().describe(
        'Payment method fee without subscription benefit',
      ),
  })
  .describe('Subscription info');

const TradeIncentiveInfoSchema = z
  .object({
    appliedIncentive: z.boolean().optional().describe('Applied incentive'),
    userIncentiveId: z.string().optional().describe('User incentive ID'),
    codeVal: z.string().optional().describe('Code value'),
    endsAt: z.string().optional().describe('Ends at'),
    feeWithoutIncentive: AmountSchema.optional().describe(
      'Fee without incentive',
    ),
    redeemed: z.boolean().optional().describe('Redeemed'),
  })
  .describe('Trade incentive info');

/**
 * RatConvertTrade schema with Amount fields.
 */
const RatConvertTradeSchema = z
  .object({
    id: z.string().optional().describe('Trade ID'),
    status: z.nativeEnum(TradeStatus).optional().describe('Trade status'),
    userEnteredAmount: AmountSchema.optional().describe('User entered amount'),
    amount: AmountSchema.optional().describe('Amount'),
    subtotal: AmountSchema.optional().describe('Subtotal'),
    total: AmountSchema.optional().describe('Total'),
    fees: z.array(FeeSchema).optional().describe('Fees'),
    totalFee: FeeSchema.optional().describe('Total fee'),
    source: PaymentMethodSchema.optional().describe('Source payment method'),
    target: PaymentMethodSchema.optional().describe('Target payment method'),
    unitPrice: UnitPriceSchema.optional().describe('Unit price'),
    userWarnings: z
      .array(UserWarningSchema)
      .optional()
      .describe('User warnings'),
    userReference: z.string().optional().describe('User reference'),
    sourceCurrency: z.string().optional().describe('Source currency'),
    targetCurrency: z.string().optional().describe('Target currency'),
    cancellationReason: ErrorSchema.optional().describe('Cancellation reason'),
    sourceId: z.string().optional().describe('Source ID'),
    targetId: z.string().optional().describe('Target ID'),
    subscriptionInfo:
      SubscriptionInfoSchema.optional().describe('Subscription info'),
    exchangeRate: AmountSchema.optional().describe('Exchange rate'),
    taxDetails: z.array(TaxInfoSchema).optional().describe('Tax details'),
    tradeIncentiveInfo: TradeIncentiveInfoSchema.optional().describe(
      'Trade incentive info',
    ),
    totalFeeWithoutTax: FeeSchema.optional().describe('Total fee without tax'),
    fiatDenotedTotal: AmountSchema.optional().describe('Fiat denoted total'),
  })
  .describe('Convert trade details');

// =============================================================================
// Response Schemas
// =============================================================================

export const CreateConvertQuoteResponseSchema = z
  .object({
    trade: RatConvertTradeSchema.optional().describe('Trade details'),
  })
  .describe('Response from creating a convert quote');

export const CommitConvertTradeResponseSchema = z
  .object({
    trade: RatConvertTradeSchema.optional().describe('Trade details'),
  })
  .describe('Response from committing a convert trade');

export const GetConvertTradeResponseSchema = z
  .object({
    trade: RatConvertTradeSchema.optional().describe('Trade details'),
  })
  .describe('Response from getting a convert trade');

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
