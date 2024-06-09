import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { getDailyReturns } from "../redux/selectors/getDailyReturns";
import { getNetAPY, getNetTvlAPY } from "../redux/selectors/getNetAPY";
import {
  DANGER_HEALTH_FACTOR,
  LOW_HEALTH_FACTOR,
  getHealthFactor,
  getLPHealthFactor,
  getHealthStatus,
} from "../redux/selectors/getHealthFactor";
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
  const LPHealthFactor = useAppSelector(getLPHealthFactor);
  const { fullDigits, setDigits } = useFullDigits();
  const slimStats = useSlimStats();

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
      : healthFactor < LOW_HEALTH_FACTOR
      ? "Low"
      : healthFactor < 200
      ? "Medium"
      : "Good";

  let allHealths: any[] = [];
  let hasBorrow = false;
  if (![-1, null].includes(healthFactor)) {
    hasBorrow = true;
    allHealths.push({
      id: `token${healthFactor}`,
      type: "Standard Token",
      healthFactor: Math.floor(healthFactor),
      healthStatus: getHealthStatus(healthFactor),
    });
  }
  if (LPHealthFactor) {
    Object.entries(LPHealthFactor).forEach(([positionId, value]: [string, any]) => {
      if (value?.borrowed && Object.keys(value?.borrowed)?.length) {
        hasBorrow = true;
      }
      allHealths.push({
        id: `lp${positionId}`,
        type: "LP",
        positionId,
        ...value,
      });
    });
  }
  allHealths = allHealths.sort((a, b) => a.healthFactor - b.healthFactor);

  return {
    netAPY,
    netLiquidityAPY,
    dailyReturns,
    healthFactor,
    LPHealthFactor,
    allHealths,
    lowHealthFactor: LOW_HEALTH_FACTOR,
    dangerHealthFactor: DANGER_HEALTH_FACTOR,
    slimStats,
    fullDigits,
    toggleDigits,
    showDailyReturns,
    toggleDailyReturns,
    hasBorrow,
    data: {
      valueLocale,
      valueLabel,
      label,
    },
  };
}
