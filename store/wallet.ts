import { Contract } from "near-api-js";
import BN from "bn.js";
import { Transaction as SelectorTransaction } from "@near-wallet-selector/core";

import { getBurrow } from "../utils";
import { ViewMethodsLogic } from "../interfaces/contract-methods";
import { getTokenContract } from "../api/get-balance";
import getConfig from "../utils/config";

const { SPECIAL_REGISTRATION_TOKEN_IDS } = getConfig() as any;

export interface Transaction {
  receiverId: string;
  functionCalls: FunctionCallOptions[];
}

export interface FunctionCallOptions {
  methodName: string;
  args?: Record<string, unknown>;
  gas?: BN;
  attachedDeposit?: BN;
}

export const executeMultipleTransactions = async (transactions) => {
  const { account, selector, hideModal, signOut, fetchData } = await getBurrow();

  const selectorTransactions: Array<SelectorTransaction> = transactions.map((t) => ({
    signerId: account.accountId,
    receiverId: t.receiverId,
    actions: t.functionCalls.map(
      ({ methodName, args = {}, gas = "100000000000000", attachedDeposit = "1" }) => ({
        type: "FunctionCall",
        params: {
          methodName,
          args,
          gas: gas.toString(),
          deposit: attachedDeposit.toString(),
        },
      }),
    ),
  }));

  try {
    const wallet = await selector.wallet();
    const result = await wallet.signAndSendTransactions({
      transactions: selectorTransactions,
    });
    if (fetchData) fetchData(account.accountId);
    return result;
  } catch (e: any) {
    if (/reject/.test(e)) {
      alert("Transaction was rejected in wallet. Please try again!");
      hideModal();
      return;
    }
    if (!/No accounts available/.test(e)) {
      throw e;
    }
    console.warn(e);
    signOut();
    alert(
      "No accounts available. Your wallet may be locked. You have been signed out. Please sign in again!",
    );
    return;
  }

  if (hideModal) hideModal();
};

export const isRegistered = async (account_id: string, contractId: string): Promise<any> => {
  try {
    const contract: Contract = await getTokenContract(contractId);
    const { view } = await getBurrow();
    return await view(contract, ViewMethodsLogic[ViewMethodsLogic.storage_balance_of], {
      account_id,
    });
  } catch (error) {
    return null;
  }
};
export const isRegistered2 = async (account_id: string, contract: Contract): Promise<any> => {
  try {
    const { view } = await getBurrow();
    return await view(contract, ViewMethodsLogic[ViewMethodsLogic.storage_balance_of], {
      account_id,
    });
  } catch (error) {
    return null;
  }
};
