import { z } from 'zod';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Payment method schema.
 */
const PaymentMethodSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe('Unique identifier for the payment method'),
    type: z.string().optional().describe('Payment method type'),
    name: z.string().optional().describe('Name for the payment method'),
    currency: z.string().optional().describe('Currency symbol'),
    verified: z.boolean().optional().describe('Verified status'),
    allowBuy: z.boolean().optional().describe('Whether buys are allowed'),
    allowSell: z.boolean().optional().describe('Whether sells are allowed'),
    allowDeposit: z
      .boolean()
      .optional()
      .describe('Whether deposits are allowed'),
    allowWithdraw: z
      .boolean()
      .optional()
      .describe('Whether withdrawals are allowed'),
    createdAt: z.string().optional().describe('Creation timestamp'),
    updatedAt: z.string().optional().describe('Last update timestamp'),
  })
  .describe('Payment method');

/**
 * Response schema for listing payment methods.
 */
export const ListPaymentMethodsResponseSchema = z
  .object({
    paymentMethods: z
      .array(PaymentMethodSchema)
      .optional()
      .describe('List of payment methods'),
  })
  .describe('Response containing list of payment methods');

/**
 * Response schema for getting a specific payment method.
 */
export const GetPaymentMethodResponseSchema = z
  .object({
    paymentMethod: PaymentMethodSchema.optional().describe(
      'Payment method details',
    ),
  })
  .describe('Response containing a payment method');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type ListPaymentMethodsResponse = z.output<
  typeof ListPaymentMethodsResponseSchema
>;
export type GetPaymentMethodResponse = z.output<
  typeof GetPaymentMethodResponseSchema
>;
