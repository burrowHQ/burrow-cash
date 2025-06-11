import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IMarginConfig } from "../interfaces";

const getMarginConfig = async (): Promise<IMarginConfig> => {
  // main
  const { view, logicContract } = await getBurrow();
  try {
    const config = (await view(
      logicContract,
      ViewMethodsLogic[ViewMethodsLogic.get_margin_config],
    )) as IMarginConfig;
    return config;
  } catch (e) {
    console.error(e);
    throw new Error("getMarginConfig");
  }
};
export default getMarginConfig;
