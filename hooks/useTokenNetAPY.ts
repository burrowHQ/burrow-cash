import { useExtraAPY } from "./useExtraAPY";

const useTokenNetAPY = ({ page, tokenId, onlyMarket = false }) => {
  const isBorrow = page === "borrow";
  const { computeTokenNetRewardAPY } = useExtraAPY({
    tokenId,
    isBorrow,
    onlyMarket: !!onlyMarket,
  });

  const { apy: tokenNetAPY } = computeTokenNetRewardAPY();
  const APY = isBorrow ? 0 : tokenNetAPY;
  return APY;
};

export default useTokenNetAPY;
