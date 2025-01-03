/* eslint-disable import/no-cycle */
/* eslint-disable operator-assignment */
import Decimal from "decimal.js";
import { createSelector } from "@reduxjs/toolkit";
import { omit } from "lodash";

import { shrinkToken } from "../../store";
import { RootState } from "../store";
import { Asset, AssetsState } from "../assetState";
import { Farm, FarmData, Portfolio, AccountState, IAccountFarms } from "../accountState";
import { AppState } from "../appSlice";
import { getStaking } from "./getStaking";
import { INetTvlFarmRewards } from "../../interfaces";
import { hasAssets, toUsd, emptySuppliedAsset, emptyBorrowedAsset } from "../utils";
import { cloneObj } from "../../helpers/helpers";
import { getMarketRewardsDataUtil } from "./getMarketRewards";
import {
  standardizeAsset,
  filterAccountSentOutFarms,
  filterAccountAllSentOutFarms,
  isMemeCategory,
} from "../../utils/index";
import { lpTokenPrefix, DEFAULT_POSITION } from "../../utils/config";

export interface IPortfolioReward {
  icon: string;
  name: string;
  symbol: string;
  tokenId: string;
  totalAmount: number;
  dailyAmount: number;
  unclaimedAmount: number;
  unclaimedAmountUSD: number;
  boosterLogBase: number;
  newDailyAmount: number;
  multiplier: number;
  price: number;
  remaining_rewards: string;
  assetTokenId?: string;
}

export interface IAccountRewards {
  brrr: IPortfolioReward;
  extra: {
    [tokenId: string]: IPortfolioReward;
  };
  net: {
    [tokenId: string]: IPortfolioReward;
  };
  sumRewards: {
    [tokenId: string]: IPortfolioReward;
  };
  poolRewards: {
    [tokenId: string]: IPortfolioReward;
  };
  suppliedRewards: IPortfolioReward[];
  borrowedRewards: IPortfolioReward[];
  netLiquidityRewards: IPortfolioReward[];
  tokenNetRewards: IPortfolioReward[];
  totalUnClaimUSD: number;
}

export const getGains = (
  portfolio: Portfolio,
  assets: AssetsState,
  source: "supplied" | "collateral" | "borrowed" | "collateralAll",
  withNetTvlMultiplier = false,
) => {
  const data = portfolio[source];
  const res = Object.keys(data).map((id) => {
    const asset = assets.data[id];
    const netTvlMultiplier = (asset?.config?.net_tvl_multiplier ?? 0) / 10000;

    const { balance } = data[id];
    const apr = Number(data[id].apr);
    const balanceUSD = toUsd(balance, asset);

    return [balanceUSD * (withNetTvlMultiplier ? netTvlMultiplier : 1), apr];
  });
  const result = res.reduce(
    ([gain, sum], [balance, apr]) => [gain + balance * apr, sum + balance],
    [0, 0],
  );
  return result;
};

export const getGainsArr = (tokens: any[], assets: AssetsState, withNetTvlMultiplier = false) => {
  const res = tokens.map((data) => {
    const asset = assets.data[data.token_id];
    const netTvlMultiplier = (asset?.config?.net_tvl_multiplier ?? 0) / 10000;
    const { balance } = data;
    const apr = Number(data.apr);
    const balanceUSD = toUsd(balance, asset);

    return [balanceUSD * (withNetTvlMultiplier ? netTvlMultiplier : 1), apr];
  });
  const result = res.reduce(
    ([gain, sum], [balance, apr]) => [gain + balance * apr, sum + balance],
    [0, 0],
  );
  return result;
};

export const getGainsFromIncentive = (
  portfolio: Portfolio,
  assets: AssetsState,
  source: "supplied" | "borrowed" | "netTvl" | "tokennetbalance",
) => {
  if (source === "netTvl") {
    return Object.entries(filterAccountSentOutFarms(portfolio.farms[source]))
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
      .reduce((sum, p) => sum + p, 0);
  } else {
    return Object.entries(portfolio.farms[source])
      .map(([tokenId, farm]: [string, Farm]) => {
        return Object.entries(filterAccountSentOutFarms(farm))
          .map(([rewardTokenId, farmData]) => {
            const asset = assets.data[tokenId];
            const rewardAsset = assets.data[rewardTokenId];
            const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
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
          .reduce((sum, p) => sum + p, 0);
      })
      .reduce((sum, p) => sum + p, 0);
  }
};

export const getDailyAmount = (
  portfolio: Portfolio,
  assets: AssetsState,
  source: "supplies" | "collaterals" | "borrows",
) => {
  return portfolio[source].map((assetData) => {
    const tokenId = assetData.token_id;
    const asset = assets.data[tokenId];
    const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
    const balance = Number(shrinkToken(assetData.balance, assetDecimals));
    const dailyAmount = new Decimal(balance).mul(assetData.apr).div(365).toNumber();
    return { [tokenId]: dailyAmount };
  });
};
export const getIncentiveDailyAmount = (
  portfolio: Portfolio,
  assets: AssetsState,
  source: "supplied" | "borrowed" | "netTvl" | "tokennetbalance",
) => {
  const result = {};
  if (source === "netTvl") {
    Object.entries(filterAccountSentOutFarms(portfolio.farms[source])).forEach(
      ([rewardTokenId, farmData]) => {
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
        result[rewardTokenId] = new Decimal(result[rewardTokenId] || 0)
          .plus(dailyAmount)
          .toNumber();
      },
    );
  } else {
    Object.entries(portfolio.farms[source]).forEach(([tokenId, farm]: [string, Farm]) => {
      Object.entries(filterAccountSentOutFarms(farm)).forEach(([rewardTokenId, farmData]) => {
        const asset = assets.data[tokenId];
        const rewardAsset = assets.data[rewardTokenId];
        const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
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
          totalBoostedShares > 0 ? (boostedShares / totalBoostedShares) * totalRewardsPerDay : 0;
        result[rewardTokenId] = new Decimal(result[rewardTokenId] || 0)
          .plus(dailyAmount)
          .toNumber();
      });
    });
  }
  return result;
};
export const computePoolsDailyAmount = (
  type: "supplied" | "borrowed" | "tokennetbalance",
  asset: Asset,
  rewardAsset: Asset,
  portfolio: Portfolio,
  xBRRRAmount: number,
  farmData: FarmData,
  boosterDecimals: number,
  boost_suppress_factor: number,
) => {
  // const position = asset.token_id.indexOf(lpTokenPrefix) > -1 ? asset.token_id : DEFAULT_POSITION;
  const boosterLogBase = Number(
    shrinkToken(farmData.asset_farm_reward.booster_log_base, boosterDecimals),
  );
  const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
  const rewardAssetDecimals = rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
  const log = Math.log(xBRRRAmount / boost_suppress_factor) / Math.log(boosterLogBase);
  const multiplier = log >= 0 ? 1 + log : 1;

  const boostedShares = Number(shrinkToken(farmData.boosted_shares, assetDecimals));

  const totalBoostedShares = Number(
    shrinkToken(farmData.asset_farm_reward.boosted_shares, assetDecimals),
  );
  const totalRewardsPerDay = Number(
    shrinkToken(farmData.asset_farm_reward.reward_per_day, rewardAssetDecimals),
  );

  const dailyAmount =
    totalBoostedShares > 0 ? (boostedShares / totalBoostedShares) * totalRewardsPerDay : 0;

  const suppliedShares = Number(
    shrinkToken(portfolio.supplied[asset.token_id]?.shares || 0, assetDecimals),
  );
  const collateralShares = Number(
    shrinkToken(portfolio.collateralAll?.[asset.token_id]?.shares || 0, assetDecimals),
  );
  const borrowedShares = Number(
    shrinkToken(
      portfolio.borrows
        .filter((a) => asset.token_id === a.token_id)
        .reduce((acc, cur) => {
          acc = acc.plus(cur.shares);
          return acc;
        }, new Decimal(0))
        .toFixed(),
      assetDecimals,
    ),
  );
  let shares;
  if (type === "supplied") {
    shares = suppliedShares + collateralShares;
  } else if (type === "borrowed") {
    shares = borrowedShares;
  } else if (type === "tokennetbalance") {
    const suppliedBalance = Number(
      shrinkToken(portfolio.supplied[asset.token_id]?.balance || 0, assetDecimals),
    );
    const collateralBalance = Number(
      shrinkToken(portfolio.collateralAll[asset.token_id]?.balance || 0, assetDecimals),
    );
    const borrowedBalance = Number(
      shrinkToken(
        portfolio.borrows
          .filter((a) => asset.token_id === a.token_id)
          .reduce((acc, cur) => {
            acc = acc.plus(cur.balance);
            return acc;
          }, new Decimal(0))
          .toFixed(),
        assetDecimals,
      ),
    );
    const tokenNetShares = suppliedBalance + collateralBalance - borrowedBalance;
    shares = tokenNetShares;
  }
  const newBoostedShares = shares * multiplier;
  const newTotalBoostedShares = totalBoostedShares + newBoostedShares - boostedShares;
  const newDailyAmount =
    newTotalBoostedShares > 0 ? (newBoostedShares / newTotalBoostedShares) * totalRewardsPerDay : 0;
  return { dailyAmount, newDailyAmount, multiplier, totalBoostedShares, shares };
};

export const computeNetLiquidityDailyAmount = (
  asset: Asset,
  totalxBRRRAmount: number,
  netTvlFarm: INetTvlFarmRewards,
  farmData: FarmData,
  boosterDecimals: number,
  xBRRR: number,
  boost_suppress_factor: number,
) => {
  const boosterLogBase = Number(
    shrinkToken(farmData.asset_farm_reward.booster_log_base, boosterDecimals),
  );

  const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;

  const log = Math.log(totalxBRRRAmount / boost_suppress_factor) / Math.log(boosterLogBase);
  const multiplier = log >= 0 ? 1 + log : 1;

  const boostedShares = Number(shrinkToken(farmData.boosted_shares, assetDecimals));
  const totalBoostedShares = Number(
    shrinkToken(netTvlFarm[asset.token_id]?.boosted_shares || "0", assetDecimals),
  );
  const totalRewardsPerDay = Number(
    shrinkToken(netTvlFarm[asset.token_id]?.reward_per_day || "0", assetDecimals),
  );

  const dailyAmount =
    totalBoostedShares > 0 ? (boostedShares / totalBoostedShares) * totalRewardsPerDay : 0;
  const logStaked = Math.log(xBRRR / boost_suppress_factor) / Math.log(boosterLogBase);
  const multiplierStaked = logStaked >= 0 ? 1 + logStaked : 1;

  const shares = boostedShares / multiplierStaked;

  const newBoostedShares = shares * multiplier;
  const newTotalBoostedShares = totalBoostedShares + newBoostedShares - boostedShares;
  const newDailyAmount =
    newTotalBoostedShares > 0 ? (newBoostedShares / newTotalBoostedShares) * totalRewardsPerDay : 0;

  return { dailyAmount, newDailyAmount, multiplier, totalBoostedShares, shares };
};

export const getAccountRewards = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.app,
    (state: RootState) => state.appMEME,
    getStaking,
    (assetsMain, assetsMEME, accountMain, accountMEME, appMain, appMEME, stakingMain) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = isMemeCategory();
      } else {
        isMeme = memeCategory;
      }

      let assets: typeof assetsMain;
      let account: typeof accountMain;
      let app: typeof appMain;
      let staking;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
        app = appMEME;
        staking = {
          xBRRR: 0,
          extraXBRRRAmount: 0,
        };
      } else {
        assets = assetsMain;
        account = accountMain;
        app = appMain;
        staking = stakingMain;
      }
      const brrrTokenId = app.config.booster_token_id;
      const { xBRRR, extraXBRRRAmount } = staking;
      const xBRRRAmount = xBRRR + extraXBRRRAmount;
      const { borrows, collaterals } = account.portfolio || {};
      const [, totalSupplied] = getGains(account.portfolio, assets, "supplied");
      const [, totalCollateral] = collaterals
        ? getGainsArr(account.portfolio.collaterals, assets)
        : getGains(account.portfolio, assets, "collateral");
      const [, totalBorrowed] = borrows
        ? getGainsArr(account.portfolio.borrows, assets)
        : getGains(account.portfolio, assets, "borrowed");

      const netLiquidity = totalCollateral + totalSupplied - totalBorrowed;
      const computePoolsRewards =
        (type: "supplied" | "borrowed" | "tokennetbalance") =>
        ([tokenId, farm]: [string, Farm]) => {
          return Object.entries(farm).map(([rewardTokenId, farmData]) => {
            const asset = assets.data[tokenId];
            const rewardAsset = assets.data[rewardTokenId];
            const rewardAssetDecimals =
              rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
            const { icon, symbol, name } = rewardAsset.metadata;

            const unclaimedAmount = Number(
              shrinkToken(farmData.unclaimed_amount, rewardAssetDecimals),
            );

            const { dailyAmount, newDailyAmount, multiplier } = computePoolsDailyAmount(
              type,
              asset,
              rewardAsset,
              account.portfolio,
              xBRRRAmount,
              farmData,
              app.config.booster_decimals,
              app.config.boost_suppress_factor,
            );
            return {
              icon,
              name,
              symbol,
              tokenId: rewardTokenId,
              unclaimedAmount,
              dailyAmount,
              newDailyAmount,
              multiplier,
              price: rewardAsset.price?.usd || 0,
              unclaimedAmountUSD: unclaimedAmount * (rewardAsset.price?.usd || 0),
              remaining_rewards: farmData?.asset_farm_reward?.remaining_rewards || "0",
            };
          });
        };

      const computeNetLiquidityRewards = ([rewardTokenId, farmData]: [string, FarmData]) => {
        const rewardAsset = assets.data[rewardTokenId];
        const rewardAssetDecimals =
          rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
        const { icon, symbol, name } = rewardAsset.metadata;
        const unclaimedAmount = Number(shrinkToken(farmData.unclaimed_amount, rewardAssetDecimals));
        const { dailyAmount, newDailyAmount, multiplier } = computeNetLiquidityDailyAmount(
          rewardAsset,
          xBRRRAmount,
          assets.netTvlFarm,
          farmData,
          app.config.booster_decimals,
          xBRRR,
          app.config.boost_suppress_factor,
        );
        return {
          icon,
          name,
          symbol,
          tokenId: rewardTokenId,
          unclaimedAmount,
          dailyAmount,
          newDailyAmount,
          multiplier,
          price: rewardAsset.price?.usd || 0,
          unclaimedAmountUSD: unclaimedAmount * (rewardAsset.price?.usd || 0),
          remaining_rewards: farmData?.asset_farm_reward?.remaining_rewards || "0",
        };
      };
      const { supplied, borrowed, netTvl, tokennetbalance } = account.portfolio.farms;
      const suppliedRewards = Object.entries(supplied).map(computePoolsRewards("supplied")).flat();
      const borrowedRewards = Object.entries(borrowed).map(computePoolsRewards("borrowed")).flat();
      const tokenNetRewards = Object.entries(tokennetbalance)
        .map(computePoolsRewards("tokennetbalance"))
        .flat();
      const netLiquidityRewards = Object.entries(netTvl).map(computeNetLiquidityRewards);
      const sumArrays = (array) => {
        const clonedArray = cloneObj(array);
        return clonedArray.reduce((rewards, asset) => {
          if (!rewards[asset.tokenId]) return { ...rewards, [asset.tokenId]: asset };
          const updatedAsset = rewards[asset.tokenId];
          updatedAsset.unclaimedAmount += asset.unclaimedAmount;
          updatedAsset.dailyAmount += asset.dailyAmount;
          updatedAsset.newDailyAmount += asset.newDailyAmount;
          return { ...rewards, [asset.tokenId]: updatedAsset };
        }, {});
      };
      const allRewards = [
        ...suppliedRewards,
        ...borrowedRewards,
        ...netLiquidityRewards,
        ...tokenNetRewards,
      ];
      const sumRewards = sumArrays(allRewards);
      const poolRewards = sumArrays([...suppliedRewards, ...borrowedRewards, ...tokenNetRewards]);
      let totalUnClaimUSD = 0;
      allRewards.forEach((d) => {
        totalUnClaimUSD += d.unclaimedAmountUSD;
      });
      return {
        brrr: poolRewards[brrrTokenId] || {},
        extra: omit(poolRewards, brrrTokenId) || {},
        poolRewards: poolRewards || {},
        net: netLiquidityRewards.reduce(
          (rewards, asset) => ({ ...rewards, [asset.tokenId]: asset }),
          {},
        ),
        sumRewards,
        totalUnClaimUSD,
      } as IAccountRewards;
    },
  );
};
export const getAccountRewardsForApy = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.app,
    (state: RootState) => state.appMEME,
    getStaking,
    (assetsMain, assetsMEME, accountMain, accountMEME, appMain, appMEME, stakingMain) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = isMemeCategory();
      } else {
        isMeme = memeCategory;
      }
      let assets: typeof assetsMain;
      let account: typeof accountMain;
      let app: typeof appMain;
      let staking;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
        app = appMEME;
        staking = {
          xBRRR: 0,
          extraXBRRRAmount: 0,
        };
      } else {
        assets = assetsMain;
        account = accountMain;
        app = appMain;
        staking = stakingMain;
      }
      const { xBRRR, extraXBRRRAmount } = staking;
      const xBRRRAmount = xBRRR + extraXBRRRAmount;

      const computePoolsRewards =
        (type: "supplied" | "borrowed" | "tokennetbalance") =>
        ([tokenId, farm]: [string, Farm]) => {
          return Object.entries(farm).map(([rewardTokenId, farmData]) => {
            const asset = assets.data[tokenId];
            const rewardAsset = assets.data[rewardTokenId];
            const rewardAssetDecimals =
              rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
            const { icon, symbol, name } = rewardAsset.metadata;

            const unclaimedAmount = Number(
              shrinkToken(farmData.unclaimed_amount, rewardAssetDecimals),
            );

            const { dailyAmount, newDailyAmount, multiplier } = computePoolsDailyAmount(
              type,
              asset,
              rewardAsset,
              account.portfolio,
              xBRRRAmount,
              farmData,
              app.config.booster_decimals,
              app.config.boost_suppress_factor,
            );

            return {
              icon,
              name,
              symbol,
              tokenId: rewardTokenId,
              unclaimedAmount,
              dailyAmount,
              newDailyAmount,
              multiplier,
              price: rewardAsset.price?.usd || 0,
              unclaimedAmountUSD: unclaimedAmount * (rewardAsset.price?.usd || 0),
              assetTokenId: tokenId,
            };
          });
        };

      const computeNetLiquidityRewards = ([rewardTokenId, farmData]: [string, FarmData]) => {
        const rewardAsset = assets.data[rewardTokenId];
        const rewardAssetDecimals =
          rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
        const { icon, symbol, name } = rewardAsset.metadata;
        const unclaimedAmount = Number(shrinkToken(farmData.unclaimed_amount, rewardAssetDecimals));

        const { dailyAmount, newDailyAmount, multiplier } = computeNetLiquidityDailyAmount(
          rewardAsset,
          xBRRRAmount,
          assets.netTvlFarm,
          farmData,
          app.config.booster_decimals,
          xBRRR,
          app.config.boost_suppress_factor,
        );

        return {
          icon,
          name,
          symbol,
          tokenId: rewardTokenId,
          unclaimedAmount,
          dailyAmount,
          newDailyAmount,
          multiplier,
          price: rewardAsset.price?.usd || 0,
          unclaimedAmountUSD: unclaimedAmount * (rewardAsset.price?.usd || 0),
        };
      };

      const { supplied, borrowed, netTvl, tokennetbalance } = filterAccountAllSentOutFarms(
        account.portfolio,
      );
      const hasNetTvlFarm = !!Object.entries(assets.netTvlFarm).length;
      const suppliedRewards = Object.entries(supplied).map(computePoolsRewards("supplied")).flat();
      const borrowedRewards = Object.entries(borrowed).map(computePoolsRewards("borrowed")).flat();
      const tokenNetRewards = Object.entries(tokennetbalance)
        .map(computePoolsRewards("tokennetbalance"))
        .flat();
      const netLiquidityRewards = hasNetTvlFarm
        ? Object.entries(netTvl).map(computeNetLiquidityRewards)
        : [];
      const allRewards = [
        ...suppliedRewards,
        ...borrowedRewards,
        ...tokenNetRewards,
        ...netLiquidityRewards,
      ];
      let totalUnClaimUSD = 0;
      allRewards.forEach((d) => {
        totalUnClaimUSD += d.unclaimedAmountUSD;
      });
      return {
        suppliedRewards,
        borrowedRewards,
        netLiquidityRewards,
        tokenNetRewards,
      } as IAccountRewards;
    },
  );
};
export const getAccountBoostRatioData = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.app,
    (state: RootState) => state.appMEME,
    getStaking,
    (assetsMain, assetsMEME, accountMain, accountMEME, appMain, appMEME, staking) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = isMemeCategory();
      } else {
        isMeme = memeCategory;
      }
      let assets: typeof assetsMain;
      let account: typeof accountMain;
      let app: typeof appMain;
      if (isMeme) {
        assets = assetsMEME;
        account = accountMEME;
        app = appMEME;
      } else {
        assets = assetsMain;
        account = accountMain;
        app = appMain;
      }
      const { booster_log_base: booster_log_base_only_tokenBalance } =
        getMarketRewardsDataUtil(assets);
      const { totalXBRRR, BRRR, amount, totalXBRRRStaked } = staking;
      const xBRRRAmount = totalXBRRR;
      if (!app?.config?.boost_suppress_factor || !app?.config?.booster_decimals)
        return [BRRR, amount, 1, 1];
      const { tokennetbalance, supplied, borrowed } = filterAccountAllSentOutFarms(
        account.portfolio,
      );
      let booster_log_base = getBoosterLogBaseFromAccountFarms(tokennetbalance);
      if (!booster_log_base) {
        booster_log_base = getBoosterLogBaseFromAccountFarms(supplied);
        if (!booster_log_base) {
          booster_log_base = getBoosterLogBaseFromAccountFarms(borrowed);
          if (!booster_log_base) {
            // for no supply situation but has tokenBalance farm on market
            booster_log_base = booster_log_base_only_tokenBalance;
          }
        }
      }
      if (booster_log_base) {
        const boosterLogBase = Number(shrinkToken(booster_log_base, app.config.booster_decimals));
        const log =
          Math.log(xBRRRAmount / app.config.boost_suppress_factor) / Math.log(boosterLogBase);
        const logStaked =
          Math.log(totalXBRRRStaked / app.config.boost_suppress_factor) / Math.log(boosterLogBase);
        const multiplier = log >= 0 ? 1 + log : 1;
        const multiplierStaked = logStaked >= 0 ? 1 + logStaked : 1;
        return [BRRR, amount, multiplier, multiplierStaked];
      }
      return [BRRR, amount, 1, 1];
    },
  );
};
function getBoosterLogBaseFromAccountFarms(accountfarms) {
  const farms = Object.values(accountfarms)?.[0];
  const farm = Object.values(farms || {})?.[0];
  if (farm) {
    return farm.asset_farm_reward?.booster_log_base;
  }
  return "";
}
export const getWeightedNetLiquidity = createSelector(
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
    if (!hasAssets(assets)) return 0;
    const { borrows, collaterals } = account.portfolio || {};
    const [, totalSupplied] = getGains(account.portfolio, assets, "supplied", true);
    const [, totalCollateral] = collaterals
      ? getGainsArr(account.portfolio.collaterals, assets, true)
      : getGains(account.portfolio, assets, "collateral", true);
    const [, totalBorrowed] = borrows
      ? getGainsArr(account.portfolio.borrows, assets, true)
      : getGains(account.portfolio, assets, "borrowed", true);

    const netLiquidity = new Decimal(totalCollateral)
      .plus(totalSupplied)
      .minus(totalBorrowed)
      .toNumber();
    return netLiquidity;
  },
);

export const getWeightedAssets = createSelector(
  (state: RootState) => state.assets,
  (state: RootState) => state.assetsMEME,
  (assetsMain, assetsMEME) => {
    const isMeme = isMemeCategory();
    let assets: typeof assetsMain;
    if (isMeme) {
      assets = assetsMEME;
    } else {
      assets = assetsMain;
    }
    if (!hasAssets(assets)) return [];
    return Object.entries(assets.data)
      .map(([, asset]) => (asset.config.net_tvl_multiplier < 10000 ? asset : undefined))
      .filter(Boolean) as Asset[];
  },
);
export const getAccountDailyRewards = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.app,
    (state: RootState) => state.appMEME,
    (assetsMain, assetsMEME, accountMain, accountMEME, appMain, appMEME) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = isMemeCategory();
      } else {
        isMeme = memeCategory;
      }

      let app: typeof appMain;
      let assets: typeof assetsMain;
      let account: typeof accountMain;
      if (isMeme) {
        app = appMEME;
        assets = assetsMEME;
        account = accountMEME;
      } else {
        app = appMain;
        assets = assetsMain;
        account = accountMain;
      }
      const accountDustProcess = dustProcess({
        accountSource: account,
        assets,
        app,
      });
      const baseCollateralUsdDaily =
        getGainsArr(accountDustProcess.portfolio.collaterals, assets)[0] / 365;
      const baseSuppliedUsdDaily =
        getGains(accountDustProcess.portfolio, assets, "supplied")[0] / 365;
      const baseBorrowedUsdDaily =
        getGainsArr(accountDustProcess.portfolio.borrows, assets)[0] / 365;

      const farmSuppliedUsdDaily = getGainsFromIncentive(account.portfolio, assets, "supplied");
      const farmBorrowedUsdDaily = getGainsFromIncentive(account.portfolio, assets, "borrowed");
      const farmNetTvlUsdDaily = getGainsFromIncentive(account.portfolio, assets, "netTvl");
      const farmTokenNetUsdDaily = getGainsFromIncentive(
        account.portfolio,
        assets,
        "tokennetbalance",
      );

      const baseSuppliedAmountDaily = getDailyAmount(
        accountDustProcess.portfolio,
        assets,
        "supplies",
      );
      const baseCollateralAmountDaily = getDailyAmount(
        accountDustProcess.portfolio,
        assets,
        "collaterals",
      );
      const baseBorrowedAmountDaily = getDailyAmount(
        accountDustProcess.portfolio,
        assets,
        "borrows",
      );

      const farmSuppliedAmountDaily = getIncentiveDailyAmount(
        account.portfolio,
        assets,
        "supplied",
      );
      const farmBorrowedAmountDaily = getIncentiveDailyAmount(
        account.portfolio,
        assets,
        "borrowed",
      );
      const farmCollateralAmountDaily = getIncentiveDailyAmount(
        account.portfolio,
        assets,
        "netTvl",
      );
      const farmTokenNetAmountDaily = getIncentiveDailyAmount(
        account.portfolio,
        assets,
        "tokennetbalance",
      );
      const allGainRewards = [
        ...baseSuppliedAmountDaily,
        ...baseCollateralAmountDaily,
        ...Object.entries(farmSuppliedAmountDaily).reduce(sumMap, []),
        ...Object.entries(farmBorrowedAmountDaily).reduce(sumMap, []),
        ...Object.entries(farmCollateralAmountDaily).reduce(sumMap, []),
        ...Object.entries(farmTokenNetAmountDaily).reduce(sumMap, []),
      ];
      const mergedGainRewards = allGainRewards.reduce((acc, reward) => {
        const [[rewardTokenId, rewardAmount]] = Object.entries(reward);
        if (!acc[rewardTokenId]) return { ...acc, ...reward };
        return { ...acc, [rewardTokenId]: acc[rewardTokenId] + rewardAmount };
      }, {});
      baseBorrowedAmountDaily.forEach((reward) => {
        const [[rewardTokenId, rewardAmount]] = Object.entries(reward);
        mergedGainRewards[rewardTokenId] = (mergedGainRewards[rewardTokenId] || 0) - rewardAmount;
      });
      const allRewards = Object.entries(mergedGainRewards).reduce((acc, [tokenId, amount]) => {
        const assetCopy = JSON.parse(JSON.stringify(assets.data[tokenId] || {}));
        standardizeAsset(assetCopy.metadata || {});
        if (Number(amount) !== 0) {
          return {
            ...acc,
            [tokenId]: {
              amount,
              asset: assetCopy,
            },
          };
        }
        return acc;
      }, {});
      return {
        baseDepositUsdDaily: baseCollateralUsdDaily + baseSuppliedUsdDaily,
        baseBorrowedUsdDaily,

        farmSuppliedUsdDaily,
        farmBorrowedUsdDaily,
        farmNetTvlUsdDaily,
        farmTokenNetUsdDaily,
        farmTotalUsdDaily:
          farmSuppliedUsdDaily + farmBorrowedUsdDaily + farmNetTvlUsdDaily + farmTokenNetUsdDaily,

        totalUsdDaily:
          baseCollateralUsdDaily +
          baseSuppliedUsdDaily -
          baseBorrowedUsdDaily +
          farmSuppliedUsdDaily +
          farmBorrowedUsdDaily +
          farmNetTvlUsdDaily +
          farmTokenNetUsdDaily,

        allRewards,
      };
    },
  );
};

export function filterAccountEndedFarms(userFarms, allFarms): IAccountFarms {
  const { supplied, borrowed, netTvl } = Copy(userFarms);
  const newSupplied = Object.entries(supplied)
    .map(([tokenId, farmData]: any) => {
      const marketFarmData = allFarms.supplied[tokenId];
      const newFarmData = Object.entries(farmData).reduce((sum, [rewardId, rewardData]) => {
        if (marketFarmData[rewardId]) return { ...sum, ...{ [rewardId]: rewardData } };
        return sum;
      }, {});
      return { [tokenId]: newFarmData };
    })
    .reduce((acc, cur) => ({ ...acc, ...cur }), {});
  const newBorrowed = Object.entries(borrowed)
    .map(([tokenId, farmData]: any) => {
      const marketFarmData = allFarms.borrowed[tokenId];
      const newFarmData = Object.entries(farmData).reduce((sum, [rewardId, rewardData]) => {
        if (marketFarmData[rewardId]) return { ...sum, ...{ [rewardId]: rewardData } };
        return sum;
      }, {});
      return { [tokenId]: newFarmData };
    })
    .reduce((acc, cur) => ({ ...acc, ...cur }), {});
  const newNetTvl = Object.entries(netTvl).reduce((sum, [rewardId, rewardData]) => {
    if (allFarms.netTvl[rewardId]) return { ...sum, ...{ [rewardId]: rewardData } };
    return sum;
  }, {});
  return {
    supplied: newSupplied,
    borrowed: newBorrowed,
    netTvl: newNetTvl,
  };
}
function dustProcess({
  accountSource,
  assets,
  app,
}: {
  accountSource: AccountState;
  assets: AssetsState;
  app: AppState;
}) {
  const account = Copy(accountSource);
  const portfolioAssets = {
    ...account.portfolio.supplied,
    ...account.portfolio.collateral,
  };
  const supplied = Object.keys(portfolioAssets)
    .map((tokenId) => {
      const asset = assets.data[tokenId];
      const collateral = shrinkToken(
        account.portfolio.collateral[tokenId]?.balance || 0,
        asset.metadata.decimals + asset.config.extra_decimals,
      );
      const suppliedBalance = shrinkToken(
        account.portfolio.supplied[tokenId]?.balance || 0,
        asset.metadata.decimals + asset.config.extra_decimals,
      );
      const suppliedToken = Number(collateral) + Number(suppliedBalance);
      return {
        tokenId,
        supplied: suppliedToken,
      };
    })
    .filter(app.showDust ? Boolean : emptySuppliedAsset)
    .reduce((acc, cur) => [...acc, cur.tokenId], [] as any);

  const borrowed = Object.keys(account.portfolio.borrowed)
    .map((tokenId) => {
      const asset = assets.data[tokenId];
      const borrowedBalance = account.portfolio.borrowed[tokenId].balance;
      const borrowedToken = Number(
        shrinkToken(borrowedBalance, asset.metadata.decimals + asset.config.extra_decimals),
      );
      return {
        tokenId,
        borrowed: borrowedToken,
      };
    })
    .filter(app.showDust ? Boolean : emptyBorrowedAsset)
    .reduce((acc, cur) => [...acc, cur.tokenId], [] as any);
  const newSupplied = {};
  const newCollateral = {};
  const newBorrowed = {};
  supplied.forEach((tokenId) => {
    if (account.portfolio.supplied[tokenId]) {
      newSupplied[tokenId] = account.portfolio.supplied[tokenId];
    }
    if (account.portfolio.collateral[tokenId]) {
      newCollateral[tokenId] = account.portfolio.collateral[tokenId];
    }
  });
  borrowed.forEach((tokenId) => {
    newBorrowed[tokenId] = account.portfolio.borrowed[tokenId];
  });
  account.portfolio.supplied = newSupplied;
  account.portfolio.collateral = newCollateral;
  account.portfolio.borrowed = newBorrowed;
  return account;
}
function sumMap(acc, rewardData) {
  return [...acc, { [rewardData[0]]: rewardData[1] }];
}

function Copy(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}
