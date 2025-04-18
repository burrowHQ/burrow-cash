import { useEffect, useState, createContext, useMemo } from "react";
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
  AlertWarning,
  CollateralSwitch,
  CollateralTip,
  BorrowLimit,
  Receive,
  Fee,
  BtcOneClickTab,
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
import { useBtcAction, useCalculateWithdraw, useCalculateDeposit } from "../../hooks/useBtcBalance";
import { beautifyPrice } from "../../utils/beautyNumber";
import { getPageTypeFromUrl } from "../../utils/commonUtils";

export const ModalContext = createContext(null) as any;
const Modal = () => {
  const [selectedCollateralType, setSelectedCollateralType] = useState(DEFAULT_POSITION);
  const [nbtcTab, setNbtcTab] = useState<"btc" | "near">("btc");
  const dispatch = useAppDispatch();
  // TODOXXX
  // const isMeme = useAppSelector(isMemeCategory);
  const pageType = getPageTypeFromUrl();
  const isMeme = pageType == "meme";
  const isOpen = useAppSelector(getModalStatus);
  const accountId = useAppSelector(getAccountId);
  const asset = useAppSelector(getAssetData);
  const assets = useAppSelector(getAssetsCategory());
  const { amount } = useAppSelector(getSelectedValues);
  const { isRepayFromDeposits } = useDegenMode();
  const theme = useTheme();
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
  // NBTC start
  // TODOXXX
  const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
  const isBtcToken = asset.tokenId === NBTCTokenId && selectedWalletId === "btc-wallet";
  const isBtcSupply = action === "Supply" && isBtcToken;
  const isBtcWithdraw = action === "Withdraw" && isBtcToken;
  const isBtcChainSupply = isBtcSupply && nbtcTab == "btc";
  const isBtcChainWithdraw = isBtcWithdraw && nbtcTab == "btc";
  const isOneClickAction = (isBtcSupply || isBtcWithdraw) && nbtcTab == "btc";
  const { availableBalance: btcAvailableBalance, availableBalance$: btcAvailableBalance$ } =
    useBtcAction({
      tokenId: asset?.tokenId || "",
      price: asset?.price || 0,
    });
  const { receiveAmount: withdrawReceiveAmount, loading: cacuWithdrawLoading } =
    useCalculateWithdraw({
      isBtcWithdraw,
      decimals: asset?.decimals || 0,
      amount,
    });
  const {
    fee: depositFee,
    loading: cacuDepositLoading,
    receiveAmount: depositReceiveAmount,
    minDepositAmount: depositMinDepositAmount,
  } = useCalculateDeposit({
    isBtcDeposit: isBtcChainSupply,
    decimals: asset?.decimals || 0,
    amount,
  });
  console.log(
    "------------------depositFee, cacuDepositLoading, depositMinDepositAmount",
    depositFee,
    cacuDepositLoading,
    depositMinDepositAmount,
  );
  // withdraw oneClick min
  if (isBtcChainWithdraw) {
    const min_withdraw_amount = 0.000054;
    if (new Decimal(amount || 0).lt(min_withdraw_amount)) {
      alerts["btcWithdrawMinLimit"] = {
        title: `You must withdraw at least ${min_withdraw_amount} NBTC`,
        severity: "error",
      };
    } else {
      delete alerts.btcWithdrawMinLimit;
    }
  }
  // deposit oneClick min
  if (isBtcChainSupply && nbtcTab == "btc") {
    if (
      new Decimal(amount || 0).gt(0) &&
      new Decimal(depositReceiveAmount || 0).lt(depositMinDepositAmount || 0)
    ) {
      alerts["btcDepositMinLimit"] = {
        title: `You must deposit at least ${depositMinDepositAmount} NBTC`,
        severity: "error",
      };
    } else {
      delete alerts.btcDepositMinLimit;
    }
  }
  // oneClick time
  if (isOneClickAction) {
    alerts["oneClickActionTime"] = {
      title: "It will take about 20 minutes to complete.",
      severity: "warning",
    };
  } else {
    delete alerts.oneClickActionTime;
  }
  const actionButtonDisabled =
    alerts["btcWithdrawMinLimit"] ||
    alerts["btcDepositMinLimit"] ||
    (isBtcChainSupply && cacuDepositLoading) ||
    (isBtcChainWithdraw && cacuWithdrawLoading);
  // NBTC end
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
            {isBtcSupply || isBtcWithdraw ? (
              <BtcOneClickTab nbtcTab={nbtcTab} setNbtcTab={setNbtcTab} isMeme={isMeme} />
            ) : null}
            <Controls
              amount={amount}
              available={isBtcChainSupply ? btcAvailableBalance : available}
              action={action}
              asset={asset}
              totalAvailable={isBtcChainSupply ? btcAvailableBalance : available}
              available$={isBtcChainSupply ? btcAvailableBalance$ : available$}
            />
            <div className="flex flex-col gap-4 mt-6">
              {isBtcChainWithdraw ? (
                <Receive
                  value={beautifyPrice(withdrawReceiveAmount) as string}
                  loading={cacuWithdrawLoading}
                />
              ) : null}
              {isBtcChainSupply ? (
                <>
                  <Receive
                    value={beautifyPrice(depositReceiveAmount) as string}
                    loading={cacuDepositLoading}
                  />
                  <Fee value={beautifyPrice(depositFee) as string} loading={cacuDepositLoading} />
                </>
              ) : null}
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
              maxWithdrawAmount={maxWithdrawAmount}
              healthFactor={healthFactor}
              collateralType={selectedCollateralType}
              poolAsset={assets[tokenId]}
              oneClickActionDepositAmount={depositReceiveAmount}
              isDisabled={actionButtonDisabled}
              isOneClickAction={isOneClickAction}
            />
            {isMeme && action === "Supply" ? (
              <AlertWarning
                title="Extreme market conditions may cause a temporary inability to redeem funds."
                className="mt-2 px-2"
              />
            ) : null}
          </Box>
        </ModalContext.Provider>
      </Wrapper>
    </MUIModal>
  );
};

export default Modal;
