import { useAppSelector } from "../redux/hooks";
import { getTotalBalance } from "../redux/selectors/getTotalBalance";

export function useProtocolNetLiquidity(withNetTvlMultiplier?: boolean, memeCategory?: boolean) {
  const protocolDeposited = useAppSelector(
    getTotalBalance({
      source: "supplied",
      withNetTvlMultiplier,
      memeCategory,
    }),
  );
  const protocolBorrowed = useAppSelector(
    getTotalBalance({
      source: "borrowed",
      withNetTvlMultiplier,
      memeCategory,
    }),
  );
  const protocolNetLiquidity = protocolDeposited - protocolBorrowed;
  return { protocolDeposited, protocolBorrowed, protocolNetLiquidity };
}
