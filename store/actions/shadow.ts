import Decimal from "decimal.js";
import BN from "bn.js";
import { getBurrow } from "../../utils";
import { expandTokenDecimal, expandToken } from "../helper";
import { prepareAndExecuteTransactions } from "../tokens";
import { Transaction } from "../wallet";
import { NEAR_DECIMALS } from "../constants";
import { ChangeMethodsLogic, ChangeMethodsREFV1, ChangeMethodsOracle } from "../../interfaces";

export async function shadow_action_supply({
  tokenId,
  decimals,
  useAsCollateral,
  amount,
  isMax,
  isRegistered,
}: {
  tokenId: string;
  decimals: number;
  useAsCollateral: boolean;
  amount: string;
  isMax: boolean;
  isRegistered: boolean;
}): Promise<void> {
  const transactions: Transaction[] = [];
  const { refv1Contract } = await getBurrow();
  const expandAmount = expandTokenDecimal(amount, decimals).toFixed(0);
  const collateralActions = {
    actions: [
      {
        PositionIncreaseCollateral: {
          position: tokenId,
          asset_amount: { token_id: tokenId },
        },
      },
    ],
  };
  const pool_id = +tokenId.split("-")[1];
  transactions.push({
    receiverId: refv1Contract.contractId,
    functionCalls: [
      {
        methodName: ChangeMethodsREFV1[ChangeMethodsREFV1.shadow_action],
        args: {
          action: "ToBurrowland",
          pool_id,
          ...(isMax ? {} : { amount: expandAmount }),
          msg: useAsCollateral ? JSON.stringify({ Execute: collateralActions }) : "",
        },
        gas: new BN("300000000000000"),
        attachedDeposit: new BN(isRegistered ? 1 : expandToken(0.01, NEAR_DECIMALS)),
      },
    ],
  });
  await prepareAndExecuteTransactions(transactions);
}
export async function shadow_action_withdraw({
  tokenId,
  expandAmount,
  isMax,
  decreaseCollateralAmount,
  enable_pyth_oracle,
}: {
  tokenId: string;
  expandAmount: string;
  isMax: boolean;
  decreaseCollateralAmount: Decimal;
  enable_pyth_oracle: boolean;
}): Promise<void> {
  const transactions: Transaction[] = [];
  const { refv1Contract, logicContract, oracleContract } = await getBurrow();
  const pool_id = +tokenId.split("-")[1];
  if (decreaseCollateralAmount.gt(0)) {
    transactions.push({
      receiverId: enable_pyth_oracle ? logicContract.contractId : oracleContract.contractId,
      functionCalls: [
        {
          methodName: enable_pyth_oracle
            ? ChangeMethodsLogic[ChangeMethodsLogic.execute_with_pyth]
            : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
          gas: new BN("300000000000000"),
          args: enable_pyth_oracle
            ? {
                actions: [
                  {
                    PositionDecreaseCollateral: {
                      position: tokenId,
                      asset_amount: {
                        token_id: tokenId,
                        amount: decreaseCollateralAmount.toFixed(0),
                      },
                    },
                  },
                ],
              }
            : {
                receiver_id: logicContract.contractId,
                msg: JSON.stringify({
                  Execute: {
                    actions: [
                      {
                        PositionDecreaseCollateral: {
                          position: tokenId,
                          asset_amount: {
                            token_id: tokenId,
                            amount: decreaseCollateralAmount.toFixed(0),
                          },
                        },
                      },
                    ],
                  },
                }),
              },
        },
      ],
    });
  }
  transactions.push({
    receiverId: refv1Contract.contractId,
    functionCalls: [
      {
        methodName: ChangeMethodsREFV1[ChangeMethodsREFV1.shadow_action],
        args: {
          action: "FromBurrowland",
          pool_id,
          amount: expandAmount,
          msg: "",
        },
        gas: new BN("300000000000000"),
      },
    ],
  });
  await prepareAndExecuteTransactions(transactions);
}
