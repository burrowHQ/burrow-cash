import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initialState } from "./marginAccountState";
import getMarginAccount from "../api/get-margin-account";

export const fetchMarginAccount = createAsyncThunk("marginAccount/fetchMarginAccount", async () => {
  const account = await getMarginAccount();
  return account;
});

export const marginAccountSlice = createSlice({
  name: "marginAccount",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMarginAccount.pending, (state, action) => {
      state.status = action.meta.requestStatus;
    });
    builder.addCase(fetchMarginAccount.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch margin account");
    });
    builder.addCase(fetchMarginAccount.fulfilled, (state, action) => {
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

export default marginAccountSlice.reducer;
