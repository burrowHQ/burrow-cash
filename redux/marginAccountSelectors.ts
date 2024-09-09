import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./store";

export const getMarginAccountSupplied = createSelector(
  (state: RootState) => state.marginAccount,
  (marginAccount) => marginAccount.supplied,
);
export const getMarginAccountPositions = createSelector(
  (state: RootState) => state.marginAccount,
  (marginAccount) => marginAccount.margin_positions,
);
export const getMarginAccount = createSelector(
  (state: RootState) => state.marginAccount,
  (marginAccount) => marginAccount,
);
