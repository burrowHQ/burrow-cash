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
      const { collateralAll, borrows, collaterals, supplies } = account.portfolio || {};

      let tokenAmounts: any[] = [];
      if (borrows && collaterals && supplies) {
        tokenAmounts = sumTokenAmounts(account, assets, source);
      }
      // todo: remove on next patch
      else {
        const allTokens = {
          ...account.portfolio.collateralAll,
          ...account.portfolio.supplied,
          ...account.portfolio.borrowed,
        };
        const sourceTokens = account.portfolio[source];
        tokenAmounts = Object.keys(allTokens).map((tokenId) => {
          const { price, metadata, config } = assets.data[tokenId];
          const total =
            Number(
              shrinkToken(
                sourceTokens[tokenId]?.balance || 0,
                metadata.decimals + config.extra_decimals,
              ),
            ) * (price?.usd || 0);

          const totalCollateral =
            Number(
              shrinkToken(
                collateralAll[tokenId]?.balance || 0,
                metadata.decimals + config.extra_decimals,
              ),
            ) * (price?.usd || 0);
          return source === "supplied" ? total + totalCollateral : total;
        });
      }
      return tokenAmounts.reduce(sumReducer, 0);
    },
  );

const sumTokenAmounts = (account, assets, source) => {
  const { collateral, borrows, collaterals, supplies } = account.portfolio || {};
  const tokens = source === "supplied" ? [...supplies, ...collaterals] : borrows;

  const tokenAmounts = tokens.map((d) => {
    const { token_id } = d || {};
    const { price, metadata, config } = assets.data[token_id];

    const total =
      Number(shrinkToken(d?.balance || 0, metadata.decimals + config.extra_decimals)) *
      (price?.usd || 0);

    // const totalCollateral =
    //   Number(
    //     shrinkToken(collateral[token_id]?.balance || 0, metadata.decimals + config.extra_decimals),
    //   ) * (price?.usd || 0);
    // if (source === "supplied") {
    //   console.log(`>> source:${source} tokenId:${token_id} total:${total} totalCollateral:${totalCollateral} metadata:${metadata.decimals} price:${price?.usd}`)
    // }
    return source === "supplied" ? total : total;
  });

  return tokenAmounts;
};
