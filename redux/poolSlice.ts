import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { get_pool_list } from "../api/get-pool";
import { initialState } from "./poolState";

export const fetchAllPools = createAsyncThunk("poolData/fetchAllPools", async () => {
  const classicPools = await await get_pool_list("classic");
  const dclPools = await await get_pool_list("dcl");
  const stablePools = await await get_pool_list("stable");
  const degenPools = await await get_pool_list("degen");
  return {
    classicPools,
    dclPools,
    stablePools,
    degenPools,
  };
});

export const dclSlice = createSlice({
  name: "poolData",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchAllPools.pending, (state) => {
      state.status = "fetching";
    });
    builder.addCase(fetchAllPools.fulfilled, (state, action) => {
      const { classicPools, dclPools, stablePools, degenPools } = action.payload;
      state.classicPools = classicPools;
      state.dclPools = dclPools;
      state.stablePools = stablePools;
      state.degenPools = degenPools;
      state.status = action.meta.requestStatus;
    });
    builder.addCase(fetchAllPools.rejected, (state, action) => {
      state.status = action.meta.requestStatus;
      console.error(action.payload);
      throw new Error("Failed to fetch pools");
    });
  },
});

export default dclSlice.reducer;
