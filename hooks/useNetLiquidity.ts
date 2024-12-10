import { useAppSelector } from "../redux/hooks";

import { getTotalBalance, getTotalBalanceMEME } from "../redux/selectors/getTotalBalance";

export function useProtocolNetLiquidity(withNetTvlMultiplier?: boolean) {
  const { dashBoardActiveTab } = useAppSelector((state) => state.category);
  const protocolDeposited = useAppSelector(
    dashBoardActiveTab == "main"
      ? getTotalBalance("supplied", withNetTvlMultiplier)
      : getTotalBalanceMEME("supplied", withNetTvlMultiplier),
  );
  const protocolBorrowed = useAppSelector(
    dashBoardActiveTab == "main"
      ? getTotalBalance("borrowed", withNetTvlMultiplier)
      : getTotalBalanceMEME("borrowed", withNetTvlMultiplier),
  );
  const protocolNetLiquidity = protocolDeposited - protocolBorrowed;
  return { protocolDeposited, protocolBorrowed, protocolNetLiquidity };
}
