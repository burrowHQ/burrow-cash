import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import Decimal from "decimal.js";
import {
  useBtcWalletSelector,
  getBtcBalance,
  getDepositAmount,
  calculateWithdraw,
  calculateGasFee,
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
    fee: string;
    btcGasFee: string;
    errorMsg: string;
  }>({
    loading: false,
    receiveAmount: "0",
    amount: "0",
    fee: "0",
    btcGasFee: "0",
    errorMsg: "",
  });
  useDebounce(
    () => {
      if (isBtcWithdraw && isBtcWithdraw && decimals && new Decimal(amount || 0).gt(0)) {
        setWithdrawData({
          loading: true,
          receiveAmount: "0",
          fee: "0",
          btcGasFee: "0",
          amount,
          errorMsg: "",
        });
        getReceiveAmount();
      } else {
        setWithdrawData({
          loading: false,
          receiveAmount: "0",
          fee: "0",
          btcGasFee: "0",
          amount,
          errorMsg: "",
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
    const receiveAmount = shrinkToken(result?.receiveAmount || "0", decimals);
    const btcGasFee = shrinkToken(result?.gasFee || "0", decimals);
    const withdrawFee = shrinkToken(result?.withdrawFee || "0", decimals);
    setWithdrawData({
      loading: false,
      receiveAmount,
      errorMsg: result?.errorMsg || "",
      fee: withdrawFee,
      btcGasFee,
      amount,
    });
  }
  return withdrawData;
}

export function useCalculateDeposit({
  amount,
  isBtcDeposit,
  decimals,
  newUserOnNearChain,
}: {
  amount: string;
  isBtcDeposit: boolean;
  decimals: number;
  newUserOnNearChain: boolean;
}) {
  const [depositData, setDepositData] = useState<{
    loading: boolean;
    amount: string;
    receiveAmount: string;
    minDepositAmount: string;
    fee: string;
    btcGasFee: string;
  }>({
    loading: false,
    amount: "0",
    receiveAmount: "0",
    minDepositAmount: "0",
    fee: "0",
    btcGasFee: "0",
  });
  const btcSelector = useBtcWalletSelector();
  const btcAccountId = btcSelector.account;
  useDebounce(
    () => {
      if (isBtcDeposit && new Decimal(amount || 0).gt(0) && decimals) {
        setDepositData({
          loading: true,
          amount,
          receiveAmount: "0",
          minDepositAmount: "0",
          fee: "0",
          btcGasFee: "0",
        });
        getReceiveAmount();
      } else {
        setDepositData({
          loading: false,
          amount,
          receiveAmount: "0",
          minDepositAmount: "0",
          fee: "0",
          btcGasFee: "0",
        });
      }
    },
    500,
    [amount, isBtcDeposit, decimals, newUserOnNearChain],
  );
  async function getReceiveAmount() {
    const env = NBTC_ENV;
    const expandAmount = new Decimal(expandToken(amount, decimals)).toFixed(0, Decimal.ROUND_DOWN);
    const {
      protocolFee,
      repayAmount,
      minDepositAmount,
      receiveAmount,
      newAccountMinDepositAmount,
    } = await getDepositAmount(expandAmount, {
      env,
    });
    const BTCGasFee = await calculateGasFee(btcAccountId, Number(expandAmount));
    const totalFeeAmount = shrinkToken(
      new Decimal(protocolFee || 0).plus(repayAmount).toFixed(),
      decimals,
    );
    const minDepositAmountReadable = shrinkToken(minDepositAmount, decimals);
    const receiveAmountReadable = shrinkToken(
      Decimal.max(
        new Decimal(expandAmount || 0)
          .minus(protocolFee || 0)
          .minus(repayAmount || 0)
          .minus(newUserOnNearChain ? 800 : 0),
        0,
      ).toFixed(0, Decimal.ROUND_DOWN),
      decimals,
    );
    const _BTCGasFee = shrinkToken(BTCGasFee, decimals);
    setDepositData({
      loading: false,
      amount,
      receiveAmount: receiveAmountReadable,
      minDepositAmount: minDepositAmountReadable,
      fee: totalFeeAmount,
      btcGasFee: _BTCGasFee,
    });
  }
  return depositData;
}
