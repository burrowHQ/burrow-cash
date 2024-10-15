import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import Decimal from "decimal.js";
import { useBtcWalletSelector } from "btc-wallet";

export function useBtcAction({ updater }: any) {
  const [balance, setBalance] = useState<string | null>(null);
  const btcSelector = useBtcWalletSelector();
  useDebounce(
    () => {
      if (btcSelector?.account) {
        btcSelector.getBalance().then((res) => {
          const _balance = new Decimal(res).div(10 ** 8).toString();
          setBalance(_balance);
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
