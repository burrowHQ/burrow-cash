import { useState, useMemo, useEffect } from "react";
import Decimal from "decimal.js";
import { useBtcWalletSelector, checkBridgeTransactionStatus } from "btc-wallet";
import { nearTokenId } from "../../utils";
import {
  toggleUseAsCollateral,
  hideModal,
  showOneClickBtcModal,
  setOneClickBtcStatus,
} from "../../redux/appSlice";
import {
  toggleUseAsCollateral as toggleUseAsCollateralMEME,
  hideModal as hideModalMEME,
} from "../../redux/appSliceMEME";
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
import { getSelectedValues, getAssetData } from "../../redux/appSelectors";
import { isMemeCategory } from "../../redux/categorySelectors";
import { trackActionButton } from "../../utils/telemetry";
import { useDegenMode } from "../../hooks/hooks";
import { SubmitButton } from "./components";
import getShadowRecords from "../../api/get-shadows";
import { expandToken, shrinkToken } from "../../store";
import { isFailureExecution } from "../../utils/transactionUtils";
import { NBTC_ENV } from "../../utils/config";

export default function Action({
  maxBorrowAmount,
  healthFactor,
  collateralType,
  poolAsset,
  isDisabled,
  maxWithdrawAmount,
  isOneClickAction,
  oneClickActionDepositAmount,
}) {
  const [loading, setLoading] = useState(false);
  const { amount, useAsCollateral, isMax } = useAppSelector(getSelectedValues);
  const selectedWalletId = window.selector?.store?.getState()?.selectedWalletId;
  const dispatch = useAppDispatch();
  const asset = useAppSelector(getAssetData);
  const { account, autoConnect } = useBtcWalletSelector();
  const { action = "Deposit", tokenId, borrowApy, price, portfolio, isLpToken, position } = asset;
  const { isRepayFromDeposits } = useDegenMode();
  const isMeme = useAppSelector(isMemeCategory);
  const { available, canUseAsCollateral, extraDecimals, collateral, disabled, decimals } =
    getModalData({
      ...asset,
      maxWithdrawAmount,
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
      if (isMeme) {
        dispatch(toggleUseAsCollateralMEME({ useAsCollateral: false }));
      } else {
        dispatch(toggleUseAsCollateral({ useAsCollateral: false }));
      }
    }
  }, [useAsCollateral]);

  const handleActionButtonClick = async () => {
    if (!account && selectedWalletId === "btc-wallet") {
      autoConnect();
      return;
    }
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
          await deposit({ amount, useAsCollateral, isMax, isMeme });
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
            receiveAmount: isOneClickAction ? oneClickActionDepositAmount : 0,
            isMax,
            isMeme,
            isOneClickAction,
          }).then(async (result: any) => {
            if (isOneClickAction && result !== "error") {
              const { txHash: btcTxHash, fetchData } = result;
              dispatch(hideModal());
              dispatch(showOneClickBtcModal());
              try {
                dispatch(
                  setOneClickBtcStatus({
                    status: {
                      fromChain: "BTC",
                      toChain: "NEAR",
                      fromChainHash: btcTxHash,
                    },
                  }),
                );
                const res = await checkBridgeTransactionStatus({
                  txHash: btcTxHash,
                  fromChain: "BTC",
                  env: NBTC_ENV,
                });
                const nearTxHash = res.ToTxHash;
                dispatch(
                  setOneClickBtcStatus({
                    status: {
                      fromChain: "BTC",
                      toChain: "NEAR",
                      fromChainHash: btcTxHash,
                      toChainHash: nearTxHash,
                      successText:
                        "BTC Supply has been completed. Please check your supply balance.",
                    },
                  }),
                );
                if (fetchData) fetchData(account);
              } catch (error) {
                dispatch(
                  setOneClickBtcStatus({
                    status: {
                      failedText: "BTC Supply has been failed.",
                    },
                  }),
                );
              }
            }
          });
        }
        break;
      case "Borrow": {
        await borrow({ tokenId, extraDecimals, amount, collateralType, isMeme });
        break;
      }
      case "Withdraw": {
        await withdraw({
          tokenId,
          extraDecimals,
          amount,
          isMax,
          isMeme,
          available,
          isOneClickAction,
        }).then(async (result: any) => {
          if (isOneClickAction) {
            const transtion_outcome = (result as any[]).at(-1);
            const nearTxHash = transtion_outcome?.transaction?.hash;
            dispatch(hideModal());
            dispatch(showOneClickBtcModal());
            try {
              dispatch(
                setOneClickBtcStatus({
                  status: {
                    fromChain: "NEAR",
                    toChain: "BTC",
                    fromChainHash: nearTxHash,
                  },
                }),
              );
              const res = await checkBridgeTransactionStatus({
                txHash: nearTxHash,
                fromChain: "NEAR",
                env: NBTC_ENV,
              });
              const btcTxHash = res.ToTxHash;
              setOneClickBtcStatus({
                status: {
                  fromChain: "NEAR",
                  toChain: "BTC",
                  fromChainHash: nearTxHash,
                  toChainHash: btcTxHash,
                  successText: "BTC Withdraw has been completed. Please check your BTC balance.",
                },
              });
            } catch (error) {
              dispatch(
                setOneClickBtcStatus({
                  status: {
                    failedText: "BTC Withdraw has been failed.",
                  },
                }),
              );
            }
          }
        });
        break;
      }
      case "Adjust":
        await adjustCollateral({
          tokenId,
          extraDecimals,
          amount,
          isMax,
          isMeme,
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
              .mul(3)
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
            isMeme,
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
            isMeme,
          });
        }
        break;
      }
      default:
        break;
    }
    dispatch(hideModal());
    dispatch(hideModalMEME());
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
      disabled={actionDisabled || isDisabled}
      loading={loading}
      onClick={handleActionButtonClick}
    />
  );
}
