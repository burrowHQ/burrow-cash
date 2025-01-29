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
    try {
      accountBalance = (await account.getAccountBalance()).available;
    } catch (error) {}
    const balances = await Promise.all(
      tokenIds.map((id) => getBalance(id, accountId, shadowRecords)),
    );
    const portfolio = await getPortfolio(accountId);
    return { accountId, accountBalance, balances, portfolio, tokenIds };
  }

  return undefined;
};

export default getAccount;
