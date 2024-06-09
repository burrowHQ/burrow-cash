import { useExtraAPY } from "./useExtraAPY";

export const useAPY = ({
  baseAPY,
  rewards: list,
  page,
  tokenId,
  onlyMarket = false,
  isStaking = false,
  excludeNetApy = false,
}) => {
  const isBorrow = page === "borrow";
  const {
    computeRewardAPY,
    computeStakingRewardAPY,
    computeTokenNetRewardAPY,
    netLiquidityAPY,
    netTvlMultiplier,
  } = useExtraAPY({
    tokenId,
    isBorrow,
    onlyMarket: !!onlyMarket,
  });

  const extraAPY = list.reduce((acc: number, { metadata, rewards, price, config }) => {
    const apy = computeRewardAPY({
      rewardTokenId: metadata.token_id,
      rewardData: rewards,
    });

    return acc + apy;
  }, 0);

  const stakingExtraAPY = list.reduce((acc: number, { metadata }) => {
    const apy = computeStakingRewardAPY(metadata.token_id);
    return acc + apy;
  }, 0);
  const { apy: tokenNetAPY } = computeTokenNetRewardAPY();
  const sign = isBorrow ? -1 : 1;
  const apy = isStaking ? stakingExtraAPY : extraAPY;
  const boostedAPY =
    baseAPY +
    (isBorrow || excludeNetApy ? 0 : netLiquidityAPY) * netTvlMultiplier +
    (isBorrow ? 0 : tokenNetAPY) +
    sign * apy;
  return boostedAPY;
};
