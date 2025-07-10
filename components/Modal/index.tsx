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
  BtcOneClickTab,
  FeeContainer,
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
import { beautifyNumber } from "../../utils/beautyNumber";
import { useUserBalance } from "../../hooks/useUserBalance";
import {
  DEFAULT_POSITION,
  lpTokenPrefix,
  NBTCTokenId,
  WNEARTokenId,
  ETH_CONTRACT_ID,
  ETH_OLD_CONTRACT_ID,
} from "../../utils/config";

export const ModalContext = createContext(null) as any;
const Modal = () => {
  const [btcCanSupplyAvailableBalance, setBtcCanSupplyAvailableBalance] = useState<string>("0");
  const [selectedCollateralType, setSelectedCollateralType] = useState(DEFAULT_POSITION);
  const [nbtcTab, setNbtcTab] = useState<"btc" | "near">("btc");
  const [newUserNbtcReserveAmount] = useState<number>(0.000008);
  const dispatch = useAppDispatch();
  const isMeme = useAppSelector(isMemeCategory);
  const isOpen = useAppSelector(getModalStatus);
  const accountId = useAppSelector(getAccountId);
  const asset = useAppSelector(getAssetData);
  const assets = useAppSelector(getAssetsCategory());
  const { amount } = useAppSelector(getSelectedValues);
  const { isRepayFromDeposits } = useDegenMode();
  const [withdrawData, setWithdrawData] = useState<{
    withdrawReceiveAmount: string;
    cacuWithdrawLoading: boolean;
    withdrawFee: string;
    withdrawGasFee: string;
    errorMsg: string;
  }>({
    withdrawReceiveAmount: "0",
    cacuWithdrawLoading: false,
    withdrawFee: "0",
    withdrawGasFee: "0",
    errorMsg: "",
  });
  const [depositData, setDepositData] = useState<{
    depositFee: string;
    depositGasFee: string;
    cacuDepositLoading: boolean;
    depositReceiveAmount: string;
    depositMinDepositAmount: string;
  }>({
    depositFee: "0",
    depositGasFee: "0",
    cacuDepositLoading: false,
    depositReceiveAmount: "0",
    depositMinDepositAmount: "0",
  });
  const theme = useTheme();
  const { action = "Deposit", tokenId, position } = asset;
  const { supplyBalance } = useUserBalance(tokenId, false);
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
  const maxWithdrawAmount_ETH = useAppSelector(getWithdrawMaxAmount(ETH_CONTRACT_ID));
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
    maxWithdrawAmount_ETH,
    isRepayFromDeposits,
    healthFactor,
    amount,
    borrowed: repayAmount,
    poolAsset: assets[tokenId],
  });
  const newUserOnNearChain = useMemo(() => {
    return new Decimal(supplyBalance || 0).lte(0);
  }, [supplyBalance]);
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
  const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
  const isBtcWallet = selectedWalletId === "btc-wallet";
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
  const {
    receiveAmount: withdrawReceiveAmountPending,
    loading: cacuWithdrawLoadingPending,
    amount: withdrawAmountPending,
    fee: withdrawFeePending,
    btcGasFee: withdrawBtcGasFeePending,
    errorMsg: withdrawErrorMsgPending,
  } = useCalculateWithdraw({
    isBtcWithdraw,
    decimals: asset?.decimals || 0,
    amount,
  });

  const {
    fee: depositFeePending,
    btcGasFee: depositBtcGasFeePending,
    loading: cacuDepositLoadingPending,
    receiveAmount: depositReceiveAmountPending,
    minDepositAmount: depositMinDepositAmountPending,
    amount: depositAmountPending,
  } = useCalculateDeposit({
    isBtcDeposit: isBtcChainSupply,
    decimals: asset?.decimals || 0,
    amount,
    newUserOnNearChain,
  });
  useEffect(() => {
    if (amount == withdrawAmountPending) {
      setWithdrawData({
        withdrawReceiveAmount: withdrawReceiveAmountPending,
        cacuWithdrawLoading: cacuWithdrawLoadingPending,
        withdrawFee: withdrawFeePending,
        withdrawGasFee: withdrawBtcGasFeePending,
        errorMsg: withdrawErrorMsgPending,
      });
    }
  }, [
    withdrawReceiveAmountPending,
    cacuWithdrawLoadingPending,
    withdrawAmountPending,
    withdrawFeePending,
    withdrawBtcGasFeePending,
    amount,
  ]);
  useEffect(() => {
    if (amount == depositAmountPending) {
      setDepositData({
        depositFee: depositFeePending,
        depositGasFee: depositBtcGasFeePending,
        cacuDepositLoading: cacuDepositLoadingPending,
        depositReceiveAmount: depositReceiveAmountPending,
        depositMinDepositAmount: depositMinDepositAmountPending,
      });
    }
  }, [
    depositFeePending,
    cacuDepositLoadingPending,
    depositReceiveAmountPending,
    depositMinDepositAmountPending,
    depositAmountPending,
    depositBtcGasFeePending,
    amount,
  ]);
  // TODOXXX
  useEffect(() => {
    if (Number(depositData?.depositFee || 0) > 0) {
      const maxSupplyBalance = Decimal.max(
        0,
        new Decimal(btcAvailableBalance || 0)
          .minus(depositData?.depositFee)
          .minus(newUserOnNearChain ? newUserNbtcReserveAmount : 0),
      );
      setBtcCanSupplyAvailableBalance(maxSupplyBalance.toFixed());
    }
  }, [depositData?.depositFee, btcAvailableBalance, newUserOnNearChain]);
  const btcCanSupplyAvailableBalance$ = useMemo(() => {
    return new Decimal(btcCanSupplyAvailableBalance || 0).mul(price || 0).toFixed(2);
  }, [asset?.price, btcCanSupplyAvailableBalance]);
  const oneDepositBridgeAmount = useMemo(() => {
    if (isBtcChainSupply && +(amount || 0) > 0 && +(depositData?.depositFee || 0) > 0) {
      return new Decimal(amount)
        .plus(depositData?.depositFee)
        .plus(newUserOnNearChain ? newUserNbtcReserveAmount : "0");
    }
    return "0";
  }, [amount, depositData?.depositFee, isBtcChainSupply, newUserOnNearChain]);
  const {
    depositFee,
    depositGasFee,
    cacuDepositLoading,
    depositReceiveAmount,
    depositMinDepositAmount,
  } = depositData;
  const { withdrawReceiveAmount, cacuWithdrawLoading, withdrawFee, withdrawGasFee } = withdrawData;
  // withdraw oneClick min
  if (isBtcChainWithdraw) {
    if (withdrawData.errorMsg) {
      alerts["btcWithdrawErrorMsg"] = {
        title: withdrawData.errorMsg,
        severity: "error",
      };
    } else {
      delete alerts.btcWithdrawErrorMsg;
    }
  }
  // deposit oneClick min TODOXXX
  if (isBtcChainSupply && nbtcTab == "btc") {
    if (
      new Decimal(oneDepositBridgeAmount || 0).gt(0) &&
      new Decimal(oneDepositBridgeAmount).lt(depositMinDepositAmount || 0)
    ) {
      alerts["btcDepositMinLimit"] = {
        title: `You must deposit at least ${new Decimal(depositMinDepositAmount)
          .minus(depositData?.depositFee || 0)
          .minus(newUserOnNearChain ? newUserNbtcReserveAmount : "0")
          .toFixed()} NBTC`,
        severity: "error",
      };
    } else {
      delete alerts.btcDepositMinLimit;
    }
  }
  const actionButtonDisabled =
    alerts["btcWithdrawErrorMsg"] ||
    alerts["btcDepositMinLimit"] ||
    (isBtcChainSupply && cacuDepositLoading) ||
    (isBtcChainWithdraw && cacuWithdrawLoading);

  const { transactionsNumOnNear, transactionsGasOnNear, storage } = useMemo(() => {
    if (!isBtcWallet || new Decimal(amount || 0).lte(0)) {
      return {
        transactionsNumOnNear: "0",
        transactionsGasOnNear: "0",
      };
    } else if (action == "Supply") {
      return {
        transactionsNumOnNear: tokenId == WNEARTokenId ? "3" : "2",
        transactionsGasOnNear: tokenId == WNEARTokenId ? "250" : "150",
        storage: {
          contractId: isMeme
            ? process.env.NEXT_PUBLIC_MEMECONTRACT_NAME
            : process.env.NEXT_PUBLIC_CONTRACT_NAME,
          amount: "0.1",
        },
      };
    } else if (action == "Withdraw") {
      return {
        transactionsNumOnNear: "3",
        transactionsGasOnNear: "450",
        storage: {
          contractId: tokenId,
          amount: "0.00125",
        },
      };
    } else if (action == "Borrow") {
      return {
        transactionsNumOnNear: "2",
        transactionsGasOnNear: "350",
        storage: {
          contractId: tokenId,
          amount: "0.00125",
        },
      };
    } else if (action == "Adjust") {
      return {
        transactionsNumOnNear: "2",
        transactionsGasOnNear: "350",
      };
    } else if (action == "Repay") {
      return {
        transactionsNumOnNear: "2",
        transactionsGasOnNear: "350",
      };
    } else {
      return {
        transactionsNumOnNear: "0",
        transactionsGasOnNear: "0",
      };
    }
  }, [action, amount, isBtcWallet]);
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
            {/* TODOXXX */}
            <Controls
              amount={amount}
              available={isBtcChainSupply ? btcCanSupplyAvailableBalance : available}
              action={action}
              asset={asset}
              totalAvailable={isBtcChainSupply ? btcCanSupplyAvailableBalance : available}
              available$={isBtcChainSupply ? btcCanSupplyAvailableBalance$ : available$}
            />
            <div className="flex flex-col gap-4 mt-6">
              {isBtcChainWithdraw ? (
                <>
                  <Receive
                    value={
                      beautifyNumber({
                        num: withdrawReceiveAmount,
                        maxDecimal: 8,
                      }) as string
                    }
                    loading={cacuWithdrawLoading}
                  />
                  <FeeContainer
                    loading={cacuWithdrawLoading}
                    bridgeProtocolFee={Number(withdrawFee || 0)}
                    bridgeGasFee={Number(withdrawGasFee || 0)}
                  />
                </>
              ) : null}
              {isBtcChainSupply ? (
                <FeeContainer
                  loading={Number(amount || 0) > 0 ? cacuDepositLoading : false}
                  bridgeProtocolFee={Number(amount || 0) > 0 ? depositFee : 0}
                  isDeposit={true}
                  storage={{
                    contractId: isMeme
                      ? process.env.NEXT_PUBLIC_MEMECONTRACT_NAME
                      : process.env.NEXT_PUBLIC_CONTRACT_NAME,
                    amount: "0.1",
                  }}
                />
              ) : null}
              {!isBtcChainWithdraw && !isBtcChainSupply && isBtcWallet ? (
                <FeeContainer
                  loading={false}
                  transactionsGasOnNear={transactionsGasOnNear}
                  transactionsNumOnNear={transactionsNumOnNear}
                  storage={storage}
                />
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
            {/* TODOXXX */}
            <Action
              maxBorrowAmount={maxBorrowAmount}
              maxWithdrawAmount={maxWithdrawAmount}
              healthFactor={healthFactor}
              collateralType={selectedCollateralType}
              poolAsset={assets[tokenId]}
              oneClickActionDepositAmount={oneDepositBridgeAmount}
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
