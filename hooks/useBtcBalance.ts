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
  updaterCounter,
  price,
}: {
  tokenId: string;
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
          // btcBalance: total balance on BTC chain
          // btcAvailableBalance: After deducting network fee
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
  useDebounce(
    () => {
      if (isBtcWithdraw && isBtcWithdraw && decimals) {
        setLoading(true);
        getReceiveAmount();
      }
    },
    500,
    [amount, isBtcWithdraw, decimals],
  );
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

export function useCalculateDeposit({
  amount,
  isBtcDeposit,
  decimals,
}: {
  amount: string;
  isBtcDeposit: boolean;
  decimals: number;
}) {
  // interface DepositAmountResult {
  //   depositAmount: number;            // Original deposit amount to be sent
  //   receiveAmount: number;            // Amount to be received after deducting fees and repayments
  //   protocolFee: number;              // Protocol fee
  //   repayAmount: number;              // Amount to repay if there's debt
  //   newAccountMinDepositAmount: number; // Minimum deposit amount for new accounts
  // }
  const [receiveAmount, setReceiveAmount] = useState<string>();
  const [receiveAmountExpand, setRreceiveAmountExpand] = useState<string>();
  const [minDepositAmount, setMinDepositAmount] = useState<string>();
  const [fee, setFee] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  useDebounce(
    () => {
      if (isBtcDeposit && new Decimal(amount || 0).gt(0) && decimals) {
        setLoading(true);
        getReceiveAmount();
      } else {
        setReceiveAmount("0");
        setMinDepositAmount("0");
        setFee("0");
        setLoading(false);
      }
    },
    500,
    [amount, isBtcDeposit, decimals],
  );
  async function getReceiveAmount() {
    const env = NBTC_ENV;
    const expandAmount = new Decimal(expandToken(amount, decimals)).toFixed(0);
    const { protocolFee, repayAmount, receiveAmount, minDepositAmount } = await getDepositAmount(
      expandAmount,
      {
        env,
      },
    );
    const totalFeeAmount = shrinkToken(
      new Decimal(protocolFee || 0).plus(repayAmount).toFixed(),
      decimals,
    );
    const minDepositAmountReadable = shrinkToken(minDepositAmount, decimals);
    const receiveAmountReadable = shrinkToken(
      Decimal.max(
        new Decimal(expandAmount || 0).minus(protocolFee || 0).minus(repayAmount || 0),
        0,
      ).toFixed(0),
      decimals,
    );
    setReceiveAmount(receiveAmountReadable);
    setMinDepositAmount(minDepositAmountReadable);
    setFee(new Decimal(amount || 0).gt(0) ? totalFeeAmount : "0");
    setLoading(false);
  }
  return {
    receiveAmount,
    fee,
    loading,
    minDepositAmount,
    tag: amount,
  };
}
