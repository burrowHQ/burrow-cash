import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { getProtocolStats, getProtocolStatsMEME } from "../redux/appSelectors";
import { setProtocolStats } from "../redux/appSlice";

export function useStatsToggle() {
  const dispatch = useAppDispatch();
  const { activeCategory } = useAppSelector((state) => state.category);
  const protocolStats = useAppSelector(
    activeCategory == "main" ? getProtocolStats : getProtocolStatsMEME,
  );

  const setStats = (v: boolean) => dispatch(setProtocolStats(v));

  return { protocolStats, setStats };
}
