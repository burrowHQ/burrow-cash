import { createSelector } from "@reduxjs/toolkit";
import { MAX_RATIO } from "../../store";

import { RootState } from "../store";
import { hasAssets } from "../utils";
import { getAdjustedSum } from "./getWithdrawMaxAmount";
import { DEFAULT_POSITION } from "../../utils/config";

export const LOW_HEALTH_FACTOR = 180;
export const DANGER_HEALTH_FACTOR = 100;

export const getHealthFactor = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account.portfolio,
    (state: RootState) => state.accountMEME.portfolio,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, portfolioMain, portfolioMEME, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      let assets: typeof assetsMain;
      let portfolio: typeof portfolioMain;
      if (isMeme) {
        assets = assetsMEME;
        portfolio = portfolioMEME;
      } else {
        assets = assetsMain;
        portfolio = portfolioMain;
      }
      if (!hasAssets(assets)) return null;
      if (!portfolio) return null;
      if (!Object.keys(portfolio.borrowed).length) return -1;
      return calHealthFactor(portfolio, assets);
    },
  );
};

export const getLPHealthFactor = (memeCategory?: boolean) => {
  return createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.assetsMEME,
    (state: RootState) => state.account.portfolio,
    (state: RootState) => state.accountMEME.portfolio,
    (state: RootState) => state.category,
    (assetsMain, assetsMEME, portfolioMain, portfolioMEME, category) => {
      let isMeme: boolean;
      if (typeof memeCategory !== "boolean") {
        isMeme = category.activeCategory == "meme";
      } else {
        isMeme = memeCategory;
      }
      let assets: typeof assetsMain;
      let portfolio: typeof portfolioMain;
      if (isMeme) {
        assets = assetsMEME;
        portfolio = portfolioMEME;
      } else {
        assets = assetsMain;
        portfolio = portfolioMain;
      }
      if (!hasAssets(assets)) return null;
      if (!portfolio?.positions) return null;
      const LPToken = {};
      Object.entries(portfolio?.positions).forEach(([key, value]) => {
        if (key !== DEFAULT_POSITION) {
          const asset = assets?.data?.[key];
          const healthFactor = calHealthFactor(portfolio, assets, key);
          LPToken[key] = {
            ...value,
            metadata: asset?.metadata,
            healthFactor: Math.trunc(healthFactor),
            healthStatus: getHealthStatus(healthFactor),
          };
        }
      });
      return LPToken;
    },
  );
};

const calHealthFactor = (portfolio: any, assets: any, positionId?: string) => {
  const adjustedCollateralSum = getAdjustedSum("collateral", portfolio, assets.data, positionId);
  const adjustedBorrowedSum = getAdjustedSum("borrowed", portfolio, assets.data, positionId);
  const healthFactor = adjustedCollateralSum.div(adjustedBorrowedSum).mul(100).toNumber();
  return healthFactor < MAX_RATIO ? healthFactor : MAX_RATIO;
};

export const getHealthStatus = (healthFactor) => {
  const isDanger = healthFactor !== -1 && healthFactor < DANGER_HEALTH_FACTOR;
  const isWarning = healthFactor !== -1 && healthFactor < LOW_HEALTH_FACTOR;
  let healthStatus = "good";
  if (isWarning) {
    healthStatus = "warning";
  }
  if (isDanger) {
    healthStatus = "danger";
  }
  return healthStatus;
};
