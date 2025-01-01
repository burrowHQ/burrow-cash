import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./store";
import { transformAsset } from "./utils";
import { isMemeCategory } from "../utils";

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
  (app) => app.showModal,
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
  (app) => app.protocolStats,
);

export const getProtocolStatsMEME = createSelector(
  (state: RootState) => state.appMEME,
  (app) => app.protocolStats,
);

export const getShowInfo = createSelector(
  (state: RootState) => state.app,
  (app) => app.showInfo,
);

export const getAppState = createSelector(
  (state: RootState) => state.app,
  (app) => app,
);

export const getAppStateMEME = createSelector(
  (state: RootState) => state.appMEME,
  (app) => app,
);

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
  (app) => app.selected,
);

export const getTableSorting = createSelector(
  (state: RootState) => state.app,
  (app) => app.tableSorting,
);

export const getDegenMode = createSelector(
  (state: RootState) => state.app,
  (app) => app.degenMode,
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
  (state: RootState) => state.assets.data,
  (state: RootState) => state.assetsMEME.data,
  (state: RootState) => state.account,
  (state: RootState) => state.accountMEME,
  (app, assetsMain, assetsMEME, accountMain, accountMEME) => {
    let asset;
    let portfolio;
    let account;
    let assets;
    if (isMemeCategory()) {
      asset = assetsMEME[app.selected?.tokenId];
      portfolio = accountMEME.portfolio;
      account = accountMEME;
      assets = assetsMEME;
    } else {
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
    (state: RootState) => state.assets.data,
    (state: RootState) => state.account,
    (app, assets, account) => {
      const asset = assets[tokenId];
      return {
        tokenId: asset?.token_id,
        ...(asset ? transformAsset(asset, account, assets, app) : {}),
      };
    },
  );

export const getUnreadLiquidation = createSelector(
  (state: RootState) => state.app,
  (app) => app.unreadLiquidation,
);

export const getUnreadLiquidationMEME = createSelector(
  (state: RootState) => state.appMEME,
  (app) => app.unreadLiquidation,
);

export const getToastMessage = createSelector(
  (state: RootState) => state.app,
  (app) => app.toastMessage,
);
