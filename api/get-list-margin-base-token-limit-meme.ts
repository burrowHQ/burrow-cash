import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginBaseTokenConfigList } from "../interfaces";

const getListMarginBaseTokenLimitMEME = async (
  token_ids: string[],
): Promise<IMarginBaseTokenConfigList> => {
  const { view, logicMEMEContract } = await getBurrow();
  try {
    const config = (await view(
      logicMEMEContract,
      ViewMethodsLogic[ViewMethodsLogic.list_margin_base_token_limit],
      {
        token_ids,
      },
    )) as IMarginBaseTokenConfigList;
    return config;
  } catch (e) {
    console.error(e);
    throw new Error("getListMarginBaseTokenLimitMEME");
  }
};

export default getListMarginBaseTokenLimitMEME;
