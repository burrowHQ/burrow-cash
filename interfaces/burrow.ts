import { Account, Contract } from "near-api-js";
import type { WalletSelector } from "@near-wallet-selector/core";

import {
  IMetadata,
  AssetEntry,
  IAssetDetailed,
  Balance,
  NetTvlFarm,
  IUnitLptAsset,
  IShadowRecordInfo,
} from "./asset";
import { IAccount, IAccountDetailed, IAccountAllPositionsDetailed } from "./account";
import { IPrices, IPythPrice } from "./oracle";

export interface IConfig {
  booster_decimals: number;
  booster_token_id: string;
  force_closing_enabled: number;
  max_num_assets: number;
  maximum_recency_duration_sec: number;
  maximum_staking_duration_sec: number;
  maximum_staleness_duration_sec: number;
  minimum_staking_duration_sec: number;
  oracle_account_id: string;
  ref_exchange_id: string;
  owner_id: string;
  x_booster_multiplier_at_maximum_staking_duration: number;
  boost_suppress_factor: number;
  enable_price_oracle: boolean;
  enable_pyth_oracle: boolean;
}

export interface IBurrow {
  selector: WalletSelector;
  account: Account;
  changeAccount: (accountId: string) => void;
  fetchData: (id?: string) => void;
  hideModal: () => void;
  signOut: () => void;
  signIn: () => void;
  logicContract: Contract;
  oracleContract: Contract;
  refv1Contract: Contract;
  pythContract: Contract;
  view: (
    contract: Contract,
    methodName: string,
    args?: any,
  ) => Promise<
    | IPrices
    | IPythPrice
    | IMetadata
    | AssetEntry[]
    | IAssetDetailed
    | IAccountDetailed
    | IUnitLptAsset
    | IShadowRecordInfo
    | IAccount[]
    | IAccountAllPositionsDetailed
    | Balance
    | IConfig
    | NetTvlFarm
    | string
    | boolean
    | IAssetDetailed[]
  >;
  call: (
    contract: Contract,
    methodName: string,
    args?: Record<string, unknown>,
    deposit?: string,
  ) => Promise<any>;
}
