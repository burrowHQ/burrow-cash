import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { toUsd, sumReducer, hasAssets } from "../utils";

export const getTotalBalance = ({
  source,
  withNetTvlMultiplier = false,
  memeCategory,
}: {
  source: "borrowed" | "supplied";
  withNetTvlMultiplier?: boolean;
  memeCategory?: boolean;
}) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      let assets: typeof assetsMain;
      if (isMeme) {
        assets = assetsMEME;
      } else {
        assets = assetsMain;
      }
      if (!hasAssets(assets)) return 0;
      return Object.keys(assets.data)
        .map((tokenId) => {
          const asset = assets.data[tokenId];
          const netTvlMultiplier = withNetTvlMultiplier
            ? asset.config.net_tvl_multiplier / 10000
            : 1;

          return (
            toUsd(asset[source].balance, asset) * netTvlMultiplier +
            (source === "supplied" ? toUsd(asset.reserved, asset) * netTvlMultiplier : 0)
          );
        })
        .reduce(sumReducer, 0);
    },
  );
