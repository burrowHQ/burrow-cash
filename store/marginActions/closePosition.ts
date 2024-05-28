import BN from "bn.js";
import { getBurrow } from "../../utils";
import { ChangeMethodsLogic } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";

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
  const { logicContract } = await getBurrow();
  const transactions: Transaction[] = [];
  transactions.push({
    receiverId: logicContract.contractId,
    functionCalls: [
      {
        methodName: ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth],
        args: {
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
        },
        gas: new BN("300000000000000"),
      },
    ],
  });

  const withDrawMapList = !isLong
    ? [
        {
          methodName: ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth],
          args: {
            actions: [
              {
                Withdraw: {
                  token_id: token_p_id,
                },
              },
            ],
          },
          gas: new BN("100000000000000"),
        },
        {
          methodName: ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth],
          args: {
            actions: [
              {
                Withdraw: {
                  token_id: token_d_id,
                },
              },
            ],
          },
          gas: new BN("100000000000000"),
        },
      ]
    : [
        {
          methodName: ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth],
          args: {
            actions: [
              {
                Withdraw: {
                  token_id: token_d_id,
                },
              },
            ],
          },
          gas: new BN("100000000000000"),
        },
      ];

  transactions.push({
    receiverId: logicContract.contractId,
    functionCalls: withDrawMapList,
  });
  await prepareAndExecuteTransactions(transactions);
}
