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
  const [withdrawData, setWithdrawData] = useState<{
    loading: boolean;
    receiveAmount: string;
    amount: string;
  }>({
    loading: false,
    receiveAmount: "0",
    amount: "0",
  });
  useDebounce(
    () => {
      if (isBtcWithdraw && isBtcWithdraw && decimals && new Decimal(amount || 0).gt(0)) {
        setWithdrawData({
          loading: true,
          receiveAmount: "0",
          amount,
        });
        getReceiveAmount();
      } else {
        setWithdrawData({
          loading: false,
          receiveAmount: "0",
          amount,
        });
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
    setWithdrawData({
      loading: false,
      receiveAmount: shrinkToken(result?.receiveAmount || "0", decimals),
      amount,
    });
  }
  return withdrawData;
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
  const [depositData, setDepositData] = useState<{
    loading: boolean;
    amount: string;
    receiveAmount: string;
    minDepositAmount: string;
    fee: string;
  }>({
    loading: false,
    amount: "0",
    receiveAmount: "0",
    minDepositAmount: "0",
    fee: "0",
  });
  useDebounce(
    () => {
      if (isBtcDeposit && new Decimal(amount || 0).gt(0) && decimals) {
        setDepositData({
          loading: true,
          amount,
          receiveAmount: "0",
          minDepositAmount: "0",
          fee: "0",
        });
        getReceiveAmount();
      } else {
        setDepositData({
          loading: false,
          amount,
          receiveAmount: "0",
          minDepositAmount: "0",
          fee: "0",
        });
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
    setDepositData({
      loading: false,
      amount,
      receiveAmount: receiveAmountReadable,
      minDepositAmount: minDepositAmountReadable,
      fee: totalFeeAmount,
    });
  }
  return depositData;
}
