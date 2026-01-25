import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const ListPaymentMethodsRequestSchema = z.object({});

export const GetPaymentMethodRequestSchema = z.object({
  paymentMethodId: z.string().describe('The ID of the payment method'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListPaymentMethodsRequest = z.input<
  typeof ListPaymentMethodsRequestSchema
>;
export type GetPaymentMethodRequest = z.input<
  typeof GetPaymentMethodRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

const PaymentMethodResponseSchema = z.object({
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
  allowDeposit: z.boolean().optional().describe('Whether deposits are allowed'),
  allowWithdraw: z
    .boolean()
    .optional()
    .describe('Whether withdrawals are allowed'),
  createdAt: z.string().optional().describe('Creation timestamp'),
  updatedAt: z.string().optional().describe('Last update timestamp'),
});

export const ListPaymentMethodsResponseSchema = z.object({
  paymentMethods: z
    .array(PaymentMethodResponseSchema)
    .optional()
    .describe('List of payment methods'),
});

export const GetPaymentMethodResponseSchema = z.object({
  paymentMethod: PaymentMethodResponseSchema.optional().describe(
    'Payment method details',
  ),
});

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type ListPaymentMethodsResponse = z.output<
  typeof ListPaymentMethodsResponseSchema
>;
export type GetPaymentMethodResponse = z.output<
  typeof GetPaymentMethodResponseSchema
>;
