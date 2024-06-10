import { createSelector } from "@reduxjs/toolkit";

import { shrinkToken, PERCENT_DIGITS } from "../../store";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { toDecimal } from "../../utils/uiNumber";
import { lpTokenPrefix, DEFAULT_POSITION } from "../../utils/config";

export const getCollateralAmount = (tokenId: string) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (assets, account) => {
      if (!hasAssets(assets)) return "0";
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
    },
  );
