import { IAsset } from "./account";

export interface IMarginConfig {
  max_leverage_rate: number;
  pending_debt_scale: number;
  max_slippage_rate: number;
  min_safty_buffer: number;
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
