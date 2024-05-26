import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { shrinkToken } from "../../store";
import { toUsd } from "../utils";
import { AssetsState } from "../assetState";

export const getAverageNetRewardApy = () =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (assets, account) => {
      const [, totalCollateral] = getNetGains(account.portfolio.collaterals, assets);
      const [, totalSupplied] = getNetGains(account.portfolio.supplies, assets);
      const [, totalBorrowed] = getNetGains(account.portfolio.borrows, assets);
      const { netTvl } = account.portfolio.farms;
      const totalNetProfit = Object.entries(netTvl || {})
        .map(([rewardTokenId, farmData]) => {
          const rewardAsset = assets.data[rewardTokenId];
          const rewardAssetDecimals =
            rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
          const boostedShares = Number(shrinkToken(farmData.boosted_shares, rewardAssetDecimals));
          const totalBoostedShares = Number(
            shrinkToken(farmData.asset_farm_reward.boosted_shares, rewardAssetDecimals),
          );
          const totalRewardsPerDay = Number(
            shrinkToken(farmData.asset_farm_reward.reward_per_day, rewardAssetDecimals),
          );
          const dailyAmount =
            totalBoostedShares > 0 ? (boostedShares / totalBoostedShares) * totalRewardsPerDay : 0;
          return dailyAmount * (rewardAsset.price?.usd || 0);
        })
        .reduce((acc, usd) => acc + usd, 0);
      const netLiquidity = totalCollateral + totalSupplied - totalBorrowed;
      return netLiquidity > 0 ? (totalNetProfit / netLiquidity) * 365 * 100 : 0;
    },
  );

export const getNetGains = (tokens: any[], assets: AssetsState) => {
  const res = tokens.map((data) => {
    const asset = assets.data[data.token_id];
    const netTvlMultiplier = asset.config.net_tvl_multiplier / 10000;
    const { balance } = data;
    const apr = Number(data.apr);
    const balanceUSD = toUsd(balance, asset);

    return [balanceUSD * (netTvlMultiplier ? 1 : 0), apr];
  });
  const result = res.reduce(
    ([gain, sum], [balanceUSD, apr]) => [gain + balanceUSD * apr, sum + balanceUSD],
    [0, 0],
  );
  return result;
};
