import { createSelector } from "@reduxjs/toolkit";

import Decimal from "decimal.js";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { getExtraDailyTotals } from "./getExtraDailyTotals";
import { getAccountRewards, getGains } from "./getAccountRewards";
import { getProtocolRewards } from "./getProtocolRewards";
import { shrinkToken } from "../../store/helper";
import { filterAccountSentOutRewards } from "../../utils";

export const getNetAPY = ({ isStaking = false }: { isStaking: boolean }) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    getExtraDailyTotals({ isStaking }),
    (assets, account, extraDaily) => {
      if (!hasAssets(assets)) return 0;

      const [gainCollateral, totalCollateral] = getGains(account.portfolio, assets, "collateral");
      const [gainSupplied, totalSupplied] = getGains(account.portfolio, assets, "supplied");
      const [gainBorrowed, totalBorrowed] = getGains(account.portfolio, assets, "borrowed");

      const gainExtra = extraDaily * 365;

      const netGains = gainCollateral + gainSupplied + gainExtra - gainBorrowed;
      const netTotals = totalCollateral + totalSupplied - totalBorrowed;
      const netAPY = (netGains / netTotals) * 100;

      return netAPY || 0;
    },
  );

export const getNetTvlAPY = ({ isStaking = false }) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    getAccountRewards,
    (assets, account, rewards) => {
      if (!hasAssets(assets)) return 0;

      const [, totalCollateral] = getGains(account.portfolio, assets, "collateral");
      const [, totalSupplied] = getGains(account.portfolio, assets, "supplied");
      const [, totalBorrowed] = getGains(account.portfolio, assets, "borrowed");
      const net = filterAccountSentOutRewards(rewards.net);
      const netTvlRewards = Object.values(net).reduce(
        (acc, r) => acc + (isStaking ? r.newDailyAmount : r.dailyAmount) * r.price,
        0,
      );
      const netLiquidity = totalCollateral + totalSupplied - totalBorrowed;
      let apy;
      if (new Decimal(netLiquidity).gt(0)) {
        apy = ((netTvlRewards * 365) / netLiquidity) * 100;
      }
      return apy || 0;
    },
  );

export const getTotalNetTvlAPY = createSelector(getProtocolRewards, (rewards) => {
  if (!rewards.length) return 0;
  const totalDailyNetTvlRewards = rewards.reduce((acc, r) => {
    if (r.boosted_shares > 0) {
      acc = acc.plus(new Decimal(r.dailyAmount * r.price * 365).div(r.boosted_shares).mul(100));
    }
    return acc;
  }, new Decimal(0));
  return totalDailyNetTvlRewards.toNumber();
});
