import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initialState } from "./marginAccountState";
import getMarginAccountMEME from "../api/get-margin-account-meme";

export const fetchMarginAccountMEME = createAsyncThunk(
  "marginAccountMEME/fetchMarginAccount",
  async () => {
    const account = await getMarginAccountMEME();
    return account;
  },
);

export const marginAccountSliceMEME = createSlice({
  name: "marginAccountMEME",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMarginAccountMEME.pending, (state, action) => {
      state.status = action.meta.requestStatus;
    });
    builder.addCase(fetchMarginAccountMEME.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch margin account");
    });
    builder.addCase(fetchMarginAccountMEME.fulfilled, (state, action) => {
      state.status = action.meta.requestStatus;
      state.fetchedAt = new Date().toString();
      // if (!action.payload?.account_id) return;
      const { account_id, margin_positions, supplied } = action.payload || {};
      state.account_id = account_id || "";
      state.margin_positions = margin_positions || {};
      state.supplied = supplied || [];
    });
  },
});

export default marginAccountSliceMEME.reducer;
