import { IAsset } from "./account";

export interface IMarginConfig {
  max_leverage_rate: number;
  pending_debt_scale: number;
  max_slippage_rate: number;
  min_safety_buffer: number;
  margin_debt_discount_rate: number;
  open_position_fee_rate: number;
  registered_dexes: { [dexId: string]: number };
  registered_tokens: { [tokenId: string]: number };
  max_active_user_margin_position: number;
}

export interface IMarginTradingPositionView {
  [posId: string]: {
    open_ts: string;
    uahpi_at_open: string;
    debt_cap: string;
    token_c_info: IAsset;
    token_d_info: IAsset;
    token_p_id: IAsset;
    token_p_amount: string;
    is_locking: boolean;
  };
}

export interface IMarginAccountDetailedView {
  account_id: string;
  supplied: IAsset[];
  margin_positions: IMarginTradingPositionView;
}

export interface IEstimateResult {
  expand_amount_in: string;
  amount_out: string;
  min_amount_out: string;
  swap_indication: {
    dex_id: string;
    swap_action_text: string;
  };
  fee: number;
  tag: string;
  from: "v1" | "dcl";
}
export interface IPool {
  amount_in?: string;
  amount_out: string;
  min_amount_out: string;
  pool_id: string | number;
  token_in: string;
  token_out: string;
}
export interface IRoute {
  amount_in: string;
  amount_out: string;
  min_amount_out: string;
  pools: IPool[];
}
export interface IFindPathResult {
  amount_in: string;
  amount_out: string;
  contract_in: string;
  contract_out: string;
  routes: IRoute[];
}

export interface IServerPool {
  amount_in?: string;
  min_amount_out: string;
  pool_id: string | number;
  token_in: string;
  token_out: string;
}

export interface IMarginBaseTokenConfig {
  min_safety_buffer: number;
  max_leverage_rate: number;
  max_common_slippage_rate: number;
  max_forceclose_slippage_rate: number;
  liq_benefit_protocol_rate: number;
  liq_benefit_liquidator_rate: number;
  min_base_token_short_position: string;
  min_base_token_long_position: string;
  max_base_token_short_position: string;
  max_base_token_long_position: string;
  total_base_token_available_short: string;
  total_base_token_available_long: string;
}

export interface IMarginBaseTokenConfigList {
  [key: string]: IMarginBaseTokenConfig;
}
export type IPositionType = "Long" | "Short";
