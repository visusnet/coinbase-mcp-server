import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

/**
 * Request schema for listing payment methods.
 */
export const ListPaymentMethodsRequestSchema = z
  .object({})
  .describe('Request to list all payment methods');

/**
 * Request schema for getting a specific payment method.
 */
export const GetPaymentMethodRequestSchema = z
  .object({
    paymentMethodId: z.string().describe('The ID of the payment method'),
  })
  .describe('Request to get a specific payment method');

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type ListPaymentMethodsRequest = z.output<
  typeof ListPaymentMethodsRequestSchema
>;
export type GetPaymentMethodRequest = z.output<
  typeof GetPaymentMethodRequestSchema
>;
