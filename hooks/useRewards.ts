import Decimal from "decimal.js";
import { useAppSelector } from "../redux/hooks";
import {
  getAccountRewards,
  getAccountDailyRewards,
  getAccountRewardsForApy,
} from "../redux/selectors/getAccountRewards";
import { getNetLiquidityRewards, getProtocolRewards } from "../redux/selectors/getProtocolRewards";
import { getTokenLiquidity } from "../redux/selectors/getTokenLiquidity";
import { useProtocolNetLiquidity } from "./useNetLiquidity";
import { shrinkToken, USD_FORMAT } from "../store";
import { useAvailableAssets } from "./hooks";
import { getAccountPortfolio } from "../redux/accountSelectors";
import { getAssets } from "../redux/assetsSelectors";
import { standardizeAsset } from "../utils";
import { getNetGains } from "../redux/selectors/getAverageNetRewardApy";

export function useRewards() {
  const assetRewards = useAppSelector(getAccountRewards);
  const protocol = useAppSelector(getProtocolRewards);
  const { brrr, totalUnClaimUSD } = assetRewards || {};
  const extra = Object.entries(assetRewards.extra);
  const net = Object.entries(assetRewards.net);
  const poolRewards = Object.entries(assetRewards.poolRewards);
  const allRewards = Object.entries(assetRewards.sumRewards);

  let totalUnClaimUSDDisplay;
  if (totalUnClaimUSD !== undefined) {
    const IGNORE_AMOUNT = 0.01;
    if (!totalUnClaimUSD) {
      totalUnClaimUSDDisplay = 0;
    } else if (totalUnClaimUSD > 0 && totalUnClaimUSD < IGNORE_AMOUNT) {
      totalUnClaimUSDDisplay = `<${IGNORE_AMOUNT.toLocaleString(undefined, USD_FORMAT)}`;
    } else {
      totalUnClaimUSDDisplay = totalUnClaimUSD.toLocaleString(undefined, USD_FORMAT);
    }
  }

  // borrow + supply + net reward
  const all: Array<{ tokenId: string; data: any }> = [];
  allRewards.forEach(([key, value]) => {
    all.push({
      tokenId: key,
      data: standardizeAsset(value),
    });
  });

  return {
    brrr,
    extra,
    net,
    poolRewards,
    protocol,
    data: {
      array: all,
      totalUnClaimUSD,
      totalUnClaimUSDDisplay,
    },
  };
}
export function useDailyRewards() {
  const assetRewards = useAppSelector(getAccountDailyRewards);
  return assetRewards;
}

export function useNetLiquidityRewards() {
  const rewards = useAppSelector(getNetLiquidityRewards);
  return rewards;
}

export function useProRataNetLiquidityReward(tokenId, dailyAmount) {
  const rows = useAvailableAssets();
  const assets = useAppSelector(getAssets);
  const net_tvl_multiplier = (assets?.data?.[tokenId].config.net_tvl_multiplier || 0) / 10000;
  const { protocolNetLiquidity } = useProtocolNetLiquidity(true);
  const tokenLiquidity = useAppSelector(getTokenLiquidity(tokenId));

  if (!tokenId) return dailyAmount;
  const share = (tokenLiquidity * net_tvl_multiplier) / protocolNetLiquidity;
  return dailyAmount * share;
}

export function useStakeRewardApy() {
  const assetRewards = useAppSelector(getAccountRewardsForApy);
  const portfolio = useAppSelector(getAccountPortfolio);
  const assets = useAppSelector(getAssets);
  if (!assets?.data)
    return {
      avgStakeSupplyAPY: 0,
      avgStakeBorrowAPY: 0,
      avgStakeNetAPY: 0,
    };
  const { suppliedRewards, borrowedRewards, netLiquidityRewards } = assetRewards;
  const { supplied, collateral, borrowed, farms } = portfolio;
  const supplyFarms = farms.supplied || {};
  const borrowFarms = farms.borrowed || {};
  // supply
  const totalSupplyProfit = suppliedRewards.reduce((sum, cur) => {
    const { tokenId, newDailyAmount } = cur;
    return sum + (assets.data[tokenId].price?.usd || 0) * newDailyAmount;
  }, 0);
  const totalSupplyPrincipal = Object.entries(supplyFarms)
    .map(([tokenId]) => {
      const asset = assets.data[tokenId];
      const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
      const balance = Number(
        shrinkToken(
          new Decimal(supplied[tokenId]?.balance || 0)
            .plus(collateral[tokenId]?.balance || 0)
            .toNumber(),
          assetDecimals,
        ),
      );
      return balance * (asset.price?.usd || 0);
    })
    .reduce((acc, cur) => acc + cur, 0);

  // borrow
  const totalBorrowProfit = borrowedRewards.reduce((sum, cur) => {
    const { tokenId, newDailyAmount } = cur;
    return sum + (assets.data[tokenId].price?.usd || 0) * newDailyAmount;
  }, 0);
  const totalBorrowedPrincipal = Object.entries(borrowFarms)
    .map(([tokenId]) => {
      const asset = assets.data[tokenId];
      const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
      const balance = Number(
        shrinkToken(new Decimal(borrowed[tokenId]?.balance || 0).toNumber(), assetDecimals),
      );
      return balance * (asset.price?.usd || 0);
    })
    .reduce((acc, cur) => acc + cur, 0);

  // net
  const totalNetProfit = netLiquidityRewards.reduce((sum, cur) => {
    const { tokenId, newDailyAmount } = cur;
    return sum + (assets.data[tokenId].price?.usd || 0) * newDailyAmount;
  }, 0);
  const [, totalCollateral] = getNetGains(portfolio, assets, "collateral");
  const [, totalSupplied] = getNetGains(portfolio, assets, "supplied");
  const [, totalBorrowed] = getNetGains(portfolio, assets, "borrowed");
  const totalNetPrincipal = totalCollateral + totalSupplied - totalBorrowed;

  const supplyAPY =
    totalSupplyPrincipal > 0 ? (totalSupplyProfit / totalSupplyPrincipal) * 365 * 100 : 0;
  const borrowAPY =
    totalBorrowedPrincipal > 0 ? (totalBorrowProfit / totalBorrowedPrincipal) * 365 * 100 : 0;
  const netAPY = totalNetPrincipal > 0 ? (totalNetProfit / totalNetPrincipal) * 365 * 100 : 0;
  return { avgStakeSupplyAPY: supplyAPY, avgStakeBorrowAPY: borrowAPY, avgStakeNetAPY: netAPY };
}
