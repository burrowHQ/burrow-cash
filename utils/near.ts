import { keyStores, utils, connect, Contract } from "near-api-js";
import { Transaction as WSTransaction } from "@near-wallet-selector/core";
import BN from "bn.js";
import getConfig from "./config";

const config = getConfig();

export const ONE_YOCTO_NEAR = "0.000000000000000000000001";
export const LP_STORAGE_AMOUNT = "0.01";

export const getGas = (gas?: string) => (gas ? new BN(gas) : new BN("100000000000000"));

export async function getNear() {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const nearConnection = await connect({ keyStore, ...config });
  return nearConnection;
}
export async function getKeypomNear() {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore(undefined, "keypom:");
  const nearConnection = await connect({ keyStore, ...config });
  return nearConnection;
}
export async function getAccount() {
  const nearConnection = await getNear();
  const account = await nearConnection.account(window.accountId || "");
  return account;
}
export async function getKeypomAccount() {
  const nearConnection = await getKeypomNear();
  const account = await nearConnection.account(window.accountId || "");
  return account;
}
