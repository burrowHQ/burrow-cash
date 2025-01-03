import { createSelector } from "@reduxjs/toolkit";

import { shrinkToken, PERCENT_DIGITS } from "../../store";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { isMemeCategory } from "../../utils";
import { toDecimal } from "../../utils/uiNumber";
import { lpTokenPrefix, DEFAULT_POSITION } from "../../utils/config";

export const getCollateralAmount = (tokenId: string, memeCategory?: boolean) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (assetsMain, assetsMEME, accountMain, accountMEME) => {
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
            PERCENT_DIGITS,
          ),
        );
      } catch (error) {}
    },
  );
