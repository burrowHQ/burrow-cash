import BN from "bn.js";
import Decimal from "decimal.js";

import { getWithdrawTransaction } from "btc-wallet";
import { decimalMax, decimalMin, getBurrow, nearTokenId } from "../../utils";
import {
  expandToken,
  expandTokenDecimal,
  registerAccountOnTokenWithQuery,
  shrinkToken,
  shrinkTokenDecimal,
} from "../helper";
import { ChangeMethodsLogic, ChangeMethodsOracle, ChangeMethodsToken } from "../../interfaces";
import { getTokenContract, prepareAndExecuteTransactions } from "../tokens";
import { ChangeMethodsNearToken } from "../../interfaces/contract-methods";
import { Transaction, isRegistered } from "../wallet";
import { NEAR_DECIMALS, NO_STORAGE_DEPOSIT_CONTRACTS, NEAR_STORAGE_DEPOSIT } from "../constants";
import getAssets from "../../api/get-assets";
import { transformAssets } from "../../transformers/asstets";
import getAccount from "../../api/get-account";
import { transformAccount } from "../../transformers/account";
import { computeWithdrawMaxAmount } from "../../redux/selectors/getWithdrawMaxAmount";
import getConfig, { NBTCTokenId } from "../../utils/config";
import { shadow_action_withdraw } from "./shadow";
import { store } from "../../redux/store";

const { SPECIAL_REGISTRATION_TOKEN_IDS } = getConfig() as any;
interface Props {
  tokenId: string;
  extraDecimals: number;
  amount: string;
  isMax: boolean;
  isMeme: boolean;
  available: number;
}

export async function withdraw({
  tokenId,
  extraDecimals,
  amount,
  isMax,
  isMeme,
  available,
}: Props) {
  const state = store.getState();
  const { oracleContract, logicContract, memeOracleContract, logicMEMEContract, selector } =
    await getBurrow();
  let assets: typeof state.assets.data;
  let account: typeof state.account;
  let enable_pyth_oracle: boolean;
  let logicContractId: string;
  let oracleContractId: string;
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
  if (!account) return;
  const asset = assets[tokenId];
  const { decimals } = asset.metadata;
  const isNEAR = tokenId === nearTokenId;
  const { isLpToken } = asset;
  const suppliedBalance = new Decimal(account.portfolio?.supplied[tokenId]?.balance || 0);
  const hasBorrow = account.portfolio?.borrows?.length > 0;
  const maxAmount = computeWithdrawMaxAmount(tokenId, assets, account.portfolio!);
  const expandedAmount = isMax
    ? decimalMin(maxAmount, expandTokenDecimal(available, decimals + extraDecimals))
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
    const registerToken = await registerAccountOnTokenWithQuery(account.accountId, tokenId);
    if (registerToken) {
      transactions.push(registerToken);
    }

    const withdrawAction = {
      Withdraw: {
        token_id: tokenId,
        max_amount: !isMax ? expandedAmount.toFixed(0) : undefined,
      },
    };
    if (decreaseCollateralAmount.gt(0)) {
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
                  actions: [
                    {
                      DecreaseCollateral: {
                        token_id: tokenId,
                        amount: hasBorrow ? decreaseCollateralAmount.toFixed(0) : undefined,
                      },
                    },
                    withdrawAction,
                  ],
                }
              : {
                  receiver_id: logicContractId,
                  msg: JSON.stringify({
                    Execute: {
                      actions: [
                        {
                          DecreaseCollateral: {
                            token_id: tokenId,
                            amount: decreaseCollateralAmount.toFixed(0),
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
        receiverId: logicContractId,
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
    const tokenContract = await getTokenContract(tokenId);
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
    const wallet = await selector.wallet();
    let withdraw_to_btc;
    if (wallet.id == "btc-wallet" && tokenId === NBTCTokenId) {
      const withdrawAmount = shrinkTokenDecimal(expandedAmount.toFixed(0), extraDecimals).toFixed(
        0,
      );
      withdraw_to_btc = await getWithdrawTransaction({
        amount: withdrawAmount,
        env: "private_mainnet",
      });
    }
    await prepareAndExecuteTransactions(transactions, isMeme, withdraw_to_btc);
  }
}
