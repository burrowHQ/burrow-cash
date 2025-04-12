import { LoadingButtonProps } from "@mui/lab/LoadingButton";
import { ButtonProps, MenuItemProps } from "@mui/material";
import { useClaimAllRewards } from "../../hooks/useClaimAllRewards";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setIsClaiming } from "../../redux/accountSlice";
import { setIsClaiming as setIsClaimingMEME } from "../../redux/accountSliceMEME";
import { isClaiming } from "../../redux/accountSelectors";
import { useRewards } from "../../hooks/useRewards";

interface Props {
  Button: React.ComponentType<LoadingButtonProps | ButtonProps | MenuItemProps>;
  location: string;
  onDone?: () => void;
  disabled?: boolean;
  memeCategory?: boolean;
}

function ClaimAllRewards({ Button, onDone, disabled = false, memeCategory }: Props) {
  const { handleClaimAll } = useClaimAllRewards(memeCategory);
  const isLoading = useAppSelector(isClaiming(memeCategory));
  const rewardsObj = useRewards(memeCategory);
  const rewards = rewardsObj?.data?.array || [];
  const dispatch = useAppDispatch();
  const handleClick = () => {
    if (isLoading) return;
    if (memeCategory) {
      dispatch(setIsClaimingMEME("pending"));
    } else {
      dispatch(setIsClaiming("pending"));
    }
    handleClaimAll({
      rewards,
      action: onDone,
    });
  };
  return <Button onClick={handleClick} loading={isLoading} disabled={disabled} />;
}

export default ClaimAllRewards;
