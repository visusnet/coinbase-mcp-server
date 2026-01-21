import type {
  SdkListAccountsResponse,
  SdkGetAccountResponse,
  SdkAccount,
  Account,
  ListAccountsResponse,
  GetAccountResponse,
} from './AccountsService.types';
import { toAmount } from './common.convert';

/**
 * Convert SDK Account to our Account type with number amounts.
 */
function toAccount(sdkAccount: SdkAccount): Account {
  const { availableBalance, hold, ...unchanged } = sdkAccount;
  return {
    ...unchanged,
    availableBalance: toAmount(availableBalance),
    hold: toAmount(hold),
  };
}

/**
 * Convert SDK ListAccountsResponse to our type.
 */
export function toListAccountsResponse(
  sdkResponse: SdkListAccountsResponse,
): ListAccountsResponse {
  const { accounts, ...unchanged } = sdkResponse;
  return { ...unchanged, accounts: accounts?.map(toAccount) };
}

/**
 * Convert SDK GetAccountResponse to our type.
 */
export function toGetAccountResponse(
  sdkResponse: SdkGetAccountResponse,
): GetAccountResponse {
  return {
    account: sdkResponse.account ? toAccount(sdkResponse.account) : undefined,
  };
}
