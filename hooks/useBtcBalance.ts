import { useState } from "react";
import { useDebounce } from "react-use";
import Decimal from "decimal.js";
import { useBtcWalletSelector, getBtcBalance, getDepositAmount } from "btc-wallet";
import { expandToken, shrinkToken } from "../store/helper";
import { NBTCTokenId, NBTC_ENV } from "../utils/config";

export function useBtcAction({
  tokenId,
  decimals,
  updaterCounter,
}: {
  tokenId: string;
  decimals: number;
  updaterCounter?: number;
}) {
  const [balance, setBalance] = useState<number>(0);
  const [totalFeeAmount, setTotalFeeAmount] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const btcSelector = useBtcWalletSelector();
  const isBtcTokenId = tokenId == NBTCTokenId;
  const env = NBTC_ENV;
  useDebounce(
    () => {
      if (btcSelector?.account && isBtcTokenId) {
        getBtcBalance().then(async (res) => {
          const { balance: btcBalance, availableBalance: btcAvailableBalance } = res;
          const expandAvailableBalance = expandToken(btcAvailableBalance, decimals);
          const { protocolFee, repayAmount } = await getDepositAmount(expandAvailableBalance, {
            env,
          });
          const totalFeeAmount = shrinkToken(
            new Decimal(protocolFee || 0).plus(repayAmount).toFixed(),
            decimals,
          );
          const avaBalance = Decimal.max(
            0,
            new Decimal(btcAvailableBalance).minus(totalFeeAmount).toFixed(),
          ).toFixed();
          setBalance(btcBalance || 0);
          setAvailableBalance(+(avaBalance || 0));
          setTotalFeeAmount(+(totalFeeAmount || 0));
        });
      }
    },
    500,
    [btcSelector?.account, updaterCounter, isBtcTokenId],
  );
  return {
    balance,
    availableBalance,
    totalFeeAmount,
  };
}
