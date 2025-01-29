import Decimal from "decimal.js";

import {
  IAssetEntry,
  IAssetDetailed,
  IUnitLptAsset,
  AssetEntry,
  ViewMethodsLogic,
  ViewMethodsREFV1,
} from "../interfaces";
import { getBurrow } from "../utils";
import { DEFAULT_PRECISION } from "./constants";

Decimal.set({ precision: DEFAULT_PRECISION });

export const getAssets = async (): Promise<IAssetEntry[]> => {
  const { view, logicContract, pythContract } = await getBurrow();
  return (
    (await view(logicContract, ViewMethodsLogic[ViewMethodsLogic.get_assets_paged])) as AssetEntry[]
  ).map(([token_id, asset]: AssetEntry) => ({
    ...asset,
    token_id,
  }));
};
export const getAssetsDetail = async (): Promise<IAssetDetailed[]> => {
  const { view, logicContract } = await getBurrow();
  return (await view(
    logicContract,
    ViewMethodsLogic[ViewMethodsLogic.get_assets_paged_detailed],
  )) as IAssetDetailed[];
};

export const getAssetsMEME = async (): Promise<IAssetEntry[]> => {
  const { view, logicMEMEContract, pythContract } = await getBurrow();
  return (
    (await view(
      logicMEMEContract,
      ViewMethodsLogic[ViewMethodsLogic.get_assets_paged],
    )) as AssetEntry[]
  ).map(([token_id, asset]: AssetEntry) => ({
    ...asset,
    token_id,
  }));
};
export const getAssetsMEMEDetail = async (): Promise<IAssetDetailed[]> => {
  const { view, logicMEMEContract } = await getBurrow();
  return (await view(
    logicMEMEContract,
    ViewMethodsLogic[ViewMethodsLogic.get_assets_paged_detailed],
  )) as IAssetDetailed[];
};

export const getUnitLptAssets = async (pool_ids: number[]): Promise<IUnitLptAsset> => {
  const { view, refv1Contract } = await getBurrow();
  const details = (await view(
    refv1Contract,
    ViewMethodsREFV1[ViewMethodsREFV1.get_unit_lpt_assets],
    { pool_ids },
  )) as IUnitLptAsset;
  return details;
};
