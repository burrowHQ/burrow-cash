import { IMarginBaseTokenConfig, IMarginBaseTokenConfigList } from "../interfaces";

type Status = "pending" | "fulfilled" | "rejected" | undefined;
export interface IMarginConfigState {
  pending_debt_scale: number;
  margin_debt_discount_rate: number;
  open_position_fee_rate: number;
  registered_dexes: Record<string, number>;
  registered_tokens: Record<string, number>;
  status: Status;
  fetchedAt: string | undefined;
  max_active_user_margin_position: number;
  defaultBaseTokenConfig: IMarginBaseTokenConfig;
  listBaseTokenConfig: IMarginBaseTokenConfigList;
}

export const initialState: IMarginConfigState = {
  pending_debt_scale: 0,
  margin_debt_discount_rate: 0,
  open_position_fee_rate: 0,
  registered_dexes: {},
  registered_tokens: {},
  status: undefined,
  fetchedAt: undefined,
  max_active_user_margin_position: 0,
  defaultBaseTokenConfig: {
    min_safety_buffer: 0,
    max_leverage_rate: 0,
    max_common_slippage_rate: 0,
    max_forceclose_slippage_rate: 0,
    liq_benefit_protocol_rate: 0,
    liq_benefit_liquidator_rate: 0,
    min_base_token_short_position: "",
    min_base_token_long_position: "",
    max_base_token_short_position: "",
    max_base_token_long_position: "",
    total_base_token_available_short: "",
    total_base_token_available_long: "",
  },
  listBaseTokenConfig: {},
};
