import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

export const GetPaymentMethodRequestSchema = z.object({
  paymentMethodId: z.string().describe('The ID of the payment method'),
});

// =============================================================================
// Request Types (derived from schemas)
// =============================================================================

export type GetPaymentMethodRequest = z.infer<
  typeof GetPaymentMethodRequestSchema
>;
