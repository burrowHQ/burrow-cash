import { fetchAllPools, init_env } from "@ref-finance/ref-sdk";
import { ViewMethodsDcl, ViewMethodsREFV1 } from "../interfaces/index";
import { getBurrow } from "../utils";
import { IPoolDcl, IQuoteResult } from "../interfaces/pool";
import getConfig, { isTestnet } from "../utils/config";
import { expandToken } from "../store/helper";

init_env(isTestnet ? "testnet" : "mainnet");
export async function getDclPools() {
  const { view, dclContract } = await getBurrow();
  const allDclPools: IPoolDcl[] = (await view(
    dclContract,
    ViewMethodsDcl[ViewMethodsDcl.list_pools],
  )) as IPoolDcl[];

  return allDclPools;
}

export async function quote({
  pool_ids,
  input_token_id,
  output_token_id,
  input_amount,
  tag,
}: {
  pool_ids: string[];
  input_token_id: string;
  output_token_id: string;
  input_amount: string;
  tag?: string;
}) {
  const { view, dclContract } = await getBurrow();
  const quote_res = (await view(dclContract, ViewMethodsDcl[ViewMethodsDcl.quote], {
    pool_ids,
    input_token: input_token_id,
    output_token: output_token_id,
    input_amount,
    tag,
  })) as IQuoteResult;

  return quote_res;
}
export async function get_pool_list(poolType: "classic" | "stable" | "degen" | "dcl") {
  const config = getConfig();
  const limit = poolType == "classic" ? 500 : 100;
  const data = await fetch(
    `${config.indexUrl}/pool/search?type=${poolType}&sort=tvl&limit=${limit}&labels=&offset=0&hide_low_pool=false&order_by=desc`,
  )
    .then((res) => res.json())
    .catch(() => {
      return {
        data: {
          list: [],
        },
      };
    });
  return data?.data?.list || [];
}
async function get_stable_pool_details(pool_ids: string[]) {
  const { view, refv1Contract } = await getBurrow();
  const allStablePools: IPoolDcl[] = (await view(
    refv1Contract,
    ViewMethodsREFV1[ViewMethodsREFV1.get_pool_detail_info_by_ids],
    {
      pool_ids,
    },
  )) as IPoolDcl[];
  const poolKindMap = {
    RatedPoolInfo: "RATED_SWAP",
    StablePoolInfo: "STABLE_SWAP",
    DegenPoolInfo: "DEGEN_SWAP",
  };
  const stablePools = allStablePools?.map((poolDetail, index) => {
    const [key, pool_info] = Object.entries(poolDetail)[0] as any[];
    return {
      ...pool_info,
      pool_kind: poolKindMap[key],
      id: pool_ids[index],
      rates: pool_info.rates || pool_info?.c_amounts?.map(() => expandToken(1, 18)),
    };
  });
  return stablePools;
}
export async function get_pools_from_sdk() {
  const { ratedPools, unRatedPools, simplePools } = await fetchAllPools();
  const stablePools = unRatedPools.concat(ratedPools);
  const pool_ids = stablePools.map((p) => p.id);
  const stablePoolsDetail = await get_stable_pool_details(pool_ids);
  return {
    simplePools,
    stablePools,
    stablePoolsDetail,
  };
}
