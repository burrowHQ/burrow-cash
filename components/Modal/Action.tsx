import { useState, useMemo, useEffect } from "react";
import { Box, Typography, Switch, Tooltip, Alert, useTheme } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import Decimal from "decimal.js";
import { FcInfo } from "@react-icons/all-files/fc/FcInfo";
import { nearTokenId } from "../../utils";
import { toggleUseAsCollateral, hideModal } from "../../redux/appSlice";
import { getModalData } from "./utils";
import { repay } from "../../store/actions/repay";
import { repayFromDeposits } from "../../store/actions/repayFromDeposits";
import { supply } from "../../store/actions/supply";
import { deposit } from "../../store/actions/deposit";
import { borrow } from "../../store/actions/borrow";
import { withdraw } from "../../store/actions/withdraw";
import { shadow_action_supply } from "../../store/actions/shadow";
import { adjustCollateral } from "../../store/actions/adjustCollateral";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { getSelectedValues, getAssetData, getConfig } from "../../redux/appSelectors";
import { trackActionButton } from "../../utils/telemetry";
import { useDegenMode } from "../../hooks/hooks";
import { SubmitButton, AlertWarning } from "./components";
import { getAccountPortfolio } from "../../redux/accountSelectors";
import getShadowRecords from "../../api/get-shadows";
import { expandToken, shrinkToken } from "../../store";

export default function Action({ maxBorrowAmount, healthFactor, collateralType, poolAsset }) {
  const [loading, setLoading] = useState(false);
  const { amount, useAsCollateral, isMax } = useAppSelector(getSelectedValues);
  const { enable_pyth_oracle } = useAppSelector(getConfig);
  const dispatch = useAppDispatch();
  const asset = useAppSelector(getAssetData);
  const { action = "Deposit", tokenId, borrowApy, price, portfolio, isLpToken, position } = asset;
  const { isRepayFromDeposits } = useDegenMode();
  const { available, canUseAsCollateral, extraDecimals, collateral, disabled, decimals } =
    getModalData({
      ...asset,
      maxBorrowAmount,
      healthFactor,
      amount,
      isRepayFromDeposits,
    });
  const borrowed = shrinkToken(
    portfolio?.positions?.[position || ""]?.borrowed?.[tokenId]?.balance || "0",
    (extraDecimals || 0) + (decimals || 0),
  );
  useEffect(() => {
    if (!canUseAsCollateral) {
      dispatch(toggleUseAsCollateral({ useAsCollateral: false }));
    }
  }, [useAsCollateral]);

  const handleActionButtonClick = async () => {
    setLoading(true);
    trackActionButton(action, {
      tokenId,
      amount,
      isMax,
      useAsCollateral,
      available,
      collateral,
      sliderValue: Math.round((+amount * 100) / available) || 0,
      isRepayFromDeposits,
    });
    switch (action) {
      case "Supply":
        if (tokenId === nearTokenId) {
          await deposit({ amount, useAsCollateral, isMax });
        } else if (isLpToken) {
          const shadowRecords = await getShadowRecords();
          const pool_id = tokenId.split("-")[1];
          await shadow_action_supply({
            tokenId,
            decimals: +(decimals || 0) + +extraDecimals,
            useAsCollateral,
            amount,
            isMax,
            isRegistered: !!shadowRecords?.[pool_id],
          });
        } else {
          await supply({
            tokenId,
            extraDecimals,
            useAsCollateral,
            amount,
            isMax,
          });
        }
        break;
      case "Borrow": {
        await borrow({ tokenId, extraDecimals, amount, collateralType, enable_pyth_oracle });
        break;
      }
      case "Withdraw": {
        await withdraw({
          tokenId,
          extraDecimals,
          amount,
          isMax,
          enable_pyth_oracle,
        });
        break;
      }
      case "Adjust":
        await adjustCollateral({
          tokenId,
          extraDecimals,
          amount,
          isMax,
          enable_pyth_oracle,
        });
        break;
      case "Repay": {
        let minRepay = "0";
        let interestChargedIn1min = "0";
        if (borrowApy && price && borrowed) {
          interestChargedIn1min = expandToken(
            new Decimal(borrowApy)
              .div(365 * 24 * 60)
              .div(100)
              .mul(borrowed)
              .toFixed(),
            decimals,
            0,
          );
          if (+interestChargedIn1min === 0) {
            interestChargedIn1min = "1";
          }
        }
        if (poolAsset?.supplied?.shares) {
          minRepay = new Decimal(poolAsset?.supplied?.balance)
            .div(poolAsset?.supplied?.shares)
            .mul(2)
            .toFixed(0, 2);
        }
        if (isRepayFromDeposits) {
          await repayFromDeposits({
            tokenId,
            amount,
            extraDecimals,
            position: collateralType,
            isMax,
            enable_pyth_oracle,
          });
        } else {
          await repay({
            tokenId,
            amount,
            extraDecimals,
            position: collateralType,
            isMax,
            minRepay,
            interestChargedIn1min,
          });
        }
        break;
      }
      default:
        break;
    }
    dispatch(hideModal());
  };
  const actionDisabled = useMemo(() => {
    if (action === "Supply" && +amount > 0) return false;
    if (disabled) return true;
    if (action !== "Adjust" && +amount <= 0) return true;
    if (
      action !== "Repay" &&
      parseFloat(healthFactor?.toFixed(2)) >= 0 &&
      parseFloat(healthFactor?.toFixed(2)) <= 100
    )
      return true;
    return false;
  }, [amount, healthFactor, disabled]);

  return (
    <SubmitButton
      action={action}
      disabled={actionDisabled}
      loading={loading}
      onClick={handleActionButtonClick}
    />
  );
}
