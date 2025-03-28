import { IPrice } from "./oracle";

export interface IAssetConfig {
  reserve_ratio: number;
  target_utilization: number;
  target_utilization_rate: string;
  max_utilization_rate: string;
  volatility_ratio: number;
  extra_decimals: number;
  can_deposit: boolean;
  can_withdraw: boolean;
  can_use_as_collateral: boolean;
  can_borrow: boolean;
  net_tvl_multiplier: number;
  holding_position_fee_rate: string;
  min_borrowed_amount?: string;
}

export interface IAssetEntry {
  token_id: string;
  supplied: IPool;
  borrowed: IPool;
  margin_debt: IPool;
  margin_pending_debt: string;
  margin_position: string;
  reserved: string;
  prot_fee: string;
  last_update_timestamp: string;
  config: IAssetConfig;
  uahpi?: string;
}

export type AssetEntry = [string, IAssetEntry];

interface IPool {
  shares: string;
  balance: string;
}

export interface IMetadata {
  token_id: string;
  icon: string;
  name: string;
  symbol: string;
  decimals: number;
  tokens?: any;
}

export interface IAssetFarmReward {
  /// The reward token ID.
  token_id?: string;
  /// The amount of reward distributed per day.
  reward_per_day: string;
  /// The log base for the booster. Used to compute boosted shares per account.
  /// Including decimals of the booster.
  booster_log_base: string;
  /// The amount of rewards remaining to distribute.
  remaining_rewards: string;
  /// The total number of boosted shares.
  boosted_shares: string;
}

interface IAssetFarmView {
  farm_id: string;
  rewards: IAssetFarmReward[];
}

export interface INetTvlFarmReward {
  boosted_shares: string;
  booster_log_base: string;
  remaining_rewards: string;
  reward_per_day: string;
}

export interface INetTvlFarmRewards {
  [asset_id: string]: INetTvlFarmReward;
}

export interface NetTvlFarm {
  block_timestamp: string;
  rewards: INetTvlFarmRewards;
}

export interface IAssetDetailed {
  token_id: string;
  /// Total supplied including collateral, but excluding reserved.
  supplied: IPool;
  /// Total borrowed.
  borrowed: IPool;
  /// The amount reserved for the stability. This amount can also be borrowed and affects
  /// borrowing rate.
  reserved: string;
  /// When the asset was last updated. It's always going to be the current block timestamp.
  last_update_timestamp: string;
  /// The asset config.
  config: IAssetConfig;
  /// Current supply APR
  supply_apr: string;
  /// Current borrow APR
  borrow_apr: string;
  /// Asset farms
  farms: IAssetFarmView[];
  // price mixin
  price?: IPrice;
  prot_fee: string;
  isLpToken: boolean;
  lptMetadata: IUnitLptAssetDetail;
  margin_debt: IPool;
  margin_pending_debt: string;
  margin_position: string;
  uahpi: string;
}

export interface AssetFarm {
  block_timestamp: string;
  /// Rewards for the given farm
  rewards: IAssetFarmReward;
}

export interface Balance {
  available: string;
  total: string;
}

export interface IAssetFarmRewardPortfolio extends IAssetFarmReward {
  asset_farm_reward: IAssetFarmReward;
  boosted_shares: "string";
  unclaimed_amount: "string";
}

export interface IReward {
  rewards: IAssetFarmReward;
  metadata: IMetadata;
  config: IAssetConfig;
  price: number;
  type?: "portfolio" | "asset";
}

export interface IPortfolioReward {
  rewards: IAssetFarmRewardPortfolio;
  metadata: IMetadata;
  config: IAssetConfig;
  price: number;
  type?: "portfolio" | "asset";
}

export interface IPortfolioAsset {
  tokenId: string;
  symbol: string;
  icon: string;
  price: number;
  apy: number;
  collateral: number;
  supplied: number;
  canUseAsCollateral: boolean;
  canWithdraw: boolean;
  rewards: IPortfolioReward[];
  depositRewards: IReward[];
  borrowRewards: IReward[];
  totalSupplyMoney: number;
  borrowApy?: number;
}

export interface UIAsset {
  tokenId: string;
  icon: string;
  symbol: string;
  name: string;
  price: number;
  supplyApy: number;
  totalSupply: number;
  totalSupply$: string;
  totalSupplyMoney: number;
  borrowApy: number;
  totalBorrowed: number;
  totalBorrowed$: string;
  totalBorrowedMoney: number;
  availableLiquidity: number;
  availableLiquidity$: string;
  availableLiquidityMoney: number;
  collateralFactor: string;
  canUseAsCollateral: boolean;
  supplied: number;
  collateral: number;
  deposited: number;
  borrowed: number;
  availableNEAR: number;
  available: number;
  decimals: number;
  extraDecimals: number;
  brrrBorrow: number;
  brrrSupply: number;
  depositRewards: IReward[];
  borrowRewards: IReward[];
  can_borrow: boolean;
  can_deposit: boolean;
  tokens: IToken[];
  isLpToken: boolean;
}

export interface IToken {
  token_id: string;
  amount: string;
  usd?: string;
  metadata?: IMetadata;
}
export interface IUnitLptAssetDetail {
  timestamp: string;
  decimals: number;
  tokens: IToken[];
}
export interface IUnitLptAsset {
  [lp_token_id: string]: IUnitLptAssetDetail;
}

export interface IShadowRecord {
  shadow_in_farm: string;
  shadow_in_burrow: string;
}
export interface IShadowRecordInfo {
  [pool_id: string]: IShadowRecord;
}
