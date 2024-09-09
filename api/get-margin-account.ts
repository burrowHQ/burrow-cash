import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginAccountDetailedView } from "../interfaces";
import { getAccount as getAccountWallet } from "../utils/wallet-selector-compat";

const getMarginAccount = async () => {
  const account = await getAccountWallet();
  const { accountId } = account;
  if (accountId) {
    const { view, logicContract } = await getBurrow();
    try {
      const marginAccount = (await view(
        logicContract,
        ViewMethodsLogic[ViewMethodsLogic.get_margin_account],
        {
          account_id: accountId,
        },
      )) as IMarginAccountDetailedView;

      return marginAccount;
    } catch (e) {
      console.error(e);
      throw new Error("get_margin_account");
    }
  }
  return undefined;
};

export default getMarginAccount;
