import Decimal from "decimal.js";
import { executeBTCDepositAndAction } from "btc-wallet";
import { decimalMin, getBurrow } from "../../utils";
import { expandTokenDecimal } from "../helper";
import { NBTCTokenId, NBTC_ENV } from "../../utils/config";
import { ChangeMethodsToken } from "../../interfaces";
import { getTokenContract, getMetadata, prepareAndExecuteTokenTransactions } from "../tokens";
import getBalance from "../../api/get-balance";

export async function supply({
  tokenId,
  extraDecimals,
  useAsCollateral,
  amount,
  isMax,
  isMeme,
}: {
  tokenId: string;
  extraDecimals: number;
  useAsCollateral: boolean;
  amount: string;
  isMax: boolean;
  isMeme: boolean;
}): Promise<void> {
  const { account, logicContract, logicMEMEContract, hideModal, selector } = await getBurrow();
  const { decimals } = (await getMetadata(tokenId))!;
  const tokenContract = await getTokenContract(tokenId);
  const burrowContractId = isMeme ? logicMEMEContract.contractId : logicContract.contractId;
  let expandedAmount;
  if (tokenId === NBTCTokenId) {
    expandedAmount = expandTokenDecimal(amount, decimals);
  } else {
    const tokenBalance = new Decimal(await getBalance(tokenId, account.accountId));
    expandedAmount = isMax
      ? tokenBalance
      : decimalMin(expandTokenDecimal(amount, decimals), tokenBalance);
  }
  const collateralAmount = expandTokenDecimal(expandedAmount, extraDecimals);
  const collateralActions = {
    actions: [
      {
        IncreaseCollateral: {
          token_id: tokenId,
          max_amount: collateralAmount.toFixed(0),
        },
      },
    ],
  };
  const wallet = await selector.wallet();
  if (wallet.id == "btc-wallet" && tokenId === NBTCTokenId) {
    try {
      await executeBTCDepositAndAction({
        action: {
          receiver_id: burrowContractId,
          amount: expandedAmount.toFixed(0),
          msg: useAsCollateral ? JSON.stringify({ Execute: collateralActions }) : "",
        },
        env: NBTC_ENV,
        registerDeposit: "100000000000000000000000",
      });
    } catch (error) {
      if (hideModal) hideModal();
    }
  } else {
    await prepareAndExecuteTokenTransactions(tokenContract, {
      methodName: ChangeMethodsToken[ChangeMethodsToken.ft_transfer_call],
      args: {
        receiver_id: burrowContractId,
        amount: expandedAmount.toFixed(0),
        msg: useAsCollateral ? JSON.stringify({ Execute: collateralActions }) : "",
      },
    });
  }
}
