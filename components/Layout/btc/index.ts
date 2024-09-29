// @ts-nocheck
import type {
  Action,
  Optional,
  Transaction,
  InjectedWallet,
  FunctionCallAction,
  WalletModuleFactory,
  WalletBehaviourFactory,
} from "@near-wallet-selector/core";
import { ConnectedWalletAccount, WalletConnection } from "near-api-js";
import { providers, transactions } from "near-api-js";
import { AccessKeyViewRaw, AccountView } from "near-api-js/lib/providers/provider";
import {
  SignedDelegate,
  SignedTransaction,
  buildDelegateAction,
  actionCreators,
  decodeTransaction,
} from "@near-js/transactions";

import { KeyType, PublicKey } from "near-api-js/lib/utils/key_pair";
import {
  createTransaction,
  encodeDelegateAction,
  encodeTransaction,
  Signature,
} from "near-api-js/lib/transaction";
import { baseDecode, baseEncode } from "@near-js/utils";
import bs58 from "bs58";

export * from "./btcWalletSelectorContext";
// import { useBtcWalletSelector, BtcWalletSelectorContextProvider } from './btcWalletSelectorContext'

const { signedDelegate, transfer, functionCall } = actionCreators;

interface CAWalletParams {
  iconUrl?: string;
  deprecated?: boolean;
  btcContext?: any;
}

const base_url = "https://api.dev.satoshibridge.top/v1";
const token = "nbtc1-nsp.testnet";
const contractId = "dev1-nsp.testnet";

const state: any = {
  saveAccount(account: string) {
    window.localStorage.setItem("satoshi-account", account);
  },
  removeAccount() {
    window.localStorage.removeItem("satoshi-account");
  },
  savePublicKey(publicKey: string) {
    window.localStorage.setItem("satoshi-publickey", publicKey);
  },
  removePublicKey() {
    window.localStorage.removeItem("satoshi-publickey");
  },
  saveBtcPublicKey(publicKey: string) {
    window.localStorage.setItem("satoshi-btc-publickey", publicKey);
  },
  removeBtcPublicKey() {
    window.localStorage.removeItem("satoshi-btc-publickey");
  },
  clear() {
    this.removeAccount();
    this.removePublicKey();
    this.removeBtcPublicKey();
  },
  save(account: string, publicKey: string) {
    this.saveAccount(account);
    this.savePublicKey(publicKey);
  },
  getAccount() {
    return window.localStorage.getItem("satoshi-account");
  },
  getPublicKey() {
    return window.localStorage.getItem("satoshi-publickey");
  },
  getBtcPublicKey() {
    return window.localStorage.getItem("satoshi-btc-publickey");
  },
};

const SatoshiWallet: WalletBehaviourFactory<InjectedWallet> = async ({
  metadata,
  store,
  emitter,
  logger,
  id,
  provider,
}) => {
  // const { login, logout, account } = useBtcWalletSelector()

  async function viewMethod({ method, args = {} }: { method: string; args: any }) {
    const res: any = await provider.query({
      request_type: "call_function",
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });

    return JSON.parse(Buffer.from(res.result).toString());
  }

  const signIn = async ({ contractId, methodNames }: any) => {
    const accountId = state.getAccount();
    const publicKey = state.getPublicKey();
    // @ts-ignore
    const btcContext = window.btcContext;

    console.log("metadata:", metadata);

    if (accountId && publicKey) {
      return [
        {
          accountId,
          publicKey,
        },
      ];
    }

    const btcAccount = await btcContext.login();
    const btcPublicKey = await btcContext.getPublicKey();

    const nearTempAddress = await viewMethod({
      method: "get_chain_signature_near_account",
      args: { btc_public_key: btcPublicKey },
    });

    const nearTempPublicKey = await viewMethod({
      method: "get_chain_signature_near_account_public_key",
      args: { btc_public_key: btcPublicKey },
    });

    state.saveAccount(nearTempAddress);
    state.savePublicKey(nearTempPublicKey);
    state.saveBtcPublicKey(btcPublicKey);

    return [
      {
        accountId: nearTempAddress,
        publicKey: nearTempPublicKey,
      },
    ];
  };

  const signOut = async () => {
    // @ts-ignore
    const btcContext = window.btcContext;
    btcContext.logout();
    state.clear();
    window.localStorage.removeItem("near-wallet-selector:selectedWalletId");
  };

  const getAccounts = async () => {
    return [{ accountId: state.getAccount() }];
  };

  return {
    signIn,
    signOut,
    getAccounts,
    async verifyOwner() {
      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signMessage() {
      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signAndSendTransaction({ signerId, receiverId, actions }: any) {
      // @ts-ignore
      const btcContext = window.btcContext;

      // console.log(btcContext)

      // const v = btcContext.getContext()

      // console.log(v)

      // v.setIsProcessing(true)

      // return

      const accountId = state.getAccount();
      const publicKey = state.getPublicKey();

      const newActions = actions.map((action: any) => {
        switch (action.type) {
          case "FunctionCall":
            return functionCall(
              action.params.method,
              action.params.args,
              action.params.gas,
              action.deposit,
            );
          case "Transfer":
            return transfer(action.params.deposit);
        }
      });

      const { header } = await provider.block({ finality: "final" });

      const rawAccessKey = await provider.query<AccessKeyViewRaw>({
        request_type: "view_access_key",
        account_id: accountId,
        public_key: publicKey,
        finality: "final",
      });

      const accessKey = {
        ...rawAccessKey,
        nonce: BigInt(rawAccessKey.nonce || 0),
      };

      const publicKeyFromat = PublicKey.from(publicKey);

      let nearNonceNumber = accessKey.nonce + BigInt(1);
      const nearNonceApi = await getNearNonceFromApi(accountId);

      if (nearNonceApi) {
        nearNonceNumber =
          nearNonceApi.result_data && Number(nearNonceApi.result_data) > 0
            ? BigInt(Number(nearNonceApi.result_data))
            : accessKey.nonce + BigInt(1);
      }

      const _transiton: any = await transactions.createTransaction(
        accountId as string,
        publicKeyFromat,
        receiverId as string,
        nearNonceNumber,
        newActions,
        baseDecode(header.hash),
      );

      const tx_bytes = encodeTransaction(_transiton);

      // const txHash = new Uint8Array(sha256(Buffer.from(tx_bytes)));
      const hash = bs58.encode(tx_bytes);

      const accountInfo = await viewMethod({
        method: "get_account",
        args: { account_id: accountId },
      });

      const nonceApi = await getNonceFromApi(accountId as string);

      const nonce = nonceApi?.result_data ? Number(nonceApi?.result_data) : accountInfo.nonce;

      const outcome = {
        near_transactions: Array.from(tx_bytes),
        nonce: Number(nonce),
        // nonce:0,
        chain_id: 397,
        csna: accountId,
        btcPublicKey: state.getBtcPublicKey(),
        nearPublicKey: publicKey,
      } as any;

      const intention = {
        chain_id: outcome.chain_id.toString(),
        csna: outcome.csna,
        near_transactions: [outcome.near_transactions],
        gas_token: token,
        gas_limit: "100000000",
        nonce: Number(outcome.nonce).toString(),
      };

      const strIntention = JSON.stringify(intention);

      const signature = await btcContext.signMessage(strIntention);

      const result = await uploadCAWithdraw({
        sig: signature,
        btcPubKey: outcome.btcPublicKey,
        data: toHex(strIntention),
        near_nonce: [Number(nearNonceNumber)],
        // pubKey: outcome.nearPublicKey,
      });

      console.log("result:", result);

      if (result.result_code === 0) {
        return {
          transaction: hash,
        } as any;
      } else {
        return null;
      }
    },

    async signAndSendTransactions({ transactions }) {
      return [];
    },
  };
};

function getNonceFromApi(accountId: string) {
  return fetch(`${base_url}/nonce?csna=${accountId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
}

function getNearNonceFromApi(accountId: string) {
  return fetch(`${base_url}/nonceNear?csna=${accountId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
}

function uploadCAWithdraw(data: any) {
  return fetch(`${base_url}/receiveTransaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

export function setupSatoshiWallet({
  iconUrl = "https://www.thefaucet.org/images/logo.jpg",
  deprecated = false,
  btcContext,
}: CAWalletParams): WalletModuleFactory<InjectedWallet> {
  const satoshiWallet: any = async () => {
    return {
      id: "satoshi-wallet",
      type: "injected",
      metadata: {
        name: "SatoshiWallet",
        description: "SatoshiWallet",
        iconUrl,
        downloadUrl: iconUrl,
        deprecated,
        available: true,
        btcContext,
      },
      init: SatoshiWallet,
    };
  };

  return satoshiWallet;
}

function toHex(originalString: string) {
  let charArray = originalString.split("");
  let asciiArray = charArray.map((char) => char.charCodeAt(0));
  let hexArray = asciiArray.map((code) => code.toString(16));
  let hexString = hexArray.join("");
  hexString = hexString.replace(/(^0+)/g, "");
  return hexString;
}

export default {
  // useBtcWalletSelector,
  // BtcWalletSelectorContextProvider,
  setupSatoshiWallet,
};
