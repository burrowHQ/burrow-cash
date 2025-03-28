import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./store";

export const isMemeCategory = createSelector(
  (state: RootState) => state.category,
  (category) => {
    return category.activeCategory == "meme";
  },
);
export const getActiveCategory = createSelector(
  (state: RootState) => state.category,
  (category) => {
    return category.activeCategory;
  },
);
export const getShowDust = createSelector(
  (state: RootState) => state.category,
  (app) => app.showDust,
);
