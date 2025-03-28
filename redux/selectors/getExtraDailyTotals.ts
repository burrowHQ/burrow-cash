import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { hasAssets } from "../utils";
import { filterAccountSentOutRewards } from "../../utils";
import { getAccountRewards } from "./getAccountRewards";

export const getExtraDailyTotals = ({
  isStaking = false,
  memeCategory,
}: {
  isStaking: boolean;
  memeCategory?: boolean;
}) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.category,
    getAccountRewards(memeCategory),
    (assetsMain, assetsMEME, category, rewards) => {
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
      const { poolRewards: poolRewardsPending } = rewards;
      const poolRewards = filterAccountSentOutRewards(poolRewardsPending);
      const gainExtra = Object.keys(poolRewards).reduce((acc, tokenId) => {
        const price = assets.data[tokenId]?.price?.usd || 0;
        const daily = isStaking
          ? poolRewards[tokenId].newDailyAmount
          : poolRewards[tokenId].dailyAmount;
        return acc + daily * price;
      }, 0);

      return gainExtra;
    },
  );
