import { createSelector } from "@reduxjs/toolkit";

import { shrinkToken } from "../../store";
import { RootState } from "../store";
import { sumReducer } from "../utils";

export const getTotalBRRR = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.app,
    (state: RootState) => state.appMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, accountMain, accountMEME, appMain, appMEME, category) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      let assets: typeof assetsMain;
      let account: typeof accountMain;
      let app: typeof appMain;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
        app = appMEME;
      } else {
        assets = assetsMain;
        account = accountMain;
        app = appMain;
      }
      const brrrTokenId = app.config.booster_token_id;
      if (!account.accountId || !assets.data[brrrTokenId]) return [0, 0];
      const { farms } = account.portfolio;
      const { decimals } = assets.data[brrrTokenId].metadata;
      const unclaimedSupplied = Object.keys(farms.supplied)
        .map((token) => farms.supplied[token]?.[brrrTokenId]?.unclaimed_amount || "0")
        .map((token) => Number(shrinkToken(token, decimals)))
        .reduce(sumReducer, 0);
      const unclaimedBorrowed = Object.keys(farms.borrowed)
        .map((token) => farms.borrowed[token]?.[brrrTokenId]?.unclaimed_amount || "0")
        .map((token) => Number(shrinkToken(token, decimals)))
        .reduce(sumReducer, 0);

      const totalToken = shrinkToken(
        account.portfolio.supplied[brrrTokenId]?.balance || "0",
        decimals,
      );
      const totalBrrr = Number(totalToken);
      return [totalBrrr, unclaimedSupplied + unclaimedBorrowed, totalToken];
    },
  );
};
