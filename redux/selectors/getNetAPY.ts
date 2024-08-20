import { createSelector } from "@reduxjs/toolkit";

import Decimal from "decimal.js";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { getExtraDailyTotals } from "./getExtraDailyTotals";
import { getAccountRewards, getGains, getGainsArr } from "./getAccountRewards";
import { getProtocolRewards } from "./getProtocolRewards";

export const getNetAPY = ({ isStaking = false }: { isStaking: boolean }) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (state: RootState) => state.app,
    getExtraDailyTotals({ isStaking }),
    (assets, account, app, extraDaily) => {
      if (!hasAssets(assets)) return 0;
      const { amount } = app.staking;
      const booster_token_asset = assets.data[app.config.booster_token_id];
      const { borrows, collaterals } = account?.portfolio || {};
      const [gainBorrowed, totalBorrowed] = getGainsArr(borrows, assets);
      const [gainCollateral, totalCollateral] = getGainsArr(collaterals, assets);
      const [gainSupplied, totalSupplied] = getGains(account.portfolio, assets, "supplied");

      const gainExtra = extraDaily * 365;

      const netGains = gainCollateral + gainSupplied + gainExtra - gainBorrowed;
      const netTotals =
        totalCollateral +
        totalSupplied -
        totalBorrowed -
        (isStaking ? Number(amount || 0) * (booster_token_asset.price?.usd || 0) : 0);
      const netAPY = (netGains / netTotals) * 100;

      return netAPY || 0;
    },
  );

export const getNetTvlAPY = ({ isStaking = false }) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (state: RootState) => state.app,
    getAccountRewards,
    (assets, account, app, rewards) => {
      if (!hasAssets(assets)) return 0;
      const { amount } = app.staking;
      const booster_token_asset = assets.data[app.config.booster_token_id];
      const [, totalSupplied] = getGains(account.portfolio, assets, "supplied");
      const [, totalCollateral] = getGainsArr(account.portfolio.collaterals, assets);
      const [, totalBorrowed] = getGainsArr(account.portfolio.borrows, assets);

      const netTvlRewards = Object.values(rewards.net).reduce(
        (acc, r) => acc + (isStaking ? r.newDailyAmount : r.dailyAmount) * r.price,
        0,
      );
      const netLiquidity =
        totalCollateral +
        totalSupplied -
        totalBorrowed -
        (isStaking ? Number(amount || 0) * (booster_token_asset.price?.usd || 0) : 0);
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
