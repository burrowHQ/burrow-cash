import { createSelector } from "@reduxjs/toolkit";

import Decimal from "decimal.js";
import { MAX_RATIO } from "../../store";
import { RootState } from "../store";
import { hasAssets, transformAsset } from "../utils";
import { Assets } from "../assetState";
import { Portfolio } from "../accountState";
import { getAdjustedSum } from "./getWithdrawMaxAmount";
import { DEFAULT_POSITION } from "../../utils/config";
import { UIAsset } from "../../interfaces";

export const computeBorrowMaxAmount = (tokenId: string, assets: Assets, account, app) => {
  const { portfolio } = account;
  const asset = assets[tokenId];
  const uiAsset: UIAsset = transformAsset(asset, account, assets, app);
  return Object.keys(portfolio.positions)
    .map((position: string) => {
      const adjustedCollateralSum = getAdjustedSum("collateral", portfolio, assets, position);
      const adjustedBorrowedSum = getAdjustedSum("borrowed", portfolio, assets, position);
      const volatiliyRatio = asset.config.volatility_ratio || 0;
      const price = asset.price?.usd || Infinity;
      const maxBorrowPricedForToken = adjustedCollateralSum
        .sub(adjustedBorrowedSum)
        .mul(volatiliyRatio)
        .div(MAX_RATIO)
        .mul(95)
        .div(100);
      const maxBorrowAmountTemp = maxBorrowPricedForToken.div(price);
      const maxBorrowAmount = Decimal.min(
        Math.max(0, maxBorrowAmountTemp.toNumber()),
        uiAsset.availableLiquidity || 0,
      );
      const maxBorrowPriced = adjustedCollateralSum.sub(adjustedBorrowedSum);
      return {
        [position]: {
          maxBorrowAmount: Math.max(maxBorrowAmount.toNumber(), 0),
          maxBorrowValue: Math.max(maxBorrowPriced.toNumber(), 0),
        },
      };
    })
    .reduce((acc, cur) => ({ ...acc, ...cur }), {});
};

export const getBorrowMaxAmount = (tokenId: string) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (state: RootState) => state.app,
    (assets, account, app) => {
      if (!account.accountId || !tokenId)
        return { [DEFAULT_POSITION]: { maxBorrowAmount: 0, maxBorrowValue: 0 } };
      if (!hasAssets(assets))
        return { [DEFAULT_POSITION]: { maxBorrowAmount: 0, maxBorrowValue: 0 } };
      const maxBorrowAmount = computeBorrowMaxAmount(tokenId, assets.data, account, app);
      return maxBorrowAmount;
    },
  );
