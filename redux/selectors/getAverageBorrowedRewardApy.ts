import { createSelector } from "@reduxjs/toolkit";
import Decimal from "decimal.js";
import { RootState } from "../store";
import { shrinkToken } from "../../store";
import { isMemeCategory, filterAccountSentOutFarms } from "../../utils";
import { Farm } from "../accountState";

export const getAverageBorrowedRewardApy = () =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (assetsMain, assetsMEME, accountMain, accountMEME) => {
      const isMeme = isMemeCategory();
      let assets: typeof assetsMain;
      let account: typeof accountMain;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
      } else {
        assets = assetsMain;
        account = accountMain;
      }

      const { borrows, farms } = account.portfolio;
      const borrowFarms = farms.borrowed || {};
      const [dailyTotalBorrowProfit, totalBorrow] = Object.entries(borrowFarms)
        .map(([tokenId, farm]: [string, Farm]) => {
          const asset = assets.data[tokenId];
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
              return dailyAmount * (rewardAsset.price?.usd || 0);
            })
            .reduce((acc, value) => acc + value, 0);
          const balanceDecimal = borrows
            .filter((b) => b.token_id === tokenId)
            .reduce((acc, cur) => acc.plus(cur.balance), new Decimal(0));
          const balance = Number(shrinkToken(balanceDecimal.toNumber(), assetDecimals));
          return { dailyProfit: profit, principal: balance * (asset.price?.usd || 0) };
        })
        .reduce(
          (acc, data) => {
            return [acc[0] + data.dailyProfit, acc[1] + data.principal];
          },
          [0, 0],
        );
      return totalBorrow > 0 ? (dailyTotalBorrowProfit / totalBorrow) * 365 * 100 : 0;
    },
  );
