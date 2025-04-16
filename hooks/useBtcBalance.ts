import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import Decimal from "decimal.js";
import {
  useBtcWalletSelector,
  getBtcBalance,
  getDepositAmount,
  calculateWithdraw,
} from "btc-wallet";
import { expandToken, shrinkToken } from "../store/helper";
import { NBTCTokenId, NBTC_ENV } from "../utils/config";
import { useAppSelector } from "../redux/hooks";
import { getOneClickBtcResultStatus } from "../redux/appSelectors";

export function useBtcAction({
  tokenId,
  decimals,
  updaterCounter,
  price,
}: {
  tokenId: string;
  decimals: number;
  price: string | number;
  updaterCounter?: number;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [balance, setBalance] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [availableBalance$, setAvailableBalance$] = useState<string>("$0");
  const btcSelector = useBtcWalletSelector();
  const isBtcTokenId = tokenId == NBTCTokenId;
  const status = useAppSelector(getOneClickBtcResultStatus);
  const env = NBTC_ENV;
  useDebounce(
    () => {
      if (btcSelector?.account && isBtcTokenId && price) {
        getBtcBalance().then(async (res) => {
          // TODOXXX
          // interface DepositAmountResult {
          //   depositAmount: number;            // Original deposit amount to be sent
          //   receiveAmount: number;            // Amount to be received after deducting fees and repayments
          //   protocolFee: number;              // Protocol fee
          //   repayAmount: number;              // Amount to repay if there's debt
          //   newAccountMinDepositAmount: number; // Minimum deposit amount for new accounts
          // }
          // const expandAvailableBalance = expandToken(btcAvailableBalance, decimals);
          // const { protocolFee, repayAmount, receiveAmount } = await getDepositAmount(
          //   expandAvailableBalance,
          //   {
          //     env,
          //   },
          // );
          // const totalFeeAmount = shrinkToken(
          //   new Decimal(protocolFee || 0).plus(repayAmount).toFixed(),
          //   decimals,
          // );
          // const avaBalance = Decimal.max(
          //   0,
          //   new Decimal(btcAvailableBalance).minus(totalFeeAmount).toFixed(),
          // ).toFixed();
          const { balance: btcBalance, availableBalance: btcAvailableBalance } = res;
          const avaBalance = btcAvailableBalance;
          const avaBalance$ = new Decimal(avaBalance).mul(price || 0).toFixed(2);

          setBalance(btcBalance || 0);
          setAvailableBalance(+(avaBalance || 0));
          setAvailableBalance$(`$${avaBalance$}`);
          setLoading(false);
        });
      }
    },
    500,
    [btcSelector?.account, updaterCounter, isBtcTokenId, price],
  );
  return {
    balance,
    availableBalance,
    availableBalance$,
    loading,
    status,
  };
}
export function useCalculateWithdraw({
  amount,
  isBtcWithdraw,
  decimals,
}: {
  amount: string;
  isBtcWithdraw: boolean;
  decimals: number;
}) {
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isBtcWithdraw && isBtcWithdraw && decimals) {
      setLoading(true);
      getReceiveAmount();
    }
  }, [amount, isBtcWithdraw, decimals]);
  async function getReceiveAmount() {
    const env = NBTC_ENV;
    const expandAmount = new Decimal(expandToken(amount, decimals)).toFixed(0);
    const result = await calculateWithdraw({
      amount: expandAmount,
      env,
    });
    setReceiveAmount(shrinkToken(result?.receiveAmount || "0", decimals));
    setLoading(false);
  }
  return {
    receiveAmount,
    loading,
  };
}
