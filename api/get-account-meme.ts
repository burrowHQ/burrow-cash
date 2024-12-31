import { getAssetsMEMEDetailed } from "../store";

import getBalance from "./get-balance";
import getPortfolioMEME from "./get-portfolio-meme";
import getShadowRecords from "./get-shadows";
import { getAccount as getAccountWallet } from "../utils/wallet-selector-compat";

const getAccountMEME = async () => {
  const account = await getAccountWallet();
  const { accountId } = account;
  if (accountId) {
    const assets = await getAssetsMEMEDetailed();
    const tokenIds = assets.map((asset) => asset.token_id);
    const shadowRecords = await getShadowRecords();
    const accountBalance = (await account.getAccountBalance()).available;
    const balances = await Promise.all(
      tokenIds.map((id) => getBalance(id, accountId, shadowRecords)),
    );
    const portfolio = await getPortfolioMEME(accountId);

    return { accountId, accountBalance, balances, portfolio, tokenIds };
  }

  return undefined;
};

export default getAccountMEME;
