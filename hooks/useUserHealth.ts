import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { getDailyReturns, getDailyReturnsMEME } from "../redux/selectors/getDailyReturns";
import {
  getNetAPY,
  getNetTvlAPY,
  getNetAPYMEME,
  getNetTvlAPYMEME,
} from "../redux/selectors/getNetAPY";
import {
  DANGER_HEALTH_FACTOR,
  LOW_HEALTH_FACTOR,
  getHealthFactor,
  getLPHealthFactor,
  getHealthStatus,
  getHealthFactorMEME,
  getLPHealthFactorMEME,
} from "../redux/selectors/getHealthFactor";
import { getAppState, getAppStateMEME } from "../redux/appSelectors";
import { toggleShowDailyReturns } from "../redux/appSlice";
import { trackShowDailyReturns } from "../utils/telemetry";
import { useSlimStats } from "./hooks";
import { useFullDigits } from "./useFullDigits";

export function useUserHealth() {
  const dispatch = useAppDispatch();
  const { dashBoardActiveTab } = useAppSelector((state) => state.category);
  const { showDailyReturns } = useAppSelector(
    dashBoardActiveTab == "main" ? getAppState : getAppStateMEME,
  );
  const netAPY = useAppSelector(
    dashBoardActiveTab == "main"
      ? getNetAPY({ isStaking: false })
      : getNetAPYMEME({ isStaking: false }),
  );
  const netLiquidityAPY = useAppSelector(
    dashBoardActiveTab == "main"
      ? getNetTvlAPY({ isStaking: false })
      : getNetTvlAPYMEME({ isStaking: false }),
  );
  const dailyReturns = useAppSelector(
    dashBoardActiveTab == "main" ? getDailyReturns : getDailyReturnsMEME,
  );
  const healthFactor = useAppSelector(
    dashBoardActiveTab == "main" ? getHealthFactor : getHealthFactorMEME,
  );
  const LPHealthFactor = useAppSelector(
    dashBoardActiveTab == "main" ? getLPHealthFactor : getLPHealthFactorMEME,
  );
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
