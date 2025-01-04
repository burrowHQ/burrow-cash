import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { getAvailableAssets, isAssetsLoading } from "../redux/assetsSelectors";
import { getAccountId, getHasNonFarmedAssets, isAccountLoading } from "../redux/accountSelectors";
import { getPortfolioAssets } from "../redux/selectors/getPortfolioAssets";
import {
  getConfig,
  getSlimStats,
  getDegenMode,
  getTheme,
  getUnreadLiquidation,
  getToastMessage,
} from "../redux/appSelectors";
import {
  setRepayFrom,
  toggleDegenMode,
  setTheme,
  setUnreadLiquidation,
  setToastMessage,
} from "../redux/appSlice";
import {
  setRepayFrom as setRepayFromMEME,
  setUnreadLiquidation as setUnreadLiquidationMEME,
} from "../redux/appSliceMEME";
import { getViewAs } from "../utils";
import { isMemeCategory } from "../redux/categorySelectors";
import { getWeightedAssets, getWeightedNetLiquidity } from "../redux/selectors/getAccountRewards";
import { getLiquidations } from "../api/get-liquidations";

export function useLoading() {
  const isLoadingAssets = useAppSelector(isAssetsLoading);
  const isLoadingAccount = useAppSelector(isAccountLoading);
  return isLoadingAssets || isLoadingAccount;
}

export function useIsBurrowToken(tokenId) {
  const config = useAppSelector(getConfig);
  return config.booster_token_id === tokenId;
}

export function useSlimStats() {
  return useAppSelector(getSlimStats);
}

export function useViewAs() {
  const viewAs = getViewAs();
  return !!viewAs;
}

export function useConfig() {
  return useAppSelector(getConfig);
}

export function useAccountId() {
  return useAppSelector(getAccountId);
}

export function useNonFarmedAssets() {
  const weightedNetLiquidity = useAppSelector(getWeightedNetLiquidity);
  const hasNonFarmedAssets = useAppSelector(getHasNonFarmedAssets);
  const hasNegativeNetLiquidity = weightedNetLiquidity < 0;
  const assets = useAppSelector(getWeightedAssets);

  return { hasNonFarmedAssets, weightedNetLiquidity, hasNegativeNetLiquidity, assets };
}

export function useAvailableAssets(params?: { source?: "supply" | "borrow" | "" }) {
  const { source } = params || {};
  const rows = useAppSelector(getAvailableAssets({ source }));
  return rows;
}

export function usePortfolioAssets(memeCategory?: boolean) {
  return useAppSelector(getPortfolioAssets(memeCategory));
}

export function useDegenMode() {
  const degenMode = useAppSelector(getDegenMode);
  const dispatch = useAppDispatch();

  const setDegenMode = () => {
    dispatch(toggleDegenMode());
  };

  const setRepayFromDeposits = (repayFromDeposits: boolean) => {
    const isMeme = useAppSelector(isMemeCategory);
    if (isMeme) {
      dispatch(setRepayFromMEME({ repayFromDeposits }));
    } else {
      dispatch(setRepayFrom({ repayFromDeposits }));
    }
  };

  const isRepayFromDeposits = degenMode.enabled && degenMode.repayFromDeposits;

  return { degenMode, setDegenMode, isRepayFromDeposits, setRepayFromDeposits };
}

export function useDarkMode() {
  const theme = useAppSelector(getTheme);
  const dispatch = useAppDispatch();

  const toggle = () => {
    dispatch(setTheme(theme === "light" ? "dark" : "light"));
  };

  return { toggle, theme, isDark: theme === "dark" };
}

export function useUnreadLiquidation({
  liquidationPage = 1,
  memeCategory,
}: {
  liquidationPage?: number;
  memeCategory?: boolean;
}) {
  const isMemeCur = useAppSelector(isMemeCategory);
  let isMeme: boolean;
  if (memeCategory == undefined) {
    isMeme = isMemeCur;
  } else {
    isMeme = memeCategory;
  }
  const unreadLiquidation = useAppSelector(getUnreadLiquidation);
  const accountId = useAccountId();
  const dispatch = useAppDispatch();

  const fetchUnreadLiquidation = async () => {
    try {
      const { liquidationData } = await getLiquidations(accountId, liquidationPage || 1, 10);
      if (liquidationData?.unread !== undefined) {
        if (isMeme) {
          dispatch(
            setUnreadLiquidationMEME({
              count: liquidationData.unread,
              unreadIds: unreadLiquidation?.unreadIds || [],
            }),
          );
        } else {
          dispatch(
            setUnreadLiquidation({
              count: liquidationData.unread,
              unreadIds: unreadLiquidation?.unreadIds || [],
            }),
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return { unreadLiquidation, fetchUnreadLiquidation };
}

export function useToastMessage() {
  const toastMessage = useAppSelector(getToastMessage);
  const dispatch = useAppDispatch();

  const showToast = (message) => {
    dispatch(setToastMessage(message));
  };

  return { toastMessage, showToast };
}
