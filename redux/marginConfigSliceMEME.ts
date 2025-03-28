import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initialState } from "./marginConfigState";
import getMarginConfigMEME from "../api/get-margin-config-meme";
import getDefaultMarginBaseTokenLimitMEME from "../api/get-default-margin-base-token-limit-meme";
import getListMarginBaseTokenLimitMEME from "../api/get-list-margin-base-token-limit-meme";

export const fetchMarginConfigMEME = createAsyncThunk(
  "marginConfigMEME/fetchMarginConfig",
  async () => {
    const marginConfigMEME = await getMarginConfigMEME();
    const defaultMarginBaseTokenLimitMEME = await getDefaultMarginBaseTokenLimitMEME();
    const baseTokenIds: string[] = [];
    Object.entries(marginConfigMEME.registered_tokens).forEach(([tokenId, type]) => {
      if (type == 1) {
        baseTokenIds.push(tokenId);
      }
    });
    const listMarginBaseTokenLimitMEME = await getListMarginBaseTokenLimitMEME(baseTokenIds);
    return {
      ...marginConfigMEME,
      defaultMarginBaseTokenLimitMEME,
      listMarginBaseTokenLimitMEME,
    };
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
        pending_debt_scale,
        margin_debt_discount_rate,
        open_position_fee_rate,
        registered_dexes,
        registered_tokens,
        max_active_user_margin_position,
        defaultMarginBaseTokenLimitMEME,
        listMarginBaseTokenLimitMEME,
      } = action.payload;
      state.pending_debt_scale = pending_debt_scale;
      state.margin_debt_discount_rate = margin_debt_discount_rate;
      state.open_position_fee_rate = open_position_fee_rate;
      state.registered_dexes = registered_dexes;
      state.registered_tokens = registered_tokens;
      state.max_active_user_margin_position = max_active_user_margin_position;
      state.defaultBaseTokenConfig = defaultMarginBaseTokenLimitMEME;
      state.listBaseTokenConfig = listMarginBaseTokenLimitMEME;
    });
  },
});

export default marginConfigSliceMEME.reducer;
