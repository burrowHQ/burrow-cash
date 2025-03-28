import BN from "bn.js";
import Decimal from "decimal.js";
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
import getMemeConfig from "../../api/get-config-meme";
import type { AccountState } from "../../redux/accountState";

export async function openPosition({
  token_c_id,
  token_c_amount,
  token_d_id,
  token_d_amount,
  token_p_id,
  min_token_p_amount,
  swap_indication,
  assets,
  account,
  isMeme,
}: {
  token_c_id: string;
  token_c_amount: string;
  token_d_id: string;
  token_d_amount: string;
  token_p_id: string;
  min_token_p_amount: string;
  swap_indication: any;
  assets: Assets;
  account: AccountState;
  isMeme?: boolean;
}) {
  const { logicContract, oracleContract, memeOracleContract, logicMEMEContract } =
    await getBurrow();
  let enable_pyth_oracle;
  let priceOracleContract;
  if (isMeme) {
    enable_pyth_oracle = (await getMemeConfig()).enable_pyth_oracle;
    priceOracleContract = memeOracleContract.contractId;
  } else {
    enable_pyth_oracle = (await getConfig()).enable_pyth_oracle;
    priceOracleContract = oracleContract.contractId;
  }
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
  const logicContractId = isMeme ? logicMEMEContract.contractId : logicContract.contractId;
  let toWrapAmount = new Decimal(0);
  if (isNEAR) {
    const wrap_near_balance = account.balances[nearTokenId];
    // const near_balance = account.balances["near"];
    toWrapAmount = expanded_token_c_amount.minus(wrap_near_balance);
  }
  transactions.push({
    receiverId: token_c_id,
    functionCalls: [
      ...(isNEAR && toWrapAmount.gt(0)
        ? [
            {
              methodName: ChangeMethodsNearToken[ChangeMethodsNearToken.near_deposit],
              gas: new BN("100000000000000"),
              attachedDeposit: new BN(toWrapAmount.toFixed(0, Decimal.ROUND_CEIL)), // up
            },
          ]
        : []),
      {
        methodName: ChangeMethodsToken[ChangeMethodsToken.ft_transfer_call],
        gas: new BN("100000000000000"),
        args: {
          receiver_id: logicContractId,
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
    receiverId: enable_pyth_oracle ? logicContractId : priceOracleContract,
    functionCalls: [
      {
        methodName: enable_pyth_oracle
          ? ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth]
          : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
        args: {
          ...(enable_pyth_oracle
            ? actionsTemplate
            : {
                receiver_id: logicContractId,
                msg: JSON.stringify({
                  MarginExecute: actionsTemplate,
                }),
              }),
        },
        gas: new BN("300000000000000"),
      },
    ],
  });

  return prepareAndExecuteTransactions(transactions, isMeme);
}
