import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const getAssets = createSelector(
  (state: RootState) => state.assets,
  (state: RootState) => state.assetsMEME,
  (assetsMain, assetsMEME) => {
    return {
      assetsMain,
      assetsMEME,
    };
  },
);
