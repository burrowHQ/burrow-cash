import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initialState } from "./marginConfigState";
import getMarginConfigMEME from "../api/get-margin-config-meme";

export const fetchMarginConfigMEME = createAsyncThunk(
  "marginConfigMEME/fetchMarginConfig",
  async () => {
    const marginConfig = await getMarginConfigMEME();
    return marginConfig;
  },
);

export const marginConfigSliceMEME = createSlice({
  name: "marginConfigMEME",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMarginConfigMEME.pending, (state, action) => {
      state.status = action.meta.requestStatus;
    });
    builder.addCase(fetchMarginConfigMEME.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch margin config");
    });
    builder.addCase(fetchMarginConfigMEME.fulfilled, (state, action) => {
      state.status = action.meta.requestStatus;
      state.fetchedAt = new Date().toString();
      if (!action.payload) return;
      const {
        max_leverage_rate,
        pending_debt_scale,
        max_slippage_rate,
        min_safety_buffer,
        margin_debt_discount_rate,
        open_position_fee_rate,
        registered_dexes,
        registered_tokens,
        max_active_user_margin_position,
      } = action.payload;
      state.max_leverage_rate = max_leverage_rate;
      state.pending_debt_scale = pending_debt_scale;
      state.max_slippage_rate = max_slippage_rate;
      state.min_safety_buffer = min_safety_buffer;
      state.margin_debt_discount_rate = margin_debt_discount_rate;
      state.open_position_fee_rate = open_position_fee_rate;
      state.registered_dexes = registered_dexes;
      state.registered_tokens = registered_tokens;
      state.max_active_user_margin_position = max_active_user_margin_position;
    });
  },
});

export default marginConfigSliceMEME.reducer;
