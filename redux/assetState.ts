import { IAssetDetailed, IMetadata, IAssetFarmReward, INetTvlFarmRewards } from "../interfaces";

export type Asset = Omit<IAssetDetailed, "farms"> & {
  metadata: IMetadata | any;
  farms: {
    supplied: {
      [token: string]: IAssetFarmReward;
    };
    borrowed: {
      [token: string]: IAssetFarmReward;
    };
    tokennetbalance: {
      [token: string]: IAssetFarmReward;
    };
  };
};

export interface Assets {
  [id: string]: Asset;
}
export interface AssetsState {
  data: Assets;
  netTvlFarm: INetTvlFarmRewards;
  allFarms: IFarms;
  status: "pending" | "fulfilled" | "rejected" | "fetching" | null;
  fetchedAt: string | undefined;
}

export const initialState: AssetsState = {
  data: {},
  netTvlFarm: {},
  allFarms: { supplied: {}, borrowed: {}, netTvl: {}, tokenNetBalance: {} },
  status: null,
  fetchedAt: undefined,
};

export interface IFarms {
  supplied: Record<string, INetTvlFarmRewards>;
  borrowed: Record<string, INetTvlFarmRewards>;
  tokenNetBalance: Record<string, INetTvlFarmRewards>;
  netTvl: Record<string, INetTvlFarmRewards>;
}
