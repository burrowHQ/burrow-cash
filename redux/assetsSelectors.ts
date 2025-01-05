import Decimal from "decimal.js";
import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./store";
import { hiddenAssets } from "../utils/config";
import { toUsd, transformAsset } from "./utils";

export const getAvailableAssets = ({ source }: { source?: "supply" | "borrow" | "" }) =>
  createSelector(
    (state: RootState) => state.assets.data,
    (state: RootState) => state.assetsMEME.data,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (state: RootState) => state.app,
    (state: RootState) => state.appMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, accountMain, accountMEME, appMain, appMEME, category) => {
      const isMeme = category.activeCategory == "meme";
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
      const filterKey = source === "supply" ? "can_deposit" : "can_borrow";
      const assets_filter_by_source = source
        ? Object.keys(assets).filter((tokenId) => assets[tokenId].config[filterKey])
        : Object.keys(assets);
      return assets_filter_by_source
        .filter((tokenId) => !hiddenAssets.includes(assets[tokenId].token_id))
        .map((tokenId) => {
          return transformAsset(assets[tokenId], account, assets, app);
        });
    },
  );

export const isAssetsLoading = createSelector(
  (state: RootState) => state.assets,
  (assets) => assets.status === "pending",
);

export const isAssetsFetching = createSelector(
  (state: RootState) => state.assets,
  (assets) => assets.status === "fetching",
);

export const getAssets = createSelector(
  (state: RootState) => state.assets,
  (assets) => assets,
);

export const getAssetsMEME = createSelector(
  (state: RootState) => state.assetsMEME,
  (assets) => assets,
);
export const getAssetsCategory = (memeCategory?: boolean) => {
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
      return assets;
    },
  );
};
export const getAllAssetsData = createSelector(
  (state: RootState) => state.assets,
  (state: RootState) => state.assetsMEME,
  (assetsMain, assetsMEME) => {
    const combinedAssetsData = { ...assetsMain.data, ...assetsMEME.data };
    return combinedAssetsData;
  },
);

export const getTotalSupplyAndBorrowUSD = (tokenId: string) =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, category) => {
      const isMeme = category.activeCategory == "meme";
      let assets: typeof assetsMain;
      if (isMeme) {
        assets = assetsMEME;
      } else {
        assets = assetsMain;
      }

      const asset = assets.data[tokenId];
      if (!asset) return [0, 0];

      const totalSupplyD = new Decimal(asset.supplied.balance).toFixed();
      const totalBorrowD = new Decimal(asset.borrowed.balance).toFixed();

      return [toUsd(totalSupplyD, asset), toUsd(totalBorrowD, asset)];
    },
  );
