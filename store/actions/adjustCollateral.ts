import BN from "bn.js";
import Decimal from "decimal.js";

import { decimalMin, getBurrow } from "../../utils";
import { expandTokenDecimal } from "../helper";
import { ChangeMethodsLogic, ChangeMethodsOracle } from "../../interfaces";
import { Transaction } from "../wallet";
import { prepareAndExecuteTransactions } from "../tokens";
import { store } from "../../redux/store";

export async function adjustCollateral({
  tokenId,
  extraDecimals,
  amount,
  isMax,
  isMeme,
}: {
  tokenId: string;
  extraDecimals: number;
  amount: string;
  isMax: boolean;
  isMeme: boolean;
}) {
  const state = store.getState();
  const { oracleContract, logicContract, memeOracleContract, logicMEMEContract } =
    await getBurrow();
  let assets;
  let account;
  let enable_pyth_oracle;
  let logicContractId;
  let oracleContractId;
  if (isMeme) {
    assets = state.assetsMEME.data;
    account = state.accountMEME;
    enable_pyth_oracle = state.appMEME.config.enable_pyth_oracle;
    logicContractId = logicMEMEContract.contractId;
    oracleContractId = memeOracleContract.contractId;
  } else {
    assets = state.assets.data;
    account = state.account;
    enable_pyth_oracle = state.app.config.enable_pyth_oracle;
    logicContractId = logicContract.contractId;
    oracleContractId = oracleContract.contractId;
  }
  // const assets = await getAssets().then(transformAssets);
  // const account = await getAccount().then(transformAccount);
  const asset = assets[tokenId];
  const { decimals } = asset.metadata;
  if (!account) return;
  const suppliedBalance = new Decimal(account.portfolio?.supplied[tokenId]?.balance || 0);
  const collateralBalance = new Decimal(
    asset.isLpToken
      ? account.portfolio?.positions[tokenId]?.collateral[tokenId]?.balance || 0
      : account.portfolio?.collateral[tokenId]?.balance || 0,
  );

  const totalBalance = suppliedBalance.add(collateralBalance);

  const expandedAmount = isMax
    ? totalBalance
    : decimalMin(totalBalance, expandTokenDecimal(amount, decimals + extraDecimals));

  if (expandedAmount.gt(collateralBalance)) {
    let increaseCollateralTemplate;
    if (asset.isLpToken) {
      increaseCollateralTemplate = {
        PositionIncreaseCollateral: {
          position: tokenId,
          asset_amount: {
            token_id: tokenId,
            amount: !isMax ? expandedAmount.sub(collateralBalance).toFixed(0) : undefined,
          },
        },
      };
    } else {
      increaseCollateralTemplate = {
        IncreaseCollateral: {
          token_id: tokenId,
          max_amount: !isMax ? expandedAmount.sub(collateralBalance).toFixed(0) : undefined,
        },
      };
    }
    await prepareAndExecuteTransactions([
      {
        receiverId: logicContractId,
        functionCalls: [
          {
            methodName: enable_pyth_oracle
              ? ChangeMethodsLogic[ChangeMethodsLogic.execute_with_pyth]
              : ChangeMethodsLogic[ChangeMethodsLogic.execute],
            gas: new BN("100000000000000"),
            args: {
              actions: [increaseCollateralTemplate],
            },
          },
        ],
      } as Transaction,
    ]);
  } else if (expandedAmount.lt(collateralBalance)) {
    let decreaseCollateralTemplate;
    if (asset.isLpToken) {
      decreaseCollateralTemplate = {
        PositionDecreaseCollateral: {
          position: tokenId,
          asset_amount: {
            token_id: tokenId,
            amount: expandedAmount.gt(0)
              ? collateralBalance.sub(expandedAmount).toFixed(0)
              : undefined,
          },
        },
      };
    } else {
      decreaseCollateralTemplate = {
        DecreaseCollateral: {
          token_id: tokenId,
          max_amount: expandedAmount.gt(0)
            ? collateralBalance.sub(expandedAmount).toFixed(0)
            : undefined,
        },
      };
    }
    await prepareAndExecuteTransactions([
      {
        receiverId: enable_pyth_oracle ? logicContractId : oracleContractId,
        functionCalls: [
          {
            methodName: enable_pyth_oracle
              ? ChangeMethodsLogic[ChangeMethodsLogic.execute_with_pyth]
              : ChangeMethodsOracle[ChangeMethodsOracle.oracle_call],
            gas: new BN("300000000000000"),
            args: enable_pyth_oracle
              ? {
                  actions: [decreaseCollateralTemplate],
                }
              : {
                  receiver_id: logicContractId,
                  msg: JSON.stringify({
                    Execute: {
                      actions: [decreaseCollateralTemplate],
                    },
                  }),
                },
          },
        ],
      } as Transaction,
    ]);
  }
}
