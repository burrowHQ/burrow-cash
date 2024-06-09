import { IAccountAllPositionsDetailed, ViewMethodsLogic } from "../interfaces";
import { getBurrow } from "../utils";

const getPortfolio = async (account_id: string): Promise<IAccountAllPositionsDetailed> => {
  const { view, logicContract } = await getBurrow();

  const accountDetailed = (await view(
    logicContract,
    ViewMethodsLogic[ViewMethodsLogic.get_account_all_positions],
    {
      account_id,
    },
  )) as IAccountAllPositionsDetailed;

  return accountDetailed;
};

export default getPortfolio;
