import { IAccountAllPositionsDetailed, ViewMethodsLogic } from "../interfaces";
import { getBurrow } from "../utils";

const getPortfolioMEME = async (account_id: string): Promise<IAccountAllPositionsDetailed> => {
  const { view, logicMEMEContract } = await getBurrow();

  const accountDetailed = (await view(
    logicMEMEContract,
    ViewMethodsLogic[ViewMethodsLogic.get_account_all_positions],
    {
      account_id,
    },
  )) as IAccountAllPositionsDetailed;
  console.log(accountDetailed, "getPortfolioMEME");
  return accountDetailed;
};

export default getPortfolioMEME;
