import BN from "bn.js";
import { getBurrow, nearTokenId } from "../../utils";
import { expandTokenDecimal } from "../helper";
import {
  ChangeMethodsLogic,
  ChangeMethodsNearToken,
  ChangeMethodsToken,
  ChangeMethodsOracle,
} from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import { Assets } from "../../redux/assetState";
import getConfig from "../../api/get-config";

export async function openPosition({
  token_c_id,
  token_c_amount,
  token_d_id,
  token_d_amount,
  token_p_id,
  min_token_p_amount,
  swap_indication,
  assets,
}: {
  token_c_id: string;
  token_c_amount: string;
  token_d_id: string;
  token_d_amount: string;
  token_p_id: string;
  min_token_p_amount: string;
  swap_indication: any;
  assets: Assets;
}) {
  const { logicContract, oracleContract } = await getBurrow();
  const { enable_pyth_oracle } = await getConfig();
  const isNEAR = token_c_id === nearTokenId;
  const expanded_c_amount = expandTokenDecimal(
    token_c_amount,
    assets[token_c_id].metadata.decimals + assets[token_c_id].config.extra_decimals,
  );
  const expanded_token_c_amount = expandTokenDecimal(
    token_c_amount,
    assets[token_c_id].metadata.decimals,
  );
  const expanded_d_amount = token_d_amount;
  const transactions: Transaction[] = [];
  transactions.push({
    receiverId: token_c_id,
    functionCalls: [
      ...(isNEAR
        ? [
            {
              methodName: ChangeMethodsNearToken[ChangeMethodsNearToken.near_deposit],
              gas: new BN("100000000000000"),
              attachedDeposit: new BN(expanded_token_c_amount.toFixed(0, 2)),
            },
          ]
        : []),
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
  const actionsTemplate = {
    actions: [
      {
        OpenPosition: {
          token_c_id,
          token_c_amount: expanded_c_amount.toFixed(0),
          token_d_id,
          token_d_amount: expanded_d_amount,
          token_p_id,
          min_token_p_amount,
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
            ? actionsTemplate
            : {
                receiver_id: logicContract.contractId,
                msg: JSON.stringify({
                  MarginExecute: actionsTemplate,
                }),
              }),
        },
        gas: new BN("300000000000000"),
      },
    ],
  });

  return prepareAndExecuteTransactions(transactions);
}
