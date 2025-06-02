import { getAssetsDetail } from "../store";

import getBalance from "./get-balance";
import getPortfolio from "./get-portfolio";
import getShadowRecords from "./get-shadows";
import { getAccount as getAccountWallet } from "../utils/wallet-selector-compat";

const getAccount = async () => {
  const account = await getAccountWallet();
  const { accountId } = account;
  if (accountId) {
    const assets = await getAssetsDetail();
    const tokenIds = assets.map((asset) => asset.token_id);
    const shadowRecords = await getShadowRecords();
    let accountBalance = "0";
    let totalAccountBalance = "0";
    try {
      const { available, total } = await account.getAccountBalance();
      accountBalance = available;
      totalAccountBalance = total;
    } catch (error) {}
    const balances = await Promise.all(
      tokenIds.map((id) => getBalance(id, accountId, shadowRecords)),
    );
    const portfolio = await getPortfolio(accountId);
    return { accountId, accountBalance, totalAccountBalance, balances, portfolio, tokenIds };
  }

  return undefined;
};

export default getAccount;
