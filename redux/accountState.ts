// eslint-disable-next-line import/no-cycle
import { IBoosterStaking } from "../interfaces/account";

interface Balance {
  [tokenId: string]: string;
}

interface PortfolioAsset {
  apr: string;
  balance: string;
  shares: string;
}

export interface FarmData {
  boosted_shares: string;
  unclaimed_amount: string;
  asset_farm_reward: {
    reward_per_day: string;
    booster_log_base: string;
    remaining_rewards: string;
    boosted_shares: string;
  };
}

export interface Farm {
  [reward_token_id: string]: FarmData;
}
export interface IPositions {
  [shadow_id: string]: {
    collateral: {
      [tokenId: string]: PortfolioAsset;
    };
    borrowed: {
      [tokenId: string]: PortfolioAsset;
    };
  };
}
export interface Portfolio {
  supplied: {
    [tokenId: string]: PortfolioAsset;
  };
  collateral: {
    [tokenId: string]: PortfolioAsset;
  };
  collateralAll: {
    [tokenId: string]: PortfolioAsset;
  };
  borrowed: {
    [tokenId: string]: PortfolioAsset;
  };
  supplies: any[];
  collaterals: any[];
  borrows: any[];
  positions: IPositions;
  farms: {
    supplied: {
      [tokenId: string]: Farm;
    };
    borrowed: {
      [tokenId: string]: Farm;
    };
    tokennetbalance: {
      [tokenId: string]: Farm;
    };
    netTvl: {
      [tokenId: string]: FarmData;
    };
  };
  staking: IBoosterStaking;
  hasNonFarmedAssets: boolean;
}

type Status = "pending" | "fulfilled" | "rejected" | undefined;
export interface AccountState {
  accountId: string;
  balances: Balance;
  portfolio: Portfolio;
  status: Status;
  fetchedAt: string | undefined;
  isClaiming: Status;
}

export const initialStaking = {
  staked_booster_amount: "0",
  unlock_timestamp: "0",
  x_booster_amount: "0",
};

export const initialState: AccountState = {
  accountId: "",
  balances: {},
  portfolio: {
    supplies: [],
    borrows: [],
    collaterals: [],
    supplied: {},
    collateral: {},
    collateralAll: {},
    borrowed: {},
    positions: {},
    farms: {
      supplied: {},
      borrowed: {},
      netTvl: {},
      tokennetbalance: {},
    },
    staking: initialStaking,
    hasNonFarmedAssets: false,
  },
  status: undefined,
  isClaiming: undefined,
  fetchedAt: undefined,
};

export interface IAccountFarms {
  supplied: {
    [tokenId: string]: Farm;
  };
  borrowed: {
    [tokenId: string]: Farm;
  };
  netTvl: {
    [tokenId: string]: FarmData;
  };
}
