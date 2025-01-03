import { LoadingButtonProps } from "@mui/lab/LoadingButton";
import { ButtonProps, MenuItemProps } from "@mui/material";

import { useEffect, useState } from "react";
import { useClaimAllRewards } from "../../hooks/useClaimAllRewards";

interface Props {
  Button: React.ComponentType<LoadingButtonProps | ButtonProps | MenuItemProps>;
  location: string;
  onDone?: () => void;
  disabled?: boolean;
}

function ClaimAllRewards({ Button, onDone, disabled = false }: Props) {
  const { handleClaimAll, isLoading } = useClaimAllRewards();
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
