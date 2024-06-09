import { initialStaking } from "../redux/accountState";
import { hasOnlyBurrowFarmRewards, hasZeroSharesFarmRewards, listToMap } from "../redux/utils";
import { transformAccountFarms } from "./farms";
import { DEFAULT_POSITION } from "../utils/config";

export const transformPortfolio = (account) => {
  const { portfolio } = account;
  if (!portfolio) return undefined;
  const { booster_staking, supplied, positions, farms } = portfolio;

  const onlyBurrowFarmed = hasOnlyBurrowFarmRewards(farms);

  const hasNonFarmedAssets = onlyBurrowFarmed
    ? false
    : account.portfolio["has_non_farmed_assets"] || hasZeroSharesFarmRewards(farms);
  Object.keys(positions).forEach((shadow_id: string) => {
    const { borrowed, collateral } = positions[shadow_id];
    positions[shadow_id].borrowed = listToMap(borrowed);
    positions[shadow_id].collateral = listToMap(collateral);
  });

  let collateralAll = {};
  const collaterals: any[] = [];
  const borrows: any[] = [];

  Object.entries(positions).forEach(([positionId, value]: [string, any]) => {
    if (value?.collateral) {
      collateralAll = {
        ...collateralAll,
        ...value.collateral,
      };
    }
    Object.entries(value.borrowed).forEach(([tokenId, tokenObj]: [string, any]) => {
      borrows.push({
        ...tokenObj,
        token_id: tokenId,
        positionId,
      });
    });
    Object.entries(value.collateral).forEach(([tokenId, tokenObj]: [string, any]) => {
      collaterals.push({
        ...tokenObj,
        token_id: tokenId,
        positionId,
      });
    });
  });

  return {
    supplies: supplied,
    borrows,
    collaterals,
    supplied: listToMap(supplied),
    borrowed: positions[DEFAULT_POSITION]?.borrowed || {},
    collateral: positions[DEFAULT_POSITION]?.collateral || {},
    collateralAll,
    positions,
    farms: transformAccountFarms(farms),
    staking: booster_staking || initialStaking,
    hasNonFarmedAssets,
  };
};

export const transformAccount = (account) => {
  if (!account) return undefined;

  const { accountId, accountBalance, tokenIds } = account;

  return {
    accountId,
    balances: {
      ...account.balances
        .map((b, i) => ({ [tokenIds[i]]: b }))
        .reduce((a, b) => ({ ...a, ...b }), {}),
      near: accountBalance,
    },
    portfolio: transformPortfolio(account),
  };
};
