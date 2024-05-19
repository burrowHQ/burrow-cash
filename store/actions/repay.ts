import Decimal from "decimal.js";
import BN from "bn.js";
import { decimalMax, decimalMin, getBurrow, nearTokenId } from "../../utils";
import { expandTokenDecimal, registerNearFnCall, expandToken } from "../helper";
import { ChangeMethodsNearToken, ChangeMethodsToken } from "../../interfaces";
import { getTokenContract, getMetadata, prepareAndExecuteTransactions } from "../tokens";
import getBalance from "../../api/get-balance";
import { FunctionCallOptions } from "../wallet";
import { DEFAULT_POSITION } from "../../utils/config";
import getPortfolio from "../../api/get-portfolio";
import { NEAR_STORAGE_DEPOSIT_DECIMAL } from "../constants";

export async function repay({
  tokenId,
  amount,
  extraDecimals,
  isMax,
  position,
  minRepay,
  interestChargedIn1min,
}: {
  tokenId: string;
  amount: string;
  extraDecimals: number;
  isMax: boolean;
  position: string;
  minRepay: string;
  interestChargedIn1min: string;
}) {
  // TODO repay from wallet
  const { account, logicContract } = await getBurrow();
  const tokenContract = await getTokenContract(tokenId);
  const { decimals } = (await getMetadata(tokenId))!;
  const detailedAccount = (await getPortfolio(account.accountId))!;
  const isNEAR = tokenId === nearTokenId;
  const functionCalls: FunctionCallOptions[] = [];
  const borrowedBalance = new Decimal(
    detailedAccount.positions[position]?.borrowed?.find((b) => b.token_id === tokenId)?.balance ||
      0,
  );
  const extraDecimalMultiplier = expandTokenDecimal(1, extraDecimals);
  // borrowed balance
  const tokenBorrowedBalance = Decimal.max(
    borrowedBalance.divToInt(extraDecimalMultiplier).plus(interestChargedIn1min),
    minRepay,
  );
  // wallet balance
  const tokenBalance = new Decimal(await getBalance(tokenId, account.accountId));
  const accountBalance = decimalMax(
    0,
    new Decimal((await account.getAccountBalance()).available).sub(NEAR_STORAGE_DEPOSIT_DECIMAL),
  );

  const maxAvailableBalance = isNEAR ? tokenBalance.add(accountBalance) : tokenBalance;
  const maxAmount = decimalMin(tokenBorrowedBalance, maxAvailableBalance);
  const expandedAmountToken = isMax
    ? maxAmount
    : decimalMin(maxAmount, expandTokenDecimal(amount, decimals));
  // is max
  const treatAsMax = isMax || new Decimal(expandedAmountToken).gte(tokenBorrowedBalance);
  if (isNEAR && expandedAmountToken.gt(tokenBalance)) {
    const toWrapAmount = expandedAmountToken.sub(tokenBalance);
    functionCalls.push(...(await registerNearFnCall(account.accountId, tokenContract)));
    functionCalls.push({
      methodName: ChangeMethodsNearToken[ChangeMethodsNearToken.near_deposit],
      gas: new BN("10000000000000"),
      attachedDeposit: new BN(toWrapAmount.toFixed(0, 2)),
    });
  }
  let msg;
  const isLPPosition = !(!position || position === DEFAULT_POSITION);
  if (!isLPPosition) {
    msg = {
      Execute: {
        actions: [
          {
            Repay: {
              max_amount: !treatAsMax
                ? expandedAmountToken.mul(extraDecimalMultiplier).toFixed(0)
                : undefined,
              token_id: tokenId,
            },
          },
        ],
      },
    };
  } else {
    msg = {
      Execute: {
        actions: [
          {
            PositionRepay: {
              asset_amount: {
                amount: !treatAsMax
                  ? expandedAmountToken.mul(extraDecimalMultiplier).minus(1).toFixed(0)
                  : undefined,
                token_id: tokenId,
              },
              position,
            },
          },
        ],
      },
    };
  }
  functionCalls.push({
    methodName: ChangeMethodsToken[ChangeMethodsToken.ft_transfer_call],
    gas: new BN("100000000000000"),
    args: {
      receiver_id: logicContract.contractId,
      amount: expandedAmountToken.toFixed(0),
      msg: JSON.stringify(msg),
    },
  });

  await prepareAndExecuteTransactions([
    {
      receiverId: tokenContract.contractId,
      functionCalls,
    },
  ]);
}
