import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { IConfig } from "../interfaces";

const getConfigMEME = async (): Promise<IConfig> => {
  const { view, logicMEMEContract } = await getBurrow();

  try {
    const config = (await view(
      logicMEMEContract,
      ViewMethodsLogic[ViewMethodsLogic.get_config],
    )) as IConfig;

    return config;
  } catch (e) {
    console.error(e);
    throw new Error("getConfig");
  }
};

export default getConfigMEME;
