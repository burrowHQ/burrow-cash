import { useAppSelector } from "../redux/hooks";

import { getTotalBalance, getTotalBalanceMEME } from "../redux/selectors/getTotalBalance";

export function useProtocolNetLiquidity(withNetTvlMultiplier?: boolean) {
  const { activeCategory } = useAppSelector((state) => state.category);
  const protocolDeposited = useAppSelector(
    activeCategory == "main"
      ? getTotalBalance("supplied", withNetTvlMultiplier)
      : getTotalBalanceMEME("supplied", withNetTvlMultiplier),
  );
  const protocolBorrowed = useAppSelector(
    activeCategory == "main"
      ? getTotalBalance("borrowed", withNetTvlMultiplier)
      : getTotalBalanceMEME("borrowed", withNetTvlMultiplier),
  );
  const protocolNetLiquidity = protocolDeposited - protocolBorrowed;
  return { protocolDeposited, protocolBorrowed, protocolNetLiquidity };
}
