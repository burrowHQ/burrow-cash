import { createSelector } from "@reduxjs/toolkit";

import { shrinkToken, PERCENT_DIGITS, NEAR_DECIMALS } from "../store";
import type { RootState } from "./store";
import { isMemeCategory } from "../utils";

export const getAccountId = createSelector(
  (state: RootState) => state.account,
  (account) => account.accountId,
);

export const getAccountPortfolio = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (accountMain, accountMEME) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = isMemeCategory();
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

export const isAccountLoading = createSelector(
  (state: RootState) => state.account,
  (account) => account.status === "pending",
);

export const isClaiming = createSelector(
  (state: RootState) => state.account,
  (account) => account.isClaiming === "pending",
);

export const getHasNonFarmedAssets = createSelector(
  (state: RootState) => state.account,
  (account) => account.portfolio.hasNonFarmedAssets,
);
