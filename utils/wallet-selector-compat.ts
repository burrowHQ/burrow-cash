import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector } from "@near-wallet-selector/core";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupWalletConnect } from "@near-wallet-selector/wallet-connect";
import { setupNeth } from "@near-wallet-selector/neth";
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMintbaseWallet } from "@near-wallet-selector/mintbase-wallet";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { Near } from "near-api-js/lib/near";
import { Account } from "near-api-js/lib/account";
import { BrowserLocalStorageKeyStore } from "near-api-js/lib/key_stores";
import BN from "bn.js";
import { map, distinctUntilChanged } from "rxjs";
import { setupKeypom } from "@keypom/selector";

import getConfig, {
  defaultNetwork,
  LOGIC_CONTRACT_NAME,
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

const walletConnect = setupWalletConnect({
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

  selector = await setupWalletSelector({
    modules: [
      myNearWallet,
      setupSender() as any,
      setupMeteorWallet(),
      walletConnect,
      setupNearMobileWallet({
        dAppMetadata: {
          logoUrl: "https://ref-finance-images-v2.s3.amazonaws.com/images/burrowIcon.png",
          name: "NEAR Wallet Selector",
        },
      }),
      setupHereWallet(),
      setupNightly(),
      setupNeth({
        bundle: false,
        gas: "300000000000000",
      }),
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
    ],
    network: defaultNetwork,
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

  const modal = setupModal(selector, { contractId: LOGIC_CONTRACT_NAME });
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
