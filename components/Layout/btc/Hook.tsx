// @ts-nocheck
import { useEffect } from "react";
import { useBtcWalletSelector } from "./btcWalletSelectorContext";

export default function Hooks() {
  const btcContext = useBtcWalletSelector();

  useEffect(() => {
    // @ts-ignore
    window.btcContext = btcContext;
  }, [btcContext]);

  return null;
}
