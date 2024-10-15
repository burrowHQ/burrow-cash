import { useEffect, useState } from "react";
import Big from "big";
import { useBtcWalletSelector } from "btc-wallet";

export function useBtcAction({ updater }: any) {
  const [balance, setBalance] = useState<string | null>(null);
  const btcSelector = useBtcWalletSelector();
  // provider.getBalance().then((res: any) => {
  //   const _balance = new Big(res.total).div(10 ** 8).toString();
  //   setBalance(_balance);
  // });
  // console.log('777777777777-btcSelector?.account', btcSelector?.account)
  useEffect(() => {
    if (btcSelector?.account) {
      btcSelector.getBalance().then((res) => {
        const _balance = new Big(res.total).div(10 ** 8).toString();
        setBalance(_balance);
        // console.log('0000000000000-', res);
      });
    }
  }, [btcSelector?.account]);

  return {
    balance,
  };
}
