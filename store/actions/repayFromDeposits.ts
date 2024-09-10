import BN from "bn.js";
import Decimal from "decimal.js";
import { decimalMax, getBurrow } from "../../utils";
import { expandTokenDecimal } from "../helper";
import { ChangeMethodsOracle, ChangeMethodsLogic } from "../../interfaces";
import { getMetadata, prepareAndExecuteTransactions } from "../tokens";
import { Transaction } from "../wallet";
import { transformAccount } from "../../transformers/account";
import getAccount from "../../api/get-account";
import { DEFAULT_POSITION } from "../../utils/config";
import getPortfolio from "../../api/get-portfolio";

export async function repayFromDeposits({
  tokenId,
  amount,
  extraDecimals,
  position,
  isMax,
  enable_pyth_oracle,
}: {
  tokenId: string;
  amount: string;
  extraDecimals: number;
  position: string;
  isMax: boolean;
  enable_pyth_oracle: boolean;
}) {
  // TODO repay from supplied
  const { logicContract, oracleContract } = await getBurrow();
  const { decimals } = (await getMetadata(tokenId))!;
  const account = await getAccount().then(transformAccount);
  if (!account) return;
  const detailedAccount = (await getPortfolio(account.accountId))!;
  const borrowedBalance = new Decimal(
    detailedAccount.positions[position]?.borrowed?.find((b) => b.token_id === tokenId)?.balance ||
      0,
  );
  const extraDecimalMultiplier = expandTokenDecimal(1, extraDecimals);
  // borrowed balance
  const tokenBorrowedBalance = borrowedBalance.divToInt(extraDecimalMultiplier);
  // repay amount
  const expandedAmount = expandTokenDecimal(amount, decimals);
  const suppliedBalance = new Decimal(account.portfolio?.supplied[tokenId]?.balance || 0);
  // decrease amount
  const decreaseCollateralAmount = decimalMax(
    expandedAmount.mul(extraDecimalMultiplier).sub(suppliedBalance),
    0,
  );
  // is max
  const treatAsMax = isMax || new Decimal(expandedAmount).gte(tokenBorrowedBalance);
  const transactions: Transaction[] = [];
  const repayTemplate =
    !position || position === DEFAULT_POSITION
      ? {
          Repay: {
            token_id: tokenId,
            amount: treatAsMax ? undefined : expandedAmount.mul(extraDecimalMultiplier).toFixed(0),
          },
        }
      : {
          PositionRepay: {
            asset_amount: {
              amount: treatAsMax
                ? undefined
                : expandedAmount.mul(extraDecimalMultiplier).toFixed(0),
              token_id: tokenId,
            },
            position,
          },
        };
  const decreaseCollateralTemplate = {
    DecreaseCollateral: {
      token_id: tokenId,
      amount: decreaseCollateralAmount.toFixed(0),
    },
  };
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
                ...(decreaseCollateralAmount.gt(0) ? [decreaseCollateralTemplate] : []),
                repayTemplate,
              ],
            }
          : {
              receiver_id: logicContract.contractId,
              msg: JSON.stringify({
                Execute: {
                  actions: [
                    ...(decreaseCollateralAmount.gt(0) ? [decreaseCollateralTemplate] : []),
                    repayTemplate,
                  ],
                },
              }),
            },
      },
    ],
  });
  await prepareAndExecuteTransactions(transactions);
}
