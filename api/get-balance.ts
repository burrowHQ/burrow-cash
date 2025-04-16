import { Contract } from "near-api-js";

import Decimal from "decimal.js";
import { getBurrow } from "../utils";
import { getContract } from "../store";
import {
  ChangeMethodsToken,
  ViewMethodsToken,
  ViewMethodsREFV1,
  IShadowRecordInfo,
} from "../interfaces";
import { lpTokenPrefix, NBTCTokenId, ETH_CONTRACT_ID, ETH_OLD_CONTRACT_ID } from "../utils/config";

export const getTokenContract = async (tokenContractAddress: string): Promise<Contract> => {
  const { account } = await getBurrow();
  return getContract(account, tokenContractAddress, ViewMethodsToken, ChangeMethodsToken);
};

const getBalance = async (
  tokenId: string,
  accountId: string,
  shadowRecords?: IShadowRecordInfo,
): Promise<string> => {
  const { view, refv1Contract } = await getBurrow();

  try {
    const tokenContract: Contract = await getTokenContract(
      tokenId == ETH_OLD_CONTRACT_ID ? ETH_CONTRACT_ID : tokenId,
    );
    let balanceInYocto;
    const isLpToken = tokenId.indexOf(lpTokenPrefix) > -1;
    if (isLpToken) {
      const pool_id = tokenId.split("-")[1];
      const poolShares = (await view(
        refv1Contract,
        ViewMethodsREFV1[ViewMethodsREFV1.get_pool_shares],
        {
          account_id: accountId,
          pool_id: +pool_id,
        },
      )) as string;
      const shadow_used = shadowRecords?.[pool_id]?.["shadow_in_burrow"] || "0";
      balanceInYocto = new Decimal(poolShares).minus(shadow_used).toFixed();
    } else {
      balanceInYocto = (await view(
        tokenContract,
        ViewMethodsToken[ViewMethodsToken.ft_balance_of],
        {
          account_id: accountId,
        },
      )) as string;
      // TODOXXX
      // if (
      //   tokenId === NBTCTokenId &&
      //   window.selector?.store?.getState()?.selectedWalletId === "btc-wallet"
      // ) {
      //   return Decimal.max(new Decimal(balanceInYocto || 0).minus(1000), "0").toFixed();
      // }
    }
    return balanceInYocto;
  } catch (err: any) {
    console.error(`Failed to get balance for ${accountId} on ${tokenId} ${err.message}`);
    return "0";
  }
};
export default getBalance;
