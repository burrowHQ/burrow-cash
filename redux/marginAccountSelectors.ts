import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./store";

export const getMarginAccountSupplied = createSelector(
  (state: RootState) => state.marginAccount,
  (marginAccount) => marginAccount.supplied,
);
export const getMarginAccountSuppliedMEME = createSelector(
  (state: RootState) => state.marginAccountMEME,
  (marginAccountMEME) => marginAccountMEME.supplied,
);
export const getMarginAccountPositions = createSelector(
  (state: RootState) => state.marginAccount,
  (marginAccount) => marginAccount.margin_positions,
);
export const getMarginAccountPositionsMEME = createSelector(
  (state: RootState) => state.marginAccountMEME,
  (marginAccountMEME) => marginAccountMEME.margin_positions,
);

export const getMarginAccountMEME = createSelector(
  (state: RootState) => state.marginAccountMEME,
  (marginAccountMEME) => marginAccountMEME,
);

export const getMarginAccount = createSelector(
  (state: RootState) => state.marginAccount,
  (marginAccount) => marginAccount,
);
