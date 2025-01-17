import { useState } from "react";
import { useDebounce } from "react-use";
import Decimal from "decimal.js";
import { useBtcWalletSelector, getBtcBalance, getDepositAmount } from "btc-wallet";
import { expandToken, shrinkToken } from "../store/helper";
import { NBTCTokenId } from "../utils/config";

export function useBtcAction({
  tokenId,
  decimals,
  updaterCounter,
  inputAmount,
  action,
}: {
  tokenId: string;
  decimals: number;
  updaterCounter?: number;
  inputAmount?: string | number;
  action?: string;
}) {
  const [balance, setBalance] = useState<number>(0);
  const [receiveAmount, setReceiveAmount] = useState<string>("0");
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const btcSelector = useBtcWalletSelector();
  const expandInputAmount = expandToken(inputAmount || 0, decimals, 0);
  const isBtcTokenId = tokenId == NBTCTokenId;
  useDebounce(
    () => {
      if (btcSelector?.account && isBtcTokenId) {
        getBtcBalance().then((res) => {
          const { balance: btcBalance, availableBalance: btcAvailableBalance } = res;
          setBalance(btcBalance || 0);
          setAvailableBalance(btcAvailableBalance || 0);
        });
      }
    },
    500,
    [btcSelector?.account, updaterCounter, isBtcTokenId],
  );
  useDebounce(
    () => {
      if (btcSelector?.account && isBtcTokenId && action == "Withdraw") {
        const inputAmountDecimal = new Decimal(expandInputAmount || 0);
        if (inputAmountDecimal.lte(0)) {
          setReceiveAmount("0");
        } else {
          getDepositAmount(expandInputAmount, { env: "private_mainnet" }).then(
            ({ protocolFee }) => {
              setReceiveAmount(
                shrinkToken(
                  new Decimal(inputAmountDecimal).minus(protocolFee || 0).toFixed(0),
                  decimals,
                ),
              );
            },
          );
        }
      }
    },
    500,
    [btcSelector?.account, inputAmount, isBtcTokenId, action],
  );

  return {
    balance,
    availableBalance,
    receiveAmount,
  };
}
