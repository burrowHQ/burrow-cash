import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { shrinkToken } from "../../store";
import { toUsd } from "../utils";
import { Portfolio } from "../accountState";
import { AssetsState } from "../assetState";
import { filterAccountSentOutFarms } from "../../utils/index";

export const getAverageNetRewardApy = () =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (assets, account) => {
      const [, totalCollateral] = getNetGains(account.portfolio, assets, "collateral");
      const [, totalSupplied] = getNetGains(account.portfolio, assets, "supplied");
      const [, totalBorrowed] = getNetGains(account.portfolio, assets, "borrowed");
      const { netTvl } = account.portfolio.farms;
      const totalNetProfit = Object.entries(filterAccountSentOutFarms(netTvl || {}))
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
export const getNetGains = (
  portfolio: Portfolio,
  assets: AssetsState,
  source: "supplied" | "collateral" | "borrowed",
) =>
  Object.keys(portfolio[source])
    .map((id) => {
      const asset = assets.data[id];
      const netTvlMultiplier = (asset?.config.net_tvl_multiplier || 0) / 10000;

      const { balance } = portfolio[source][id];
      const apr = Number(portfolio[source][id].apr);
      const balanceUSD = toUsd(balance, asset);

      return [balanceUSD * (netTvlMultiplier ? 1 : 0), apr];
    })
    .reduce(
      ([gain, sum], [balanceUSD, apr]) => [gain + balanceUSD * apr, sum + balanceUSD],
      [0, 0],
    );
