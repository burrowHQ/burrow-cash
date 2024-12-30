import BN from "bn.js";
import { getBurrow } from "../../utils";
import { expandTokenDecimal } from "../helper";
import { ChangeMethodsLogic, ChangeMethodsOracle } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import { Assets } from "../../redux/assetState";
import getConfig from "../../api/get-config";
import getMemeConfig from "../../api/get-config-meme";

export async function decreaseCollateral({
  pos_id,
  token_c_id,
  amount,
  assets,
  isMeme,
}: {
  pos_id: string;
  token_c_id: string;
  amount: string;
  assets: Assets;
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
  const transactions: Transaction[] = [];
  const expanded_c_amount = expandTokenDecimal(
    amount,
    assets[token_c_id].metadata.decimals + assets[token_c_id].config.extra_decimals,
  );
  const decreaseCollateralTemplate = {
    actions: [
      {
        DecreaseCollateral: {
          pos_id,
          amount: expanded_c_amount.toFixed(0),
        },
      },
    ],
  };
  const logicContractId = isMeme ? logicMEMEContract.contractId : logicContract.contractId;
  transactions.push({
    receiverId: enable_pyth_oracle ? logicContractId : priceOracleContract,
    functionCalls: [
      {
        methodName: enable_pyth_oracle
          ? ChangeMethodsLogic[ChangeMethodsLogic.margin_execute_with_pyth]
          : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
        args: {
          ...(enable_pyth_oracle
            ? decreaseCollateralTemplate
            : {
                receiver_id: logicContractId,
                msg: JSON.stringify({
                  MarginExecute: decreaseCollateralTemplate,
                }),
              }),
        },
        gas: new BN("300000000000000"),
      },
    ],
  });
  const withDrawActionsTemplate = {
    actions: [
      {
        Withdraw: {
          token_id: token_c_id,
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
            ? withDrawActionsTemplate
            : {
                receiver_id: logicContractId,
                msg: JSON.stringify({
                  MarginExecute: withDrawActionsTemplate,
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
