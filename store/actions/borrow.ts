import BN from "bn.js";

import { getBurrow, nearTokenId } from "../../utils";
import { expandToken, expandTokenDecimal } from "../helper";
import {
  ChangeMethodsNearToken,
  ChangeMethodsOracle,
  ChangeMethodsToken,
  ChangeMethodsLogic,
} from "../../interfaces";
import { Transaction, isRegistered, isRegisteredNew } from "../wallet";
import { prepareAndExecuteTransactions, getMetadata, getTokenContract } from "../tokens";
import { NEAR_DECIMALS, NO_STORAGE_DEPOSIT_CONTRACTS, NEAR_STORAGE_DEPOSIT } from "../constants";
import getConfig, { DEFAULT_POSITION } from "../../utils/config";
import { store } from "../../redux/store";

const { SPECIAL_REGISTRATION_TOKEN_IDS } = getConfig() as any;
export async function borrow({
  tokenId,
  extraDecimals,
  amount,
  collateralType,
  isMeme,
}: {
  tokenId: string;
  extraDecimals: number;
  amount: string;
  collateralType: string;
  isMeme?: boolean;
}) {
  const state = store.getState();
  const { oracleContract, logicContract, account, memeOracleContract, logicMEMEContract } =
    await getBurrow();
  let enable_pyth_oracle;
  let logicContractId;
  let oracleContractId;
  if (isMeme) {
    enable_pyth_oracle = state.appMEME.config.enable_pyth_oracle;
    logicContractId = logicMEMEContract.contractId;
    oracleContractId = memeOracleContract.contractId;
  } else {
    enable_pyth_oracle = state.app.config.enable_pyth_oracle;
    logicContractId = logicContract.contractId;
    oracleContractId = oracleContract.contractId;
  }
  const { decimals } = (await getMetadata(tokenId))!;
  const tokenContract = await getTokenContract(tokenId);
  const isNEAR = tokenId === nearTokenId;
  const transactions: Transaction[] = [];

  const expandedAmount = expandTokenDecimal(amount, decimals + extraDecimals);
  if (
    !(await isRegistered(account.accountId, tokenContract)) &&
    !NO_STORAGE_DEPOSIT_CONTRACTS.includes(tokenContract.contractId)
  ) {
    if (SPECIAL_REGISTRATION_TOKEN_IDS.includes(tokenContract.contractId)) {
      const r = await isRegisteredNew(account.accountId, tokenContract);
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
                account_id: account.accountId,
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
  let borrowTemplate;
  if (!collateralType || collateralType === DEFAULT_POSITION) {
    borrowTemplate = {
      Execute: {
        actions: [
          {
            Borrow: {
              token_id: tokenId,
              amount: expandedAmount.toFixed(0),
            },
          },
          {
            Withdraw: {
              token_id: tokenId,
              max_amount: expandedAmount.toFixed(0),
            },
          },
        ],
      },
    };
  } else {
    borrowTemplate = {
      Execute: {
        actions: [
          {
            PositionBorrow: {
              position: collateralType,
              asset_amount: {
                token_id: tokenId,
                amount: expandedAmount.toFixed(0),
              },
            },
          },
          {
            Withdraw: {
              token_id: tokenId,
              max_amount: expandedAmount.toFixed(0),
            },
          },
        ],
      },
    };
  }

  transactions.push({
    receiverId: enable_pyth_oracle ? logicContractId : oracleContractId,
    functionCalls: [
      {
        methodName: enable_pyth_oracle
          ? ChangeMethodsLogic[ChangeMethodsLogic.execute_with_pyth]
          : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
        gas: new BN("300000000000000"),
        args: enable_pyth_oracle
          ? {
              actions: borrowTemplate.Execute.actions,
            }
          : {
              receiver_id: logicContractId,
              msg: JSON.stringify(borrowTemplate),
            },
      },
    ],
  });

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
