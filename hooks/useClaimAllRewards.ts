import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { isClaiming } from "../redux/accountSelectors";
import { farmClaimAll, fetchAccount } from "../redux/accountSlice";
import { farmClaimAllMEME, fetchAccountMEME } from "../redux/accountSliceMEME";

export function useClaimAllRewards(isMemeCategory?: boolean) {
  const isLoading = useAppSelector(isClaiming);
  const dispatch = useAppDispatch();

  const handleClaimAll = () => {
    if (isMemeCategory) {
      dispatch(farmClaimAllMEME()).then(() => {
        dispatch(fetchAccountMEME());
      });
    } else {
      dispatch(farmClaimAll()).then(() => {
        dispatch(fetchAccount());
      });
    }
  };

  return { handleClaimAll, isLoading };
}
