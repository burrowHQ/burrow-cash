import { clone } from "ramda";

import { createSelector } from "@reduxjs/toolkit";
import { expandTokenDecimal } from "../../store/helper";
import { MAX_RATIO } from "../../store";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { getAdjustedSum } from "./getWithdrawMaxAmount";
import { DEFAULT_POSITION } from "../../utils/config";

export const recomputeHealthFactorAdjust = (tokenId: string, amount: number) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, accountMain, accountMEME, category) => {
      const isMeme = category.activeCategory == "meme";
      let assets: typeof assetsMain;
      let account: typeof accountMain;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
      } else {
        assets = assetsMain;
        account = accountMain;
      }
      if (!hasAssets(assets)) return { healthFactor: 0, maxBorrowValue: 0 };
      if (!account.portfolio || !tokenId) return { healthFactor: 0, maxBorrowValue: 0 };
      const asset = assets.data[tokenId];
      const { metadata, config, isLpToken } = asset;
      const position = isLpToken ? tokenId : DEFAULT_POSITION;

      const decimals = metadata.decimals + config.extra_decimals;

      const newBalance = expandTokenDecimal(amount, decimals).toFixed();

      const clonedAccount = clone(account);

      if (!clonedAccount.portfolio.positions[position]) {
        clonedAccount.portfolio.positions[position] = {
          collateral: {
            [tokenId]: {
              balance: newBalance,
              shares: newBalance,
              apr: "0",
            },
          },
          borrowed: {},
        };
      } else if (!clonedAccount.portfolio.positions[position].collateral[tokenId]) {
        clonedAccount.portfolio.positions[position].collateral[tokenId] = {
          balance: newBalance,
          shares: newBalance,
          apr: "0",
        };
      }
      // if (!clonedAccount.portfolio.collateral[tokenId]) {
      //   clonedAccount.portfolio.collateral[tokenId] = {
      //     balance: newBalance,
      //     shares: newBalance,
      //     apr: "0",
      //   };
      // }
      clonedAccount.portfolio.positions[position].collateral[tokenId] = {
        ...clonedAccount.portfolio.positions[position].collateral[tokenId],
        balance: newBalance,
        shares: newBalance,
      };

      const adjustedCollateralSum = getAdjustedSum(
        "collateral",
        clonedAccount.portfolio,
        assets.data,
        position,
      );
      const adjustedBorrowedSum = getAdjustedSum(
        "borrowed",
        account.portfolio,
        assets.data,
        position,
      );

      const maxBorrowValue = adjustedCollateralSum.sub(adjustedBorrowedSum);
      const healthFactorTemp = adjustedCollateralSum.div(adjustedBorrowedSum).mul(100).toNumber();
      const healthFactor = healthFactorTemp < MAX_RATIO ? healthFactorTemp : MAX_RATIO;
      return { healthFactor, maxBorrowValue };
    },
  );
