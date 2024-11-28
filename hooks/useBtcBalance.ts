import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import Decimal from "decimal.js";
import { useBtcWalletSelector, getBtcBalance } from "btc-wallet";

export function useBtcAction({ updater }: any) {
  const [balance, setBalance] = useState<number>(0);
  const btcSelector = useBtcWalletSelector();
  useDebounce(
    () => {
      if (btcSelector?.account) {
        // btcSelector.getBalance().then((res) => {
        //   const _balance = new Decimal(res).div(10 ** 8).toString();
        //   setBalance(_balance);
        // });
        getBtcBalance().then((res) => {
          const { rawBalance, balance: btcBalance } = res;
          setBalance(btcBalance);
        });
      }
    },
    500,
    [btcSelector?.account, updater],
  );

  return {
    balance,
  };
}
