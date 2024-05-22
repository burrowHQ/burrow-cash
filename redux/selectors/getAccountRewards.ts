/* eslint-disable import/no-cycle */
/* eslint-disable operator-assignment */
import Decimal from "decimal.js";
import { createSelector } from "@reduxjs/toolkit";
import { omit } from "lodash";

import { shrinkToken } from "../../store";
import { RootState } from "../store";
import { Asset, AssetsState } from "../assetState";
import { Farm, FarmData, Portfolio, AccountState } from "../accountState";
import { AppState } from "../appSlice";
import { getStaking } from "./getStaking";
import { INetTvlFarmRewards } from "../../interfaces";
import { hasAssets, toUsd, emptySuppliedAsset, emptyBorrowedAsset } from "../utils";
import { cloneObj } from "../../helpers/helpers";
import { standardizeAsset, filterAccountSentOutFarms } from "../../utils/index";

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
  totalUnClaimUSD: number;
}

export const getGains = (
  portfolio: Portfolio,
  assets: AssetsState,
  source: "supplied" | "collateral" | "borrowed",
  withNetTvlMultiplier = false,
) =>
  Object.keys(portfolio[source])
    .map((id) => {
      const asset = assets.data[id];
      const netTvlMultiplier = (asset?.config.net_tvl_multiplier || 0) / 10000;

      const { balance } = portfolio[source][id];
      const apr = Number(portfolio[source][id].apr);
      const balanceUSD = toUsd(balance, asset);

      return [balanceUSD * (withNetTvlMultiplier ? netTvlMultiplier : 1), apr];
    })
    .reduce(([gain, sum], [balance, apr]) => [gain + balance * apr, sum + balance], [0, 0]);

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
  source: "supplied" | "collateral" | "borrowed",
) => {
  return Object.entries(portfolio[source]).map(([tokenId, assetData]) => {
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
) => {
  const boosterLogBase = Number(
    shrinkToken(farmData.asset_farm_reward.booster_log_base, boosterDecimals),
  );

  const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
  const rewardAssetDecimals = rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;

  const log = Math.log(xBRRRAmount) / Math.log(boosterLogBase);
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
    shrinkToken(portfolio.collateral[asset.token_id]?.shares || 0, assetDecimals),
  );
  const borrowedShares = Number(
    shrinkToken(portfolio.borrowed[asset.token_id]?.shares || 0, assetDecimals),
  );
  const suppliedBalance = Number(
    shrinkToken(portfolio.supplied[asset.token_id]?.balance || 0, assetDecimals),
  );
  const collateralBalance = Number(
    shrinkToken(portfolio.collateral[asset.token_id]?.balance || 0, assetDecimals),
  );
  const borrowedBalance = Number(
    shrinkToken(portfolio.borrowed[asset.token_id]?.balance || 0, assetDecimals),
  );
  const tokenNetShares = suppliedBalance + collateralBalance - borrowedBalance;
  let shares = type === "supplied" ? suppliedShares + collateralShares : borrowedShares;
  // TODO tokennetbalance Booster logic
  if (type === "tokennetbalance") {
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
  xBRRRAmount: number,
  netTvlFarm: INetTvlFarmRewards,
  farmData: FarmData,
  boosterDecimals: number,
  netLiquidity: number,
) => {
  const boosterLogBase = Number(
    shrinkToken(farmData.asset_farm_reward.booster_log_base, boosterDecimals),
  );

  const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;

  const log = Math.log(xBRRRAmount) / Math.log(boosterLogBase);
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

  const shares =
    Number(shrinkToken(new Decimal(netLiquidity).mul(10 ** 18).toFixed(), assetDecimals)) || 0;

  const newBoostedShares = shares * multiplier;
  const newTotalBoostedShares = totalBoostedShares + newBoostedShares - boostedShares;
  const newDailyAmount =
    newTotalBoostedShares > 0 ? (newBoostedShares / newTotalBoostedShares) * totalRewardsPerDay : 0;

  return { dailyAmount, newDailyAmount, multiplier, totalBoostedShares, shares };
};

export const getAccountRewards = createSelector(
  (state: RootState) => state.assets,
  (state: RootState) => state.account,
  (state: RootState) => state.app,
  getStaking,
  (assets, account, app, staking) => {
    const brrrTokenId = app.config.booster_token_id;
    const { xBRRR, extraXBRRRAmount } = staking;
    const xBRRRAmount = xBRRR + extraXBRRRAmount;

    const [, totalCollateral] = getGains(account.portfolio, assets, "collateral");
    const [, totalSupplied] = getGains(account.portfolio, assets, "supplied");
    const [, totalBorrowed] = getGains(account.portfolio, assets, "borrowed");

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
      const rewardAssetDecimals = rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
      const { icon, symbol, name } = rewardAsset.metadata;
      const unclaimedAmount = Number(shrinkToken(farmData.unclaimed_amount, rewardAssetDecimals));

      const { dailyAmount, newDailyAmount, multiplier } = computeNetLiquidityDailyAmount(
        rewardAsset,
        xBRRRAmount,
        assets.netTvlFarm,
        farmData,
        app.config.booster_decimals,
        netLiquidity,
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
    // const hasNetTvlFarm = !!Object.entries(assets.netTvlFarm).length;
    const suppliedRewards = Object.entries(supplied).map(computePoolsRewards("supplied")).flat();
    const borrowedRewards = Object.entries(borrowed).map(computePoolsRewards("borrowed")).flat();
    const tokenNetRewards = Object.entries(tokennetbalance)
      .map(computePoolsRewards("tokennetbalance"))
      .flat();
    const netLiquidityRewards = Object.entries(netTvl)
      // .filter(([tokenId]) => assets.netTvlFarm[tokenId])
      .map(computeNetLiquidityRewards);
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
      net: netLiquidityRewards.reduce(
        (rewards, asset) => ({ ...rewards, [asset.tokenId]: asset }),
        {},
      ),
      sumRewards,
      totalUnClaimUSD,
    } as IAccountRewards;
  },
);

export const getWeightedNetLiquidity = createSelector(
  (state: RootState) => state.assets,
  (state: RootState) => state.account,
  (assets, account) => {
    if (!hasAssets(assets)) return 0;

    const [, totalCollateral] = getGains(account.portfolio, assets, "collateral", true);
    const [, totalSupplied] = getGains(account.portfolio, assets, "supplied", true);
    const [, totalBorrowed] = getGains(account.portfolio, assets, "borrowed", true);

    const netLiquidity = totalCollateral + totalSupplied - totalBorrowed;
    return netLiquidity;
  },
);

export const getWeightedAssets = createSelector(
  (state: RootState) => state.assets,
  (assets) => {
    if (!hasAssets(assets)) return [];
    return Object.entries(assets.data)
      .map(([, asset]) => (asset.config.net_tvl_multiplier < 10000 ? asset : undefined))
      .filter(Boolean) as Asset[];
  },
);
export const getAccountDailyRewards = createSelector(
  (state: RootState) => state.assets,
  (state: RootState) => state.account,
  (state: RootState) => state.app,
  (assets, account, app) => {
    const accountDustProcess = dustProcess({
      accountSource: account,
      assets,
      app,
    });
    const baseCollateralUsdDaily =
      getGains(accountDustProcess.portfolio, assets, "collateral")[0] / 365;
    const baseSuppliedUsdDaily =
      getGains(accountDustProcess.portfolio, assets, "supplied")[0] / 365;
    const baseBorrowedUsdDaily =
      getGains(accountDustProcess.portfolio, assets, "borrowed")[0] / 365;

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
      "supplied",
    );
    const baseCollateralAmountDaily = getDailyAmount(
      accountDustProcess.portfolio,
      assets,
      "collateral",
    );
    const baseBorrowedAmountDaily = getDailyAmount(
      accountDustProcess.portfolio,
      assets,
      "borrowed",
    );

    const farmSuppliedAmountDaily = getIncentiveDailyAmount(account.portfolio, assets, "supplied");
    const farmBorrowedAmountDaily = getIncentiveDailyAmount(account.portfolio, assets, "borrowed");
    const farmCollateralAmountDaily = getIncentiveDailyAmount(account.portfolio, assets, "netTvl");
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
      return {
        ...acc,
        [tokenId]: {
          amount,
          asset: assetCopy,
        },
      };
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
