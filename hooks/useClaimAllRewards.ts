import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { isClaiming } from "../redux/accountSelectors";
import { farmClaimAll, fetchAccount } from "../redux/accountSlice";
import { farmClaimAllMEME, fetchAccountMEME } from "../redux/accountSliceMEME";
import { isMemeCategory } from "../utils";

export function useClaimAllRewards() {
  const isLoading = useAppSelector(isClaiming);
  const dispatch = useAppDispatch();
  const isMeme = isMemeCategory();

  const handleClaimAll = () => {
    if (isMeme) {
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
