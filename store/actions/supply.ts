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
  isOneClickAction,
  receiveAmount,
}: {
  tokenId: string;
  extraDecimals: number;
  useAsCollateral: boolean;
  amount: string;
  isMax: boolean;
  isMeme: boolean;
  isOneClickAction: boolean;
  receiveAmount: string;
}): Promise<any> {
  const { account, logicContract, logicMEMEContract, hideModal, fetchData } = await getBurrow();
  const { decimals } = (await getMetadata(tokenId))!;
  const tokenContract = await getTokenContract(tokenId);
  const burrowContractId = isMeme ? logicMEMEContract.contractId : logicContract.contractId;
  let expandedAmount;
  let expandedReceiveAmount;
  if (tokenId === NBTCTokenId) {
    expandedAmount = expandTokenDecimal(amount, decimals);
    expandedReceiveAmount = expandTokenDecimal(receiveAmount, decimals);
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
  if (isOneClickAction) {
    try {
      const result = await executeBTCDepositAndAction({
        action: {
          receiver_id: burrowContractId,
          amount: expandedReceiveAmount.toFixed(0),
          msg: useAsCollateral ? JSON.stringify({ Execute: collateralActions }) : "",
        },
        amount: expandedAmount,
        env: NBTC_ENV,
        registerDeposit: "100000000000000000000000",
      });
      if (fetchData) fetchData(account.accountId);
      if (hideModal) hideModal();
      return result;
    } catch (error) {
      if (hideModal) hideModal();
      return "error";
    }
  } else {
    const result = await prepareAndExecuteTokenTransactions(tokenContract, {
      methodName: ChangeMethodsToken[ChangeMethodsToken.ft_transfer_call],
      args: {
        receiver_id: burrowContractId,
        amount: expandedAmount.toFixed(0),
        msg: useAsCollateral ? JSON.stringify({ Execute: collateralActions }) : "",
      },
    });
    return result;
  }
}
