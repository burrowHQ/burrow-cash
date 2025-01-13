import BN from "bn.js";
import { getBurrow } from "../../utils";
import { ChangeMethodsLogic, ChangeMethodsOracle } from "../../interfaces";
import { Transaction, isRegistered } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import { registerAccountOnToken } from "../helper";
import getConfig from "../../api/get-config";
import getConfigMEME from "../../api/get-config-meme";

export async function withdrawActionsAll({
  meme_token_ids,
  main_token_ids,
}: {
  meme_token_ids: string[];
  main_token_ids: string[];
}) {
  const { logicContract, oracleContract, account, logicMEMEContract, memeOracleContract } =
    await getBurrow();
  const transactions: Transaction[] = [];
  // token register
  const all_token_ids = meme_token_ids.concat(main_token_ids);
  const registered_pending = all_token_ids.map((id) => isRegistered(account.accountId, id));
  const registeredResolve = await Promise.all(registered_pending);
  for (const [index, registered] of Object.entries(registeredResolve)) {
    if (registered == null) {
      const storageDeposit = await registerAccountOnToken(account.accountId, all_token_ids[index]);
      transactions.unshift(storageDeposit);
    }
  }
  // meme
  if (meme_token_ids.length) {
    const { enable_pyth_oracle } = await getConfigMEME();
    const dWithDrawActionsTemplate = createWithdrawActionsTemplate(meme_token_ids);
    transactions.push({
      receiverId: enable_pyth_oracle ? logicMEMEContract.contractId : memeOracleContract.contractId,
      functionCalls: [
        {
          methodName: enable_pyth_oracle
            ? ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth]
            : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
          args: {
            ...(enable_pyth_oracle
              ? dWithDrawActionsTemplate
              : {
                  receiver_id: logicMEMEContract.contractId,
                  msg: JSON.stringify({
                    MarginExecute: dWithDrawActionsTemplate,
                  }),
                }),
          },
          gas: new BN("300000000000000"),
        },
      ],
    });
  }
  // main
  if (main_token_ids.length) {
    const { enable_pyth_oracle } = await getConfig();
    const dWithDrawActionsTemplate = createWithdrawActionsTemplate(main_token_ids);
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
  }
  const result = await prepareAndExecuteTransactions(transactions);
  return result;
}

const createWithdrawActionsTemplate = (ids: string[]) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("ids Kinahanglan nga usa ka dili bakante nga laray");
  }
  return {
    actions: ids.map((token_id) => createWithdrawAction(token_id)),
  };
};
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
