import { useAppDispatch } from "../redux/hooks";
import { farmClaimAll, fetchAccount, setIsClaiming } from "../redux/accountSlice";
import {
  farmClaimAllMEME,
  fetchAccountMEME,
  setIsClaiming as setIsClaimingMEME,
} from "../redux/accountSliceMEME";
import { claimAll } from "../store/actions/claimAll";

export function useClaimAllRewards(isMemeCategory?: boolean) {
  const dispatch = useAppDispatch();
  function changeClaimStatus(status: boolean) {
    if (isMemeCategory) {
      dispatch(setIsClaimingMEME(status));
    } else {
      dispatch(setIsClaiming(status));
    }
  }
  const handleClaimAll = ({ rewards, action }: { rewards?: any[]; action?: any }) => {
    if (isMemeCategory) {
      if (!rewards?.length) {
        dispatch(farmClaimAllMEME()).then(() => {
          dispatch(fetchAccountMEME());
        });
      } else {
        // TODOXX withdraw
        claimAll({
          rewards,
          isMeme: true,
          changeClaimStatus,
        }).then(() => {
          dispatch(fetchAccountMEME());
          action && action();
        });
      }
    } else {
      if (!rewards?.length) {
        dispatch(farmClaimAll()).then(() => {
          dispatch(fetchAccount());
        });
      } else {
        // TODOXX withdraw
        claimAll({
          rewards,
          isMeme: false,
          changeClaimStatus,
        }).then(() => {
          dispatch(fetchAccount());
          action && action();
        });
      }
    }
  };

  return { handleClaimAll };
}
