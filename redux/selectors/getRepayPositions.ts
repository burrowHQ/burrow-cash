import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { shrinkToken } from "../../store";

export const getRepayPositions = (tokenId: string) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, accountMain, accountMEME, category) => {
      const isMeme = category.activeCategory == "meme";
      let assets: typeof assetsMain;
      let account: typeof accountMain;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
      } else {
        assets = assetsMain;
        account = accountMain;
      }
      if (!hasAssets(assets) || !tokenId) return {};
      const { positions } = account.portfolio;
      const asset = assets.data[tokenId];
      return Object.keys(positions).reduce((acc, position) => {
        return {
          ...acc,
          [position]: shrinkToken(
            positions[position].borrowed[tokenId]?.balance || 0,
            asset.metadata.decimals + asset.config.extra_decimals,
          ),
        };
      }, {});
    },
  );
