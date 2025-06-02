import { createSelector } from "@reduxjs/toolkit";

import { shrinkToken, PERCENT_DIGITS, NEAR_DECIMALS } from "../store";
import type { RootState } from "./store";

export const getAccountId = createSelector(
  (state: RootState) => state.account,
  (account) => account.accountId,
);
export const getAccountCategory = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.category,
    (accountMain, accountMeme, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      let account: typeof accountMain;
      if (isMeme) {
        account = accountMeme;
      } else {
        account = accountMain;
      }
      return account;
    },
  );
};

export const getAccountPortfolio = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.category,
    (accountMain, accountMEME, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      let account: typeof accountMain;
      if (isMeme) {
        account = accountMEME;
      } else {
        account = accountMain;
      }
      return account.portfolio;
    },
  );
};

export const getAccountBalance = createSelector(
  (state: RootState) => state.account.balances,
  (balances) => {
    return balances?.near ? shrinkToken(balances?.near, NEAR_DECIMALS, PERCENT_DIGITS) : "...";
  },
);

export const getTotalAccountBalance = createSelector(
  (state: RootState) => state.account.balances,
  (balances) => {
    return shrinkToken(balances?.totalNear || 0, NEAR_DECIMALS);
  },
);

export const isAccountLoading = createSelector(
  (state: RootState) => state.account,
  (account) => account.status === "pending",
);

export const isClaiming = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (accountMain, accountMeme) => {
      const isMeme = !!memeCategory;
      let account: typeof accountMain;
      if (isMeme) {
        account = accountMeme;
      } else {
        account = accountMain;
      }
      const status = account.isClaiming == "pending";
      return status;
    },
  );
};

export const getHasNonFarmedAssets = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.category,
    (accountMain, accountMEME, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      let account: typeof accountMain;
      if (isMeme) {
        account = accountMEME;
      } else {
        account = accountMain;
      }
      return account.portfolio.hasNonFarmedAssets;
    },
  );
};
