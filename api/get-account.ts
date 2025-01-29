import { getAssetsDetail } from "../store";

import getBalance from "./get-balance";
import getPortfolio from "./get-portfolio";
import getShadowRecords from "./get-shadows";
import { blackAssets } from "../utils/config";
import { getAccount as getAccountWallet } from "../utils/wallet-selector-compat";

const getAccount = async () => {
  const account = await getAccountWallet();
  const { accountId } = account;
  if (accountId) {
    const assets = await getAssetsDetail();
    const tokenIds = assets.map((asset) => asset.token_id);
    const shadowRecords = await getShadowRecords();
    const accountBalance = (await account.getAccountBalance()).available;
    const balances = await Promise.all(
      tokenIds.map((id) => getBalance(id, accountId, shadowRecords)),
    );
    const portfolio = await getPortfolio(accountId);
    // delete portfolio.positions["shadow_ref_v1-0"];
    // portfolio.supplied = portfolio.supplied.filter((a) => !blackAssets.includes(a.token_id));
    return { accountId, accountBalance, balances, portfolio, tokenIds };
  }

  return undefined;
};

export default getAccount;
