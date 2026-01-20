import type {
  SdkListAccountsResponse,
  SdkGetAccountResponse,
  SdkAccount,
  SdkAmount,
  Account,
  Amount,
  ListAccountsResponse,
  GetAccountResponse,
} from './AccountsService.types';
import { toNumber } from './numberConversion';

/**
 * Convert SDK Amount to our Amount type with number value.
 */
function toAmount(sdkAmount: SdkAmount | undefined): Amount | undefined {
  if (!sdkAmount) {
    return undefined;
  }
  const { value, ...unchanged } = sdkAmount;
  return { ...unchanged, value: toNumber(value) };
}

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
