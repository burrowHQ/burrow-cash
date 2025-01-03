import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./store";
import { transformAsset } from "./utils";
import { isMemeCategory } from "../utils";
import { Asset } from "./assetState";

export const getConfig = createSelector(
  (state: RootState) => state.app,
  (app) => app.config,
);

export const getConfigMEME = createSelector(
  (state: RootState) => state.appMEME,
  (app) => app.config,
);

export const getModalStatus = createSelector(
  (state: RootState) => state.app,
  (state: RootState) => state.appMEME,
  (appMain, appMEME) => {
    const isMeme = isMemeCategory();
    let app: typeof appMain;
    if (isMeme) {
      app = appMEME;
    } else {
      app = appMain;
    }
    return app.showModal;
  },
);
export const getModalData = createSelector(
  (state: RootState) => state.app,
  (app) => app.selected,
);

export const getDisplayAsTokenValue = createSelector(
  (state: RootState) => state.app,
  (app) => app.displayAsTokenValue,
);

export const getSlimStats = createSelector(
  (state: RootState) => state.app,
  (app) => app.slimStats,
);

export const getFullDigits = createSelector(
  (state: RootState) => state.app,
  (app) => app.fullDigits,
);

export const getProtocolStats = createSelector(
  (state: RootState) => state.app,
  (state: RootState) => state.appMEME,
  (appMain, appMEME) => {
    const isMeme = isMemeCategory();
    let app: typeof appMain;
    if (isMeme) {
      app = appMEME;
    } else {
      app = appMain;
    }
    return app.protocolStats;
  },
);

export const getShowInfo = createSelector(
  (state: RootState) => state.app,
  (app) => app.showInfo,
);

export const getAppState = (memeCategory?) => {
  return createSelector(
    (state: RootState) => state.app,
    (state: RootState) => state.appMEME,
    (appMain, appMEME) => {
      let isMeme: boolean;
      if (memeCategory == undefined) {
        isMeme = isMemeCategory();
      } else {
        isMeme = memeCategory;
      }
      let app: typeof appMain;
      if (isMeme) {
        app = appMEME;
      } else {
        app = appMain;
      }
      return app;
    },
  );
};

export const getShowDust = createSelector(
  (state: RootState) => state.app,
  (app) => app.showDust,
);

export const getShowTicker = createSelector(
  (state: RootState) => state.app,
  (app) => app.showTicker,
);

export const getSelectedValues = createSelector(
  (state: RootState) => state.app,
  (state: RootState) => state.appMEME,
  (appMain, appMEME) => {
    const isMeme = isMemeCategory();
    let app: typeof appMain;
    if (isMeme) {
      app = appMEME;
    } else {
      app = appMain;
    }
    return app.selected;
  },
);

export const getTableSorting = createSelector(
  (state: RootState) => state.app,
  (app) => app.tableSorting,
);

export const getDegenMode = createSelector(
  (state: RootState) => state.app,
  (state: RootState) => state.appMEME,
  (appMain, appMEME) => {
    let app: typeof appMain;
    const isMeme = isMemeCategory();
    if (isMeme) {
      app = appMEME;
    } else {
      app = appMain;
    }
    return app.degenMode;
  },
);

export const getDisclaimerAgreed = createSelector(
  (state: RootState) => state.app,
  (app) => app.disclaimerAgreed,
);

export const getBlocked = (ip: string | undefined) =>
  createSelector(
    (state: RootState) => state.app,
    (app) => (ip ? app.isBlocked[ip] : undefined),
  );

export const getTheme = createSelector(
  (state: RootState) => state.app,
  (app) => app.theme,
);

export const getAssetData = createSelector(
  (state: RootState) => state.app,
  (state: RootState) => state.appMEME,
  (state: RootState) => state.assets.data,
  (state: RootState) => state.assetsMEME.data,
  (state: RootState) => state.account,
  (state: RootState) => state.accountMEME,
  (appMain, appMEME, assetsMain, assetsMEME, accountMain, accountMEME) => {
    let asset: Asset;
    let app: typeof appMain;
    let portfolio: typeof accountMain.portfolio;
    let account: typeof accountMain;
    let assets: typeof assetsMain;
    const isMeme = isMemeCategory();
    if (isMeme) {
      app = appMEME;
      asset = assetsMEME[app.selected?.tokenId];
      portfolio = accountMEME.portfolio;
      account = accountMEME;
      assets = assetsMEME;
    } else {
      app = appMain;
      asset = assetsMain[app.selected?.tokenId];
      portfolio = accountMain.portfolio;
      account = accountMain;
      assets = assetsMain;
    }
    return {
      tokenId: asset?.token_id,
      action: app.selected.action,
      position: app.selected.position,
      portfolio,
      ...(asset ? transformAsset(asset, account, assets, app) : {}),
    };
  },
);

export const getAssetDataByTokenId = (tokenId: string) =>
  createSelector(
    (state: RootState) => state.app,
    (state: RootState) => state.appMEME,
    (state: RootState) => state.assets.data,
    (state: RootState) => state.assetsMEME.data,
    (state: RootState) => state.account,
    (state: RootState) => state.accountMEME,
    (appMain, appMEME, assetsMain, assetsMEME, accountMain, accountMEME) => {
      const isMeme = isMemeCategory();
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
      const asset = assets[tokenId];
      return {
        tokenId: asset?.token_id,
        ...(asset ? transformAsset(asset, account, assets, app) : {}),
      };
    },
  );

export const getUnreadLiquidation = createSelector(
  (state: RootState) => state.app,
  (state: RootState) => state.appMEME,
  (appMain, appMEME) => {
    const isMeme = isMemeCategory();
    let app: typeof appMain;
    if (isMeme) {
      app = appMEME;
    } else {
      app = appMain;
    }
    return app.unreadLiquidation;
  },
);

export const getToastMessage = createSelector(
  (state: RootState) => state.app,
  (app) => app.toastMessage,
);
