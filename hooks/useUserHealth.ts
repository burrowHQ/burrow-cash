import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { getDailyReturns } from "../redux/selectors/getDailyReturns";
import { getNetAPY, getNetTvlAPY } from "../redux/selectors/getNetAPY";
import { getHealthFactor } from "../redux/selectors/getHealthFactor";
import { getAppState } from "../redux/appSelectors";
import { toggleShowDailyReturns } from "../redux/appSlice";
import { trackShowDailyReturns } from "../utils/telemetry";
import { useSlimStats } from "./hooks";
import { useFullDigits } from "./useFullDigits";

export function useUserHealth() {
  const dispatch = useAppDispatch();
  const { showDailyReturns } = useAppSelector(getAppState);
  const netAPY = useAppSelector(getNetAPY({ isStaking: false }));
  const netLiquidityAPY = useAppSelector(getNetTvlAPY({ isStaking: false }));
  const dailyReturns = useAppSelector(getDailyReturns);
  const healthFactor = useAppSelector(getHealthFactor);

  const { fullDigits, setDigits } = useFullDigits();
  const slimStats = useSlimStats();
  const lowHealthFactor = 180;
  const dangerHealthFactor = 100;

  const toggleDailyReturns = () => {
    trackShowDailyReturns({ showDailyReturns });
    dispatch(toggleShowDailyReturns());
  };

  const toggleDigits = () => {
    setDigits({ dailyReturns: !fullDigits.dailyReturns });
  };
  const valueLocale =
    healthFactor && healthFactor <= 100
      ? Math.floor(Number(healthFactor) * 100) / 100
      : Math.trunc(Number(healthFactor));
  const valueLabel = healthFactor === -1 || healthFactor === null ? "-%" : `${valueLocale}%`;

  const label =
    healthFactor === -1 || healthFactor === null
      ? "n/a"
      : healthFactor < lowHealthFactor
      ? "Low"
      : healthFactor < 200
      ? "Medium"
      : "Good";

  return {
    netAPY,
    netLiquidityAPY,
    dailyReturns,
    healthFactor,
    lowHealthFactor,
    dangerHealthFactor,
    slimStats,
    fullDigits,
    toggleDigits,
    showDailyReturns,
    toggleDailyReturns,
    data: {
      valueLocale,
      valueLabel,
      label,
    },
  };
}
