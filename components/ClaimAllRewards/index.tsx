import { LoadingButtonProps } from "@mui/lab/LoadingButton";
import { ButtonProps, MenuItemProps } from "@mui/material";

import { useEffect, useState } from "react";
import { useClaimAllRewards } from "../../hooks/useClaimAllRewards";

interface Props {
  Button: React.ComponentType<LoadingButtonProps | ButtonProps | MenuItemProps>;
  location: string;
  onDone?: () => void;
  disabled?: boolean;
  memeCategory?: boolean;
}

function ClaimAllRewards({ Button, onDone, disabled = false, memeCategory }: Props) {
  const { handleClaimAll, isLoading } = useClaimAllRewards(memeCategory);
  const [hasClicked, setHasClicked] = useState(false);

  const loading = Button.name === "ClaimMenuItem" ? undefined : isLoading;

  const handleClick = () => {
    setHasClicked(true);
    handleClaimAll();
  };
  useEffect(() => {
    if (hasClicked && !isLoading) {
      if (onDone) {
        onDone();
      }
      setHasClicked(false);
    }
  }, [hasClicked, isLoading, onDone]);
  return <Button onClick={handleClick} loading={loading} disabled={disabled} />;
}

export default ClaimAllRewards;
