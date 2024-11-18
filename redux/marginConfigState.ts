type Status = "pending" | "fulfilled" | "rejected" | undefined;
export interface IMarginConfigState {
  max_leverage_rate: number;
  pending_debt_scale: number;
  max_slippage_rate: number;
  min_safety_buffer: number;
  margin_debt_discount_rate: number;
  open_position_fee_rate: number;
  registered_dexes: Record<string, number>;
  registered_tokens: Record<string, number>;
  status: Status;
  fetchedAt: string | undefined;
  max_active_user_margin_position: number;
}

export const initialState: IMarginConfigState = {
  max_leverage_rate: 0,
  pending_debt_scale: 0,
  max_slippage_rate: 0,
  min_safety_buffer: 0,
  margin_debt_discount_rate: 0,
  open_position_fee_rate: 0,
  registered_dexes: {},
  registered_tokens: {},
  status: undefined,
  fetchedAt: undefined,
  max_active_user_margin_position: 0,
};
