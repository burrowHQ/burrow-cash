import _ from "lodash";
import { createSelector } from "@reduxjs/toolkit";
import { shrinkToken } from "../../store";
import { RootState } from "../store";
import { sumReducer, hasAssets } from "../utils";

export const getTotalAccountBalance = (source: "borrowed" | "supplied") =>
  createSelector(
    (state: RootState) => state.assets,
    (state: RootState) => state.account,
    (assets, account) => {
      if (!hasAssets(assets)) return 0;
      let tokenUsds: any[] = [];
      tokenUsds = sumTokenUsds(account, assets, source);
      return tokenUsds.reduce(sumReducer, 0);
    },
  );

const sumTokenUsds = (account, assets, source) => {
  const { borrows, collaterals, supplies } = account.portfolio || {};
  const tokens = source === "supplied" ? [...supplies, ...collaterals] : borrows;

  const tokenUsds = tokens.map((d) => {
    const { token_id } = d || {};
    const { price, metadata, config } = assets.data[token_id];

    const tokenUsd =
      Number(shrinkToken(d?.balance || 0, metadata.decimals + config.extra_decimals)) *
      (price?.usd || 0);

    return tokenUsd;
  });

  return tokenUsds;
};
