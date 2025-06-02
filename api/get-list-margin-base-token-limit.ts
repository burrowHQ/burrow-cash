import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginBaseTokenConfigList } from "../interfaces";

const getListMarginBaseTokenLimit = async (
  token_ids: string[],
): Promise<IMarginBaseTokenConfigList> => {
  // main
  const { view, logicContract } = await getBurrow();
  try {
    const config = (await view(
      logicContract,
      ViewMethodsLogic[ViewMethodsLogic.list_margin_base_token_limit],
      {
        token_ids,
      },
    )) as IMarginBaseTokenConfigList;
    return config;
  } catch (e) {
    console.error(e);
    throw new Error("getListMarginBaseTokenLimit");
  }
};

export default getListMarginBaseTokenLimit;
