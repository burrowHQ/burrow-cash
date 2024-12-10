import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { NetTvlFarm } from "../interfaces";

const getFarmMEME = async (farmId: "NetTvl"): Promise<NetTvlFarm> => {
  const { view, logicMEMEContract } = await getBurrow();

  try {
    const farms = (await view(
      logicMEMEContract,
      ViewMethodsLogic[ViewMethodsLogic.get_asset_farm],
      {
        farm_id: farmId,
      },
    )) as NetTvlFarm;

    return farms;
  } catch (e) {
    console.error(e);
    throw new Error("getFarm");
  }
};
export const getAllFarmsMEME = async (): Promise<[Record<string, string>, NetTvlFarm][]> => {
  const { view, logicMEMEContract } = await getBurrow();

  try {
    const farms = (await view(
      logicMEMEContract,
      ViewMethodsLogic[ViewMethodsLogic.get_asset_farms_paged],
    )) as any[];

    return farms;
  } catch (e) {
    console.error(e);
    throw new Error("getAllFarms");
  }
};

export default getFarmMEME;
