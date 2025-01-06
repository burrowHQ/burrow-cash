import { createSelector } from "@reduxjs/toolkit";
import { isEmpty } from "lodash";
import { RootState } from "../store";
import { getTokennetMarketAPY } from "../../hooks/useRewards";
import { AssetsState } from "../assetState";

export const getMarketRewardsData = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      let assets: typeof assetsMain;
      if (isMeme) {
        assets = assetsMEME;
      } else {
        assets = assetsMain;
      }
      const result = getMarketRewardsDataUtil(assets);
      return result;
    },
  );
};

export function getMarketRewardsDataUtil(assets: AssetsState) {
  const allFarms = assets?.allFarms;
  if (!allFarms || !assets?.data) return {};
  const { tokenNetBalance } = allFarms;
  // filter ended farms
  const newTokenNetBalance = {};
  Object.entries(tokenNetBalance || {}).forEach(([assetId, rewards]) => {
    const activeFarms = filterEndedFarms(rewards);
    if (!isEmpty(activeFarms)) {
      newTokenNetBalance[assetId] = activeFarms;
    }
  });
  const tokenNetBalanceMarketFarmData = Object.entries(newTokenNetBalance).map(([assetId]) => {
    const asset = assets.data[assetId];
    return {
      asset,
      marketAPY: getTokennetMarketAPY(asset, assets),
    };
  });
  // eslint-disable-next-line consistent-return
  return {
    tokenNetBalance: tokenNetBalanceMarketFarmData,
    booster_log_base: getBoosterLogBaseFromFarms(newTokenNetBalance),
  };
}
function filterEndedFarms(rewards: any) {
  const newRewards = {};
  Object.entries(rewards).forEach(([rewardId, rewardData]: any) => {
    if (rewardData.remaining_rewards !== "0") {
      newRewards[rewardId] = rewardData;
    }
  });
  return newRewards;
}
function getBoosterLogBaseFromFarms(marketFarms) {
  const farms = Object.values(marketFarms)?.[0];
  const farm = Object.values(farms || {})?.[0];
  if (farm) {
    return farm.booster_log_base;
  }
  return "";
}
