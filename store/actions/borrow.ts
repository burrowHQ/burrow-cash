import BN from "bn.js";

import { getBurrow, nearTokenId } from "../../utils";
import { expandTokenDecimal, registerAccountOnTokenWithQuery } from "../helper";
import { ChangeMethodsNearToken, ChangeMethodsOracle, ChangeMethodsLogic } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions, getMetadata, getTokenContract } from "../tokens";
import { DEFAULT_POSITION } from "../../utils/config";
import { store } from "../../redux/store";

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
  const registerToken = await registerAccountOnTokenWithQuery(
    account.accountId,
    tokenContract.contractId,
  );
  if (registerToken) {
    transactions.push(registerToken);
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
