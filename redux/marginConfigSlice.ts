import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initialState } from "./marginConfigState";
import getMarginConfig from "../api/get-margin-config";
import getDefaultMarginBaseTokenLimit from "../api/get-default-margin-base-token-limit";
import getListMarginBaseTokenLimit from "../api/get-list-margin-base-token-limit";

export const fetchMarginConfig = createAsyncThunk("marginConfig/fetchMarginConfig", async () => {
  const marginConfig = await getMarginConfig();
  const defaultMarginBaseTokenLimit = await getDefaultMarginBaseTokenLimit();
  const baseTokenIds: string[] = [];
  Object.entries(marginConfig.registered_tokens).forEach(([tokenId, type]) => {
    if (type == 1) {
      baseTokenIds.push(tokenId);
    }
  });
  const listMarginBaseTokenLimit = await getListMarginBaseTokenLimit(baseTokenIds);
  return {
    ...marginConfig,
    defaultMarginBaseTokenLimit,
    listMarginBaseTokenLimit,
  };
});

export const marginConfigSlice = createSlice({
  name: "marginConfig",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMarginConfig.pending, (state, action) => {
      state.status = action.meta.requestStatus;
    });
    builder.addCase(fetchMarginConfig.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch margin config");
    });
    builder.addCase(fetchMarginConfig.fulfilled, (state, action) => {
      state.status = action.meta.requestStatus;
      state.fetchedAt = new Date().toString();
      if (!action.payload) return;
      const {
        pending_debt_scale,
        margin_debt_discount_rate,
        open_position_fee_rate,
        registered_dexes,
        registered_tokens,
        max_active_user_margin_position,
        defaultMarginBaseTokenLimit,
        listMarginBaseTokenLimit,
      } = action.payload;

      state.pending_debt_scale = pending_debt_scale;
      state.margin_debt_discount_rate = margin_debt_discount_rate;
      state.open_position_fee_rate = open_position_fee_rate;
      state.registered_dexes = registered_dexes;
      state.registered_tokens = registered_tokens;
      state.max_active_user_margin_position = max_active_user_margin_position;
      state.defaultBaseTokenConfig = defaultMarginBaseTokenLimit;
      state.listBaseTokenConfig = listMarginBaseTokenLimit;
    });
  },
});

export default marginConfigSlice.reducer;
