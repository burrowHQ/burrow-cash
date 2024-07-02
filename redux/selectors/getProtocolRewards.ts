import { createSelector } from "@reduxjs/toolkit";

import { shrinkToken } from "../../store";
import { RootState } from "../store";
import { INetTvlFarmReward } from "../../interfaces/asset";
import { filterSentOutFarms } from "../../utils/index";

interface IProtocolReward {
  icon: string;
  name: string;
  symbol: string;
  tokenId: string;
  dailyAmount: number;
  remainingAmount: number;
  price: number;
  boosted_shares: number;
}

export const getProtocolRewardsOld = createSelector(
  (state: RootState) => state.assets,
  (assets) => {
    const rewards = Object.entries(filterSentOutFarms(assets.netTvlFarm)).map(
      ([tokenId, farm]: [string, INetTvlFarmReward]) => {
        const asset = assets.data[tokenId];
        const { name, symbol, icon } = asset.metadata;
        const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;

        const dailyAmount = Number(shrinkToken(farm.reward_per_day, assetDecimals));
        const remainingAmount = Number(shrinkToken(farm.remaining_rewards, assetDecimals));
        const boosted_shares = Number(shrinkToken(farm.boosted_shares, 18));
        return {
          icon,
          name,
          symbol,
          tokenId,
          dailyAmount,
          remainingAmount,
          price: asset.price?.usd || 0,
          boosted_shares,
        } as IProtocolReward;
      },
    );

    return rewards;
  },
);
export const getProtocolRewards = createSelector(
  (state: RootState) => state.assets,
  (assets) => {
    const tokenNetBalanceRewards = Object.entries(assets.allFarms?.tokenNetBalance || {}).reduce(
      (acc, cur) => {
        const [assetId, rewards] = cur;
        const rewardList: IProtocolReward[] = [];
        Object.entries(rewards).forEach(([rewardId, farmData]: [string, INetTvlFarmReward]) => {
          if (farmData.remaining_rewards !== "0") {
            const rewardAsset = assets.data[rewardId];
            const { name, symbol, icon } = rewardAsset.metadata;
            const rewardAssetDecimals =
              rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
            const dailyAmount = Number(shrinkToken(farmData.reward_per_day, rewardAssetDecimals));
            const remainingAmount = Number(
              shrinkToken(farmData.remaining_rewards, rewardAssetDecimals),
            );
            const boosted_shares = Number(shrinkToken(farmData.boosted_shares, 18));
            rewardList.push({
              icon,
              name,
              symbol,
              tokenId: assetId,
              dailyAmount,
              remainingAmount,
              price: rewardAsset.price?.usd || 0,
              boosted_shares,
            });
          }
        });
        return [...acc, ...rewardList];
      },
      [] as IProtocolReward[],
    );
    return tokenNetBalanceRewards;
  },
);

export const getNetLiquidityRewards = createSelector(
  (state: RootState) => state.assets,
  (assets) => {
    const rewards = Object.entries(assets.netTvlFarm).map(
      ([tokenId, farm]: [string, INetTvlFarmReward]) => {
        const asset = assets.data[tokenId];
        const { metadata, config, price } = asset;
        return {
          rewards: farm,
          metadata,
          config,
          price: price?.usd ?? 0,
        };
      },
    );

    return rewards;
  },
);
