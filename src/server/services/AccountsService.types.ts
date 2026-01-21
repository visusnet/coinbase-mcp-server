// Wrapper types with numbers for API convenience
import type { AccountPlatform } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/AccountPlatform';
import type { AccountType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/AccountType';
import type { Amount } from './common.types';

// =============================================================================
// SDK Types (for conversion) - these have our own converted counterparts
// =============================================================================

export type {
  ListAccountsResponse as SdkListAccountsResponse,
  GetAccountResponse as SdkGetAccountResponse,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/accounts/types';
export type { Account as SdkAccount } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Account';

// =============================================================================
// Our Types (with number values instead of string)
// =============================================================================

// Account type with number amounts
export interface Account {
  readonly uuid?: string;
  readonly name?: string;
  readonly currency?: string;
  readonly availableBalance?: Amount;
  readonly _default?: boolean;
  readonly active?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly deletedAt?: string;
  readonly type?: AccountType;
  readonly ready?: boolean;
  readonly hold?: Amount;
  readonly retailPortfolioId?: string;
  readonly platform?: AccountPlatform;
}

// Response type with our Account
export type GetAccountResponse = { account?: Account };

// ListAccountsResponse with our Account type
export interface ListAccountsResponse {
  readonly accounts?: Account[];
  readonly hasNext: boolean;
  readonly cursor?: string;
  readonly size?: number;
}

// Re-export request types unchanged
export type {
  ListAccountsRequest,
  GetAccountRequest,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/accounts/types';
