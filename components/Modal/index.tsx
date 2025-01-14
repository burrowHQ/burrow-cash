import { useEffect, useState, createContext } from "react";
import { Modal as MUIModal, Box, useTheme } from "@mui/material";

import Decimal from "decimal.js";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { hideModal, fetchConfig, updateAmount, updatePosition } from "../../redux/appSlice";
import {
  hideModal as hideModalMEME,
  fetchConfig as fetchConfigMEME,
  updateAmount as updateAmountMEME,
  updatePosition as updatePositionMEME,
} from "../../redux/appSliceMEME";
import { getModalStatus, getAssetData, getSelectedValues } from "../../redux/appSelectors";
import { getWithdrawMaxAmount } from "../../redux/selectors/getWithdrawMaxAmount";
import { getRepayPositions } from "../../redux/selectors/getRepayPositions";
import { getAccountId } from "../../redux/accountSelectors";
import { getBorrowMaxAmount } from "../../redux/selectors/getBorrowMaxAmount";
import { recomputeHealthFactor } from "../../redux/selectors/recomputeHealthFactor";
import { recomputeHealthFactorAdjust } from "../../redux/selectors/recomputeHealthFactorAdjust";
import { recomputeHealthFactorWithdraw } from "../../redux/selectors/recomputeHealthFactorWithdraw";
import { recomputeHealthFactorSupply } from "../../redux/selectors/recomputeHealthFactorSupply";
import { recomputeHealthFactorRepay } from "../../redux/selectors/recomputeHealthFactorRepay";
import { getAssetsCategory } from "../../redux/assetsSelectors";
import { recomputeHealthFactorRepayFromDeposits } from "../../redux/selectors/recomputeHealthFactorRepayFromDeposits";
import { formatWithCommas_number } from "../../utils/uiNumber";
import { DEFAULT_POSITION, lpTokenPrefix, NBTCTokenId } from "../../utils/config";
import { Wrapper } from "./style";
import { getModalData } from "./utils";
import {
  NotConnected,
  ModalTitle,
  RepayTab,
  HealthFactor,
  Rates,
  Alerts,
  CollateralSwitch,
  CollateralTip,
  BorrowLimit,
  Receive,
} from "./components";
import Controls from "./Controls";
import Action from "./Action";
import { fetchAssets, fetchRefPrices } from "../../redux/assetsSlice";
import { fetchAssetsMEME } from "../../redux/assetsSliceMEME";
import { useDegenMode } from "../../hooks/hooks";
import { isMemeCategory } from "../../redux/categorySelectors";
import {
  CollateralTypeSelectorBorrow,
  CollateralTypeSelectorRepay,
} from "./CollateralTypeSelector";
import { useBtcAction } from "../../hooks/useBtcBalance";

export const ModalContext = createContext(null) as any;
const Modal = () => {
  const dispatch = useAppDispatch();
  const isMeme = useAppSelector(isMemeCategory);
  const isOpen = useAppSelector(getModalStatus);
  const accountId = useAppSelector(getAccountId);
  const asset = useAppSelector(getAssetData);
  const assets = useAppSelector(getAssetsCategory());
  const { amount } = useAppSelector(getSelectedValues);
  const { isRepayFromDeposits } = useDegenMode();
  const theme = useTheme();
  const [selectedCollateralType, setSelectedCollateralType] = useState(DEFAULT_POSITION);
  const { action = "Deposit", tokenId, position } = asset;
  const { healthFactor, maxBorrowValue: adjustedMaxBorrowValue } = useAppSelector(
    action === "Withdraw"
      ? recomputeHealthFactorWithdraw(tokenId, +amount)
      : action === "Adjust"
      ? recomputeHealthFactorAdjust(tokenId, +amount)
      : action === "Supply"
      ? recomputeHealthFactorSupply(tokenId, +amount)
      : action === "Repay" && isRepayFromDeposits
      ? recomputeHealthFactorRepayFromDeposits(tokenId, +amount, selectedCollateralType)
      : action === "Repay" && !isRepayFromDeposits
      ? recomputeHealthFactorRepay(tokenId, +amount, selectedCollateralType)
      : recomputeHealthFactor(tokenId, +amount, selectedCollateralType),
  );
  const { healthFactor: single_healthFactor } = useAppSelector(
    recomputeHealthFactorWithdraw(tokenId, +amount),
  );
  const maxBorrowAmountPositions = useAppSelector(getBorrowMaxAmount(tokenId));
  const maxWithdrawAmount = useAppSelector(getWithdrawMaxAmount(tokenId));
  const repayPositions = useAppSelector(getRepayPositions(tokenId));
  const { availableBalance: btcAvailableBalance, receiveAmount } = useBtcAction({
    inputAmount: amount,
    decimals: asset.decimals,
  });
  const activePosition =
    action === "Repay" || action === "Borrow"
      ? selectedCollateralType
      : tokenId?.indexOf(lpTokenPrefix) > -1
      ? tokenId
      : DEFAULT_POSITION;
  const { maxBorrowAmount = 0, maxBorrowValue = 0 } =
    maxBorrowAmountPositions[activePosition] || {};
  const repayAmount = repayPositions[selectedCollateralType];
  const { price, available, available$, rates, alerts, canUseAsCollateral } = getModalData({
    ...asset,
    maxBorrowAmount,
    maxWithdrawAmount,
    isRepayFromDeposits,
    healthFactor,
    amount,
    borrowed: repayAmount,
    poolAsset: assets[tokenId],
  });
  useEffect(() => {
    if (isOpen) {
      // TODO33 still need this???
      dispatch(fetchAssets()).then(() => dispatch(fetchRefPrices()));
      dispatch(fetchAssetsMEME()).then(() => dispatch(fetchRefPrices()));
      dispatch(fetchConfig());
      dispatch(fetchConfigMEME());
    }
  }, [isOpen]);
  useEffect(() => {
    if (position) {
      setSelectedCollateralType(position);
    }
  }, [position]);
  useEffect(() => {
    if (isMeme) {
      dispatch(updateAmountMEME({ isMax: false, amount: "0" }));
      dispatch(updatePositionMEME({ position: selectedCollateralType }));
    } else {
      dispatch(updateAmount({ isMax: false, amount: "0" }));
      dispatch(updatePosition({ position: selectedCollateralType }));
    }
  }, [selectedCollateralType, isMeme]);
  if (action === "Adjust") {
    rates.push({
      label: "Use as Collateral",
      value: formatWithCommas_number(new Decimal(amount || 0).toFixed()),
      value$: new Decimal(price * +amount).toFixed(),
    });
  }
  const handleClose = () => {
    if (isMeme) {
      dispatch(hideModalMEME());
    } else {
      dispatch(hideModal());
    }
  };
  const repay_to_lp =
    action === "Repay" && isRepayFromDeposits && selectedCollateralType !== DEFAULT_POSITION;
  const isBtc = action === "Supply" && asset.tokenId === NBTCTokenId;
  return (
    <MUIModal open={isOpen} onClose={handleClose}>
      <Wrapper
        sx={{
          "& *::-webkit-scrollbar": {
            backgroundColor: theme.custom.scrollbarBg,
          },
        }}
        style={{
          overflowY: "auto",
        }}
      >
        <ModalContext.Provider
          value={{
            position: selectedCollateralType,
          }}
        >
          <Box sx={{ p: ["20px", "20px"] }}>
            {!accountId && <NotConnected />}
            <ModalTitle asset={asset} onClose={handleClose} />
            {action === "Borrow" ? (
              <CollateralTypeSelectorBorrow
                maxBorrowAmountPositions={maxBorrowAmountPositions}
                selectedCollateralType={selectedCollateralType}
                setSelectedCollateralType={setSelectedCollateralType}
              />
            ) : null}
            {action === "Repay" ? (
              <CollateralTypeSelectorRepay
                repayPositions={repayPositions}
                selectedCollateralType={selectedCollateralType}
                setSelectedCollateralType={setSelectedCollateralType}
              />
            ) : null}
            <RepayTab asset={asset} />
            <Controls
              amount={amount}
              available={available}
              action={action}
              asset={asset}
              totalAvailable={available}
              available$={available$}
            />
            <div className="flex flex-col gap-4 mt-6">
              {isBtc ? <Receive value={receiveAmount} /> : null}
              <HealthFactor value={healthFactor} />
              {repay_to_lp ? (
                <HealthFactor value={single_healthFactor} title="Health Factor(Single)" />
              ) : null}
              <Rates rates={rates} />
              <BorrowLimit from={maxBorrowValue} to={adjustedMaxBorrowValue} />
              {!canUseAsCollateral ? (
                <CollateralTip />
              ) : (
                <CollateralSwitch
                  action={action}
                  canUseAsCollateral={canUseAsCollateral}
                  tokenId={asset.tokenId}
                />
              )}
            </div>
            <Alerts data={alerts} />
            <Action
              maxBorrowAmount={maxBorrowAmount}
              healthFactor={healthFactor}
              collateralType={selectedCollateralType}
              poolAsset={assets[tokenId]}
            />
          </Box>
        </ModalContext.Provider>
      </Wrapper>
    </MUIModal>
  );
};

export default Modal;
