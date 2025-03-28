import BN from "bn.js";
import { getBurrow } from "../../utils";
import { expandToken } from "../helper";
import { ChangeMethodsLogic, ChangeMethodsToken, ChangeMethodsOracle } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import { Assets } from "../../redux/assetState";
import getConfig from "../../api/get-config";
import getMemeConfig from "../../api/get-config-meme";

export async function increaseCollateral({
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
  const expanded_supply_amount = expandToken(amount, assets[token_c_id].metadata.decimals, 0);
  const logicContractId = isMeme ? logicMEMEContract.contractId : logicContract.contractId;
  transactions.push({
    receiverId: token_c_id,
    functionCalls: [
      {
        methodName: ChangeMethodsToken[ChangeMethodsToken.ft_transfer_call],
        gas: new BN("100000000000000"),
        args: {
          receiver_id: logicContractId,
          amount: expanded_supply_amount,
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
          amount: expandToken(expanded_supply_amount, assets[token_c_id].config.extra_decimals, 0),
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
            ? increaseCollateralTemplate
            : {
                receiver_id: logicContractId,
                msg: JSON.stringify({
                  MarginExecute: increaseCollateralTemplate,
                }),
              }),
        },
        gas: new BN("300000000000000"),
      },
    ],
  });
  const result = await prepareAndExecuteTransactions(transactions, isMeme);

  return result;
}
