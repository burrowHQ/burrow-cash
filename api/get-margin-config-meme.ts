import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginConfig } from "../interfaces";

const getMarginConfigMEME = async (): Promise<IMarginConfig> => {
  const { view, logicMEMEContract } = await getBurrow();

  try {
    const config = (await view(
      logicMEMEContract,
      ViewMethodsLogic[ViewMethodsLogic.get_margin_config],
    )) as IMarginConfig;
    return config;
  } catch (e) {
    console.error(e);
    throw new Error("getMarginConfig");
  }
};

export default getMarginConfigMEME;
