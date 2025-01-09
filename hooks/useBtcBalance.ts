import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import Decimal from "decimal.js";
import { useBtcWalletSelector, getBtcBalance, estimateDepositAmount } from "btc-wallet";
import { expandToken, shrinkToken } from "../store/helper";

export function useBtcAction({ updater, inputAmount, decimals }: any) {
  const [balance, setBalance] = useState<number>(0);
  const [receiveAmount, setReceiveAmount] = useState<string>("0");
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const btcSelector = useBtcWalletSelector();
  const expandInputAmount = expandToken(inputAmount || 0, decimals || 0, 0);
  useDebounce(
    () => {
      if (btcSelector?.account) {
        getBtcBalance().then((res) => {
          const { rawBalance, balance: btcBalance, availableBalance: btcAvailableBalance } = res;
          setBalance(btcBalance || 0);
          setAvailableBalance(btcAvailableBalance || 0);
          // eslint-disable-next-line no-console
          console.log("----------------Balance", btcBalance);
          // eslint-disable-next-line no-console
          console.log("----------------btcAvailableBalance", btcAvailableBalance);
        });
      }
    },
    500,
    [btcSelector?.account, updater],
  );
  useDebounce(
    () => {
      const inputAmountDecimal = new Decimal(expandInputAmount || 0);
      if (inputAmountDecimal.lte(0)) {
        setReceiveAmount("0");
      } else {
        estimateDepositAmount(expandInputAmount, { env: "dev" }).then((received: number) => {
          setReceiveAmount(shrinkToken(received || "0", decimals));
          // eslint-disable-next-line no-console
          console.log("---------------receivedBalance", shrinkToken(received || "0", decimals));
        });
      }
    },
    500,
    [expandInputAmount],
  );

  return {
    balance,
    availableBalance,
    receiveAmount,
  };
}
