import { getBurrow } from "../../utils";
import { expandToken } from "../helper";
import { ChangeMethodsLogic } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import { ViewMethodsLogic } from "../../interfaces/contract-methods";
import { IConfig } from "../../interfaces/burrow";

export async function stake({ amount, months }: { amount: number; months: number }) {
  const { logicContract, view } = await getBurrow();
  const config = (await view(
    logicContract,
    ViewMethodsLogic[ViewMethodsLogic.get_config],
  )) as IConfig;

  const transactions: Transaction[] = [];

  const duration =
    months === 12
      ? config.maximum_staking_duration_sec
      : months * config.minimum_staking_duration_sec;
  console.info(
    `stake months:${months} duration:${duration} 
    minSec:${config.minimum_staking_duration_sec},
    maxSec:${config.maximum_staking_duration_sec} amount:${amount} decimals:${
      config.booster_decimals
    } tokenAmount:${expandToken(amount, config.booster_decimals)}`,
  );
  transactions.push({
    receiverId: logicContract.contractId,
    functionCalls: [
      {
        methodName: ChangeMethodsLogic[ChangeMethodsLogic.account_stake_booster],
        args: {
          receiver_id: logicContract.contractId,
          amount: expandToken(amount, config.booster_decimals),
          duration,
        },
      },
    ],
  });

  await prepareAndExecuteTransactions(transactions);
}
