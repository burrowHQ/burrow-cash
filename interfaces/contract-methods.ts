export enum ViewMethodsLogic {
  // accounts
  get_account,
  get_accounts_paged,
  get_account_all_positions,
  get_margin_account,
  // assets
  get_asset,
  get_assets,
  get_assets_paged,
  get_assets_paged_detailed,
  // config
  get_config,
  get_margin_config,
  // farms
  get_asset_farm,
  get_asset_farms,
  get_asset_farms_paged,
  storage_balance_of,
  get_all_token_pyth_infos,
}

// Change methods can modify the state. But you don't receive the returned value when called.
export enum ChangeMethodsLogic {
  // init
  new,
  execute,
  execute_with_pyth,
  // register
  storage_deposit,
  // config
  update_config,
  // assets
  add_asset,
  update_asset,
  ft_on_transfer,
  oracle_on_call,
  // farms
  account_farm_claim_all,
  add_asset_farm_reward,
  // stake
  account_stake_booster,
  account_unstake_booster,
  register_account,
  // margin action
  margin_execute_with_pyth,
}

export enum ViewMethodsOracle {
  get_price_data,
}

// Change methods can modify the state. But you don't receive the returned value when called.
export enum ChangeMethodsOracle {
  oracle_call,
}

export enum ChangeMethodsNearToken {
  near_deposit,
  near_withdraw,
}

export enum ViewMethodsToken {
  ft_metadata,
  ft_balance_of,
  storage_balance_of,
  get_st_near_price,
  get_nearx_price,
  ft_price,
  storage_balance_bounds,
}

export enum ChangeMethodsToken {
  ft_transfer_call,
  storage_deposit,
  register_account,
}

export enum ViewMethodsREFV1 {
  get_unit_lpt_assets,
  get_pool_shares,
  get_shadow_records,
  get_pool_volumes_by_ids,
  list_pool_volumes,
}
export enum ChangeMethodsREFV1 {
  shadow_action,
}
export enum ViewMethodsPyth {
  get_price,
}

export enum ChangeMethodsPyth {}

export enum ViewMethodsDcl {
  list_pools,
  quote,
}
export enum ChangeMethodsDcl {}
