import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginBaseTokenConfig } from "../interfaces";

const getDefaultMarginBaseTokenLimit = async (): Promise<IMarginBaseTokenConfig> => {
  // main
  const { view, logicContract } = await getBurrow();
  try {
    const config = (await view(
      logicContract,
      ViewMethodsLogic[ViewMethodsLogic.get_default_margin_base_token_limit],
    )) as IMarginBaseTokenConfig;
    return config;
  } catch (e) {
    console.error(e);
    throw new Error("getDefaultMarginBaseTokenLimit");
  }
};

export default getDefaultMarginBaseTokenLimit;
