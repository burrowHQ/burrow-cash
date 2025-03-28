import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginBaseTokenConfig } from "../interfaces";

const getDefaultMarginBaseTokenLimitMEME = async (): Promise<IMarginBaseTokenConfig> => {
  const { view, logicMEMEContract } = await getBurrow();

  try {
    const config = (await view(
      logicMEMEContract,
      ViewMethodsLogic[ViewMethodsLogic.get_default_margin_base_token_limit],
    )) as IMarginBaseTokenConfig;
    return config;
  } catch (e) {
    console.error(e);
    throw new Error("getDefaultMarginBaseTokenLimitMEME");
  }
};

export default getDefaultMarginBaseTokenLimitMEME;
