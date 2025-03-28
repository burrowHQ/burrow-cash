import { createSelector } from "@reduxjs/toolkit";

import { shrinkToken, PERCENT_DIGITS, PERCENT_DIGITS_BTC } from "../../store";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { toDecimal } from "../../utils/uiNumber";
import { lpTokenPrefix, DEFAULT_POSITION } from "../../utils/config";

export const getCollateralAmount = (tokenId: string, memeCategory?: boolean) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, accountMain, accountMEME, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
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

      if (!hasAssets(assets)) return "0";
      try {
        // TODO33
        const { metadata, config } = assets.data[tokenId];
        const position = tokenId.indexOf(lpTokenPrefix) > -1 ? tokenId : DEFAULT_POSITION;
        const collateral = account.portfolio.positions[position]?.collateral?.[tokenId];
        if (!collateral) return "0";
        return toDecimal(
          shrinkToken(
            collateral.balance || 0,
            metadata.decimals + config.extra_decimals,
            tokenId.indexOf("nbtc") > -1 ? PERCENT_DIGITS_BTC : PERCENT_DIGITS,
          ),
        );
      } catch (error) {}
    },
  );
