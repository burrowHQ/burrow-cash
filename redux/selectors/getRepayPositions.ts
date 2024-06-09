import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { hasAssets } from "../utils";
import { shrinkToken } from "../../store";

export const getRepayPositions = (tokenId: string) =>
  createSelector(
    (state: RootState) => state.app,
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (app, assets, account) => {
      if (!hasAssets(assets) || !tokenId) return {};
      const { positions } = account.portfolio;
      const asset = assets.data[tokenId];
      return Object.keys(positions).reduce((acc, position) => {
        return {
          ...acc,
          [position]: shrinkToken(
            positions[position].borrowed[tokenId]?.balance || 0,
            asset.metadata.decimals + asset.config.extra_decimals,
          ),
        };
      }, {});
    },
  );
