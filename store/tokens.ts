import { Contract } from "near-api-js";
import Decimal from "decimal.js";
import BN from "bn.js";
// eslint-disable-next-line import/no-cycle
import { Transaction as SelectorTransaction } from "@near-wallet-selector/core";
// eslint-disable-next-line import/no-cycle
import { expandToken, expandTokenDecimal, getContract, shrinkToken } from "./helper";
import { getBurrow } from "../utils";
import {
  DEFAULT_PRECISION,
  NEAR_DECIMALS,
  NO_STORAGE_DEPOSIT_CONTRACTS,
  NEAR_STORAGE_DEPOSIT,
  NEAR_STORAGE_DEPOSIT_MIN,
  NEAR_STORAGE_EXTRA_DEPOSIT,
  NEAR_STORAGE_TOKEN,
} from "./constants";
import {
  ViewMethodsLogic,
  ChangeMethodsLogic,
  ChangeMethodsToken,
  ViewMethodsToken,
  IMetadata,
  Balance,
} from "../interfaces";

import {
  executeMultipleTransactions,
  FunctionCallOptions,
  isRegistered,
  Transaction,
} from "./wallet";

import { ETH_CONTRACT_ID, ETH_OLD_CONTRACT_ID } from "../utils/config";
import { store } from "../redux/store";
import { get_all_tokens_metadata } from "../api/get-token";

Decimal.set({ precision: DEFAULT_PRECISION });

export const getTokenContract = async (tokenContractAddress: string): Promise<Contract> => {
  const { account } = await getBurrow();
  return getContract(account, tokenContractAddress, ViewMethodsToken, ChangeMethodsToken);
};

export const getMetadata = async (token_id: string): Promise<IMetadata | undefined> => {
  try {
    const { view } = await getBurrow();
    const tokenContract: Contract = await getTokenContract(
      token_id == ETH_OLD_CONTRACT_ID ? ETH_CONTRACT_ID : token_id,
    );
    const metadata: IMetadata = (await view(
      tokenContract,
      ViewMethodsToken[ViewMethodsToken.ft_metadata],
    )) as IMetadata;
    metadata.token_id = token_id;
    return metadata;
  } catch (err: any) {
    console.error(`Failed to get metadata for ${token_id} ${err.message}`);
    return undefined;
  }
};

export const getBalance = async (
  token_id: string,
  accountId: string,
): Promise<number | undefined> => {
  const { view } = await getBurrow();

  try {
    const tokenContract: Contract = await getTokenContract(
      token_id == ETH_OLD_CONTRACT_ID ? ETH_CONTRACT_ID : token_id,
    );

    const balanceInYocto: string = (await view(
      tokenContract,
      ViewMethodsToken[ViewMethodsToken.ft_balance_of],
      {
        account_id: accountId,
      },
    )) as string;

    const metadata = await getMetadata(token_id);
    const balance = shrinkToken(balanceInYocto, metadata?.decimals!);

    return Number(balance);
  } catch (err: any) {
    console.error(`Failed to get balance for ${accountId} on ${token_id} ${err.message}`);
    return 0;
  }
};

export const getAllMetadata = async (token_ids: string[]): Promise<IMetadata[]> => {
  if (process.env.NEXT_PUBLIC_DEFAULT_NETWORK == "testnet") {
    const metadata: IMetadata[] = (
      await Promise.all(token_ids.map((token_id) => getMetadata(token_id)))
    ).filter((m): m is IMetadata => !!m);
    return metadata;
  }
  try {
    const tokensMap = await get_all_tokens_metadata();
    const metadata: IMetadata[] = token_ids.map((token_id) => tokensMap[token_id]);
    return metadata;
  } catch (err) {
    const metadata: IMetadata[] = (
      await Promise.all(token_ids.map((token_id) => getMetadata(token_id)))
    ).filter((m): m is IMetadata => !!m);
    return metadata;
  }
};

export const prepareAndExecuteTokenTransactions = async (
  tokenContract: Contract,
  functionCall: FunctionCallOptions,
) => {
  const { account } = await getBurrow();
  const transactions: Transaction[] = [];

  const functionCalls: FunctionCallOptions[] = [];
  // check if account is registered in the token contract
  if (
    !(await isRegistered(account.accountId, tokenContract.contractId)) &&
    !NO_STORAGE_DEPOSIT_CONTRACTS.includes(tokenContract.contractId)
  ) {
    functionCalls.push({
      methodName: ChangeMethodsToken[ChangeMethodsToken.storage_deposit],
      attachedDeposit: new BN(expandToken(NEAR_STORAGE_TOKEN, NEAR_DECIMALS)),
    });
  }

  if (functionCall) {
    // add the actual transaction to be executed
    functionCalls.push(functionCall);
  }

  transactions.push({
    receiverId: tokenContract.contractId,
    functionCalls,
  });
  await prepareAndExecuteTransactions(transactions);
};

export const prepareAndExecuteTransactions = async (
  operations: Transaction[] = [],
  isMeme?: boolean,
  extraTranstion?: SelectorTransaction,
) => {
  const { account, logicContract, view, logicMEMEContract } = await getBurrow();
  const transactions: Transaction[] = [];
  const isMemeCur = store?.getState()?.category?.activeCategory == "meme";
  let isMemeCategory;
  if (isMeme == undefined) {
    isMemeCategory = isMemeCur;
  } else {
    isMemeCategory = isMeme;
  }
  // check if account is registered in burrow cash
  const burrowContract = isMemeCategory ? logicMEMEContract : logicContract;
  const storageDepositTransaction = (deposit: number) => ({
    receiverId: burrowContract.contractId,
    functionCalls: [
      {
        methodName: ChangeMethodsLogic[ChangeMethodsLogic.storage_deposit],
        args: {
          registration_only: false,
          account_id: account.accountId,
        },
        attachedDeposit: new BN(expandToken(deposit, NEAR_DECIMALS)),
      },
    ],
  });
  if (!(await isRegistered(account.accountId, burrowContract.contractId))) {
    transactions.push(storageDepositTransaction(NEAR_STORAGE_DEPOSIT));
  } else {
    const balance = (await view(
      burrowContract,
      ViewMethodsLogic[ViewMethodsLogic.storage_balance_of],
      {
        account_id: account.accountId,
      },
    )) as Balance;

    const balanceAvailableDecimal = new Decimal(balance.available);
    const nearStorageDepositMin = expandTokenDecimal(NEAR_STORAGE_DEPOSIT_MIN, NEAR_DECIMALS);

    if (balanceAvailableDecimal.lessThan(nearStorageDepositMin)) {
      transactions.push(storageDepositTransaction(NEAR_STORAGE_EXTRA_DEPOSIT));
    }
  }

  transactions.push(...operations);
  return executeMultipleTransactions(transactions, extraTranstion);
};
