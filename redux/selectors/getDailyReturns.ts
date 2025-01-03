import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { hasAssets } from "../utils";
import { isMemeCategory } from "../../utils";
import { getExtraDailyTotals } from "./getExtraDailyTotals";
import { getAccountRewards, getGains } from "./getAccountRewards";

export const getDailyReturns = (memeCategory) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    getExtraDailyTotals({ isStaking: false, memeCategory }),
    getAccountRewards(memeCategory),
    (assetsMain, assetsMEME, accountMain, accountMEME, extraDaily, rewards) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = isMemeCategory();
      } else {
        isMeme = memeCategory;
      }
      let assets: typeof assetsMain;
      let account: typeof accountMain;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
      } else {
        assets = assetsMain;
        account = accountMain;
      }
      if (!hasAssets(assets)) return 0;
      const [gainCollateral] = getGains(account.portfolio, assets, "collateral");
      const [gainSupplied] = getGains(account.portfolio, assets, "supplied");
      const [gainBorrowed] = getGains(account.portfolio, assets, "borrowed");
      const netTvlDaily = Object.entries(rewards.net).reduce(
        (acc, [, { dailyAmount, price }]) => acc + dailyAmount * price,
        0,
      );
      const netGains =
        (gainCollateral + gainSupplied + extraDaily * 365 + netTvlDaily * 365 - gainBorrowed) / 365;
      return netGains;
    },
  );
};
