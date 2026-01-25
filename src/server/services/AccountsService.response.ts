import { z } from 'zod';
import { stringToNumber } from './schema.helpers';
import { AmountSchema } from './common.response';

// =============================================================================
// Enums
// =============================================================================

/** Account platform type */
enum AccountPlatform {
  Unspecified = 'ACCOUNT_PLATFORM_UNSPECIFIED',
  Consumer = 'ACCOUNT_PLATFORM_CONSUMER',
  CfmConsumer = 'ACCOUNT_PLATFORM_CFM_CONSUMER',
  Intx = 'ACCOUNT_PLATFORM_INTX',
}

/** Account type */
enum AccountType {
  Unspecified = 'ACCOUNT_TYPE_UNSPECIFIED',
  Crypto = 'ACCOUNT_TYPE_CRYPTO',
  Fiat = 'ACCOUNT_TYPE_FIAT',
  Vault = 'ACCOUNT_TYPE_VAULT',
  PerpFutures = 'ACCOUNT_TYPE_PERP_FUTURES',
}

// =============================================================================
// Response Schemas
// =============================================================================

const AccountSchema = z
  .object({
    uuid: z.string().optional().describe('Account UUID'),
    name: z.string().optional().describe('Account name'),
    currency: z.string().optional().describe('Currency code'),
    availableBalance: AmountSchema.optional().describe('Available balance'),
    default: z
      .boolean()
      .optional()
      .describe('Whether this is the default account'),
    active: z.boolean().optional().describe('Whether the account is active'),
    createdAt: z.string().optional().describe('Account creation timestamp'),
    updatedAt: z.string().optional().describe('Last update timestamp'),
    deletedAt: z.string().optional().describe('Deletion timestamp'),
    type: z.nativeEnum(AccountType).optional().describe('Account type'),
    ready: z.boolean().optional().describe('Whether the account is ready'),
    hold: AmountSchema.optional().describe('Amount on hold'),
    retailPortfolioId: z.string().optional().describe('Retail portfolio ID'),
    platform: z
      .nativeEnum(AccountPlatform)
      .optional()
      .describe('Account platform'),
  })
  .describe('Coinbase account details');

export const ListAccountsResponseSchema = z
  .object({
    accounts: z.array(AccountSchema).optional().describe('List of accounts'),
    hasNext: z.boolean().describe('Whether more results are available'),
    cursor: z.string().optional().describe('Cursor for next page'),
    size: stringToNumber.describe('Number of accounts returned'),
  })
  .describe('Response for listing accounts');

export const GetAccountResponseSchema = z
  .object({
    account: AccountSchema.optional().describe('Account details'),
  })
  .describe('Response for getting a single account');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type ListAccountsResponse = z.output<typeof ListAccountsResponseSchema>;
export type GetAccountResponse = z.output<typeof GetAccountResponseSchema>;
