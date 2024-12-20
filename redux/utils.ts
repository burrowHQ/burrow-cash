// @ts-nocheck
import Decimal from "decimal.js";
import { pick, omit } from "ramda";

import { shrinkToken, USD_FORMAT, TOKEN_FORMAT } from "../store";
import type { Asset, Assets, AssetsState } from "./assetState";
import type { AccountState } from "./accountState";
import type { AppState } from "./appSlice";
import { UIAsset } from "../interfaces";
import { BRRR_TOKEN, defaultNetwork } from "../utils/config";
import { standardizeAsset } from "../utils";

export const sumReducer = (sum: number, a: number) => sum + a;

export const hasAssets = (assets: AssetsState) => Object.entries(assets.data).length > 0;

export const listToMap = (list) =>
  list
    .map((asset) => ({ [asset.token_id]: omit(["token_id"], asset) }))
    .reduce((a, b) => ({ ...a, ...b }), {});

export const toUsd = (balance: string, asset: Asset) =>
  asset?.price?.usd
    ? Number(shrinkToken(balance, asset.metadata.decimals + asset.config.extra_decimals)) *
      asset.price.usd
    : 0;

export const emptySuppliedAsset = (asset: { supplied: number }): boolean =>
  !(
    asset.supplied.toLocaleString(undefined, TOKEN_FORMAT) ===
    (0).toLocaleString(undefined, TOKEN_FORMAT)
  );
export const emptySuppliedAsset2 = (asset: { supplied: number; collateral: number }): boolean =>
  !(
    asset.supplied.toLocaleString(undefined, TOKEN_FORMAT) ===
      (0).toLocaleString(undefined, TOKEN_FORMAT) &&
    asset.collateral.toLocaleString(undefined, TOKEN_FORMAT) ===
      (0).toLocaleString(undefined, TOKEN_FORMAT)
  );

export const emptyBorrowedAsset = (asset: { borrowed: number }): boolean =>
  !(
    asset.borrowed.toLocaleString(undefined, TOKEN_FORMAT) ===
    (0).toLocaleString(undefined, TOKEN_FORMAT)
  );

export const hasZeroSharesFarmRewards = (farms): boolean => {
  return farms.some((farm) => farm["rewards"].some((reward) => reward["boosted_shares"] === "0"));
};

export const hasOnlyBurrowFarmRewards = (farms): boolean => {
  const BRRR = BRRR_TOKEN[defaultNetwork];
  return farms.every(
    (farm) => farm["farm_id"]["Supplied"] === BRRR || farm["farm_id"]["Borrowed"] === BRRR,
  );
};

export const transformAsset = (
  asset: Asset,
  account: AccountState,
  assets: Assets,
  app: AppState,
): UIAsset => {
  const tokenId = asset.token_id;
  const brrrTokenId = app.config.booster_token_id;
  const totalSupplyD = new Decimal(asset.supplied.balance)
    .plus(new Decimal(asset.reserved))
    .plus(asset.prot_fee)
    .toFixed();
  const totalBorrowedD = new Decimal(asset.borrowed.balance)
    .plus(new Decimal(asset.margin_debt.balance))
    .toFixed();
  const totalSupply = Number(
    shrinkToken(totalSupplyD, asset.metadata.decimals + asset.config.extra_decimals),
  );
  const totalBorrowed = Number(
    shrinkToken(totalBorrowedD, asset.metadata.decimals + asset.config.extra_decimals),
  );

  const temp1 = new Decimal(asset.supplied.balance)
    .plus(new Decimal(asset.reserved))
    .plus(asset.prot_fee)
    .minus(new Decimal(asset.borrowed.balance));
  const temp2 = temp1.minus(temp1.mul(0.001)).toFixed(0);
  const availableLiquidity = Number(
    shrinkToken(temp2, asset.metadata.decimals + asset.config.extra_decimals),
  );
  const availableLiquidity$ = toUsd(temp2, asset).toLocaleString(undefined, USD_FORMAT);
  const availableLiquidityMoney = toUsd(temp2, asset);

  let accountAttrs = {
    supplied: 0,
    collateral: 0,
    borrowed: 0,
    deposited: 0,
    availableNEAR: 0,
    available: 0,
    extraDecimals: 0,
  };

  if (account.accountId) {
    const decimals = asset.metadata.decimals + asset.config.extra_decimals;
    const supplied = Number(
      shrinkToken(account.portfolio.supplied[tokenId]?.balance || 0, decimals),
    );
    const collateral = Number(
      shrinkToken(
        asset.isLpToken
          ? account.portfolio.positions?.[tokenId]?.collateral?.[tokenId]?.balance || 0
          : account.portfolio.collateral?.[tokenId]?.balance || 0,
        decimals,
      ),
    );
    const borrowed = asset.isLpToken
      ? account.portfolio.positions?.[tokenId]?.borrowed?.[tokenId]?.balance || 0
      : account.portfolio.borrowed?.[tokenId]?.balance || 0;
    const available = account.balances[tokenId] || 0;
    const availableNEAR = account.balances["near"] || 0;

    accountAttrs = {
      supplied,
      collateral,
      deposited: supplied + collateral,
      borrowed: Number(shrinkToken(borrowed, decimals)),
      available: Number(shrinkToken(available, asset.metadata.decimals)),
      availableNEAR: Number(shrinkToken(availableNEAR, asset.metadata.decimals)),
      extraDecimals: asset.config.extra_decimals,
    };
  }
  return standardizeAsset({
    tokenId,
    ...pick(["icon", "symbol", "name", "decimals", "tokens"], asset.metadata),
    price: asset.price ? asset.price.usd : 0,
    supplyApy: Number(asset.supply_apr) * 100,
    totalSupply,
    totalSupply$: toUsd(totalSupplyD, asset).toLocaleString(undefined, USD_FORMAT),
    totalSupplyMoney: toUsd(totalSupplyD, asset),
    totalBorrowed,
    totalBorrowed$: toUsd(totalBorrowedD, asset).toLocaleString(undefined, USD_FORMAT),
    totalBorrowedMoney: toUsd(totalBorrowedD, asset),
    borrowApy: Number(asset.borrow_apr) * 100,
    availableLiquidity,
    availableLiquidity$,
    availableLiquidityMoney,
    collateralFactor: `${Number(asset.config.volatility_ratio / 100)}%`,
    canUseAsCollateral: asset.config.can_use_as_collateral,
    ...accountAttrs,
    brrrBorrow: Number(
      shrinkToken(
        asset.farms.borrowed[brrrTokenId]?.["reward_per_day"] || "0",
        assets[brrrTokenId].metadata.decimals,
      ),
    ),
    brrrSupply: Number(
      shrinkToken(
        asset.farms.supplied[brrrTokenId]?.["reward_per_day"] || "0",
        assets[brrrTokenId].metadata.decimals,
      ),
    ),
    depositRewards: getRewards("supplied", asset, assets),
    borrowRewards: getRewards("borrowed", asset, assets),
    can_borrow: asset.config.can_borrow,
    can_deposit: asset.config.can_deposit,
    isLpToken: asset.isLpToken,
  });
};

export const getRewards = (
  action: "supplied" | "borrowed" | "tokennetbalance",
  asset: Asset,
  assets: Assets,
) => {
  return Object.entries(asset.farms[action] || {}).map(([tokenId, rewards]) => ({
    rewards,
    metadata: assets[tokenId].metadata,
    config: assets[tokenId].config,
    price: assets[tokenId].price?.usd ?? 0,
  }));
};
