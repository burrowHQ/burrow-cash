import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector, Network } from "@near-wallet-selector/core";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupWalletConnect } from "@near-wallet-selector/wallet-connect";
import { setupNeth } from "@near-wallet-selector/neth";
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet";
import { setupModal } from "ref-modal-ui";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMintbaseWallet } from "@near-wallet-selector/mintbase-wallet";
import { setupBitteWallet } from "@near-wallet-selector/bitte-wallet";
import { setupCoin98Wallet } from "@near-wallet-selector/coin98-wallet";
import type { WalletSelectorModal } from "ref-modal-ui";
import { Near } from "near-api-js/lib/near";
import { Account } from "near-api-js/lib/account";
import { BrowserLocalStorageKeyStore } from "near-api-js/lib/key_stores";
import BN from "bn.js";
import { map, distinctUntilChanged } from "rxjs";
import { setupKeypom } from "@keypom/selector";
import { setupOKXWallet } from "@near-wallet-selector/okx-wallet";
import { setupBTCWallet } from "btc-wallet";
// @ts-nocheck
import type { Config } from "@wagmi/core";
// @ts-nocheck
import { reconnect, http, createConfig } from "@wagmi/core";
// @ts-nocheck
import { walletConnect, injected } from "@wagmi/connectors";
// @ts-nocheck
import { setupEthereumWallets } from "@near-wallet-selector/ethereum-wallets";
// @ts-nocheck
import { createWeb3Modal } from "@web3modal/wagmi";
// @ts-nocheck
import { getRpcList } from "../components/Rpc/tool";

import getConfig, {
  defaultNetwork,
  LOGIC_CONTRACT_NAME,
  LOGIC_MEMECONTRACT_NAME,
  WALLET_CONNECT_ID,
  isTestnet,
} from "./config";

declare global {
  interface Window {
    selector: WalletSelector;
    selectorSubscription: any;
    modal: WalletSelectorModal;
    accountId: string;
  }
}

interface WalletMethodArgs {
  signerId?: string;
  contractId?: string;
  methodName?: string;
  args?: any;
  gas?: string | BN;
  attachedDeposit?: string | BN;
}

interface GetWalletSelectorArgs {
  onAccountChange: (accountId?: string | null) => void;
}

// caches in module so we don't re-init every time we need it
let near: Near;
let accountId: string;
let init = false;
let selector: WalletSelector | null = null;
const nearBlock = {
  id: 397,
  name: "NEAR Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "NEAR",
    symbol: "NEAR",
  },
  rpcUrls: {
    default: { http: ["https://eth-rpc.mainnet.near.org"] },
    public: { http: ["https://eth-rpc.mainnet.near.org"] },
  },
  blockExplorers: {
    default: {
      name: "NEAR Explorer",
      url: "https://eth-explorer.near.org",
    },
  },
  testnet: false,
};
const wagmiConfig: Config = createConfig({
  chains: [nearBlock],
  transports: {
    [nearBlock.id]: http(),
  },
  connectors: [
    walletConnect({
      projectId: WALLET_CONNECT_ID,
      showQrModal: false,
    }),
    injected({ shimDisconnect: true }),
  ],
});
reconnect(wagmiConfig);
const web3Modal = createWeb3Modal({
  wagmiConfig,
  projectId: WALLET_CONNECT_ID,
  allowUnsupportedChain: true,
});
const walletConnect2 = setupWalletConnect({
  projectId: WALLET_CONNECT_ID,
  metadata: {
    name: "Burrow Finance",
    description: "Burrow with NEAR Wallet Selector",
    url: "https://github.com/near/wallet-selector",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  },
  chainId: `near:${defaultNetwork}`,
});

const myNearWallet = setupMyNearWallet({
  walletUrl: isTestnet ? "https://testnet.mynearwallet.com" : "https://app.mynearwallet.com",
});
const KEYPOM_OPTIONS = {
  beginTrial: {
    landing: {
      title: "Welcome!",
    },
  },
  wallets: [
    {
      name: "MyNEARWallet",
      description: "Secure your account with a Seed Phrase",
      redirectUrl: `https://${defaultNetwork}.mynearwallet.com/linkdrop/ACCOUNT_ID/SECRET_KEY`,
      iconUrl: "INSERT_ICON_URL_HERE",
    },
  ],
};

export const getWalletSelector = async ({ onAccountChange }: GetWalletSelectorArgs) => {
  if (init) return selector;
  init = true;
  const RPC_LIST = getRpcList();
  let endPoint = "defaultRpc";
  try {
    endPoint = window.localStorage.getItem("endPoint") || endPoint;
    if (!RPC_LIST[endPoint]) {
      endPoint = "defaultRpc";
      localStorage.removeItem("endPoint");
    }
  } catch (error) {}
  selector = await setupWalletSelector({
    modules: [
      setupMeteorWallet(),
      setupEthereumWallets({
        wagmiConfig,
        web3Modal,
        alwaysOnboardDuringSignIn: true,
      } as any),
      setupBTCWallet({
        autoConnect: true,
        env: "private_mainnet",
      }) as any,
      myNearWallet,
      setupOKXWallet({}),
      setupSender() as any,
      walletConnect2,
      setupNearMobileWallet({
        dAppMetadata: {
          logoUrl: "https://ref-finance-images-v2.s3.amazonaws.com/images/burrowIcon.png",
          name: "NEAR Wallet Selector",
        },
      }),
      setupHereWallet(),
      setupNightly(),
      setupKeypom({
        networkId: defaultNetwork,
        signInContractId: LOGIC_CONTRACT_NAME,
        trialAccountSpecs: {
          url: "/trial-accounts/ACCOUNT_ID#SECRET_KEY",
          modalOptions: KEYPOM_OPTIONS,
        },
        instantSignInSpecs: {
          url: "/#instant-url/ACCOUNT_ID#SECRET_KEY/MODULE_ID",
        },
      }),
      setupLedger(),
      setupMintbaseWallet({
        walletUrl: "https://wallet.mintbase.xyz",
        contractId: LOGIC_CONTRACT_NAME,
        deprecated: false,
      }),
      setupBitteWallet({
        walletUrl: "https://wallet.bitte.ai",
        contractId: LOGIC_CONTRACT_NAME,
        deprecated: false,
      }),
      setupCoin98Wallet(),
    ],
    network: {
      networkId: defaultNetwork,
      nodeUrl: RPC_LIST[endPoint].url,
    } as Network,
    debug: !!isTestnet,
    optimizeWalletOrder: false,
  });
  const { observable }: { observable: any } = selector.store;
  const subscription = observable
    .pipe(
      map((s: any) => s.accounts),
      distinctUntilChanged(),
    )
    .subscribe((nextAccounts) => {
      console.info("Accounts Update", nextAccounts);
      accountId = nextAccounts[0]?.accountId;
      window.accountId = accountId;
      onAccountChange(accountId);
      if (window.location.href.includes("#instant-url")) {
        window.history.replaceState({}, "", "/");
      }
    });

  const modal = setupModal(selector as any, {
    contractId: LOGIC_CONTRACT_NAME,
    blockFunctionKeyWallets: [
      "okx-wallet",
      "my-near-wallet",
      "meteor-wallet",
      "neth",
      "nightly",
      "ledger",
      "wallet-connect",
      "keypom",
      "mintbase-wallet",
      "bitte-wallet",
      "ethereum-wallets",
      "sender",
      "coin98-wallet",
    ],
  });
  window.modal = modal;
  window.selectorSubscription = subscription;

  return selector;
};

export const getNear = () => {
  const config = getConfig(defaultNetwork);
  const keyStore = new BrowserLocalStorageKeyStore();
  if (!near) {
    near = new Near({
      ...config,
      deps: { keyStore },
    });
  }
  return near;
};

export const getAccount = async (viewAsAccountId?: string | null) => {
  near = getNear();
  return new Account(near.connection, viewAsAccountId || accountId || window.accountId);
};

export const functionCall = async ({
  contractId,
  methodName,
  args,
  gas,
  attachedDeposit,
}: WalletMethodArgs) => {
  if (!selector) {
    throw new Error("selector not initialized");
  }
  if (!contractId) {
    throw new Error("functionCall error: contractId undefined");
  }
  if (!methodName) {
    throw new Error("functionCall error: methodName undefined");
  }

  const wallet = await selector.wallet();

  return wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName,
          args,
          gas: gas?.toString() || "30000000000000",
          deposit: attachedDeposit?.toString() || "0",
        },
      },
    ],
  });
};
