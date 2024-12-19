import BN from "bn.js";
import { getBurrow } from "../../utils";
import { expandTokenDecimal } from "../helper";
import { ChangeMethodsLogic, ChangeMethodsToken, ChangeMethodsOracle } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import { Assets } from "../../redux/assetState";
import getConfig from "../../api/get-config";

export async function increaseCollateral({
  pos_id,
  token_c_id,
  amount,
  assets,
}: {
  pos_id: string;
  token_c_id: string;
  amount: string;
  assets: Assets;
}) {
  const { logicContract, oracleContract } = await getBurrow();
  const { enable_pyth_oracle } = await getConfig();
  const transactions: Transaction[] = [];
  const expanded_c_amount = expandTokenDecimal(
    amount,
    assets[token_c_id].metadata.decimals + assets[token_c_id].config.extra_decimals,
  );
  const expanded_token_c_amount = expandTokenDecimal(amount, assets[token_c_id].metadata.decimals);
  transactions.push({
    receiverId: token_c_id,
    functionCalls: [
      {
        methodName: ChangeMethodsToken[ChangeMethodsToken.ft_transfer_call],
        gas: new BN("100000000000000"),
        args: {
          receiver_id: logicContract.contractId,
          amount: expanded_token_c_amount.toFixed(0),
          msg: '"DepositToMargin"',
        },
      },
    ],
  });
  const increaseCollateralTemplate = {
    actions: [
      {
        IncreaseCollateral: {
          pos_id,
          amount: expanded_c_amount.toFixed(0),
        },
      },
    ],
  };
  transactions.push({
    receiverId: enable_pyth_oracle ? logicContract.contractId : oracleContract.contractId,
    functionCalls: [
      {
        methodName: enable_pyth_oracle
          ? ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth]
          : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
        args: {
          ...(enable_pyth_oracle
            ? increaseCollateralTemplate
            : {
                receiver_id: logicContract.contractId,
                msg: JSON.stringify({
                  MarginExecute: increaseCollateralTemplate,
                }),
              }),
        },
        gas: new BN("300000000000000"),
      },
    ],
  });
  const result = await prepareAndExecuteTransactions(transactions);

  return result;
}
