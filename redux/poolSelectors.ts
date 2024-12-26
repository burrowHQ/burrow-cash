import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./store";

export const getDclPools = createSelector(
  (state: RootState) => state.poolData,
  (poolData) => poolData.dclPools,
);

export const getClassicPools = createSelector(
  (state: RootState) => state.poolData,
  (poolData) => poolData.classicPools,
);
export const getStablePools = createSelector(
  (state: RootState) => state.poolData,
  (poolData) => poolData.stablePools,
);

export const getDegenPools = createSelector(
  (state: RootState) => state.poolData,
  (poolData) => poolData.degenPools,
);

export const getAllPools = createSelector(
  (state: RootState) => state.poolData,
  (poolData) =>
    (poolData.degenPools || [])
      .concat(poolData.stablePools || [])
      .concat(poolData.dclPools || [])
      .concat(poolData.classicPools || []),
);
