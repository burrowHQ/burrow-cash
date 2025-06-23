import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector, Network } from "@near-wallet-selector/core";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupWalletConnect } from "rhea-wallet-connect";
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
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
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";
import { setupMeteorWalletApp } from "@near-wallet-selector/meteor-wallet-app";
import { setupBTCWallet, setupWalletSelectorModal } from "btc-wallet";
import { setupIntearWallet } from "@near-wallet-selector/intear-wallet";
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
import { getRpcList, getSelectedRpc } from "../components/Rpc/tool";

import getConfig, {
  defaultNetwork,
  LOGIC_CONTRACT_NAME,
  LOGIC_MEMECONTRACT_NAME,
  WALLET_CONNECT_ID,
  isTestnet,
  NBTC_ENV,
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
  featuredWalletIds: [
    "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709",
    "15c8b91ade1a4e58f3ce4e7a0dd7f42b47db0c8df7e0d84f63eb39bcb96c4e0f",
    "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
  ],
});
const walletConnect2 = setupWalletConnect({
  projectId: WALLET_CONNECT_ID,
  metadata: {
    name: "RHEA Finance",
    description: "RHEA with NEAR Wallet Selector",
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
  const { selectedRpc, rpcListSorted } = getSelectedRpc();
  selector = await setupWalletSelector({
    modules: [
      setupHotWallet(),
      setupHereWallet(),
      setupOKXWallet({}),
      setupMeteorWallet(),
      setupEthereumWallets({
        wagmiConfig,
        web3Modal,
        alwaysOnboardDuringSignIn: true,
      } as any),
      setupBTCWallet({
        autoConnect: true,
        env: NBTC_ENV,
      }) as any,
      myNearWallet,
      setupSender() as any,
      walletConnect2,
      setupNearMobileWallet({
        dAppMetadata: {
          logoUrl: "https://ref-finance-images-v2.s3.amazonaws.com/images/burrowIcon.png",
          name: "NEAR Wallet Selector",
        },
      }),
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
      setupBitteWallet({
        walletUrl: "https://wallet.bitte.ai",
        contractId: LOGIC_CONTRACT_NAME,
        deprecated: false,
      }),
      setupCoin98Wallet(),
      setupMeteorWalletApp({
        contractId: LOGIC_CONTRACT_NAME,
      }),
      setupIntearWallet(),
    ],
    network: {
      networkId: defaultNetwork,
      nodeUrl: selectedRpc,
    } as Network,
    fallbackRpcUrls: rpcListSorted,
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

  const modal = setupWalletSelectorModal(selector as any, {
    contractId: LOGIC_CONTRACT_NAME,
    blockFunctionKeyWallets: [
      "okx-wallet",
      "my-near-wallet",
      "meteor-wallet",
      "nightly",
      "ledger",
      "keypom",
      "mintbase-wallet",
      "bitte-wallet",
      "ethereum-wallets",
      "sender",
      "coin98-wallet",
    ],
    initialPosition: {
      right: "30px",
      bottom: "40px",
    },
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
