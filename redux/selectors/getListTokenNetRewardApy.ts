import { createSelector } from "@reduxjs/toolkit";
import Decimal from "decimal.js";
import { RootState } from "../store";
import { shrinkToken } from "../../store";
import { Farm } from "../accountState";
import { filterAccountSentOutFarms, standardizeAsset } from "../../utils/index";

export const getListTokenNetRewardApy = () =>
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
      const { supplied, collateral, borrowed, farms } = account.portfolio;
      const tokenNetFarms = farms.tokennetbalance || {};
      const list = Object.entries(tokenNetFarms)
        .map(([tokenId, farm]: [string, Farm]) => {
          const asset = JSON.parse(JSON.stringify(assets.data[tokenId] || {}));
          asset.metadata = standardizeAsset(asset.metadata || {});
          const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
          const curr_farm = Object.entries(filterAccountSentOutFarms(farm));
          const profit = curr_farm
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
              return dailyAmount * (rewardAsset.price?.usd || 0) * 365;
            })
            .reduce((acc, value) => acc + value, 0);
          const principal =
            Number(
              shrinkToken(
                new Decimal(supplied[tokenId]?.balance || 0)
                  .plus(collateral[tokenId]?.balance || 0)
                  .minus(borrowed[tokenId]?.balance || 0)
                  .toFixed(),
                assetDecimals,
              ),
            ) * (asset.price?.usd || 0);
          let apy = 0;
          if (principal > 0) {
            apy = (profit / principal) * 100;
          }

          return { asset, apy, rewardOpen: curr_farm.length > 0 };
        })
        .filter((item) => item.rewardOpen);
      return list;
    },
  );
