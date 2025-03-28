import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { getStaking } from "../redux/selectors/getStaking";
import { setStaking } from "../redux/appSlice";
import { getNetAPY, getNetTvlAPY } from "../redux/selectors/getNetAPY";

export function useStaking(memeCategory?: boolean) {
  const dispatch = useAppDispatch();
  const staking = useAppSelector(getStaking(memeCategory));
  const stakingNetAPY = useAppSelector(getNetAPY({ isStaking: true, memeCategory }));
  const stakingNetTvlAPY = useAppSelector(getNetTvlAPY({ isStaking: true, memeCategory }));

  const setAmount = (amount) => {
    dispatch(setStaking({ amount }));
  };

  const setMonths = (months) => {
    dispatch(setStaking({ months }));
  };

  return { ...staking, setAmount, setMonths, stakingNetAPY, stakingNetTvlAPY };
}
