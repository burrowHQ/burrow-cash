import Decimal from "decimal.js";
import { clone } from "ramda";
import { createSelector } from "@reduxjs/toolkit";

import { expandTokenDecimal, MAX_RATIO } from "../../store";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { getAdjustedSum } from "./getWithdrawMaxAmount";

export const recomputeHealthFactor = (tokenId: string, amount: number, position: string) =>
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
      const { metadata, config } = asset;
      const decimals = metadata.decimals + config.extra_decimals;
      const clonedAccount = clone(account);
      if (!clonedAccount.portfolio.positions[position]) {
        clonedAccount.portfolio.positions[position] = {
          borrowed: {
            [tokenId]: {
              balance: "0",
              shares: "0",
              apr: "0",
            },
          },
          collateral: {},
        };
      } else if (!clonedAccount.portfolio.positions[position].borrowed[tokenId]) {
        clonedAccount.portfolio.positions[position].borrowed[tokenId] = {
          balance: "0",
          shares: "0",
          apr: "0",
        };
      }
      const newBalance = expandTokenDecimal(amount, decimals)
        .plus(
          new Decimal(clonedAccount.portfolio.positions[position].borrowed[tokenId]?.balance || 0),
        )
        .toFixed();
      clonedAccount.portfolio.positions[position].borrowed[tokenId].balance = newBalance;
      // if (!clonedAccount.portfolio.borrowed[tokenId]) {
      //   clonedAccount.portfolio.borrowed[tokenId] = {
      //     balance: newBalance,
      //     shares: newBalance,
      //     apr: "0",
      //   };
      // }

      // clonedAccount.portfolio.borrowed[tokenId] = {
      //   ...clonedAccount.portfolio.borrowed[tokenId],
      //   balance: newBalance,
      // };

      const portfolio = amount === 0 ? account.portfolio : clonedAccount.portfolio;

      const adjustedCollateralSum = getAdjustedSum(
        "collateral",
        account.portfolio,
        assets.data,
        position,
      );
      const adjustedBorrowedSum = getAdjustedSum("borrowed", portfolio, assets.data, position);

      const maxBorrowValue = adjustedCollateralSum.sub(adjustedBorrowedSum);
      const healthFactorTemp = adjustedCollateralSum.div(adjustedBorrowedSum).mul(100).toNumber();
      const healthFactor = healthFactorTemp < MAX_RATIO ? healthFactorTemp : MAX_RATIO;
      return { healthFactor, maxBorrowValue };
    },
  );
