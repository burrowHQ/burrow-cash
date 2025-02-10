import BN from "bn.js";
import Decimal from "decimal.js";

import { decimalMax, decimalMin, getBurrow, nearTokenId } from "../../utils";
import { expandToken, expandTokenDecimal } from "../helper";
import { ChangeMethodsLogic, ChangeMethodsOracle, ChangeMethodsToken } from "../../interfaces";
import { getTokenContract, prepareAndExecuteTransactions } from "../tokens";
import { ChangeMethodsNearToken } from "../../interfaces/contract-methods";
import { Transaction, isRegistered, isRegisteredNew } from "../wallet";
import { NEAR_DECIMALS, NO_STORAGE_DEPOSIT_CONTRACTS, NEAR_STORAGE_DEPOSIT } from "../constants";
import getAssets from "../../api/get-assets";
import { transformAssets } from "../../transformers/asstets";
import getAccount from "../../api/get-account";
import { transformAccount } from "../../transformers/account";
import { computeWithdrawMaxAmount } from "../../redux/selectors/getWithdrawMaxAmount";
import getConfig from "../../utils/config";
import { shadow_action_withdraw } from "./shadow";
import type { Assets } from "../../redux/assetState";
import type { Portfolio } from "../../redux/accountState";

const { SPECIAL_REGISTRATION_TOKEN_IDS } = getConfig() as any;
interface Props {
  tokenId: string;
  extraDecimals: number;
  amount: string;
  isMax: boolean;
  enable_pyth_oracle: boolean;
  assets: Assets;
  accountPortfolio: Portfolio;
  accountId: string;
}

export async function withdraw({
  tokenId,
  extraDecimals,
  amount,
  isMax,
  enable_pyth_oracle,
  assets,
  accountPortfolio,
  accountId,
}: Props) {
  // const assets = await getAssets().then(transformAssets);
  // const account = await getAccount().then(transformAccount);
  // console.log('0000000000000-assets', assets)
  // console.log('0000000000000-accountPortfolio', accountPortfolio)
  // console.log('0000000000000-accountId', accountId)
  // console.log('0000000000000-account', account)
  if (!accountId) return;
  const asset = assets[tokenId];
  const { decimals } = asset.metadata;
  const { logicContract, oracleContract } = await getBurrow();
  const isNEAR = tokenId === nearTokenId;
  const { isLpToken } = asset;
  const suppliedBalance = new Decimal(accountPortfolio?.supplied[tokenId]?.balance || 0);
  const hasBorrow = accountPortfolio?.borrows?.length > 0;
  const maxAmount = computeWithdrawMaxAmount(tokenId, assets, accountPortfolio!);

  const expandedAmount = isMax
    ? maxAmount
    : decimalMin(maxAmount, expandTokenDecimal(amount, decimals + extraDecimals));

  const transactions: Transaction[] = [];
  const decreaseCollateralAmount = decimalMax(expandedAmount.sub(suppliedBalance), 0);
  if (isLpToken) {
    shadow_action_withdraw({
      tokenId,
      expandAmount: expandedAmount.toFixed(0),
      isMax,
      decreaseCollateralAmount,
      enable_pyth_oracle,
    });
  } else {
    const tokenContract = await getTokenContract(tokenId);
    if (
      !(await isRegistered(accountId, tokenContract)) &&
      !NO_STORAGE_DEPOSIT_CONTRACTS.includes(tokenContract.contractId)
    ) {
      if (SPECIAL_REGISTRATION_TOKEN_IDS.includes(tokenContract.contractId)) {
        const r = await isRegisteredNew(accountId, tokenContract);
        if (r) {
          transactions.push({
            receiverId: tokenContract.contractId,
            functionCalls: [
              {
                methodName: ChangeMethodsToken[ChangeMethodsToken.storage_deposit],
                attachedDeposit: new BN(expandToken(NEAR_STORAGE_DEPOSIT, NEAR_DECIMALS)),
              },
            ],
          });
        } else {
          transactions.push({
            receiverId: tokenContract.contractId,
            functionCalls: [
              {
                methodName: ChangeMethodsToken[ChangeMethodsToken.register_account],
                gas: new BN("10000000000000"),
                args: {
                  account_id: accountId,
                },
                attachedDeposit: new BN(0),
              },
            ],
          });
        }
      } else {
        transactions.push({
          receiverId: tokenContract.contractId,
          functionCalls: [
            {
              methodName: ChangeMethodsToken[ChangeMethodsToken.storage_deposit],
              attachedDeposit: new BN(expandToken(NEAR_STORAGE_DEPOSIT, NEAR_DECIMALS)),
            },
          ],
        });
      }
    }

    const withdrawAction = {
      Withdraw: {
        token_id: tokenId,
        max_amount: !isMax ? expandedAmount.toFixed(0) : undefined,
      },
    };
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
                      DecreaseCollateral: {
                        token_id: tokenId,
                        amount:
                          !hasBorrow && isMax ? undefined : decreaseCollateralAmount.toFixed(0),
                      },
                    },
                    withdrawAction,
                  ],
                }
              : {
                  receiver_id: logicContract.contractId,
                  msg: JSON.stringify({
                    Execute: {
                      actions: [
                        {
                          DecreaseCollateral: {
                            token_id: tokenId,
                            amount:
                              !hasBorrow && isMax ? undefined : decreaseCollateralAmount.toFixed(0),
                          },
                        },
                        withdrawAction,
                      ],
                    },
                  }),
                },
          },
        ],
      });
    } else {
      transactions.push({
        receiverId: logicContract.contractId,
        functionCalls: [
          {
            methodName: ChangeMethodsLogic[ChangeMethodsLogic.execute],
            args: {
              actions: [withdrawAction],
            },
          },
        ],
      });
    }
    // 10 yocto is for rounding errors.
    if (isNEAR && expandedAmount.gt(10)) {
      transactions.push({
        receiverId: tokenContract.contractId,
        functionCalls: [
          {
            methodName: ChangeMethodsNearToken[ChangeMethodsNearToken.near_withdraw],
            args: {
              amount: expandedAmount.sub(10).toFixed(0),
            },
          },
        ],
      });
    }
    await prepareAndExecuteTransactions(transactions);
  }
}
