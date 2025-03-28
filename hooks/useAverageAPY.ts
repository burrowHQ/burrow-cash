import { useAppSelector } from "../redux/hooks";
import { getAverageAPY } from "../redux/selectors/getAverageAPY";

export const useAverageAPY = (memeCategory?: boolean) => {
  const { averageSupplyApy, averageBorrowedApy } = useAppSelector(getAverageAPY(memeCategory));
  return { averageSupplyApy, averageBorrowedApy };
};
