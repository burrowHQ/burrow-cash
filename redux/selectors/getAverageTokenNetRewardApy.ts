import { createSelector } from "@reduxjs/toolkit";
import Decimal from "decimal.js";
import { RootState } from "../store";
import { shrinkToken } from "../../store";
import { Farm } from "../accountState";
import { filterAccountSentOutFarms } from "../../utils/index";

export const getAverageTokenNetRewardApy = () =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (assets, account) => {
      const { supplied, collateral, borrowed, farms } = account.portfolio;
      const tokenNetFarms = farms.tokennetbalance || {};
      const [dailyTotalTokenNetProfit, totalTokenNet] = Object.entries(tokenNetFarms)
        .map(([tokenId, farm]: [string, Farm]) => {
          const asset = assets.data[tokenId];
          const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
          const profit = Object.entries(filterAccountSentOutFarms(farm))
            .map(([rewardTokenId, farmData]) => {
              const rewardAsset = assets.data[rewardTokenId];
              const rewardAssetDecimals =
                rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
              const boostedShares = Number(shrinkToken(farmData.boosted_shares, assetDecimals));
              const totalBoostedShares = Number(
                shrinkToken(farmData.asset_farm_reward.boosted_shares, assetDecimals),
              );
              const totalRewardsPerDay = Number(
                shrinkToken(farmData.asset_farm_reward.reward_per_day, rewardAssetDecimals),
              );
              const dailyAmount =
                totalBoostedShares > 0
                  ? (boostedShares / totalBoostedShares) * totalRewardsPerDay
                  : 0;
              return dailyAmount * (rewardAsset.price?.usd || 0);
            })
            .reduce((acc, value) => acc + value, 0);
          const balance = Number(
            shrinkToken(
              new Decimal(supplied[tokenId]?.balance || 0)
                .plus(collateral[tokenId]?.balance || 0)
                .minus(borrowed[tokenId]?.balance || 0)
                .toFixed(),
              assetDecimals,
            ),
          );
          return { dailyProfit: profit, principal: balance * (asset.price?.usd || 0) };
        })
        .reduce(
          (acc, data) => {
            return [acc[0] + data.dailyProfit, acc[1] + data.principal];
          },
          [0, 0],
        );
      return totalTokenNet > 0 ? (dailyTotalTokenNetProfit / totalTokenNet) * 365 * 100 : 0;
    },
  );
