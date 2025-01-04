import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./store";

export const isMemeCategory = createSelector(
  (state: RootState) => state.category,
  (category) => {
    return category.activeCategory == "meme";
  },
);
