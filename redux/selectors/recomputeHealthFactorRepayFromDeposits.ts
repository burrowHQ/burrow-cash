import Decimal from "decimal.js";
import { clone } from "ramda";
import { createSelector } from "@reduxjs/toolkit";

import { expandTokenDecimal, MAX_RATIO } from "../../store";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { getAdjustedSum } from "./getWithdrawMaxAmount";
import { decimalMax, isMemeCategory } from "../../utils";

export const recomputeHealthFactorRepayFromDeposits = (
  tokenId: string,
  amount: number,
  position: string,
) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (assetsMain, assetsMEME, accountMain, accountMEME) => {
      const isMeme = isMemeCategory();
      let assets;
      let account;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
      } else {
        assets = assetsMain;
        account = accountMain;
      }
      if (!hasAssets(assets)) return { healthFactor: 0, maxBorrowValue: 0 };
      if (
        !account.portfolio ||
        !tokenId ||
        !account.portfolio.positions[position]?.borrowed?.[tokenId]
      )
        return { healthFactor: 0, maxBorrowValue: 0 };
      const asset = assets.data[tokenId];
      const { metadata, config } = asset;
      const decimals = metadata.decimals + config.extra_decimals;
      const amountDecimal = expandTokenDecimal(amount, decimals);
      // new borrowed balance
      const borrowedBalance = new Decimal(
        account.portfolio.positions[position].borrowed[tokenId].balance,
      );
      const newBorrowedBalance = decimalMax(0, borrowedBalance.minus(amountDecimal));

      const clonedAccount = clone(account);
      // update borrowed balance in position
      clonedAccount.portfolio.positions[position].borrowed[tokenId].balance =
        newBorrowedBalance.toFixed();
      const adjustedCollateralSum = getAdjustedSum(
        "collateral",
        account.portfolio,
        assets.data,
        position,
      );
      const adjustedBorrowedSum = getAdjustedSum(
        "borrowed",
        clonedAccount.portfolio,
        assets.data,
        position,
      );
      const maxBorrowValue = adjustedCollateralSum.sub(adjustedBorrowedSum);
      const healthFactorTemp = adjustedCollateralSum.div(adjustedBorrowedSum).mul(100).toNumber();
      const healthFactor = healthFactorTemp < MAX_RATIO ? healthFactorTemp : MAX_RATIO;
      return { healthFactor, maxBorrowValue };
    },
  );
