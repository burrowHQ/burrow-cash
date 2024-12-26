import { Contract } from "near-api-js";
import BN from "bn.js";
import Decimal from "decimal.js";

import { isEmpty } from "lodash";
import getConfig, { defaultNetwork, LOGIC_CONTRACT_NAME, LOGIC_MEMECONTRACT_NAME } from "./config";
import { nearMetadata, wooMetadata, sfraxMetadata, fraxMetadata } from "../components/Assets";

import {
  ChangeMethodsLogic,
  ChangeMethodsOracle,
  ViewMethodsLogic,
  ViewMethodsOracle,
  ViewMethodsREFV1,
  ChangeMethodsREFV1,
  ViewMethodsPyth,
  ChangeMethodsPyth,
  ViewMethodsDcl,
  ChangeMethodsDcl,
} from "../interfaces/contract-methods";
import { IBurrow, IViewReturnType } from "../interfaces/burrow";
import { getContract } from "../store";

import { getWalletSelector, getAccount, functionCall } from "./wallet-selector-compat";
import { IAssetFarmReward } from "../interfaces/asset";
import { FarmData, Portfolio, Farm } from "../redux/accountState";
// eslint-disable-next-line import/no-cycle
import { IPortfolioReward } from "../redux/selectors/getAccountRewards";
import { IConfig } from "../interfaces";

export const getViewAs = () => {
  if (window.location.href.includes("#instant-url")) {
    return null;
  } else {
    const url = new URL(window.location.href.replace("/#", ""));
    const searchParams = new URLSearchParams(url.search);
    return searchParams.get("viewAs");
  }
};

interface GetBurrowArgs {
  fetchData?: (id: string) => void | null;
  hideModal?: () => void | null;
  signOut?: () => void | null;
}

let selector;
let burrow: IBurrow;
// let resetBurrow = true;
let fetchDataCached;
let hideModalCached;
let signOutCached;

export const nearNativeTokens = ["wrap.near", "wrap.testnet"];

const nearTokenIds = {
  mainnet: "wrap.near",
  testnet: "wrap.testnet",
};

export const nearTokenId = nearTokenIds[defaultNetwork] || nearTokenIds.testnet;

export const getBurrow = async ({
  fetchData,
  hideModal,
  signOut,
}: GetBurrowArgs = {}): Promise<IBurrow> => {
  /// because it's being called by multiple components on startup
  /// all calls wait until setup is complete and then return burrow instance promise
  const getBurrowInternal = async () => {
    if (burrow) return burrow;
    await new Promise((res) => {
      setTimeout(() => {
        res({});
      }, 250);
    });
    return getBurrowInternal();
  };
  // if (!resetBurrow) return getBurrowInternal();
  // resetBurrow = false;

  const changeAccount = async (accountId) => {
    if (fetchData) fetchData(accountId);
  };

  if (!selector && fetchData && signOut) {
    selector = await getWalletSelector({
      onAccountChange: changeAccount,
    });
  }
  const account = await getAccount(getViewAs());

  if (!fetchDataCached && !!fetchData) fetchDataCached = fetchData;
  if (!hideModalCached && !!hideModal) hideModalCached = hideModal;
  if (!signOutCached && !!signOut)
    signOutCached = async () => {
      if (!selector) return;
      const wallet = await selector.wallet();
      await wallet.signOut().catch((err) => {
        console.error("Failed to sign out", err);
      });
      if (hideModal) hideModal();
      signOut(); // position
    };
  const signIn = () => selector.signIn();

  const view = async (
    contract: Contract,
    methodName: string,
    args: Record<string, unknown> = {},
    json = true,
  ): Promise<IViewReturnType> => {
    try {
      const viewAccount = await getAccount(getViewAs());
      return await viewAccount.viewFunction(contract.contractId, methodName, args, {
        // always parse to string, JSON parser will fail if its not a json
        parse: (data: Uint8Array) => {
          const result = Buffer.from(data).toString();
          return json ? JSON.parse(result) : result;
        },
      });
    } catch (err: any) {
      console.error(
        `view failed on ${contract.contractId} method: ${methodName}, ${JSON.stringify(args)}`,
      );
      throw err;
    }
  };

  const call = async (
    contract: Contract,
    methodName: string,
    args: Record<string, unknown> = {},
    deposit = "1",
  ) => {
    const { contractId } = contract;
    const gas = new BN(300000000000000);
    const attachedDeposit = new BN(deposit);

    return functionCall({
      contractId,
      methodName,
      args,
      gas,
      attachedDeposit,
    }).catch((e) => console.error(e));
  };

  const logicContract: Contract = await getContract(
    account,
    LOGIC_CONTRACT_NAME,
    ViewMethodsLogic,
    ChangeMethodsLogic,
  );

  const logicMEMEContract: Contract = await getContract(
    account,
    LOGIC_MEMECONTRACT_NAME,
    ViewMethodsLogic,
    ChangeMethodsLogic,
  );

  // get oracle address from
  const config = (await view(
    logicContract,
    ViewMethodsLogic[ViewMethodsLogic.get_config],
  )) as IConfig;

  const configMEME = (await view(
    logicMEMEContract,
    ViewMethodsLogic[ViewMethodsLogic.get_config],
  )) as IConfig;

  const oracle_account_id = getConfig().ORACLE_ACCOUNT_ID;
  const ref_exchange_id = getConfig().REF_EXCHANGE_ID;
  const oracleContract: Contract = await getContract(
    account,
    oracle_account_id,
    ViewMethodsOracle,
    ChangeMethodsOracle,
  );
  const refv1Contract: Contract = await getContract(
    account,
    ref_exchange_id,
    ViewMethodsREFV1,
    ChangeMethodsREFV1,
  );
  const pythContract: Contract = await getContract(
    account,
    getConfig().PYTH_ORACLE_CONTRACT_ID,
    ViewMethodsPyth,
    ChangeMethodsPyth,
  );
  const dclContract: Contract = await getContract(
    account,
    getConfig().DCL_SWAP_CONTRACT_ID,
    ViewMethodsDcl,
    ChangeMethodsDcl,
  );

  if (localStorage.getItem("near-wallet-selector:selectedWalletId") == null) {
    if (
      localStorage.getItem("near_app_wallet_auth_key") != null ||
      localStorage.getItem("null_wallet_auth_key") != null
    ) {
      if (signOutCached) signOutCached();
    }
  }

  burrow = {
    selector,
    changeAccount,
    fetchData: fetchDataCached,
    hideModal: hideModalCached,
    signOut: signOutCached,
    signIn,
    account,
    logicContract,
    logicMEMEContract,
    oracleContract,
    refv1Contract,
    pythContract,
    dclContract,
    view,
    call,
    config,
    configMEME,
  } as IBurrow;

  return burrow;
};

// Initialize contract & set global variables
export async function initContract(): Promise<IBurrow> {
  return getBurrow();
}

export function accountTrim(accountId: string) {
  return accountId && accountId.length > 14 + 14 + 1
    ? `${accountId.slice(0, 6)}...${accountId.slice(-6)}`
    : accountId;
}

export const getLocalAppVersion = () => {
  return process.env.CONFIG_BUILD_ID;
};

export const getRemoteAppVersion = async () => {
  const res = await fetch(window.location.origin);
  const html = await res.text();
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(html, "text/html");
  const data = JSON.parse(htmlDoc.querySelector("#__NEXT_DATA__")?.textContent as string);
  return data.buildId;
};

export function decimalMax(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  a = new Decimal(a);
  b = new Decimal(b);
  return a.gt(b) ? a : b;
}

export function decimalMin(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  a = new Decimal(a);
  b = new Decimal(b);
  return a.lt(b) ? a : b;
}

export function standardizeAsset(asset) {
  const serializationAsset = JSON.parse(JSON.stringify(asset || {}));
  if (serializationAsset.symbol === "wNEAR") {
    serializationAsset.symbol = nearMetadata.symbol;
    serializationAsset.icon = nearMetadata.icon;
  }
  if (serializationAsset.metadata?.symbol === "wNEAR") {
    serializationAsset.metadata.symbol = nearMetadata.symbol;
    serializationAsset.metadata.icon = nearMetadata.icon;
  }
  if (serializationAsset.symbol === "WOO") {
    serializationAsset.icon = wooMetadata.icon;
  }
  if (serializationAsset.metadata?.symbol === "WOO") {
    serializationAsset.metadata.icon = wooMetadata.icon;
  }
  if (serializationAsset.symbol === "sFRAX") {
    serializationAsset.icon = sfraxMetadata.icon;
  }
  if (serializationAsset.metadata?.symbol === "sFRAX") {
    serializationAsset.metadata.icon = sfraxMetadata.icon;
  }
  if (serializationAsset.symbol === "FRAX") {
    serializationAsset.icon = fraxMetadata.icon;
  }
  if (serializationAsset.metadata?.symbol === "FRAX") {
    serializationAsset.metadata.icon = fraxMetadata.icon;
  }
  return serializationAsset;
}

interface IAssetFarmRewards {
  [token: string]: IAssetFarmReward;
}
interface IAccountFarmRewards {
  [token: string]: FarmData;
}
export function filterSentOutFarms(FarmsPending: IAssetFarmRewards) {
  // Filter out the ones rewards sent out
  const tokenNetFarms = Object.entries(FarmsPending).reduce((acc, cur) => {
    const [rewardTokenId, farmData] = cur;
    if (farmData.remaining_rewards !== "0") {
      return {
        ...acc,
        [rewardTokenId]: farmData,
      };
    }
    return acc;
  }, {}) as IAssetFarmRewards;
  return tokenNetFarms;
}
export function filterAccountSentOutFarms(FarmsPending: IAccountFarmRewards) {
  // Filter out the ones rewards sent out
  const accountTokenNetFarms = Object.entries(FarmsPending).reduce((acc, cur) => {
    const [rewardTokenId, farmData] = cur;
    if (farmData.asset_farm_reward.remaining_rewards !== "0") {
      return {
        ...acc,
        [rewardTokenId]: farmData,
      };
    }
    return acc;
  }, {}) as IAccountFarmRewards;
  return accountTokenNetFarms;
}
export function filterAccountSentOutRewards(RewardsPending: any) {
  // Filter out the ones rewards sent out
  const accountTokenNetFarms = Object.entries(RewardsPending).reduce((acc, cur) => {
    const [rewardTokenId, rewardData] = cur as any;
    if (rewardData.remaining_rewards !== "0") {
      return {
        ...acc,
        [rewardTokenId]: rewardData,
      };
    }
    return acc;
  }, {}) as IPortfolioReward;
  return accountTokenNetFarms;
}
export function filterAccountAllSentOutFarms(portfolio: Portfolio) {
  // Filter out the ones rewards sent out
  const { supplied, borrowed, netTvl, tokennetbalance } = portfolio.farms;
  const newSupplied = filterTypeFarms(supplied);
  const newBorrowed = filterTypeFarms(borrowed);
  const newTokennetbalance = filterTypeFarms(tokennetbalance);
  const newNetTvl = filterAccountSentOutFarms(netTvl);
  return {
    supplied: newSupplied,
    borrowed: newBorrowed,
    tokennetbalance: newTokennetbalance,
    netTvl: newNetTvl,
  };
}
function filterTypeFarms(typeFarmData): IFarms {
  const newTypeFarmData = Object.entries(typeFarmData).reduce((acc, [tokenId, farm]: any) => {
    const newFarm = JSON.parse(JSON.stringify(filterAccountSentOutFarms(farm)));
    if (isEmpty(newFarm)) return acc;
    return {
      ...acc,
      [tokenId]: newFarm,
    };
  }, {});
  return newTypeFarmData;
}

interface IFarms {
  [tokenId: string]: Farm;
}
