import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { getProtocolStats, getProtocolStatsMEME } from "../redux/appSelectors";
import { setProtocolStats } from "../redux/appSlice";

export function useStatsToggle() {
  const dispatch = useAppDispatch();
  const { dashBoardActiveTab } = useAppSelector((state) => state.category);
  const protocolStats = useAppSelector(
    dashBoardActiveTab == "main" ? getProtocolStats : getProtocolStatsMEME,
  );

  const setStats = (v: boolean) => dispatch(setProtocolStats(v));

  return { protocolStats, setStats };
}
