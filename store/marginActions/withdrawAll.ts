import BN from "bn.js";
import { getBurrow } from "../../utils";
import { ChangeMethodsLogic, ChangeMethodsOracle } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import getConfig from "../../api/get-config";

export async function withdrawActionsAll(token_ids: string[]) {
  const { logicContract, oracleContract } = await getBurrow();
  const { enable_pyth_oracle } = await getConfig();
  const transactions: Transaction[] = [];

  const createWithdrawAction = (token_id: string) => {
    if (typeof token_id !== "string") {
      throw new Error(`${token_id}`);
    }
    return {
      Withdraw: {
        token_id,
      },
    };
  };

  const createWithdrawActionsTemplate = (ids: string[]) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("ids Kinahanglan nga usa ka dili bakante nga laray");
    }

    return {
      actions: token_ids.map((token_id) => createWithdrawAction(token_id)),
    };
  };

  const dWithDrawActionsTemplate = createWithdrawActionsTemplate(token_ids);

  transactions.push({
    receiverId: enable_pyth_oracle ? logicContract.contractId : oracleContract.contractId,
    functionCalls: [
      {
        methodName: enable_pyth_oracle
          ? ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth]
          : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
        args: {
          ...(enable_pyth_oracle
            ? dWithDrawActionsTemplate
            : {
                receiver_id: logicContract.contractId,
                msg: JSON.stringify({
                  MarginExecute: dWithDrawActionsTemplate,
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
