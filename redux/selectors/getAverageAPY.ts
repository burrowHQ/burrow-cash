import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { getGains, getGainsArr } from "./getAccountRewards";

export const getAverageAPY = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, accountMain, accountMEME, category) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = category.activeCategory == "meme";
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
      const [gainCollateral, totalCollateral] = getGainsArr(account.portfolio.collaterals, assets);
      const [gainSupplied, totalSupplied] = getGains(account.portfolio, assets, "supplied");
      const [gainBorrowed, totalBorrowed] = getGainsArr(account.portfolio.borrows, assets);
      const suplyGains = gainCollateral + gainSupplied;
      const supplyTotals = totalCollateral + totalSupplied;
      const averageSupplyApy = supplyTotals > 0 ? (suplyGains / supplyTotals) * 100 : 0;
      const averageBorrowedApy = totalBorrowed > 0 ? (gainBorrowed / totalBorrowed) * 100 : 0;
      return { averageSupplyApy, averageBorrowedApy };
    },
  );
};
