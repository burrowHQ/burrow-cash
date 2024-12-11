import { createSelector } from "@reduxjs/toolkit";
import Decimal from "decimal.js";

import { omit } from "lodash";
import { RootState } from "../store";
import { emptySuppliedAsset, emptyBorrowedAsset, hasAssets, getRewards, toUsd } from "../utils";
import { shrinkToken, expandToken } from "../../store";
import { Asset, Assets } from "../assetState";
import { Farm } from "../accountState";
import { standardizeAsset } from "../../utils";
import { DEFAULT_POSITION } from "../../utils/config";
import { CONST_COLLATERAL_TYPE } from "../../const/constCommon";

export const getPortfolioRewards = (
  type: "supplied" | "borrowed" | "tokennetbalance",
  asset: Asset,
  farm: Farm,
  assets: Assets,
) => {
  if (!farm) return [];
  return Object.entries(farm).map(([tokenId, rewards]) => {
    const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
    const rewardTokenDecimals =
      assets[tokenId].metadata.decimals + assets[tokenId].config.extra_decimals;

    const totalRewardsPerDay = Number(
      shrinkToken(asset.farms[type][tokenId]?.["reward_per_day"] || "0", rewardTokenDecimals),
    );
    const totalBoostedShares = Number(
      shrinkToken(asset.farms[type][tokenId]?.["boosted_shares"] || "0", assetDecimals),
    );
    const boostedShares = Number(
      shrinkToken(farm?.[tokenId]?.boosted_shares || "0", assetDecimals),
    );

    const rewardPerDay = (boostedShares / totalBoostedShares) * totalRewardsPerDay || 0;

    return {
      rewards: { ...rewards, reward_per_day: expandToken(rewardPerDay, rewardTokenDecimals) },
      metadata: assets[tokenId].metadata,
      config: assets[tokenId].config,
      type: "portfolio",
      price: assets[tokenId].price?.usd ?? 0,
    };
  });
};

export const getPortfolioAssets = createSelector(
  (state: RootState) => state.app,
  (state: RootState) => state.assets,
  (state: RootState) => state.account,
  (app, assets, account) => {
    if (!hasAssets(assets)) return [[], [], 0, 0, {}, []];
    const brrrTokenId = app.config.booster_token_id;
    const lpPositions = omit(account.portfolio.positions, DEFAULT_POSITION);
    let portfolioLpAssets = {};
    Object.keys(lpPositions).forEach((shadow_id: string) => {
      portfolioLpAssets = {
        ...portfolioLpAssets,
        ...lpPositions[shadow_id].collateral,
      };
    });
    const portfolioAssets = {
      ...account.portfolio.supplied,
      ...account.portfolio.collateral,
      ...portfolioLpAssets,
    };
    let totalSuppliedUSD = 0;
    let totalBorrowedUSD = 0;
    const supplied = Object.keys(portfolioAssets)
      .map((tokenId) => {
        const asset = assets.data[tokenId];
        const { isLpToken } = asset;
        const collateral = shrinkToken(
          (isLpToken
            ? account.portfolio.positions[tokenId]?.collateral?.[tokenId]?.balance || 0
            : account.portfolio.collateral?.[tokenId]?.balance) || 0,
          asset.metadata.decimals + asset.config.extra_decimals,
        );
        const suppliedBalance = account.portfolio.supplied?.[tokenId]?.balance || 0;
        const totalSupplyD = new Decimal(asset.supplied.balance)
          .plus(new Decimal(asset.reserved))
          .toFixed();
        const suppliedToken =
          Number(collateral) +
          Number(
            shrinkToken(suppliedBalance, asset.metadata.decimals + asset.config.extra_decimals),
          );
        const suppliedUSD = (asset.price?.usd || 0) * suppliedToken;
        totalSuppliedUSD += suppliedUSD;
        return standardizeAsset({
          tokenId,
          metadata: asset.metadata,
          symbol: asset.metadata.symbol,
          icon: asset.metadata.icon,
          price: asset.price?.usd ?? 0,
          apy: Number(portfolioAssets[tokenId].apr) * 100,
          collateral: Number(collateral),
          supplied: suppliedToken,
          canUseAsCollateral: asset.config.can_use_as_collateral,
          canWithdraw: asset.config.can_withdraw,
          rewards: [
            ...getPortfolioRewards(
              "supplied",
              asset,
              account.portfolio.farms.supplied[tokenId],
              assets.data,
            ),
            ...getPortfolioRewards(
              "tokennetbalance",
              asset,
              account.portfolio.farms.tokennetbalance[tokenId],
              assets.data,
            ),
          ],
          depositRewards: getRewards("supplied", asset, assets.data),
          totalSupplyMoney: toUsd(totalSupplyD, asset),
        });
      })
      .filter(app.showDust ? Boolean : emptySuppliedAsset);
    // borrow from regular position
    const borrowed = Object.keys(account.portfolio.borrowed || {})
      .map((tokenId) => {
        const asset = assets.data[tokenId];

        const borrowedBalance = account.portfolio.borrowed[tokenId].balance;
        const brrrUnclaimedAmount =
          account.portfolio.farms.borrowed[tokenId]?.[brrrTokenId]?.unclaimed_amount || "0";
        const totalSupplyD = new Decimal(asset.supplied.balance)
          .plus(new Decimal(asset.reserved))
          .toFixed();

        const borrowedToken = Number(
          shrinkToken(borrowedBalance, asset.metadata.decimals + asset.config.extra_decimals),
        );
        const borrowedUSD = borrowedToken * (asset.price?.usd || 0);
        totalBorrowedUSD += borrowedUSD;
        return standardizeAsset({
          tokenId,
          shadow_id: DEFAULT_POSITION,
          collateralType: CONST_COLLATERAL_TYPE.SINGLE_TOKEN,
          metadata: asset.metadata,
          symbol: asset.metadata.symbol,
          icon: asset.metadata.icon,
          price: asset.price?.usd ?? 0,
          supplyApy: Number(asset.supply_apr) * 100,
          borrowApy: Number(asset.borrow_apr) * 100,
          borrowed: borrowedToken,
          brrrUnclaimedAmount: Number(
            shrinkToken(brrrUnclaimedAmount, assets.data[brrrTokenId].metadata.decimals),
          ),
          rewards: getPortfolioRewards(
            "borrowed",
            asset,
            account.portfolio.farms.borrowed[tokenId],
            assets.data,
          ),
          borrowRewards: getRewards("borrowed", asset, assets.data),
          totalSupplyMoney: toUsd(totalSupplyD, asset),
        });
      })
      .filter(app.showDust ? Boolean : emptyBorrowedAsset);
    // borrow from lp position
    const borrowed_LP = Object.keys(lpPositions).reduce((acc, shadow_id: string) => {
      const b = Object.keys(lpPositions[shadow_id].borrowed)
        .map((tokenId) => {
          const asset = assets.data[tokenId];
          const lpAsset = assets.data[shadow_id];
          const borrowedBalance = lpPositions[shadow_id].borrowed[tokenId].balance;
          const brrrUnclaimedAmount =
            account.portfolio.farms.borrowed[tokenId]?.[brrrTokenId]?.unclaimed_amount || "0";
          const totalSupplyD = new Decimal(asset.supplied.balance)
            .plus(new Decimal(asset.reserved))
            .toFixed();
          const borrowedToken = Number(
            shrinkToken(borrowedBalance, asset.metadata.decimals + asset.config.extra_decimals),
          );
          const borrowedUSD = borrowedToken * (asset.price?.usd || 0);
          totalBorrowedUSD += borrowedUSD;
          return standardizeAsset({
            tokenId,
            shadow_id,
            collateralType: CONST_COLLATERAL_TYPE.LP_TOKEN,
            metadata: asset.metadata,
            metadataLP: lpAsset.metadata,
            symbol: asset.metadata.symbol,
            icon: asset.metadata.icon,
            price: asset.price?.usd ?? 0,
            supplyApy: Number(asset.supply_apr) * 100,
            borrowApy: Number(asset.borrow_apr) * 100,
            borrowed: borrowedToken,
            brrrUnclaimedAmount: Number(
              shrinkToken(brrrUnclaimedAmount, assets.data[brrrTokenId].metadata.decimals),
            ),
            rewards: getPortfolioRewards(
              "borrowed",
              asset,
              account.portfolio.farms.borrowed[tokenId],
              assets.data,
            ),
            borrowRewards: getRewards("borrowed", asset, assets.data),
            totalSupplyMoney: toUsd(totalSupplyD, asset),
          });
        })
        .filter(app.showDust ? Boolean : emptyBorrowedAsset);
      return { ...acc, [shadow_id]: b };
    }, {});
    const borrowedAll = Array.from(borrowed);
    Object.entries(borrowed_LP).forEach(([positionId, value]: [string, any]) => {
      borrowedAll.push(...value);
    });
    return [supplied, borrowed, totalSuppliedUSD, totalBorrowedUSD, borrowed_LP, borrowedAll];
  },
);

export const getPortfolioMEMEAssets = createSelector(
  (state: RootState) => state.appMEME,
  (state: RootState) => state.assetsMEME,
  (state: RootState) => state.accountMEME,
  (appMEME, assetsMEME, accountMEME) => {
    if (!hasAssets(assetsMEME)) return [[], [], 0, 0, {}, []];
    const brrrTokenId = appMEME.config.booster_token_id;
    const lpPositions = omit(accountMEME.portfolio.positions, DEFAULT_POSITION);
    let portfolioLpAssets = {};
    Object.keys(lpPositions).forEach((shadow_id: string) => {
      portfolioLpAssets = {
        ...portfolioLpAssets,
        ...lpPositions[shadow_id].collateral,
      };
    });
    const portfolioAssets = {
      ...accountMEME.portfolio.supplied,
      ...accountMEME.portfolio.collateral,
      ...portfolioLpAssets,
    };
    let totalSuppliedUSD = 0;
    let totalBorrowedUSD = 0;
    const supplied = Object.keys(portfolioAssets)
      .map((tokenId) => {
        const asset = assetsMEME.data[tokenId];
        const { isLpToken } = asset;
        const collateral = shrinkToken(
          (isLpToken
            ? accountMEME.portfolio.positions[tokenId]?.collateral?.[tokenId]?.balance || 0
            : accountMEME.portfolio.collateral?.[tokenId]?.balance) || 0,
          asset.metadata.decimals + asset.config.extra_decimals,
        );
        const suppliedBalance = accountMEME.portfolio.supplied?.[tokenId]?.balance || 0;
        const totalSupplyD = new Decimal(asset.supplied.balance)
          .plus(new Decimal(asset.reserved))
          .toFixed();
        const suppliedToken =
          Number(collateral) +
          Number(
            shrinkToken(suppliedBalance, asset.metadata.decimals + asset.config.extra_decimals),
          );
        const suppliedUSD = (asset.price?.usd || 0) * suppliedToken;
        totalSuppliedUSD += suppliedUSD;
        return standardizeAsset({
          tokenId,
          metadata: asset.metadata,
          symbol: asset.metadata.symbol,
          icon: asset.metadata.icon,
          price: asset.price?.usd ?? 0,
          apy: Number(portfolioAssets[tokenId].apr) * 100,
          collateral: Number(collateral),
          supplied: suppliedToken,
          canUseAsCollateral: asset.config.can_use_as_collateral,
          canWithdraw: asset.config.can_withdraw,
          rewards: [
            ...getPortfolioRewards(
              "supplied",
              asset,
              accountMEME.portfolio.farms.supplied[tokenId],
              assetsMEME.data,
            ),
            ...getPortfolioRewards(
              "tokennetbalance",
              asset,
              accountMEME.portfolio.farms.tokennetbalance[tokenId],
              assetsMEME.data,
            ),
          ],
          depositRewards: getRewards("supplied", asset, assetsMEME.data),
          totalSupplyMoney: toUsd(totalSupplyD, asset),
        });
      })
      .filter(appMEME.showDust ? Boolean : emptySuppliedAsset);
    // borrow from regular position
    const borrowed = Object.keys(accountMEME.portfolio.borrowed || {})
      .map((tokenId) => {
        const asset = assetsMEME.data[tokenId];

        const borrowedBalance = accountMEME.portfolio.borrowed[tokenId].balance;
        const brrrUnclaimedAmount =
          accountMEME.portfolio.farms.borrowed[tokenId]?.[brrrTokenId]?.unclaimed_amount || "0";
        const totalSupplyD = new Decimal(asset.supplied.balance)
          .plus(new Decimal(asset.reserved))
          .toFixed();

        const borrowedToken = Number(
          shrinkToken(borrowedBalance, asset.metadata.decimals + asset.config.extra_decimals),
        );
        const borrowedUSD = borrowedToken * (asset.price?.usd || 0);
        totalBorrowedUSD += borrowedUSD;
        return standardizeAsset({
          tokenId,
          shadow_id: DEFAULT_POSITION,
          collateralType: CONST_COLLATERAL_TYPE.SINGLE_TOKEN,
          metadata: asset.metadata,
          symbol: asset.metadata.symbol,
          icon: asset.metadata.icon,
          price: asset.price?.usd ?? 0,
          supplyApy: Number(asset.supply_apr) * 100,
          borrowApy: Number(asset.borrow_apr) * 100,
          borrowed: borrowedToken,
          brrrUnclaimedAmount: Number(
            shrinkToken(brrrUnclaimedAmount, assetsMEME.data[brrrTokenId].metadata.decimals),
          ),
          rewards: getPortfolioRewards(
            "borrowed",
            asset,
            accountMEME.portfolio.farms.borrowed[tokenId],
            assetsMEME.data,
          ),
          borrowRewards: getRewards("borrowed", asset, assetsMEME.data),
          totalSupplyMoney: toUsd(totalSupplyD, asset),
        });
      })
      .filter(appMEME.showDust ? Boolean : emptyBorrowedAsset);
    // borrow from lp position
    const borrowed_LP = Object.keys(lpPositions).reduce((acc, shadow_id: string) => {
      const b = Object.keys(lpPositions[shadow_id].borrowed)
        .map((tokenId) => {
          const asset = assetsMEME.data[tokenId];
          const lpAsset = assetsMEME.data[shadow_id];
          const borrowedBalance = lpPositions[shadow_id].borrowed[tokenId].balance;
          const brrrUnclaimedAmount =
            accountMEME.portfolio.farms.borrowed[tokenId]?.[brrrTokenId]?.unclaimed_amount || "0";
          const totalSupplyD = new Decimal(asset.supplied.balance)
            .plus(new Decimal(asset.reserved))
            .toFixed();
          const borrowedToken = Number(
            shrinkToken(borrowedBalance, asset.metadata.decimals + asset.config.extra_decimals),
          );
          const borrowedUSD = borrowedToken * (asset.price?.usd || 0);
          totalBorrowedUSD += borrowedUSD;
          return standardizeAsset({
            tokenId,
            shadow_id,
            collateralType: CONST_COLLATERAL_TYPE.LP_TOKEN,
            metadata: asset.metadata,
            metadataLP: lpAsset.metadata,
            symbol: asset.metadata.symbol,
            icon: asset.metadata.icon,
            price: asset.price?.usd ?? 0,
            supplyApy: Number(asset.supply_apr) * 100,
            borrowApy: Number(asset.borrow_apr) * 100,
            borrowed: borrowedToken,
            brrrUnclaimedAmount: Number(
              shrinkToken(brrrUnclaimedAmount, assetsMEME.data[brrrTokenId].metadata.decimals),
            ),
            rewards: getPortfolioRewards(
              "borrowed",
              asset,
              accountMEME.portfolio.farms.borrowed[tokenId],
              assetsMEME.data,
            ),
            borrowRewards: getRewards("borrowed", asset, assetsMEME.data),
            totalSupplyMoney: toUsd(totalSupplyD, asset),
          });
        })
        .filter(appMEME.showDust ? Boolean : emptyBorrowedAsset);
      return { ...acc, [shadow_id]: b };
    }, {});

    const borrowedAll = Array.from(borrowed);
    Object.entries(borrowed_LP).forEach(([positionId, value]: [string, any]) => {
      borrowedAll.push(...value);
    });
    return [supplied, borrowed, totalSuppliedUSD, totalBorrowedUSD, borrowed_LP, borrowedAll];
  },
);
