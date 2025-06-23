import { getAssetsMEMEDetail } from "../store";

import getBalance from "./get-balance";
import getPortfolioMEME from "./get-portfolio-meme";
import getShadowRecords from "./get-shadows";
import { getAccount as getAccountWallet } from "../utils/wallet-selector-compat";
import { hiddenAssetsMEME } from "../utils/config";

const getAccountMEME = async () => {
  const account = await getAccountWallet();
  const { accountId } = account;
  if (accountId) {
    const assets = await getAssetsMEMEDetail();
    const tokenIds = assets.reduce((acc: string[], asset) => {
      const token_id: string = asset.token_id;
      if (!hiddenAssetsMEME.includes(token_id)) {
        acc.push(token_id);
      }
      return acc;
    }, []);
    const shadowRecords = await getShadowRecords();
    let accountBalance = "0";
    try {
      accountBalance = (await account.getAccountBalance()).available;
    } catch (error) {}
    const balances = await Promise.all(
      tokenIds.map((id) => getBalance(id, accountId, shadowRecords)),
    );
    const portfolio = await getPortfolioMEME(accountId);

    return { accountId, accountBalance, balances, portfolio, tokenIds };
  }

  return undefined;
};

export default getAccountMEME;
