import { useAppSelector } from "../redux/hooks";
import { getAverageAPY, getAverageAPYMEME } from "../redux/selectors/getAverageAPY";

export const useAverageAPY = () => {
  const { averageSupplyApy, averageBorrowedApy } = useAppSelector(getAverageAPY);
  return { averageSupplyApy, averageBorrowedApy };
};

export const useAverageAPYMEME = () => {
  const { averageSupplyApy, averageBorrowedApy } = useAppSelector(getAverageAPYMEME);
  return { averageSupplyApy, averageBorrowedApy };
};
