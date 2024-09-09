import BN from "bn.js";
import { getBurrow } from "../../utils";
import { ChangeMethodsLogic, ChangeMethodsOracle } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import getConfig from "../../api/get-config";

export async function closePosition({
  pos_id,
  token_p_id,
  token_p_amount,
  token_d_id,
  min_token_d_amount,
  swap_indication,
  isLong,
}: {
  pos_id: string;
  token_p_id: string;
  token_p_amount: string;
  token_d_id: string;
  min_token_d_amount: string;
  swap_indication: any;
  isLong?: boolean;
}) {
  const { logicContract, oracleContract } = await getBurrow();
  const { enable_pyth_oracle } = await getConfig();
  const transactions: Transaction[] = [];
  const closeActionsTemplate = {
    actions: [
      {
        CloseMTPosition: {
          pos_id,
          token_p_amount,
          min_token_d_amount,
          swap_indication,
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
            ? closeActionsTemplate
            : {
                receiver_id: logicContract.contractId,
                msg: JSON.stringify({
                  MarginExecute: closeActionsTemplate,
                }),
              }),
        },
        gas: new BN("300000000000000"),
      },
    ],
  });
  const pWithDrawActionsTemplate = {
    actions: [
      {
        Withdraw: {
          token_id: token_p_id,
        },
      },
    ],
  };
  const dWithDrawActionsTemplate = {
    actions: [
      {
        Withdraw: {
          token_id: token_d_id,
        },
      },
    ],
  };

  if (!isLong) {
    transactions.push({
      receiverId: enable_pyth_oracle ? logicContract.contractId : oracleContract.contractId,
      functionCalls: [
        {
          methodName: enable_pyth_oracle
            ? ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth]
            : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
          args: {
            ...(enable_pyth_oracle
              ? pWithDrawActionsTemplate
              : {
                  receiver_id: logicContract.contractId,
                  msg: JSON.stringify({
                    MarginExecute: pWithDrawActionsTemplate,
                  }),
                }),
          },
          gas: new BN("300000000000000"),
        },
      ],
    });
  }

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

  await prepareAndExecuteTransactions(transactions);
}
