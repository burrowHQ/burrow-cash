import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { hasAssets } from "../utils";
import { getAccountRewards } from "./getAccountRewards";
import { filterAccountSentOutRewards } from "../../utils/index";

export const getExtraDailyTotals = ({ isStaking = false }: { isStaking: boolean }) =>
  createSelector(
    (state: RootState) => state.assets,
    getAccountRewards,
    (state: RootState) => state.app.config,
    (assets, rewards, config) => {
      if (!hasAssets(assets)) return 0;

      const { extra: extraPending, brrr: brrrPending } = rewards;
      const extra = filterAccountSentOutRewards(extraPending);
      const brrr: any = brrrPending.remaining_rewards !== "0" ? brrrPending : {};
      const gainBrrr =
        (brrr.dailyAmount || 0) * (assets.data[config.booster_token_id]?.price?.usd || 0);

      const gainExtra = Object.keys(extra).reduce((acc, tokenId) => {
        const price = assets.data[tokenId]?.price?.usd || 0;
        const daily = isStaking ? extra[tokenId].newDailyAmount : extra[tokenId].dailyAmount;
        return acc + daily * price;
      }, 0);

      return gainExtra + gainBrrr;
    },
  );
