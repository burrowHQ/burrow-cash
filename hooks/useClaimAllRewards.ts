import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { isClaiming } from "../redux/accountSelectors";
import { trackClaimButton } from "../utils/telemetry";
import { farmClaimAll, fetchAccount } from "../redux/accountSlice";
import { farmClaimAllMEME, fetchAccountMEME } from "../redux/accountSliceMEME";
import { fetchMarginAccount } from "../redux/marginAccountSlice";

export function useClaimAllRewards(location: string) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(isClaiming);

  const handleClaimAll = () => {
    trackClaimButton(location);
    dispatch(farmClaimAll()).then(() => {
      dispatch(fetchAccount());
      dispatch(fetchMarginAccount());
    });
    dispatch(farmClaimAllMEME()).then(() => {
      dispatch(fetchAccountMEME());
    });
  };

  return { handleClaimAll, isLoading };
}
