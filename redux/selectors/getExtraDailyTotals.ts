import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { hasAssets } from "../utils";
import { getAccountRewards } from "./getAccountRewards";

export const getExtraDailyTotals = ({ isStaking = false }: { isStaking: boolean }) =>
  createSelector(
    (state: RootState) => state.assets,
    getAccountRewards,
    (state: RootState) => state.app.config,
    (assets, rewards, config) => {
      if (!hasAssets(assets)) return 0;
      const { poolRewards } = rewards;

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
